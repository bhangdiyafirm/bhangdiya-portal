import React, { useState, useEffect } from "react";
import { signOut } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "./firebase";

function Dashboard() {
  const [clientName, setClientName] = useState("");
  const [documents, setDocuments] = useState(null);
  const [view, setView] = useState("main");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedFY, setSelectedFY] = useState("");

  useEffect(() => {
    const fetchClientData = async () => {
      const user = auth.currentUser;
      if (user) {
        const docRef = doc(db, "clients", user.email);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          setClientName(data.name);
          setDocuments(data.documents || {});
        }
      }
    };

    fetchClientData();
  }, []);

  const handleLogout = async () => {
    await signOut(auth);
    window.location.href = "/";
  };

  const openCategory = (category) => {
    setSelectedCategory(category);
    if (category === "MASTERS") {
      setView("files");
    } else {
      setView("category");
    }
  };

  const openFY = (fy) => {
    setSelectedFY(fy);
    setView("files");
  };

  const goBack = () => {
    if (view === "files" && selectedCategory !== "MASTERS") {
      setView("category");
    } else {
      setView("main");
      setSelectedCategory("");
      setSelectedFY("");
    }
  };

  const renderMain = () => (
    <div style={styles.grid}>
      {["GST", "ITR", "MASTERS"].map((cat) => (
        <div key={cat} style={styles.folderCard} onClick={() => openCategory(cat)}>
          <div style={styles.folderIcon}>📁</div>
          <p style={styles.folderLabel}>{cat}</p>
        </div>
      ))}
    </div>
  );

  const renderCategory = () => {
    const fys = documents && documents[selectedCategory] ? Object.keys(documents[selectedCategory]) : [];
    return (
      <div style={styles.grid}>
        {fys.length === 0 && <p style={styles.placeholder}>No years added yet.</p>}
        {fys.map((fy) => (
          <div key={fy} style={styles.folderCard} onClick={() => openFY(fy)}>
            <div style={styles.folderIcon}>📁</div>
            <p style={styles.folderLabel}>{fy}</p>
          </div>
        ))}
      </div>
    );
  };

  const renderFiles = () => {
    let files = [];
    if (selectedCategory === "MASTERS") {
      files = (documents && documents["MASTERS"]) || [];
    } else {
      files = (documents && documents[selectedCategory] && documents[selectedCategory][selectedFY]) || [];
    }

    return (
      <div style={styles.fileList}>
        {files.length === 0 && <p style={styles.placeholder}>No files uploaded yet.</p>}
        {files.map(function (file, idx) {
          return (
            <a
              key={idx}
              href={file.url}
              target="_blank"
              rel="noopener noreferrer"
              style={styles.fileItem}
            >
              📄 {file.name}
            </a>
          );
        })}
      </div>
    );
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h2>Welcome, {clientName || "..."}</h2>
        <button onClick={handleLogout} style={styles.logoutButton}>
          Logout
        </button>
      </div>

      <div style={styles.card}>
        {view !== "main" && (
          <button onClick={goBack} style={styles.backButton}>
            ← Back
          </button>
        )}

        <h3>
          {view === "main" && "Your Documents"}
          {view === "category" && selectedCategory}
          {view === "files" && selectedCategory === "MASTERS"
            ? "MASTERS"
            : view === "files"
            ? selectedCategory + " / " + selectedFY
            : ""}
        </h3>

        {view === "main" && renderMain()}
        {view === "category" && renderCategory()}
        {view === "files" && renderFiles()}
      </div>
    </div>
  );
}

const styles = {
  container: {
    padding: "30px",
    fontFamily: "Arial, sans-serif",
    backgroundColor: "#f0f2f5",
    minHeight: "100vh",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "30px",
  },
  logoutButton: {
    padding: "8px 16px",
    backgroundColor: "#e00",
    color: "#fff",
    border: "none",
    borderRadius: "4px",
    cursor: "pointer",
  },
  card: {
    backgroundColor: "#fff",
    padding: "20px",
    borderRadius: "8px",
    boxShadow: "0 2px 10px rgba(0,0,0,0.1)",
    minHeight: "300px",
  },
  backButton: {
    marginBottom: "15px",
    padding: "6px 14px",
    backgroundColor: "#eee",
    border: "none",
    borderRadius: "4px",
    cursor: "pointer",
  },
  grid: {
    display: "flex",
    gap: "20px",
    flexWrap: "wrap",
    marginTop: "15px",
  },
  folderCard: {
    width: "120px",
    padding: "20px 10px",
    backgroundColor: "#f8f9fa",
    border: "1px solid #ddd",
    borderRadius: "8px",
    textAlign: "center",
    cursor: "pointer",
  },
  folderIcon: {
    fontSize: "40px",
  },
  folderLabel: {
    marginTop: "8px",
    fontWeight: "bold",
    fontSize: "14px",
  },
  fileList: {
    display: "flex",
    flexDirection: "column",
    gap: "10px",
    marginTop: "15px",
  },
  fileItem: {
    padding: "12px",
    backgroundColor: "#f8f9fa",
    border: "1px solid #ddd",
    borderRadius: "6px",
    textDecoration: "none",
    color: "#0070f3",
  },
  placeholder: {
    color: "#888",
  },
};

export default Dashboard;