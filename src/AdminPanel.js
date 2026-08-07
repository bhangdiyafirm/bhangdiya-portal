import React, { useState, useEffect } from "react";
import { signOut } from "firebase/auth";
import { collection, getDocs } from "firebase/firestore";
import { auth, db } from "./firebase";
import ClientManage from "./ClientManage";

function AdminPanel() {
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedClient, setSelectedClient] = useState(null);
  const [search, setSearch] = useState("");

  useEffect(() => {
    const fetchClients = async () => {
      const querySnapshot = await getDocs(collection(db, "clients"));
      const clientList = [];
      querySnapshot.forEach(function (docSnap) {
        clientList.push({ id: docSnap.id, name: docSnap.data().name });
      });
      setClients(clientList);
      setLoading(false);
    };

    fetchClients();
  }, []);

  const handleLogout = async () => {
    await signOut(auth);
    window.location.href = "/";
  };

  const filteredClients = clients.filter(function (c) {
    const q = search.toLowerCase();
    return (
      (c.name || "").toLowerCase().includes(q) ||
      (c.id || "").toLowerCase().includes(q)
    );
  });

  return (
    <div className="admin-page">
      <style>{`
        .admin-page {
          min-height: 100vh;
          background: linear-gradient(180deg, #f4f8ff 0%, #eef3fb 100%);
          font-family: 'Segoe UI', Arial, sans-serif;
          color: #1a2740;
          display: flex;
          flex-direction: column;
        }

        .admin-navbar {
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
          background: linear-gradient(135deg, #12233f, #2b3a55);
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 6px 14px rgba(18,35,63,0.28);
        }

        .navbar-firm-name {
          font-weight: 700;
          font-size: 15.5px;
          color: #12233f;
        }

        .navbar-firm-sub {
          font-size: 11px;
          color: #b8860b;
          font-weight: 700;
          letter-spacing: 0.4px;
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

        .admin-content {
          flex: 1;
          padding: 30px 26px 40px 26px;
          max-width: 1080px;
          margin: 0 auto;
          width: 100%;
          box-sizing: border-box;
        }

        .admin-banner {
          background: linear-gradient(135deg, #12233f 0%, #2b3a55 60%, #0070f3 150%);
          border-radius: 18px;
          padding: 26px 30px;
          color: #fff;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 20px;
          box-shadow: 0 16px 34px rgba(18,35,63,0.22);
          animation: fadeSlideUp 0.5s ease;
          flex-wrap: wrap;
        }

        @keyframes fadeSlideUp {
          from { opacity: 0; transform: translateY(14px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .admin-banner-title {
          font-size: 20px;
          font-weight: 700;
          margin: 0 0 4px 0;
        }

        .admin-banner-sub {
          font-size: 13px;
          opacity: 0.85;
          margin: 0;
        }

        .banner-stat {
          background: rgba(255,255,255,0.14);
          border: 1px solid rgba(255,255,255,0.25);
          border-radius: 12px;
          padding: 10px 18px;
          text-align: center;
          min-width: 100px;
        }

        .banner-stat-number {
          font-size: 20px;
          font-weight: 700;
        }

        .banner-stat-label {
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
          gap: 14px;
          flex-wrap: wrap;
        }

        .section-title {
          font-size: 17px;
          font-weight: 700;
          color: #12233f;
          margin: 0;
        }

        .search-wrapper {
          position: relative;
          flex: 1;
          max-width: 280px;
        }

        .search-input {
          width: 100%;
          padding: 10px 14px 10px 38px;
          border: 1.5px solid #e2e8f0;
          border-radius: 10px;
          font-size: 13.5px;
          box-sizing: border-box;
          background: #fbfcfe;
          transition: border-color 0.2s ease, box-shadow 0.2s ease;
        }

        .search-input:focus {
          outline: none;
          border-color: #0070f3;
          box-shadow: 0 0 0 3px rgba(0,112,243,0.12);
          background: #ffffff;
        }

        .search-icon {
          position: absolute;
          left: 12px;
          top: 50%;
          transform: translateY(-50%);
          color: #9aa8bd;
        }

        .client-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
          gap: 16px;
        }

        .client-card {
          background: #f9fbfe;
          border: 1px solid #eef2f8;
          border-radius: 14px;
          padding: 18px;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 14px;
          transition: transform 0.18s ease, box-shadow 0.18s ease, border-color 0.18s ease;
        }

        .client-card:hover {
          transform: translateY(-3px);
          box-shadow: 0 14px 28px rgba(15,40,90,0.10);
          border-color: #d9e6fb;
        }

        .client-avatar {
          width: 44px;
          height: 44px;
          border-radius: 50%;
          background: linear-gradient(135deg, #0070f3, #0050c9);
          color: #fff;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 700;
          font-size: 16px;
          flex-shrink: 0;
        }

        .client-name {
          font-weight: 700;
          font-size: 14.5px;
          color: #12233f;
          margin: 0 0 2px 0;
        }

        .client-email {
          font-size: 11.5px;
          color: #8b98ab;
          margin: 0;
        }

        .client-arrow {
          margin-left: auto;
          color: #c7d2e0;
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

        .loading-state {
          text-align: center;
          padding: 40px;
          color: #8b98ab;
          font-size: 13.5px;
        }

        .admin-footer {
          text-align: center;
          padding: 20px 16px;
          color: #97a3b6;
          font-size: 11.5px;
          border-top: 1px solid #e6ecf5;
          background: #ffffff;
        }

        .admin-footer strong {
          color: #33445c;
        }

        @media (max-width: 640px) {
          .admin-banner {
            flex-direction: column;
            align-items: flex-start;
          }
          .section-header {
            flex-direction: column;
            align-items: stretch;
          }
          .search-wrapper {
            max-width: 100%;
          }
        }
      `}</style>

      <div className="admin-navbar">
        <div className="navbar-left">
          <div className="navbar-logo">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
              <path d="M12 2L3 7v6c0 5 3.8 8.7 9 10 5.2-1.3 9-5 9-10V7l-9-5z" stroke="#fff" strokeWidth="1.6" />
              <path d="M8.5 12l2.3 2.3L15.8 9" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <div>
            <div className="navbar-firm-name">Bhangdiya &amp; Bhangdiya</div>
            <div className="navbar-firm-sub">ADMIN PANEL</div>
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

      <div className="admin-content">
        {selectedClient ? (
          <ClientManage
            clientId={selectedClient.id}
            clientName={selectedClient.name}
            onBack={() => setSelectedClient(null)}
          />
        ) : (
          <>
            <div className="admin-banner">
              <div>
                <p className="admin-banner-title">Welcome, Admin</p>
                <p className="admin-banner-sub">Manage your clients and their documents</p>
              </div>
              <div className="banner-stat">
                <div className="banner-stat-number">{clients.length}</div>
                <div className="banner-stat-label">TOTAL CLIENTS</div>
              </div>
            </div>

            <div className="section-card">
              <div className="section-header">
                <h3 className="section-title">All Clients</h3>
                <div className="search-wrapper">
                  <span className="search-icon">
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
                      <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="1.8" />
                      <path d="M20 20l-3.5-3.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                    </svg>
                  </span>
                  <input
                    type="text"
                    placeholder="Search clients..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="search-input"
                  />
                </div>
              </div>

              {loading && <div className="loading-state">Loading clients...</div>}

              {!loading && filteredClients.length === 0 && (
                <div className="empty-state">
                  <svg width="52" height="52" viewBox="0 0 24 24" fill="none">
                    <circle cx="12" cy="8" r="4" stroke="#c7d2e0" strokeWidth="1.6" />
                    <path d="M4 20c0-4 3.6-6 8-6s8 2 8 6" stroke="#c7d2e0" strokeWidth="1.6" />
                  </svg>
                  <p>{clients.length === 0 ? "No clients added yet." : "No clients match your search."}</p>
                </div>
              )}

              {!loading && filteredClients.length > 0 && (
                <div className="client-grid">
                  {filteredClients.map(function (client) {
                    return (
                      <div
                        key={client.id}
                        className="client-card"
                        onClick={() => setSelectedClient(client)}
                      >
                        <div className="client-avatar">
                          {client.name ? client.name.charAt(0).toUpperCase() : "C"}
                        </div>
                        <div>
                          <p className="client-name">{client.name}</p>
                          <p className="client-email">{client.id}</p>
                        </div>
                        <div className="client-arrow">
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                            <path d="M9 6l6 6-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </>
        )}
      </div>

      <div className="admin-footer">
        <strong>M/s Bhangdiya &amp; Bhangdiya, Chartered Accountants</strong> · 9890188300 / 9890806888
        <br />
        © {new Date().getFullYear()} All rights reserved.
      </div>
    </div>
  );
}

export default AdminPanel;