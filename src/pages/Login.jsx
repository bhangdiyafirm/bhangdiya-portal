import { useEffect, useRef, useState } from "react";
import { RecaptchaVerifier, signInWithPhoneNumber } from "firebase/auth";
import { auth, usingEmulators } from "../firebase";
import { FIRM } from "../firm";
import { formatPhone, toE164 } from "../data";
import { ContactList, Icon, Monogram } from "../components/Ui.jsx";

const RESEND_SECONDS = 30;

function explain(error) {
  switch (error?.code) {
    case "auth/invalid-phone-number":
      return "Please enter a valid 10-digit Indian mobile number.";
    case "auth/invalid-verification-code":
      return "That code is not correct. Please check the SMS and try again.";
    case "auth/code-expired":
      return "This code has expired. Please ask for a new one.";
    case "auth/too-many-requests":
      return "Too many attempts. Please wait a while and try again.";
    case "auth/billing-not-enabled":
    case "auth/quota-exceeded":
    case "auth/operation-not-allowed":
      return "SMS login is not available right now. Please call us and we will help you.";
    case "auth/network-request-failed":
      return "No internet connection. Please check and try again.";
    default:
      return "Something went wrong. Please try again.";
  }
}

export default function Login() {
  const [step, setStep] = useState("phone");
  const [mobile, setMobile] = useState("");
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const [wait, setWait] = useState(0);
  const confirmation = useRef(null);
  const verifier = useRef(null);
  const codeInput = useRef(null);

  useEffect(() => {
    if (wait <= 0) return undefined;
    const timer = setTimeout(() => setWait(wait - 1), 1000);
    return () => clearTimeout(timer);
  }, [wait]);

  useEffect(() => () => verifier.current?.clear(), []);

  const phone = toE164(mobile);

  async function sendCode(event) {
    event?.preventDefault();
    if (!phone) {
      setError({ message: "Please enter a valid 10-digit Indian mobile number." });
      return;
    }
    setBusy(true);
    setError(null);
    try {
      if (!verifier.current) {
        verifier.current = new RecaptchaVerifier(auth, "recaptcha-slot", { size: "invisible" });
      }
      confirmation.current = await signInWithPhoneNumber(auth, phone, verifier.current);
      setStep("code");
      setCode("");
      setWait(RESEND_SECONDS);
      setTimeout(() => codeInput.current?.focus(), 50);
    } catch (err) {
      verifier.current?.clear();
      verifier.current = null;
      setError({ message: explain(err), code: err?.code });
    }
    setBusy(false);
  }

  async function verify(value) {
    if (value.length !== 6 || busy) return;
    setBusy(true);
    setError(null);
    try {
      await confirmation.current.confirm(value);
    } catch (err) {
      setError({ message: explain(err), code: err?.code });
      setBusy(false);
    }
  }

  function onCodeChange(event) {
    const value = event.target.value.replace(/\D/g, "").slice(0, 6);
    setCode(value);
    if (value.length === 6) verify(value);
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
            <h2>{step === "phone" ? "Sign in" : "Enter the code"}</h2>
            <p className="muted">
              {step === "phone"
                ? "Use the mobile number registered with our office. We'll send you a 6-digit code by SMS."
                : `We sent a 6-digit code to ${formatPhone(phone)}.`}
            </p>
          </div>

          {step === "phone" ? (
            <form onSubmit={sendCode} noValidate>
              <label className="field-label" htmlFor="mobile">
                Mobile number
              </label>
              <div className="phone-field">
                <span className="phone-prefix">+91</span>
                <input
                  id="mobile"
                  type="tel"
                  inputMode="numeric"
                  autoComplete="tel-national"
                  placeholder="98901 88300"
                  value={mobile}
                  onChange={(e) => setMobile(e.target.value)}
                  autoFocus
                />
              </div>
              {error && <Alert error={error} />}
              <button className="btn btn-primary btn-block" disabled={busy}>
                {busy ? "Sending code…" : "Send code"}
              </button>
            </form>
          ) : (
            <form onSubmit={(e) => (e.preventDefault(), verify(code))} noValidate>
              <label className="field-label" htmlFor="code">
                6-digit code
              </label>
              <input
                id="code"
                ref={codeInput}
                className="code-input"
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                placeholder="••••••"
                value={code}
                onChange={onCodeChange}
              />
              {error && <Alert error={error} />}
              <button className="btn btn-primary btn-block" disabled={busy || code.length !== 6}>
                {busy ? "Checking…" : "Verify and sign in"}
              </button>
              <div className="login-links">
                <button type="button" className="link" onClick={() => setStep("phone")}>
                  Change number
                </button>
                <button
                  type="button"
                  className="link"
                  disabled={wait > 0 || busy}
                  onClick={sendCode}
                >
                  {wait > 0 ? `Resend code in ${wait}s` : "Resend code"}
                </button>
              </div>
            </form>
          )}

          <div id="recaptcha-slot" />
          {usingEmulators && (
            <p className="dev-note">
              Local test mode: no real SMS is sent. The code appears in the emulator log.
            </p>
          )}
        </div>
        <p className="login-foot muted">
          © {new Date().getFullYear()} M/s {FIRM.name}, {FIRM.tagline}
        </p>
      </section>
    </div>
  );
}

function Alert({ error }) {
  return (
    <p className="alert" role="alert">
      {error.message}
      {error.code && <span className="alert-code">{error.code}</span>}
    </p>
  );
}
