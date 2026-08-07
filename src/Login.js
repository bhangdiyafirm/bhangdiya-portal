import React, { useState } from "react";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "./firebase";

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (err) {
      setError("Invalid email or password. Please try again.");
    }

    setLoading(false);
  };

  return (
    <div className="login-page">
      <style>{`
        .login-page {
          min-height: 100vh;
          width: 100%;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          background: linear-gradient(135deg, #f0f6ff 0%, #e8f0fe 40%, #f5f9ff 100%);
          font-family: 'Segoe UI', Arial, sans-serif;
          padding: 30px 16px;
          position: relative;
          overflow: hidden;
        }

        .login-page::before {
          content: "";
          position: absolute;
          top: -120px;
          right: -120px;
          width: 320px;
          height: 320px;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(0,112,243,0.08) 0%, rgba(0,112,243,0) 70%);
        }

        .login-page::after {
          content: "";
          position: absolute;
          bottom: -140px;
          left: -140px;
          width: 360px;
          height: 360px;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(0,112,243,0.06) 0%, rgba(0,112,243,0) 70%);
        }

        .login-card {
          position: relative;
          z-index: 1;
          background: #ffffff;
          padding: 44px 38px 34px 38px;
          border-radius: 18px;
          box-shadow: 0 20px 50px rgba(15, 40, 90, 0.10), 0 2px 8px rgba(15, 40, 90, 0.06);
          width: 100%;
          max-width: 400px;
          text-align: center;
          animation: fadeSlideUp 0.5s ease;
        }

        @keyframes fadeSlideUp {
          from { opacity: 0; transform: translateY(16px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .login-logo {
          width: 64px;
          height: 64px;
          margin: 0 auto 14px auto;
          border-radius: 16px;
          background: linear-gradient(135deg, #0070f3, #0050c9);
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 8px 20px rgba(0,112,243,0.25);
        }

        .login-title {
          margin: 0 0 4px 0;
          color: #12233f;
          font-size: 22px;
          font-weight: 700;
          letter-spacing: 0.2px;
        }

        .login-subtitle {
          color: #0070f3;
          font-weight: 600;
          font-size: 13px;
          margin: 0 0 6px 0;
          letter-spacing: 0.3px;
        }

        .login-welcome {
          color: #6b7a8f;
          font-size: 13.5px;
          margin: 0 0 26px 0;
          line-height: 1.5;
        }

        .field-group {
          text-align: left;
          margin-bottom: 16px;
        }

        .field-label {
          display: block;
          font-size: 12.5px;
          font-weight: 600;
          color: #33445c;
          margin-bottom: 6px;
        }

        .field-wrapper {
          position: relative;
          display: flex;
          align-items: center;
        }

        .field-icon {
          position: absolute;
          left: 13px;
          display: flex;
          align-items: center;
          color: #9aa8bd;
        }

        .field-input {
          width: 100%;
          padding: 12px 14px 12px 40px;
          border: 1.5px solid #e2e8f0;
          border-radius: 10px;
          font-size: 14.5px;
          box-sizing: border-box;
          transition: border-color 0.2s ease, box-shadow 0.2s ease;
          background: #fbfcfe;
          color: #1a2740;
        }

        .field-input:focus {
          outline: none;
          border-color: #0070f3;
          box-shadow: 0 0 0 3px rgba(0,112,243,0.12);
          background: #ffffff;
        }

        .toggle-eye {
          position: absolute;
          right: 13px;
          cursor: pointer;
          color: #9aa8bd;
          display: flex;
          align-items: center;
          background: none;
          border: none;
          padding: 0;
        }

        .toggle-eye:hover {
          color: #0070f3;
        }

        .row-between {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin: 4px 0 22px 0;
          font-size: 13px;
        }

        .remember-label {
          display: flex;
          align-items: center;
          gap: 7px;
          color: #4b5b73;
          cursor: pointer;
          user-select: none;
        }

        .remember-label input {
          accent-color: #0070f3;
          width: 15px;
          height: 15px;
          cursor: pointer;
        }

        .forgot-link {
          color: #0070f3;
          text-decoration: none;
          font-weight: 600;
        }

        .forgot-link:hover {
          text-decoration: underline;
        }

        .login-button {
          width: 100%;
          padding: 13px;
          background: linear-gradient(135deg, #0070f3, #0058cc);
          color: #fff;
          border: none;
          border-radius: 10px;
          font-size: 15.5px;
          font-weight: 600;
          cursor: pointer;
          transition: transform 0.15s ease, box-shadow 0.15s ease, opacity 0.15s ease;
          box-shadow: 0 10px 22px rgba(0,112,243,0.28);
        }

        .login-button:hover:not(:disabled) {
          transform: translateY(-1px);
          box-shadow: 0 14px 28px rgba(0,112,243,0.34);
        }

        .login-button:disabled {
          opacity: 0.7;
          cursor: not-allowed;
        }

        .error-text {
          color: #d92d20;
          background: #fef2f1;
          border: 1px solid #fbd5d2;
          padding: 9px 12px;
          border-radius: 8px;
          font-size: 12.5px;
          margin-bottom: 16px;
          text-align: left;
        }

        .info-box {
          margin-top: 22px;
          background: #f2f8ff;
          border: 1px solid #d9e9ff;
          border-radius: 12px;
          padding: 14px 16px;
          font-size: 12.5px;
          color: #33445c;
          line-height: 1.6;
          text-align: left;
        }

        .info-box a {
          color: #0070f3;
          font-weight: 600;
          text-decoration: none;
        }

        .info-box a:hover {
          text-decoration: underline;
        }

        .trust-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 10px;
          margin-top: 22px;
        }

        .trust-item {
          display: flex;
          align-items: center;
          gap: 7px;
          font-size: 11.5px;
          color: #5a6b83;
          background: #f7f9fc;
          border-radius: 8px;
          padding: 8px 9px;
        }

        .trust-item svg {
          flex-shrink: 0;
          color: #0070f3;
        }

        .login-footer {
          margin-top: 22px;
          text-align: center;
          color: #97a3b6;
          font-size: 11.5px;
          position: relative;
          z-index: 1;
        }

        @media (max-width: 420px) {
          .login-card {
            padding: 34px 22px 26px 22px;
          }
          .trust-row {
            grid-template-columns: 1fr;
          }
        }
      `}</style>

      <div className="login-card">
        <div className="login-logo">
          <svg width="30" height="30" viewBox="0 0 24 24" fill="none">
            <path d="M12 2L3 7v6c0 5 3.8 8.7 9 10 5.2-1.3 9-5 9-10V7l-9-5z" stroke="#fff" strokeWidth="1.6" fill="none"/>
            <path d="M8.5 12l2.3 2.3L15.8 9" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
          </svg>
        </div>

        <h2 className="login-title">Bhangdiya &amp; Bhangdiya</h2>
        <p className="login-subtitle">CHARTERED ACCOUNTANTS · CLIENT PORTAL</p>
        <p className="login-welcome">Welcome back. Please sign in to securely access your documents.</p>

        <form onSubmit={handleLogin}>
          <div className="field-group">
            <label className="field-label">Email Address</label>
            <div className="field-wrapper">
              <span className="field-icon">
                <svg width="17" height="17" viewBox="0 0 24 24" fill="none">
                  <rect x="3" y="5" width="18" height="14" rx="2" stroke="currentColor" strokeWidth="1.6"/>
                  <path d="M3 7l9 6 9-6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </span>
              <input
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="field-input"
                required
              />
            </div>
          </div>

          <div className="field-group">
            <label className="field-label">Password</label>
            <div className="field-wrapper">
              <span className="field-icon">
                <svg width="17" height="17" viewBox="0 0 24 24" fill="none">
                  <rect x="5" y="10" width="14" height="10" rx="2" stroke="currentColor" strokeWidth="1.6"/>
                  <path d="M8 10V7a4 4 0 018 0v3" stroke="currentColor" strokeWidth="1.6"/>
                </svg>
              </span>
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="field-input"
                style={{ paddingRight: "40px" }}
                required
              />
              <button
                type="button"
                className="toggle-eye"
                onClick={() => setShowPassword(!showPassword)}
                aria-label="Toggle password visibility"
              >
                {showPassword ? (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                    <path d="M3 3l18 18" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
                    <path d="M10.6 5.1A10.9 10.9 0 0112 5c5 0 9 4 10 7-0.4 1.1-1.1 2.3-2.1 3.4M6.4 6.4C4.5 7.7 3 9.6 2 12c1 3 5 7 10 7 1.3 0 2.5-0.2 3.6-0.6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
                    <path d="M9.9 9.9a3 3 0 004.2 4.2" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
                  </svg>
                ) : (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                    <path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7-10-7-10-7z" stroke="currentColor" strokeWidth="1.6"/>
                    <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.6"/>
                  </svg>
                )}
              </button>
            </div>
          </div>

          <div className="row-between">
            <label className="remember-label">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
              />
              Remember Me
            </label>
            <a href="#forgot" className="forgot-link">Forgot Password?</a>
          </div>

          {error && <p className="error-text">{error}</p>}

          <button type="submit" className="login-button" disabled={loading}>
            {loading ? "Logging in..." : "Login to Portal"}
          </button>
        </form>

        <div className="info-box">
          <strong>Are you a new client?</strong><br />
          To create your client portal account at M/s CA Bhangdiya &amp; Bhangdiya,
          please contact us at{" "}
          <a href="tel:9890188300">9890188300</a> /{" "}
          <a href="tel:9890806888">9890806888</a>.
        </div>

        <div className="trust-row">
          <div className="trust-item">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M12 2L3 7v6c0 5 3.8 8.7 9 10 5.2-1.3 9-5 9-10V7l-9-5z" stroke="currentColor" strokeWidth="1.8"/></svg>
            Secure Login
          </div>
          <div className="trust-item">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><rect x="5" y="10" width="14" height="10" rx="2" stroke="currentColor" strokeWidth="1.8"/><path d="M8 10V7a4 4 0 018 0v3" stroke="currentColor" strokeWidth="1.8"/></svg>
            SSL Protected
          </div>
          <div className="trust-item">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M4 8h16M4 12h16M4 16h10" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>
            Confidential Client Data
          </div>
          <div className="trust-item">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M8.5 12l2.3 2.3L15.8 9" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/><circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.8"/></svg>
            Trusted CA Firm
          </div>
        </div>
      </div>

      <p className="login-footer">
        © {new Date().getFullYear()} M/s Bhangdiya &amp; Bhangdiya, Chartered Accountants. All rights reserved.
      </p>
    </div>
  );
}

export default Login;