// Runs against the local Firestore emulator (npm test). Never touches real data.
import { readFileSync } from "node:fs";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
} from "@firebase/rules-unit-testing";
import { deleteDoc, doc, getDoc, setDoc, updateDoc } from "firebase/firestore";
import worker, { signCloudinary } from "../worker/index.js";

const PROJECT = "demo-bhangdiya";
const ADMIN = "+919000000001";
const CLIENT_A = "+919000000002";
const CLIENT_B = "+919000000003";

let env;
const as = (phone) => env.authenticatedContext(phone.slice(1), { phone_number: phone }).firestore();

beforeAll(async () => {
  env = await initializeTestEnvironment({
    projectId: PROJECT,
    firestore: { rules: readFileSync("firestore.rules", "utf8"), host: "127.0.0.1", port: 8080 },
  });
});
afterAll(() => env.cleanup());

beforeEach(async () => {
  await env.clearFirestore();
  await env.withSecurityRulesDisabled(async (ctx) => {
    const db = ctx.firestore();
    await setDoc(doc(db, "admins", ADMIN), { role: "admin" });
    await setDoc(doc(db, "clients", CLIENT_A), { name: "A", active: true });
    await setDoc(doc(db, "clients", CLIENT_A, "files", "f1"), { name: "a.pdf", publicId: "clients/9/a.pdf" });
    await setDoc(doc(db, "clients", CLIENT_B), { name: "B", active: false });
    await setDoc(doc(db, "clients", CLIENT_B, "files", "f2"), { name: "b.pdf", publicId: "clients/9/b.pdf" });
  });
});

describe("database rules", () => {
  it("blocks visitors who are not logged in", async () => {
    const db = env.unauthenticatedContext().firestore();
    await assertFails(getDoc(doc(db, "clients", CLIENT_A)));
    await assertFails(getDoc(doc(db, "clients", CLIENT_A, "files", "f1")));
  });

  it("lets a client read their own profile and files", async () => {
    const db = as(CLIENT_A);
    await assertSucceeds(getDoc(doc(db, "clients", CLIENT_A)));
    await assertSucceeds(getDoc(doc(db, "clients", CLIENT_A, "files", "f1")));
  });

  it("stops one client reading another client", async () => {
    const db = as(CLIENT_A);
    await assertFails(getDoc(doc(db, "clients", CLIENT_B)));
    await assertFails(getDoc(doc(db, "clients", CLIENT_B, "files", "f2")));
  });

  it("stops clients changing anything", async () => {
    const db = as(CLIENT_A);
    await assertFails(updateDoc(doc(db, "clients", CLIENT_A), { name: "X" }));
    await assertFails(setDoc(doc(db, "clients", CLIENT_A, "files", "new"), { name: "x" }));
    await assertFails(deleteDoc(doc(db, "clients", CLIENT_A, "files", "f1")));
  });

  it("hides files from a disabled client", async () => {
    await assertFails(getDoc(doc(as(CLIENT_B), "clients", CLIENT_B, "files", "f2")));
  });

  it("lets admins manage clients and files", async () => {
    const db = as(ADMIN);
    await assertSucceeds(getDoc(doc(db, "clients", CLIENT_B)));
    await assertSucceeds(setDoc(doc(db, "clients", "+919000000004"), { name: "New", active: true }));
    await assertSucceeds(deleteDoc(doc(db, "clients", CLIENT_A, "files", "f1")));
  });

  it("never lets anyone make themselves an admin", async () => {
    await assertFails(setDoc(doc(as(CLIENT_A), "admins", CLIENT_A), { role: "admin" }));
    await assertFails(setDoc(doc(as(ADMIN), "admins", CLIENT_A), { role: "admin" }));
    await assertFails(getDoc(doc(as(CLIENT_A), "admins", ADMIN)));
  });
});

describe("file server", () => {
  const workerEnv = {
    FIREBASE_PROJECT_ID: PROJECT,
    FIRESTORE_BASE_URL: "http://127.0.0.1:8080/v1",
    CLOUDINARY_CLOUD_NAME: "testcloud",
    CLOUDINARY_API_KEY: "testkey",
    CLOUDINARY_API_SECRET: "testsecret",
  };

  // The emulator accepts unsigned tokens, so these stand in for real logins.
  const tokenFor = (phone) => {
    const encode = (value) => Buffer.from(JSON.stringify(value)).toString("base64url");
    const now = Math.floor(Date.now() / 1000);
    return `${encode({ alg: "none", typ: "JWT" })}.${encode({
      iss: `https://securetoken.google.com/${PROJECT}`,
      aud: PROJECT,
      sub: phone.slice(1),
      user_id: phone.slice(1),
      phone_number: phone,
      iat: now,
      exp: now + 3600,
      auth_time: now,
      firebase: { sign_in_provider: "phone", identities: { phone: [phone] } },
    })}.`;
  };

  const call = (path, body, phone) =>
    worker.fetch(
      new Request(`https://portal.test${path}`, {
        method: "POST",
        headers: phone ? { authorization: `Bearer ${tokenFor(phone)}` } : {},
        body: JSON.stringify(body),
      }),
      workerEnv
    );

  it("matches Cloudinary's published signature example", async () => {
    const signature = await signCloudinary(
      { public_id: "sample_image", timestamp: 1315060510, eager: "w_400,h_300,c_pad|w_260,h_200,c_crop" },
      "abcd"
    );
    expect(signature).toBe("bfd09f95f331f558cbd1320e67aa8d488770583e");
  });

  it("refuses requests with no login", async () => {
    expect((await call("/api/file-url", { clientId: CLIENT_A, fileId: "f1" })).status).toBe(401);
  });

  it("gives a client a short-lived link to their own file", async () => {
    const response = await call("/api/file-url", { clientId: CLIENT_A, fileId: "f1" }, CLIENT_A);
    expect(response.status).toBe(200);
    const url = new URL((await response.json()).url);
    expect(url.searchParams.get("public_id")).toBe("clients/9/a.pdf");
    expect(url.searchParams.get("type")).toBe("private");
    expect(url.searchParams.get("signature")).toMatch(/^[0-9a-f]{40}$/);
    expect(Number(url.searchParams.get("expires_at"))).toBeLessThanOrEqual(Date.now() / 1000 + 300);
  });

  it("refuses a link to another client's file", async () => {
    const response = await call("/api/file-url", { clientId: CLIENT_B, fileId: "f2" }, CLIENT_A);
    expect(response.status).toBe(403);
  });

  it("lets an admin get a link to any client's file", async () => {
    const response = await call("/api/file-url", { clientId: CLIENT_B, fileId: "f2" }, ADMIN);
    expect(response.status).toBe(200);
  });

  it("gives upload permission to admins only", async () => {
    const asAdmin = await call("/api/upload-signature", { phone: ADMIN, clientId: CLIENT_A }, ADMIN);
    expect(asAdmin.status).toBe(200);
    expect((await asAdmin.json()).type).toBe("private");

    const asClient = await call("/api/upload-signature", { phone: CLIENT_A, clientId: CLIENT_A }, CLIENT_A);
    expect(asClient.status).toBe(403);

    const pretending = await call("/api/upload-signature", { phone: ADMIN, clientId: CLIENT_A }, CLIENT_A);
    expect(pretending.status).toBe(403);
  });

  it("refuses file deletion by a client", async () => {
    const response = await call(
      "/api/delete-file",
      { phone: CLIENT_A, publicId: "clients/9/a.pdf" },
      CLIENT_A
    );
    expect(response.status).toBe(403);
  });
});
