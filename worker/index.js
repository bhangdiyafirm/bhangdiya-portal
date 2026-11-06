// Small free server (Cloudflare Worker) that holds the Cloudinary secret.
//
// It stores no permissions of its own. It forwards the caller's Firebase login
// token to Firestore, so the rules in firestore.rules decide who may do what.

const LINK_LIFETIME_SECONDS = 300;

function json(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json", "cache-control": "no-store" },
  });
}

async function sha1Hex(text) {
  const digest = await crypto.subtle.digest("SHA-1", new TextEncoder().encode(text));
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

// Cloudinary signature: parameters sorted by name, joined, secret appended, SHA-1.
export function signCloudinary(params, secret) {
  const base = Object.keys(params)
    .sort()
    .map((key) => `${key}=${params[key]}`)
    .join("&");
  return sha1Hex(base + secret);
}

function firestoreUrl(env, path) {
  const base =
    env.FIRESTORE_BASE_URL || "https://firestore.googleapis.com/v1";
  return `${base}/projects/${env.FIREBASE_PROJECT_ID}/databases/(default)/documents/${path}`;
}

// Reads a document as the logged-in caller. Returns null if refused or missing.
async function readAsCaller(env, token, path) {
  const response = await fetch(firestoreUrl(env, path), {
    headers: { authorization: `Bearer ${token}` },
  });
  return response.ok ? response.json() : null;
}

const EMAIL = /^[^\s@/]+@[^\s@/]+\.[^\s@/]+$/;

async function callerIsAdmin(env, token, email) {
  if (typeof email !== "string" || !EMAIL.test(email)) return false;
  // Rules only let someone read the admin record for their own email.
  return (await readAsCaller(env, token, `admins/${encodeURIComponent(email)}`)) !== null;
}

// Cloudinary folder for a client, e.g. "rahul.sharma@gmail.com" -> "clients/rahul_sharma_gmail_com".
export function folderFor(email) {
  return `clients/${email.toLowerCase().replace(/[^a-z0-9]+/g, "_")}`;
}

async function uploadSignature(env, token, body) {
  if (!(await callerIsAdmin(env, token, body.email))) return json({ error: "forbidden" }, 403);
  if (typeof body.clientId !== "string" || !EMAIL.test(body.clientId)) {
    return json({ error: "bad_request" }, 400);
  }

  const params = {
    folder: folderFor(body.clientId),
    timestamp: Math.floor(Date.now() / 1000),
    type: "private",
  };
  return json({
    ...params,
    apiKey: env.CLOUDINARY_API_KEY,
    signature: await signCloudinary(params, env.CLOUDINARY_API_SECRET),
    uploadUrl: `https://api.cloudinary.com/v1_1/${env.CLOUDINARY_CLOUD_NAME}/raw/upload`,
  });
}

async function fileUrl(env, token, body) {
  if (typeof body.clientId !== "string" || typeof body.fileId !== "string") {
    return json({ error: "bad_request" }, 400);
  }

  const path = `clients/${encodeURIComponent(body.clientId)}/files/${encodeURIComponent(body.fileId)}`;
  const file = await readAsCaller(env, token, path);
  const publicId = file?.fields?.publicId?.stringValue;
  if (!publicId) return json({ error: "forbidden" }, 403);

  const now = Math.floor(Date.now() / 1000);
  const params = {
    expires_at: now + LINK_LIFETIME_SECONDS,
    public_id: publicId,
    timestamp: now,
    type: "private",
  };
  const query = new URLSearchParams({
    ...params,
    api_key: env.CLOUDINARY_API_KEY,
    signature: await signCloudinary(params, env.CLOUDINARY_API_SECRET),
  });
  return json({
    url: `https://api.cloudinary.com/v1_1/${env.CLOUDINARY_CLOUD_NAME}/raw/download?${query}`,
  });
}

async function deleteFile(env, token, body) {
  if (!(await callerIsAdmin(env, token, body.email))) return json({ error: "forbidden" }, 403);
  if (typeof body.publicId !== "string" || !body.publicId.startsWith("clients/")) {
    return json({ error: "bad_request" }, 400);
  }

  const params = {
    public_id: body.publicId,
    timestamp: Math.floor(Date.now() / 1000),
    type: "private",
  };
  const form = new URLSearchParams({
    ...params,
    api_key: env.CLOUDINARY_API_KEY,
    signature: await signCloudinary(params, env.CLOUDINARY_API_SECRET),
  });
  const response = await fetch(
    `https://api.cloudinary.com/v1_1/${env.CLOUDINARY_CLOUD_NAME}/raw/destroy`,
    { method: "POST", body: form }
  );
  return response.ok ? json({ ok: true }) : json({ error: "delete_failed" }, 502);
}

const ROUTES = {
  "/api/upload-signature": uploadSignature,
  "/api/file-url": fileUrl,
  "/api/delete-file": deleteFile,
};

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const { pathname } = url;

    // Google sign-in helper pages, served from our own address (see src/firebase.js).
    if (pathname.startsWith("/__/auth/") || pathname === "/__/firebase/init.json") {
      const target = `https://${env.FIREBASE_PROJECT_ID}.firebaseapp.com${pathname}${url.search}`;
      return fetch(new Request(target, request));
    }

    const route = ROUTES[pathname];

    if (!route) {
      if (pathname.startsWith("/api/")) return json({ error: "not_found" }, 404);
      return env.ASSETS.fetch(request);
    }
    if (request.method !== "POST") return json({ error: "method_not_allowed" }, 405);

    const token = (request.headers.get("authorization") || "").replace(/^Bearer /, "");
    if (!token) return json({ error: "unauthenticated" }, 401);

    let body;
    try {
      body = await request.json();
    } catch {
      return json({ error: "bad_request" }, 400);
    }
    return route(env, token, body);
  },
};
