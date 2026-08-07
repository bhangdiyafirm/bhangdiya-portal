import React, { useState, useEffect } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "./firebase";
import Login from "./Login";
import Dashboard from "./Dashboard";
import AdminPanel from "./AdminPanel";

function App() {
  const [user, setUser] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        const adminRef = doc(db, "admins", currentUser.email);
        const adminSnap = await getDoc(adminRef);
        setIsAdmin(adminSnap.exists());
        setUser(currentUser);
      } else {
        setUser(null);
        setIsAdmin(false);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  if (loading) {
    return <p style={{ textAlign: "center", marginTop: "50px" }}>Loading...</p>;
  }

  if (!user) {
    return <Login />;
  }

  return isAdmin ? <AdminPanel /> : <Dashboard />;
}

export default App;