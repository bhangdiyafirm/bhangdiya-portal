import React, { useState, useEffect } from "react";
import { signOut } from "firebase/auth";
import { collection, getDocs } from "firebase/firestore";
import { auth, db } from "./firebase";
import ClientManage from "./ClientManage";

function AdminPanel() {
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedClient, setSelectedClient] = useState(null);

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

  if (selectedClient) {
    return (
      <div style={styles.container}>
        <div style={styles.header}>
          <h2>Admin Panel - Bhangdiya And Bhangdiya</h2>
          <button onClick={handleLogout} style={styles.logoutButton}>
            Logout
          </button>
        </div>
        <ClientManage
          clientId={selectedClient.id}
          clientName={selectedClient.name}
          onBack={() => setSelectedClient(null)}
        />
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h2>Admin Panel - Bhangdiya And Bhangdiya</h2>
        <button onClick={handleLogout} style={styles.logoutButton}>
          Logout
        </button>
      </div>

      <div style={styles.card}>
        <h3>All Clients</h3>

        {loading && <p>Loading clients...</p>}

        {!loading && clients.length === 0 && (
          <p style={styles.placeholder}>No clients added yet.</p>
        )}

        <div style={styles.clientList}>
          {clients.map(function (client) {
            return (
              <div
                key={client.id}
                style={styles.clientCard}
                onClick={() => setSelectedClient(client)}
              >
                <p style={styles.clientName}>{client.name}</p>
                <p style={styles.clientEmail}>{client.id}</p>
              </div>
            );
          })}
        </div>
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
  clientList: {
    display: "flex",
    flexDirection: "column",
    gap: "10px",
    marginTop: "15px",
  },
  clientCard: {
    padding: "14px",
    backgroundColor: "#f8f9fa",
    border: "1px solid #ddd",
    borderRadius: "6px",
    cursor: "pointer",
  },
  clientName: {
    fontWeight: "bold",
    margin: 0,
  },
  clientEmail: {
    color: "#888",
    margin: "4px 0 0 0",
    fontSize: "13px",
  },
  placeholder: {
    color: "#888",
  },
};

export default AdminPanel;