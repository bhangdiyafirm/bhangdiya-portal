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
  const [lastLogin, setLastLogin] = useState("");

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
        if (user.metadata && user.metadata.lastSignInTime) {
          const d = new Date(user.metadata.lastSignInTime);
          setLastLogin(d.toLocaleDateString() + " at " + d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }));
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

  const getTotalDocuments = () => {
    if (!documents) return 0;
    let count = 0;
    Object.keys(documents).forEach(function (cat) {
      if (cat === "MASTERS") {
        count += (documents[cat] || []).length;
      } else {
        Object.keys(documents[cat] || {}).forEach(function (fy) {
          count += (documents[cat][fy] || []).length;
        });
      }
    });
    return count;
  };

  const getCategoryCount = (cat) => {
    if (!documents || !documents[cat]) return 0;
    if (cat === "MASTERS") return documents[cat].length;
    let count = 0;
    Object.keys(documents[cat]).forEach(function (fy) {
      count += (documents[cat][fy] || []).length;
    });
    return count;
  };

  const folderMeta = {
    GST: {
      label: "GST Returns",
      desc: "Year-wise GST filings",
      gradient: "linear-gradient(135deg, #0070f3, #0050c9)",
      icon: (
        <svg width="26" height="26" viewBox="0 0 24 24" fill="none">
          <path d="M4 6h16M4 12h16M4 18h10" stroke="#fff" strokeWidth="2" strokeLinecap="round" />
        </svg>
      ),
    },
    ITR: {
      label: "Income Tax Returns",
      desc: "Year-wise ITR filings",
      gradient: "linear-gradient(135deg, #b8860b, #d4a520)",
      icon: (
        <svg width="26" height="26" viewBox="0 0 24 24" fill="none">
          <rect x="4" y="3" width="16" height="18" rx="2" stroke="#fff" strokeWidth="2" />
          <path d="M8 8h8M8 12h8M8 16h5" stroke="#fff" strokeWidth="2" strokeLinecap="round" />
        </svg>
      ),
    },
    MASTERS: {
      label: "Masters",
      desc: "Aadhaar, PAN &amp; other documents",
      gradient: "linear-gradient(135deg, #2b3a55, #12233f)",
      icon: (
        <svg width="26" height="26" viewBox="0 0 24 24" fill="none">
          <path d="M12 2l8 4v6c0 5-3.4 8.4-8 10-4.6-1.6-8-5-8-10V6l8-4z" stroke="#fff" strokeWidth="2" />
        </svg>
      ),
    },
  };

  const renderMain = () => (
    <div className="folder-grid">
      {["GST", "ITR", "MASTERS"].map((cat) => {
        const meta = folderMeta[cat];
        const count = getCategoryCount(cat);
        return (
          <div key={cat} className="folder-card" onClick={() => openCategory(cat)}>
            <div className="folder-icon-box" style={{ background: meta.gradient }}>
              {meta.icon}
            </div>
            <p className="folder-title">{meta.label}</p>
            <p className="folder-desc">{meta.desc}</p>
            <span className="folder-count">{count} file{count === 1 ? "" : "s"}</span>
          </div>
        );
      })}
    </div>
  );

  const renderCategory = () => {
    const fys = documents && documents[selectedCategory] ? Object.keys(documents[selectedCategory]) : [];
    return (
      <div className="folder-grid">
        {fys.length === 0 && (
          <div className="empty-state">
            <svg width="52" height="52" viewBox="0 0 24 24" fill="none">
              <path d="M3 7a2 2 0 012-2h4l2 2h8a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V7z" stroke="#c7d2e0" strokeWidth="1.6" />
            </svg>
            <p>No financial years added yet</p>
          </div>
        )}
        {fys.map((fy) => (
          <div key={fy} className="folder-card" onClick={() => openFY(fy)}>
            <div className="folder-icon-box" style={{ background: "linear-gradient(135deg, #0070f3, #0050c9)" }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <path d="M3 7a2 2 0 012-2h4l2 2h8a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V7z" stroke="#fff" strokeWidth="2" />
              </svg>
            </div>
            <p className="folder-title">{fy}</p>
            <span className="folder-count">{(documents[selectedCategory][fy] || []).length} file(s)</span>
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
      <div className="file-list">
        {files.length === 0 && (
          <div className="empty-state">
            <svg width="52" height="52" viewBox="0 0 24 24" fill="none">
              <rect x="5" y="3" width="14" height="18" rx="2" stroke="#c7d2e0" strokeWidth="1.6" />
              <path d="M8 8h8M8 12h8M8 16h5" stroke="#c7d2e0" strokeWidth="1.6" strokeLinecap="round" />
            </svg>
            <p>No files uploaded yet</p>
          </div>
        )}
      {files.map(function (file, idx) {
  return (
    <a
    key={idx}
    href={file.url}
    target="_blank"
    rel="noopener noreferrer"
    className="file-item"
  >
              <span className="file-icon">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                  <rect x="5" y="3" width="14" height="18" rx="2" stroke="#0070f3" strokeWidth="1.8" />
                  <path d="M8 8h8M8 12h8M8 16h5" stroke="#0070f3" strokeWidth="1.8" strokeLinecap="round" />
                </svg>
              </span>
              <span className="file-name">{file.name}</span>
              <span className="file-action">View →</span>
            </a>
          );
        })}
      </div>
    );
  };

  const totalDocs = getTotalDocuments();

  return (
    <div className="dash-page">
      <style>{`
        .dash-page {
          min-height: 100vh;
          background: linear-gradient(180deg, #f4f8ff 0%, #eef3fb 100%);
          font-family: 'Segoe UI', Arial, sans-serif;
          color: #1a2740;
          display: flex;
          flex-direction: column;
        }

        .dash-navbar {
          background: #ffffff;
          border-bottom: 1px solid #e6ecf5;
          padding: 14px 26px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          position: sticky;
          top: 0;
          z-index: 10;
          box-shadow: 0 2px 12px rgba(15,40,90,0.04);
        }

        .navbar-left {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .navbar-logo {
          width: 42px;
          height: 42px;
          border-radius: 12px;
          background: linear-gradient(135deg, #0070f3, #0050c9);
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 6px 14px rgba(0,112,243,0.25);
        }

        .navbar-firm {
          line-height: 1.25;
        }

        .navbar-firm-name {
          font-weight: 700;
          font-size: 15.5px;
          color: #12233f;
        }

        .navbar-firm-sub {
          font-size: 11px;
          color: #0070f3;
          font-weight: 600;
          letter-spacing: 0.3px;
        }

        .navbar-right {
          display: flex;
          align-items: center;
          gap: 16px;
        }

        .navbar-icon-btn {
          width: 38px;
          height: 38px;
          border-radius: 10px;
          background: #f4f8ff;
          border: 1px solid #e6ecf5;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: background 0.15s ease;
        }

        .navbar-icon-btn:hover {
          background: #e8f0fe;
        }

        .navbar-profile {
          display: flex;
          align-items: center;
          gap: 9px;
        }

        .profile-avatar {
          width: 36px;
          height: 36px;
          border-radius: 50%;
          background: linear-gradient(135deg, #d4a520, #b8860b);
          color: #fff;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 700;
          font-size: 14px;
        }

        .logout-btn {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 9px 16px;
          background: #fef2f1;
          color: #d92d20;
          border: 1px solid #fbd5d2;
          border-radius: 9px;
          font-weight: 600;
          font-size: 13px;
          cursor: pointer;
          transition: background 0.15s ease;
        }

        .logout-btn:hover {
          background: #fde4e2;
        }

        .dash-content {
          flex: 1;
          padding: 30px 26px 40px 26px;
          max-width: 1080px;
          margin: 0 auto;
          width: 100%;
          box-sizing: border-box;
        }

        .welcome-banner {
          background: linear-gradient(135deg, #0070f3 0%, #0050c9 60%, #12233f 130%);
          border-radius: 18px;
          padding: 28px 30px;
          color: #fff;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 20px;
          box-shadow: 0 16px 34px rgba(0,80,201,0.22);
          animation: fadeSlideUp 0.5s ease;
          flex-wrap: wrap;
        }

        @keyframes fadeSlideUp {
          from { opacity: 0; transform: translateY(14px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .welcome-left {
          display: flex;
          align-items: center;
          gap: 16px;
        }

        .welcome-avatar {
          width: 58px;
          height: 58px;
          border-radius: 50%;
          background: rgba(255,255,255,0.18);
          border: 2px solid rgba(255,255,255,0.4);
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 700;
          font-size: 22px;
        }

        .welcome-title {
          font-size: 20px;
          font-weight: 700;
          margin: 0 0 4px 0;
        }

        .welcome-sub {
          font-size: 13px;
          opacity: 0.85;
          margin: 0;
        }

        .welcome-stats {
          display: flex;
          gap: 14px;
        }

        .stat-pill {
          background: rgba(255,255,255,0.14);
          border: 1px solid rgba(255,255,255,0.25);
          border-radius: 12px;
          padding: 10px 16px;
          text-align: center;
          min-width: 92px;
        }

        .stat-number {
          font-size: 19px;
          font-weight: 700;
        }

        .stat-label {
          font-size: 10.5px;
          opacity: 0.85;
          margin-top: 2px;
        }

        .section-card {
          background: #ffffff;
          border-radius: 18px;
          padding: 26px;
          margin-top: 24px;
          box-shadow: 0 10px 28px rgba(15,40,90,0.06);
          animation: fadeSlideUp 0.5s ease;
        }

        .section-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 20px;
        }

        .section-title {
          font-size: 17px;
          font-weight: 700;
          color: #12233f;
          margin: 0;
        }

        .back-btn {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 8px 14px;
          background: #f4f8ff;
          border: 1px solid #e0e9f7;
          border-radius: 9px;
          color: #0070f3;
          font-weight: 600;
          font-size: 13px;
          cursor: pointer;
          transition: background 0.15s ease;
        }

        .back-btn:hover {
          background: #e8f0fe;
        }

        .folder-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(190px, 1fr));
          gap: 18px;
        }

        .folder-card {
          background: #f9fbfe;
          border: 1px solid #eef2f8;
          border-radius: 14px;
          padding: 20px 16px;
          cursor: pointer;
          transition: transform 0.18s ease, box-shadow 0.18s ease, border-color 0.18s ease;
        }

        .folder-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 14px 28px rgba(15,40,90,0.10);
          border-color: #d9e6fb;
        }

        .folder-icon-box {
          width: 50px;
          height: 50px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 14px;
        }

        .folder-title {
          font-weight: 700;
          font-size: 14.5px;
          color: #12233f;
          margin: 0 0 3px 0;
        }

        .folder-desc {
          font-size: 11.5px;
          color: #8b98ab;
          margin: 0 0 10px 0;
        }

        .folder-count {
          display: inline-block;
          font-size: 11px;
          font-weight: 600;
          color: #0070f3;
          background: #eaf2ff;
          padding: 3px 9px;
          border-radius: 20px;
        }

        .file-list {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .file-item {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 14px 16px;
          background: #f9fbfe;
          border: 1px solid #eef2f8;
          border-radius: 12px;
          text-decoration: none;
          transition: background 0.15s ease, border-color 0.15s ease;
        }

        .file-item:hover {
          background: #eef5ff;
          border-color: #d9e6fb;
        }

        .file-icon {
          display: flex;
        }

        .file-name {
          flex: 1;
          font-size: 13.5px;
          font-weight: 600;
          color: #223252;
        }

        .file-action {
          font-size: 12px;
          font-weight: 700;
          color: #0070f3;
        }

        .empty-state {
          grid-column: 1 / -1;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 40px 10px;
          color: #a6b2c5;
          gap: 10px;
        }

        .empty-state p {
          font-size: 13px;
          margin: 0;
        }

        .dash-footer {
          text-align: center;
          padding: 20px 16px;
          color: #97a3b6;
          font-size: 11.5px;
          border-top: 1px solid #e6ecf5;
          background: #ffffff;
        }

        .dash-footer strong {
          color: #33445c;
        }

        @media (max-width: 640px) {
          .welcome-banner {
            flex-direction: column;
            align-items: flex-start;
          }
          .welcome-stats {
            width: 100%;
          }
          .stat-pill {
            flex: 1;
          }
          .navbar-firm-name {
            font-size: 13.5px;
          }
        }
      `}</style>

      <div className="dash-navbar">
        <div className="navbar-left">
          <div className="navbar-logo">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
              <path d="M12 2L3 7v6c0 5 3.8 8.7 9 10 5.2-1.3 9-5 9-10V7l-9-5z" stroke="#fff" strokeWidth="1.6" />
              <path d="M8.5 12l2.3 2.3L15.8 9" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <div className="navbar-firm">
            <div className="navbar-firm-name">Bhangdiya &amp; Bhangdiya</div>
            <div className="navbar-firm-sub">CLIENT PORTAL</div>
          </div>
        </div>

        <div className="navbar-right">
          <div className="navbar-icon-btn" title="Notifications">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <path d="M18 8a6 6 0 10-12 0c0 7-3 9-3 9h18s-3-2-3-9" stroke="#5a6b83" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M13.7 21a2 2 0 01-3.4 0" stroke="#5a6b83" strokeWidth="1.7" strokeLinecap="round" />
            </svg>
          </div>
          <div className="navbar-profile">
            <div className="profile-avatar">
              {clientName ? clientName.charAt(0).toUpperCase() : "C"}
            </div>
          </div>
          <button onClick={handleLogout} className="logout-btn">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
              <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M16 17l5-5-5-5M21 12H9" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Logout
          </button>
        </div>
      </div>

      <div className="dash-content">
        <div className="welcome-banner">
          <div className="welcome-left">
            <div className="welcome-avatar">
              {clientName ? clientName.charAt(0).toUpperCase() : "C"}
            </div>
            <div>
              <p className="welcome-title">Welcome, {clientName || "..."}</p>
              <p className="welcome-sub">
                {lastLogin ? "Last login: " + lastLogin : "Access your documents securely below"}
              </p>
            </div>
          </div>
          <div className="welcome-stats">
            <div className="stat-pill">
              <div className="stat-number">{totalDocs}</div>
              <div className="stat-label">TOTAL FILES</div>
            </div>
            <div className="stat-pill">
              <div className="stat-number">3</div>
              <div className="stat-label">CATEGORIES</div>
            </div>
          </div>
        </div>

        <div className="section-card">
          <div className="section-header">
            <h3 className="section-title">
              {view === "main" && "Your Documents"}
              {view === "category" && folderMeta[selectedCategory].label}
              {view === "files" && selectedCategory === "MASTERS"
                ? "Masters"
                : view === "files"
                ? selectedCategory + " / " + selectedFY
                : ""}
            </h3>
            {view !== "main" && (
              <button onClick={goBack} className="back-btn">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                  <path d="M15 18l-6-6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                Back
              </button>
            )}
          </div>

          {view === "main" && renderMain()}
          {view === "category" && renderCategory()}
          {view === "files" && renderFiles()}
        </div>
      </div>

      <div className="dash-footer">
        <strong>M/s Bhangdiya &amp; Bhangdiya, Chartered Accountants</strong> · 9890188300 / 9890806888
        <br />
        © {new Date().getFullYear()} All rights reserved.
      </div>
    </div>
  );
}

export default Dashboard;