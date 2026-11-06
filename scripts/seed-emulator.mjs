// Adds sample data to the LOCAL emulator only, for trying the site (npm run seed).
const BASE =
  "http://127.0.0.1:8080/v1/projects/demo-bhangdiya/databases/(default)/documents";

const toFields = (data) =>
  Object.fromEntries(
    Object.entries(data).map(([key, value]) => {
      if (typeof value === "boolean") return [key, { booleanValue: value }];
      if (typeof value === "number") return [key, { integerValue: String(value) }];
      if (value === null) return [key, { nullValue: null }];
      return [key, { stringValue: value }];
    })
  );

async function put(path, data) {
  const response = await fetch(`${BASE}/${path}`, {
    method: "PATCH",
    headers: { "content-type": "application/json", authorization: "Bearer owner" },
    body: JSON.stringify({ fields: toFields(data) }),
  });
  if (!response.ok) throw new Error(`${path}: ${response.status} ${await response.text()}`);
}

const admin = encodeURIComponent("sample.admin@example.com");
const client = encodeURIComponent("sample.client@example.com");

await put(`admins/${admin}`, { role: "admin", name: "Sample Admin" });
await put(`clients/${client}`, { name: "Sample Client", mobile: "+919999999902", active: true });
await put(`clients/${encodeURIComponent("second.client@example.com")}`, { name: "Second Sample Client", active: true });

const files = [
  ["f1", "GST Return July.pdf", "GST", "FY 2026-27", 248000],
  ["f2", "GST Challan Receipt.pdf", "GST", "FY 2026-27", 91000],
  ["f3", "GST Annual Return.pdf", "GST", "FY 2025-26", 512000],
  ["f4", "ITR Acknowledgement.pdf", "ITR", "FY 2025-26", 130000],
  ["f5", "PAN Card.pdf", "MASTERS", null, 64000],
];
for (const [id, name, category, fy, size] of files) {
  await put(`clients/${client}/files/${id}`, {
    name,
    category,
    fy,
    size,
    publicId: `clients/sample/${id}.pdf`,
    uploadedAt: Date.now(),
  });
}

console.log("Sample data added. Sign in as sample.admin@example.com or sample.client@example.com");
