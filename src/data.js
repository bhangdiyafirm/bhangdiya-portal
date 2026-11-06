import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
} from "firebase/firestore";
import { auth, db } from "./firebase";

export const CATEGORIES = [
  { id: "GST", label: "GST", description: "Returns, challans and notices" },
  { id: "ITR", label: "Income Tax", description: "Returns, computations and acknowledgements" },
  { id: "MASTERS", label: "Masters", description: "PAN, registrations and other records" },
];

export const MAX_FILE_BYTES = 10 * 1024 * 1024; // Cloudinary free plan limit for documents

export function categoryLabel(id) {
  return CATEGORIES.find((c) => c.id === id)?.label ?? id;
}

// Indian financial years, newest first. April starts a new year.
export function financialYears(count = 8, today = new Date()) {
  const start = today.getMonth() >= 3 ? today.getFullYear() : today.getFullYear() - 1;
  return Array.from({ length: count }, (_, i) => {
    const year = start - i;
    return `FY ${year}-${String((year + 1) % 100).padStart(2, "0")}`;
  });
}

// Accepts "98901 88300", "+91 9890188300", "09890188300" and returns "+919890188300".
export function toE164(input) {
  let digits = String(input).replace(/\D/g, "");
  if (digits.length === 12 && digits.startsWith("91")) digits = digits.slice(2);
  if (digits.length === 11 && digits.startsWith("0")) digits = digits.slice(1);
  return /^[6-9]\d{9}$/.test(digits) ? `+91${digits}` : null;
}

export function formatPhone(e164 = "") {
  const digits = e164.replace(/^\+91/, "");
  return digits.length === 10 ? `+91 ${digits.slice(0, 5)} ${digits.slice(5)}` : e164;
}

export function formatSize(bytes) {
  if (!bytes) return "";
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function formatDate(value) {
  const date = value?.toDate ? value.toDate() : value ? new Date(value) : null;
  return date
    ? date.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })
    : "";
}

// ---- Who is signed in ----------------------------------------------------

export async function loadSession(phone) {
  const admin = await getDoc(doc(db, "admins", phone));
  if (admin.exists()) return { role: "admin", profile: admin.data() };

  const client = await getDoc(doc(db, "clients", phone));
  if (client.exists()) return { role: "client", profile: client.data() };

  return { role: "unregistered", profile: null };
}

// ---- Clients ---------------------------------------------------------------

export async function listClients() {
  const snapshot = await getDocs(collection(db, "clients"));
  return snapshot.docs
    .map((d) => ({ id: d.id, ...d.data() }))
    .sort((a, b) => (a.name || "").localeCompare(b.name || ""));
}

export async function createClient(phone, name) {
  const ref = doc(db, "clients", phone);
  if ((await getDoc(ref)).exists()) throw new Error("A client with this mobile number already exists.");
  await setDoc(ref, { name: name.trim(), active: true, createdAt: serverTimestamp() });
}

export function setClientActive(phone, active) {
  return updateDoc(doc(db, "clients", phone), { active });
}

export function renameClient(phone, name) {
  return updateDoc(doc(db, "clients", phone), { name: name.trim() });
}

// ---- Files -----------------------------------------------------------------

export async function listFiles(clientId) {
  const snapshot = await getDocs(
    query(collection(db, "clients", clientId, "files"), orderBy("uploadedAt", "desc"))
  );
  return snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
}

async function callServer(path, body) {
  const token = await auth.currentUser.getIdToken();
  let response;
  try {
    response = await fetch(path, {
      method: "POST",
      headers: { "content-type": "application/json", authorization: `Bearer ${token}` },
      body: JSON.stringify(body),
    });
  } catch {
    throw new Error("Could not reach the file server. Check your internet connection.");
  }
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(
      response.status === 403
        ? "You don't have access to this file."
        : "The file server is not available right now. Please try again later."
    );
  }
  return data;
}

// Opens the window first, so phone browsers don't block it as a pop-up.
export async function openFile(clientId, fileId) {
  const win = window.open("", "_blank");
  try {
    const { url } = await callServer("/api/file-url", { clientId, fileId });
    if (win) win.location.href = url;
    else window.location.href = url;
  } catch (error) {
    win?.close();
    throw error;
  }
}

function sendWithProgress(url, form, onProgress) {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", url);
    xhr.upload.onprogress = (e) => e.lengthComputable && onProgress?.(e.loaded / e.total);
    xhr.onload = () => {
      const data = JSON.parse(xhr.responseText || "{}");
      if (xhr.status >= 200 && xhr.status < 300) resolve(data);
      else reject(new Error(data.error?.message || "Upload failed."));
    };
    xhr.onerror = () => reject(new Error("Upload failed. Check your internet connection."));
    xhr.send(form);
  });
}

export async function uploadFile({ adminPhone, clientId, file, category, fy, onProgress }) {
  if (file.size > MAX_FILE_BYTES) throw new Error(`${file.name} is larger than 10 MB.`);

  const sig = await callServer("/api/upload-signature", { phone: adminPhone, clientId });
  const form = new FormData();
  form.append("file", file);
  form.append("api_key", sig.apiKey);
  form.append("timestamp", sig.timestamp);
  form.append("signature", sig.signature);
  form.append("folder", sig.folder);
  form.append("type", sig.type);

  const uploaded = await sendWithProgress(sig.uploadUrl, form, onProgress);
  await addDoc(collection(db, "clients", clientId, "files"), {
    name: file.name,
    category,
    fy: category === "MASTERS" ? null : fy,
    size: uploaded.bytes ?? file.size,
    publicId: uploaded.public_id,
    uploadedAt: serverTimestamp(),
    uploadedBy: adminPhone,
  });
}

export async function deleteFile({ adminPhone, clientId, file }) {
  await callServer("/api/delete-file", { phone: adminPhone, publicId: file.publicId });
  await deleteDoc(doc(db, "clients", clientId, "files", file.id));
}
