import { useEffect, useState } from "react";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { auth } from "./firebase";
import { loadSession } from "./data";
import Login from "./pages/Login.jsx";
import ClientHome from "./pages/ClientHome.jsx";
import AdminHome from "./pages/AdminHome.jsx";
import Unregistered from "./pages/Unregistered.jsx";
import { Spinner } from "./components/Ui.jsx";

export default function App() {
  const [state, setState] = useState({ status: "loading" });

  useEffect(
    () =>
      onAuthStateChanged(auth, async (user) => {
        if (!user) return setState({ status: "signedOut" });
        const phone = user.phoneNumber;
        if (!phone) {
          await signOut(auth);
          return setState({ status: "signedOut" });
        }
        setState({ status: "loading" });
        try {
          const session = await loadSession(phone);
          setState({ status: "ready", phone, ...session });
        } catch {
          setState({ status: "error", phone });
        }
      }),
    []
  );

  if (state.status === "loading") {
    return (
      <div className="center-screen">
        <Spinner label="Opening your portal" />
      </div>
    );
  }
  if (state.status === "signedOut") return <Login />;
  if (state.status === "error") return <Unregistered phone={state.phone} failed />;
  if (state.role === "admin") return <AdminHome phone={state.phone} profile={state.profile} />;
  if (state.role === "client") return <ClientHome phone={state.phone} profile={state.profile} />;
  return <Unregistered phone={state.phone} />;
}
