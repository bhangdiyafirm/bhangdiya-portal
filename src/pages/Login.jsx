import { useEffect, useState } from "react";
import {
  GoogleAuthProvider,
  getRedirectResult,
  signInWithPopup,
  signInWithRedirect,
} from "firebase/auth";
import { auth, usingEmulators } from "../firebase";
import { FIRM } from "../firm";
import { ContactList, Icon, Monogram } from "../components/Ui.jsx";

function explain(error) {
  switch (error?.code) {
    case "auth/popup-closed-by-user":
    case "auth/cancelled-popup-request":
      return null; // The person closed the Google window themselves.
    case "auth/popup-blocked":
      return "Your browser blocked the Google sign-in window. Please allow pop-ups for this site and try again.";
    case "auth/network-request-failed":
      return "No internet connection. Please check and try again.";
    case "auth/unauthorized-domain":
      return "Sign-in is not set up for this web address yet. Please contact our office.";
    default:
      return "Sign-in didn't work. Please try again.";
  }
}

function GoogleMark() {
  return (
    <svg width="20" height="20" viewBox="0 0 48 48" aria-hidden="true">
      <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z" />
      <path fill="#FF3D00" d="m6.3 14.7 6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z" />
      <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z" />
      <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z" />
    </svg>
  );
}

// Phones handle a full-page trip to Google better than a pop-up window.
const preferRedirect =
  typeof window !== "undefined" && window.matchMedia?.("(pointer: coarse)").matches;

export default function Login() {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  // Shows a problem that happened on the way back from Google's page.
  useEffect(() => {
    getRedirectResult(auth).catch((err) => {
      const message = explain(err);
      if (message) setError({ message, code: err?.code });
    });
  }, []);

  async function signIn() {
    setBusy(true);
    setError(null);
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: "select_account" });
    try {
      if (preferRedirect) {
        await signInWithRedirect(auth, provider);
        return; // The page leaves for Google here.
      }
      await signInWithPopup(auth, provider);
    } catch (err) {
      if (
        err?.code === "auth/popup-blocked" ||
        err?.code === "auth/operation-not-supported-in-this-environment"
      ) {
        await signInWithRedirect(auth, provider);
        return;
      }
      const message = explain(err);
      if (message) setError({ message, code: err?.code });
    }
    setBusy(false);
  }

  return (
    <div className="login">
      <aside className="login-brand">
        <div className="login-brand-inner">
          <Monogram />
          <h1>{FIRM.name}</h1>
          <p className="login-tag">{FIRM.tagline}</p>
          <p className="login-lede">
            Your GST, income tax and other documents from our office, in one secure place.
          </p>
          <div className="login-contact">
            <p className="login-contact-title">New client? Contact us to get access.</p>
            <ContactList />
          </div>
        </div>
      </aside>

      <section className="login-panel">
        <div className="login-card">
          <div className="login-card-head">
            <span className="pill">
              <Icon name="shield" size={14} /> Client Portal
            </span>
            <h2>Sign in</h2>
            <p className="muted">
              Use the Google (Gmail) account you registered with our office. No password to
              remember.
            </p>
          </div>

          <button className="btn btn-google btn-block" onClick={signIn} disabled={busy}>
            <GoogleMark />
            {busy ? "Opening Google…" : "Continue with Google"}
          </button>

          {error && (
            <p className="alert" role="alert">
              {error.message}
              {error.code && <span className="alert-code">{error.code}</span>}
            </p>
          )}

          <ul className="login-points">
            <li>
              <Icon name="check" size={16} /> Only registered clients can see documents
            </li>
            <li>
              <Icon name="check" size={16} /> You see only your own files
            </li>
          </ul>

          {usingEmulators && (
            <p className="dev-note">Local test mode: Google sign-in is simulated on this computer.</p>
          )}
        </div>
        <p className="login-foot muted">
          © {new Date().getFullYear()} M/s {FIRM.name}, {FIRM.tagline}
        </p>
      </section>
    </div>
  );
}
