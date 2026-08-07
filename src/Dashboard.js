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
  const [search, setSearch] = useState("");
  const [viewMode, setViewMode] = useState("grid");

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
    setSearch("");
    setSelectedCategory(category);
    if (category === "MASTERS") {
      setView("files");
    } else {
      setView("category");
    }
  };

  const openFY = (fy) => {
    setSearch("");
    setSelectedFY(fy);
    setView("files");
  };

  const goBack = () => {
    setSearch("");
    if (view === "files" && selectedCategory !== "MASTERS") {
      setView("category");
    } else {
      setView("main");
      setSelectedCategory("");
      setSelectedFY("");
    }
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
      label: "GST",
      desc: "Goods and Services Tax related documents",
      bg: "#eef4ff",
      accent: "#0070f3",
    },
    ITR: {
      label: "ITR",
      desc: "Income Tax Returns and related documents",
      bg: "#eafaf0",
      accent: "#16a34a",
    },
    MASTERS: {
      label: "MASTERS",
      desc: "Master data and other important files",
      bg: "#fff4e8",
      accent: "#e07a1f",
    },
  };

  const folderIcon = (
    <svg width="30" height="30" viewBox="0 0 24 24" fill="none">
      <path d="M3 7a2 2 0 012-2h4l2 2h8a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V7z" fill="#fbbf24" stroke="#f0a920" strokeWidth="0.5" />
    </svg>
  );

  const renderMain = () => {
    const cats = ["GST", "ITR", "MASTERS"].filter(function (cat) {
      return folderMeta[cat].label.toLowerCase().includes(search.toLowerCase());
    });

    return (
      <div className={viewMode === "grid" ? "cards-grid" : "cards-list"}>
        {cats.map((cat) => {
          const meta = folderMeta[cat];
          const count = getCategoryCount(cat);
          return (
            <div key={cat} className="folder-card" style={{ background: meta.bg }}>
              <div className="folder-card-top">
                <div className="folder-icon-circle">{folderIcon}</div>
                <span className="count-badge" style={{ color: meta.accent, background: "#ffffffb0" }}>
                  📁 {count}
                </span>
              </div>
              <p className="folder-title">{meta.label}</p>
              <p className="folder-desc">{meta.desc}</p>
              <button
                className="view-docs-btn"
                style={{ color: meta.accent, borderColor: meta.accent }}
                onClick={() => openCategory(cat)}
              >
                View Documents
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                  <path d="M9 6l6 6-6 6" stroke={meta.accent} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
            </div>
          );
        })}
      </div>
    );
  };

  const renderCategory = () => {
    const fys = documents && documents[selectedCategory] ? Object.keys(documents[selectedCategory]) : [];
    const filtered = fys.filter(function (fy) {
      return fy.toLowerCase().includes(search.toLowerCase());
    });
    const meta = folderMeta[selectedCategory];

    return (
      <div className={viewMode === "grid" ? "cards-grid" : "cards-list"}>
        {filtered.length === 0 && (
          <div className="empty-state">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none">
              <path d="M3 7a2 2 0 012-2h4l2 2h8a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V7z" stroke="#c7d2e0" strokeWidth="1.6" />
            </svg>
            <p>No financial years added yet</p>
          </div>
        )}
        {filtered.map((fy) => (
          <div key={fy} className="folder-card" style={{ background: meta.bg }}>
            <div className="folder-card-top">
              <div className="folder-icon-circle">{folderIcon}</div>
              <span className="count-badge" style={{ color: meta.accent, background: "#ffffffb0" }}>
                📄 {(documents[selectedCategory][fy] || []).length}
              </span>
            </div>
            <p className="folder-title">{fy}</p>
            <p className="folder-desc">Files for {fy}</p>
            <button
              className="view-docs-btn"
              style={{ color: meta.accent, borderColor: meta.accent }}
              onClick={() => openFY(fy)}
            >
              View Documents
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                <path d="M9 6l6 6-6 6" stroke={meta.accent} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
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

    const filtered = files.filter(function (f) {
      return f.name.toLowerCase().includes(search.toLowerCase());
    });

    return (
      <div className="file-list">
        {filtered.length === 0 && (
          <div className="empty-state">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none">
              <rect x="5" y="3" width="14" height="18" rx="2" stroke="#c7d2e0" strokeWidth="1.6" />
              <path d="M8 8h8M8 12h8M8 16h5" stroke="#c7d2e0" strokeWidth="1.6" strokeLinecap="round" />
            </svg>
            <p>No files uploaded yet</p>
          </div>
        )}
        {filtered.map(function (file, idx) {
          return (
            <a key={idx} href={file.url} target="_blank" rel="noopener noreferrer" className="file-item">
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

  const initial = clientName ? clientName.charAt(0).toUpperCase() : "C";

  return (
    <div className="dash-page">
      <style>{`
        .dash-page {
          min-height: 100vh;
          background: #f4f7fb;
          font-family: 'Segoe UI', Arial, sans-serif;
          color: #1a2740;
          display: flex;
          flex-direction: column;
        }

        .dash-navbar {
          background: #ffffff;
          border-bottom: 1px solid #e6ecf5;
          padding: 14px 30px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          position: sticky;
          top: 0;
          z-index: 10;
          flex-wrap: wrap;
          gap: 14px;
        }

        .navbar-left {
          display: flex;
          align-items: center;
          gap: 14px;
          flex-wrap: wrap;
        }

        .navbar-logo {
          width: 46px;
          height: 46px;
          border-radius: 10px;
          border: 1.5px solid #d9e6fb;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 800;
          font-size: 18px;
          color: #0070f3;
          font-family: Georgia, serif;
        }

        .navbar-firm-name {
          font-weight: 800;
          font-size: 16px;
          color: #12233f;
          letter-spacing: 0.3px;
        }

        .navbar-firm-sub {
          font-size: 11.5px;
          color: #8b98ab;
        }

        .navbar-divider {
          width: 1px;
          height: 34px;
          background: #e6ecf5;
        }

        .navbar-portal-title {
          display: flex;
          align-items: center;
          gap: 6px;
          font-weight: 700;
          font-size: 14px;
          color: #12233f;
        }

        .navbar-portal-sub {
          font-size: 11px;
          color: #8b98ab;
        }

        .navbar-right {
          display: flex;
          align-items: center;
          gap: 16px;
        }

        .navbar-profile {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .profile-avatar {
          width: 38px;
          height: 38px;
          border-radius: 50%;
          background: linear-gradient(135deg, #0070f3, #0050c9);
          color: #fff;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 700;
          font-size: 14px;
        }

        .profile-text-label {
          font-size: 11px;
          color: #8b98ab;
        }

        .profile-text-name {
          font-size: 13.5px;
          font-weight: 700;
          color: #12233f;
        }

        .bell-btn {
          position: relative;
          width: 36px;
          height: 36px;
          border-radius: 9px;
          background: #f4f8ff;
          border: 1px solid #e6ecf5;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
        }

        .bell-dot {
          position: absolute;
          top: 7px;
          right: 8px;
          width: 7px;
          height: 7px;
          border-radius: 50%;
          background: #e0433d;
        }

        .logout-btn {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 9px 16px;
          background: #ffffff;
          color: #d92d20;
          border: 1.5px solid #f2c6c2;
          border-radius: 9px;
          font-weight: 600;
          font-size: 13px;
          cursor: pointer;
          transition: background 0.15s ease;
        }

        .logout-btn:hover {
          background: #fef2f1;
        }

        .hero-banner {
          margin: 22px 26px 0 26px;
          background: linear-gradient(120deg, #eaf2ff 0%, #f4f8ff 60%, #eef6ff 100%);
          border-radius: 18px;
          padding: 28px 32px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 20px;
          flex-wrap: wrap;
          animation: fadeSlideUp 0.5s ease;
        }

        @keyframes fadeSlideUp {
          from { opacity: 0; transform: translateY(14px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .hero-left {
          display: flex;
          align-items: center;
          gap: 16px;
        }

        .hero-avatar {
          width: 56px;
          height: 56px;
          border-radius: 50%;
          background: #ffffff;
          box-shadow: 0 6px 16px rgba(0,112,243,0.18);
          display: flex;
          align-items: center;
          justify-content: center;
          color: #0070f3;
        }

        .hero-title {
          font-size: 21px;
          font-weight: 800;
          color: #12233f;
          margin: 0 0 4px 0;
        }

        .hero-sub {
          font-size: 13.5px;
          color: #6b7a8f;
          margin: 0;
        }

        .hero-illustration {
          display: flex;
          gap: 10px;
          opacity: 0.9;
        }

        .illus-box {
          width: 46px;
          height: 46px;
          border-radius: 12px;
          background: #ffffff;
          box-shadow: 0 8px 18px rgba(15,40,90,0.08);
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .main-layout {
          margin: 22px 26px 0 26px;
          display: flex;
          gap: 20px;
          flex-wrap: wrap;
        }

        .documents-panel {
          flex: 1;
          min-width: 320px;
          background: #ffffff;
          border-radius: 18px;
          padding: 26px;
          box-shadow: 0 10px 28px rgba(15,40,90,0.06);
          animation: fadeSlideUp 0.5s ease;
        }

        .doc-panel-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 20px;
          flex-wrap: wrap;
          gap: 14px;
        }

        .doc-panel-title-row {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .doc-icon-badge {
          width: 42px;
          height: 42px;
          border-radius: 12px;
          background: linear-gradient(135deg, #0070f3, #0050c9);
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .doc-panel-title {
          font-size: 16.5px;
          font-weight: 800;
          color: #12233f;
          margin: 0;
        }

        .doc-panel-sub {
          font-size: 11.5px;
          color: #8b98ab;
          margin: 0;
        }

        .doc-panel-actions {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .search-wrapper {
          position: relative;
        }

        .search-input {
          padding: 9px 14px 9px 36px;
          border: 1.5px solid #e2e8f0;
          border-radius: 10px;
          font-size: 13px;
          background: #fbfcfe;
          width: 190px;
          box-sizing: border-box;
        }

        .search-input:focus {
          outline: none;
          border-color: #0070f3;
          box-shadow: 0 0 0 3px rgba(0,112,243,0.12);
        }

        .search-icon {
          position: absolute;
          left: 11px;
          top: 50%;
          transform: translateY(-50%);
          color: #9aa8bd;
        }

        .toggle-btn {
          width: 36px;
          height: 36px;
          border-radius: 9px;
          border: 1px solid #e2e8f0;
          background: #fbfcfe;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
        }

        .toggle-btn.active {
          background: #0070f3;
          border-color: #0070f3;
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
        }

        .cards-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(210px, 1fr));
          gap: 18px;
        }

        .cards-list {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .folder-card {
          border-radius: 14px;
          padding: 20px;
          transition: transform 0.18s ease, box-shadow 0.18s ease;
        }

        .folder-card:hover {
          transform: translateY(-3px);
          box-shadow: 0 12px 24px rgba(15,40,90,0.10);
        }

        .folder-card-top {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 14px;
        }

        .folder-icon-circle {
          width: 56px;
          height: 56px;
          border-radius: 50%;
          background: #ffffff;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 4px 10px rgba(15,40,90,0.06);
        }

        .count-badge {
          font-size: 11.5px;
          font-weight: 700;
          padding: 4px 10px;
          border-radius: 20px;
        }

        .folder-title {
          font-size: 16px;
          font-weight: 800;
          color: #12233f;
          margin: 0 0 6px 0;
          text-align: center;
        }

        .folder-desc {
          font-size: 12px;
          color: #6b7a8f;
          text-align: center;
          margin: 0 0 16px 0;
          line-height: 1.5;
        }

        .view-docs-btn {
          width: 100%;
          padding: 9px;
          background: #ffffff;
          border: 1.5px solid;
          border-radius: 9px;
          font-weight: 700;
          font-size: 12.5px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          transition: opacity 0.15s ease;
        }

        .view-docs-btn:hover {
          opacity: 0.8;
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
        }

        .file-item:hover {
          background: #eef5ff;
          border-color: #d9e6fb;
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

        .safety-panel {
          width: 260px;
          background: #ffffff;
          border-radius: 18px;
          padding: 24px;
          box-shadow: 0 10px 28px rgba(15,40,90,0.06);
          height: fit-content;
          animation: fadeSlideUp 0.5s ease;
        }

        .safety-header {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 12px;
        }

        .safety-icon-box {
          width: 44px;
          height: 44px;
          border-radius: 12px;
          background: #eaf2ff;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .safety-title {
          font-size: 14.5px;
          font-weight: 800;
          color: #12233f;
          margin: 0 0 2px 0;
        }

        .safety-desc {
          font-size: 12px;
          color: #6b7a8f;
          line-height: 1.6;
          margin: 0 0 16px 0;
        }

        .safety-list {
          display: flex;
          flex-direction: column;
          gap: 12px;
          border-top: 1px solid #eef2f8;
          padding-top: 14px;
        }

        .safety-item {
          display: flex;
          align-items: center;
          gap: 10px;
          font-size: 12.5px;
          color: #33445c;
          font-weight: 600;
        }

        .safety-item-icon {
          width: 26px;
          height: 26px;
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .help-strip {
          margin: 22px 26px 0 26px;
          background: #ffffff;
          border-radius: 18px;
          padding: 20px 26px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 18px;
          box-shadow: 0 10px 28px rgba(15,40,90,0.06);
        }

        .help-left {
          display: flex;
          align-items: center;
          gap: 14px;
        }

        .help-icon-box {
          width: 44px;
          height: 44px;
          border-radius: 50%;
          background: linear-gradient(135deg, #0070f3, #0050c9);
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .help-title {
          font-size: 14px;
          font-weight: 800;
          color: #12233f;
          margin: 0 0 2px 0;
        }

        .help-sub {
          font-size: 12px;
          color: #8b98ab;
          margin: 0;
        }

        .help-info-row {
          display: flex;
          align-items: center;
          gap: 26px;
          flex-wrap: wrap;
        }

        .help-info-item {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 13px;
          color: #33445c;
          font-weight: 600;
        }

        .help-info-item a {
          color: #33445c;
          text-decoration: none;
        }

        .dash-footer {
          margin-top: 26px;
          background: linear-gradient(135deg, #12233f, #0d1b33);
          color: #cfd9ea;
          padding: 26px 30px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 14px;
        }

        .footer-left {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .footer-logo {
          width: 40px;
          height: 40px;
          border-radius: 9px;
          border: 1.5px solid rgba(255,255,255,0.3);
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 800;
          font-family: Georgia, serif;
          color: #fff;
        }

        .footer-firm-name {
          font-weight: 800;
          font-size: 14px;
          color: #fff;
        }

        .footer-firm-sub {
          font-size: 11px;
          color: #9fb0cc;
        }

        .footer-center {
          font-size: 12px;
          color: #9fb0cc;
          text-align: center;
        }

        .footer-tagline {
          color: #d4a520;
          font-style: italic;
          margin-left: 10px;
        }

        .footer-social {
          display: flex;
          gap: 10px;
        }

        .footer-social a {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          border: 1.5px solid rgba(255,255,255,0.3);
          display: flex;
          align-items: center;
          justify-content: center;
          color: #fff;
          text-decoration: none;
        }

        @media (max-width: 900px) {
          .main-layout {
            flex-direction: column;
          }
          .safety-panel {
            width: 100%;
          }
        }

        @media (max-width: 640px) {
          .hero-illustration {
            display: none;
          }
          .doc-panel-header {
            flex-direction: column;
            align-items: stretch;
          }
          .search-input {
            width: 100%;
          }
        }
      `}</style>

      <div className="dash-navbar">
        <div className="navbar-left">
          <div className="navbar-logo">CA</div>
          <div>
            <div className="navbar-firm-name">BHANGDIYA &amp; BHANGDIYA</div>
            <div className="navbar-firm-sub">Chartered Accountants</div>
          </div>
          <div className="navbar-divider"></div>
          <div>
            <div className="navbar-portal-title">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
                <path d="M12 2L3 7v6c0 5 3.8 8.7 9 10 5.2-1.3 9-5 9-10V7l-9-5z" stroke="#0070f3" strokeWidth="1.8" />
                <path d="M8.5 12l2.3 2.3L15.8 9" stroke="#0070f3" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              Client Portal
            </div>
            <div className="navbar-portal-sub">Secure | Trusted | Professional</div>
          </div>
        </div>

        <div className="navbar-right">
          <div className="navbar-profile">
            <div className="profile-avatar">{initial}</div>
            <div>
              <div className="profile-text-label">Welcome,</div>
              <div className="profile-text-name">{clientName || "..."}</div>
            </div>
          </div>
          <div className="bell-btn">
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none">
              <path d="M18 8a6 6 0 10-12 0c0 7-3 9-3 9h18s-3-2-3-9" stroke="#5a6b83" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M13.7 21a2 2 0 01-3.4 0" stroke="#5a6b83" strokeWidth="1.7" strokeLinecap="round" />
            </svg>
            <span className="bell-dot"></span>
          </div>
          <button onClick={handleLogout} className="logout-btn">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
              <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M16 17l5-5-5-5M21 12H9" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Logout
          </button>
        </div>
      </div>

      <div className="hero-banner">
        <div className="hero-left">
          <div className="hero-avatar">
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="8" r="4" stroke="#0070f3" strokeWidth="1.8" />
              <path d="M4 20c0-4 3.6-6 8-6s8 2 8 6" stroke="#0070f3" strokeWidth="1.8" />
            </svg>
          </div>
          <div>
            <p className="hero-title">Welcome back, {clientName || "..."}!</p>
            <p className="hero-sub">
              {lastLogin ? "Last login: " + lastLogin + " · Access and manage all your important documents securely." : "Access and manage all your important documents securely."}
            </p>
          </div>
        </div>
        <div className="hero-illustration">
          <div className="illus-box">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
              <rect x="4" y="3" width="16" height="18" rx="2" stroke="#0070f3" strokeWidth="1.6" />
              <path d="M8 8h8M8 12h3M13 12h3M8 16h3M13 16h3" stroke="#0070f3" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </div>
          <div className="illus-box">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
              <rect x="4" y="4" width="16" height="16" rx="2" stroke="#d4a520" strokeWidth="1.6" />
              <path d="M8 14l3-3 2 2 3-4" stroke="#d4a520" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <div className="illus-box">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
              <path d="M12 3v6M8 5l4-2 4 2" stroke="#16a34a" strokeWidth="1.6" strokeLinecap="round" />
              <path d="M6 20c0-5 3-8 6-8s6 3 6 8" stroke="#16a34a" strokeWidth="1.6" />
            </svg>
          </div>
        </div>
      </div>

      <div className="main-layout">
        <div className="documents-panel">
          <div className="doc-panel-header">
            <div className="doc-panel-title-row">
              <div className="doc-icon-badge">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                  <path d="M3 7a2 2 0 012-2h4l2 2h8a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V7z" stroke="#fff" strokeWidth="1.8" />
                </svg>
              </div>
              <div>
                <p className="doc-panel-title">
                  {view === "main" && "Your Documents"}
                  {view === "category" && folderMeta[selectedCategory].label}
                  {view === "files" && selectedCategory === "MASTERS"
                    ? "Masters"
                    : view === "files"
                    ? selectedCategory + " / " + selectedFY
                    : ""}
                </p>
                <p className="doc-panel-sub">
                  {view === "main" ? "View and download your documents by category" : "Browse and open your files"}
                </p>
              </div>
            </div>

            <div className="doc-panel-actions">
              {view !== "main" && (
                <button className="back-btn" onClick={goBack}>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
                    <path d="M15 18l-6-6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  Back
                </button>
              )}
              <div className="search-wrapper">
                <span className="search-icon">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                    <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="1.8" />
                    <path d="M20 20l-3.5-3.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                  </svg>
                </span>
                <input
                  type="text"
                  placeholder="Search documents..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="search-input"
                />
              </div>
              {view !== "files" && (
                <>
                  <button
                    className={"toggle-btn " + (viewMode === "grid" ? "active" : "")}
                    onClick={() => setViewMode("grid")}
                  >
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
                      <rect x="3" y="3" width="7" height="7" rx="1" fill={viewMode === "grid" ? "#fff" : "#8b98ab"} />
                      <rect x="14" y="3" width="7" height="7" rx="1" fill={viewMode === "grid" ? "#fff" : "#8b98ab"} />
                      <rect x="3" y="14" width="7" height="7" rx="1" fill={viewMode === "grid" ? "#fff" : "#8b98ab"} />
                      <rect x="14" y="14" width="7" height="7" rx="1" fill={viewMode === "grid" ? "#fff" : "#8b98ab"} />
                    </svg>
                  </button>
                  <button
                    className={"toggle-btn " + (viewMode === "list" ? "active" : "")}
                    onClick={() => setViewMode("list")}
                  >
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
                      <path d="M4 6h16M4 12h16M4 18h16" stroke={viewMode === "list" ? "#fff" : "#8b98ab"} strokeWidth="2" strokeLinecap="round" />
                    </svg>
                  </button>
                </>
              )}
            </div>
          </div>

          {view === "main" && renderMain()}
          {view === "category" && renderCategory()}
          {view === "files" && renderFiles()}
        </div>

        {view === "main" && (
          <div className="safety-panel">
            <div className="safety-header">
              <div className="safety-icon-box">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                  <path d="M12 2L3 7v6c0 5 3.8 8.7 9 10 5.2-1.3 9-5 9-10V7l-9-5z" stroke="#0070f3" strokeWidth="1.8" />
                  <path d="M8.5 12l2.3 2.3L15.8 9" stroke="#0070f3" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              <div>
                <p className="safety-title">Your Data is Safe</p>
              </div>
            </div>
            <p className="safety-desc">
              We ensure the highest security standards to protect your confidential information.
            </p>
            <div className="safety-list">
              <div className="safety-item">
                <span className="safety-item-icon" style={{ background: "#eaf2ff" }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                    <rect x="5" y="10" width="14" height="10" rx="2" stroke="#0070f3" strokeWidth="1.8" />
                    <path d="M8 10V7a4 4 0 018 0v3" stroke="#0070f3" strokeWidth="1.8" />
                  </svg>
                </span>
                Bank-level Security
              </div>
              <div className="safety-item">
                <span className="safety-item-icon" style={{ background: "#eafaf0" }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                    <path d="M6 17a4 4 0 010-8 5 5 0 019.6-1.5A4 4 0 0118 17H6z" stroke="#16a34a" strokeWidth="1.7" />
                  </svg>
                </span>
                Regular Backups
              </div>
              <div className="safety-item">
                <span className="safety-item-icon" style={{ background: "#fff4e8" }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                    <path d="M12 2L3 7v6c0 5 3.8 8.7 9 10 5.2-1.3 9-5 9-10V7l-9-5z" stroke="#e07a1f" strokeWidth="1.7" />
                    <path d="M8.5 12l2.3 2.3L15.8 9" stroke="#e07a1f" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </span>
                100% Confidential
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="help-strip">
        <div className="help-left">
          <div className="help-icon-box">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path d="M3 18v-6a9 9 0 0118 0v6" stroke="#fff" strokeWidth="1.8" />
              <path d="M21 19a2 2 0 01-2 2h-1v-5h3v3zM3 19a2 2 0 002 2h1v-5H3v3z" stroke="#fff" strokeWidth="1.8" />
            </svg>
          </div>
          <div>
            <p className="help-title">Need Help?</p>
            <p className="help-sub">Our support team is here to assist you.</p>
          </div>
        </div>
        <div className="help-info-row">
          <div className="help-info-item">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
              <path d="M22 16.9v3a2 2 0 01-2.2 2 19.8 19.8 0 01-8.6-3 19.5 19.5 0 01-6-6 19.8 19.8 0 01-3-8.7A2 2 0 014.1 2h3a2 2 0 012 1.7c.1 1 .3 2 .7 3a2 2 0 01-.5 2.1L8 10a16 16 0 006 6l1.2-1.3a2 2 0 012.1-.5c1 .4 2 .6 3 .7a2 2 0 011.7 2z" stroke="#0070f3" strokeWidth="1.6" />
            </svg>
            <a href="tel:9890188300">9890188300</a> / <a href="tel:9890806888">9890806888</a>
          </div>
          <div className="help-info-item">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
              <rect x="3" y="5" width="18" height="14" rx="2" stroke="#0070f3" strokeWidth="1.6" />
              <path d="M3 7l9 6 9-6" stroke="#0070f3" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            panclients@gmail.com
          </div>
          <div className="help-info-item">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="9" stroke="#0070f3" strokeWidth="1.6" />
              <path d="M12 7v5l3 3" stroke="#0070f3" strokeWidth="1.6" strokeLinecap="round" />
            </svg>
            10 AM to 9 PM
          </div>
        </div>
      </div>

      <div className="dash-footer">
        <div className="footer-left">
          <div className="footer-logo">CA</div>
          <div>
            <div className="footer-firm-name">BHANGDIYA &amp; BHANGDIYA</div>
            <div className="footer-firm-sub">Chartered Accountants</div>
          </div>
        </div>
        <div className="footer-center">
          © {new Date().getFullYear()} Bhangdiya &amp; Bhangdiya. All Rights Reserved.
          <span className="footer-tagline">Trusted. Transparent. Professional.</span>
        </div>
        <div className="footer-social">
          <a href="#" title="Add real link">f</a>
          <a href="#" title="Add real link">in</a>
          <a href="#" title="Add real link">◎</a>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;