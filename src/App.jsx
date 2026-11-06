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
        const usedGoogle = user.providerData.some((p) => p.providerId === "google.com");
        if (!usedGoogle || !user.email) {
          // Leftover login of another kind (e.g. the old mobile-number test): start fresh.
          await signOut(auth);
          return setState({ status: "signedOut" });
        }
        const email = user.email.toLowerCase();
        const person = { email, displayName: user.displayName || "", photo: user.photoURL || "" };
        setState({ status: "loading" });
        try {
          const session = await loadSession(email);
          setState({ status: "ready", ...person, ...session });
        } catch {
          setState({ status: "error", ...person });
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
  if (state.status === "error") return <Unregistered email={state.email} failed />;

  const name = state.profile?.name || state.displayName;
  if (state.role === "admin") return <AdminHome email={state.email} name={name} />;
  if (state.role === "client") {
    return <ClientHome email={state.email} name={name} profile={state.profile} />;
  }
  return <Unregistered email={state.email} />;
}
