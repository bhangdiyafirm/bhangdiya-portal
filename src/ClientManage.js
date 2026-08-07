import React, { useState } from "react";
import { doc, updateDoc, arrayUnion } from "firebase/firestore";import { db } from "./firebase";

const CLOUD_NAME = "xxezxppo";
const UPLOAD_PRESET = "bhangdiya_portal";

function ClientManage({ clientId, clientName, onBack }) {
  const [category, setCategory] = useState("");
  const [fy, setFy] = useState("");
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState("");

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  const handleUpload = async () => {
    if (!category) {
      setMessage("Please select a category (GST, ITR, or MASTERS).");
      return;
    }
    if (category !== "MASTERS" && !fy) {
      setMessage("Please enter a Financial Year (e.g. FY 2024-25).");
      return;
    }
    if (!file) {
      setMessage("Please choose a file first.");
      return;
    }

    setUploading(true);
    setMessage("Uploading...");

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("upload_preset", UPLOAD_PRESET);

      const response = await fetch(
        "https://api.cloudinary.com/v1_1/" + CLOUD_NAME + "/auto/upload",
        {
          method: "POST",
          body: formData,
        }
      );

      const data = await response.json();

      if (!data.secure_url) {
        setMessage("Upload failed. Please try again.");
        setUploading(false);
        return;
      }

      const newFileEntry = { name: file.name, url: data.secure_url };
      const clientDocRef = doc(db, "clients", clientId);

      if (category === "MASTERS") {
        const fieldPath = "documents.MASTERS";
        await updateDoc(clientDocRef, {
          [fieldPath]: arrayUnion(newFileEntry),
        });
      } else {
        const fieldPath = "documents." + category + "." + fy;
        await updateDoc(clientDocRef, {
          [fieldPath]: arrayUnion(newFileEntry),
        });
      }

      setMessage("File uploaded successfully!");
      setFile(null);
    } catch (err) {
      setMessage("Error: " + err.message);
    }

    setUploading(false);
  };


  return (
    <div style={styles.container}>
      <button onClick={onBack} style={styles.backButton}>
        ← Back to Clients
      </button>

      <div style={styles.card}>
        <h3>Manage Documents for {clientName}</h3>
        <p style={styles.emailText}>{clientId}</p>

        <div style={styles.formGroup}>
          <label style={styles.label}>Category</label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            style={styles.select}
          >
            <option value="">-- Select Category --</option>
            <option value="GST">GST</option>
            <option value="ITR">ITR</option>
            <option value="MASTERS">MASTERS</option>
          </select>
        </div>

        {category && category !== "MASTERS" && (
          <div style={styles.formGroup}>
            <label style={styles.label}>Financial Year</label>
            <input
              type="text"
              placeholder="e.g. FY 2024-25"
              value={fy}
              onChange={(e) => setFy(e.target.value)}
              style={styles.input}
            />
          </div>
        )}

        <div style={styles.formGroup}>
          <label style={styles.label}>Choose File</label>
          <input type="file" onChange={handleFileChange} style={styles.input} />
        </div>

        <button onClick={handleUpload} disabled={uploading} style={styles.uploadButton}>
          {uploading ? "Uploading..." : "Upload File"}
        </button>

        {message && <p style={styles.message}>{message}</p>}
      </div>
    </div>
  );
}

const styles = {
  container: {
    padding: "0",
  },
  backButton: {
    marginBottom: "15px",
    padding: "6px 14px",
    backgroundColor: "#eee",
    border: "none",
    borderRadius: "4px",
    cursor: "pointer",
  },
  card: {
    backgroundColor: "#fff",
    padding: "20px",
    borderRadius: "8px",
    boxShadow: "0 2px 10px rgba(0,0,0,0.1)",
  },
  emailText: {
    color: "#888",
    marginTop: "-10px",
    marginBottom: "20px",
  },
  formGroup: {
    marginBottom: "15px",
  },
  label: {
    display: "block",
    marginBottom: "5px",
    fontWeight: "bold",
    fontSize: "14px",
  },
  select: {
    width: "100%",
    padding: "10px",
    border: "1px solid #ccc",
    borderRadius: "4px",
    boxSizing: "border-box",
  },
  input: {
    width: "100%",
    padding: "10px",
    border: "1px solid #ccc",
    borderRadius: "4px",
    boxSizing: "border-box",
  },
  uploadButton: {
    padding: "10px 20px",
    backgroundColor: "#0070f3",
    color: "#fff",
    border: "none",
    borderRadius: "4px",
    cursor: "pointer",
    fontSize: "15px",
  },
  message: {
    marginTop: "15px",
    color: "#333",
  },
};

export default ClientManage;