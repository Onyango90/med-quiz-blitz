// src/pages/SignIn.jsx — with Google Sign-In
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "../firebase";
import { useAuth } from "../context/AuthContext";
import "./Auth.css";

// Google "G" SVG icon
function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="none" fillRule="evenodd">
        <path d="M17.64 9.205c0-.639-.057-1.252-.164-1.841H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/>
        <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z" fill="#34A853"/>
        <path d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05"/>
        <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
      </g>
    </svg>
  );
}

export default function SignIn() {
  const navigate          = useNavigate();
  const { signInWithGoogle } = useAuth();
  const [loading,  setLoading]  = useState(false);
  const [gLoading, setGLoading] = useState(false);
  const [error,    setError]    = useState("");

  // ── Email / password sign-in ──────────────────────────────────────────────
  const handleSignIn = async (e) => {
    e.preventDefault();
    setLoading(true); setError("");

    const email    = e.target.email.value.trim();
    const password = e.target.password.value.trim();

    try {
      const cred = await signInWithEmailAndPassword(auth, email, password);
      const user = cred.user;
      localStorage.setItem("userName",  user.displayName || email.split("@")[0]);
      localStorage.setItem("userEmail", email);
      navigate("/home");
    } catch (err) {
      switch (err.code) {
        case "auth/user-not-found":
          setError("No account found with this email. Please sign up first."); break;
        case "auth/wrong-password":
          setError("Incorrect password. Please try again."); break;
        case "auth/invalid-email":
          setError("Please enter a valid email address."); break;
        case "auth/too-many-requests":
          setError("Too many failed attempts. Please try again later."); break;
        default:
          setError("Failed to sign in. Please check your connection and try again.");
      }
      setLoading(false);
    }
  };

  // ── Google sign-in ────────────────────────────────────────────────────────
  const handleGoogle = async () => {
    setGLoading(true); setError("");
    try {
      await signInWithGoogle();
      navigate("/home");
    } catch (err) {
      if (err.code !== "auth/popup-closed-by-user") {
        setError("Google sign-in failed. Please try again.");
      }
      setGLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">

        {/* ─ Brand hero ─ */}
        <div className="auth-brand">
          <div className="auth-brand-bg">
            <div className="auth-brand-orb au-orb-1" />
            <div className="auth-brand-orb au-orb-2" />
          </div>
          <div className="auth-brand-inner">
            <div className="auth-logo-mark">M</div>
            <span className="auth-brand-name">Med<span>Blitz</span></span>
            <span className="auth-brand-sub">
              Your daily medical quiz companion.<br />Study smarter, score higher.
            </span>
            <div className="auth-brand-stats">
              <div className="auth-stat">
                <span className="auth-stat-val">10k+</span>
                <span className="auth-stat-label">Questions</span>
              </div>
              <div className="auth-stat">
                <span className="auth-stat-val">12</span>
                <span className="auth-stat-label">Subjects</span>
              </div>
              <div className="auth-stat">
                <span className="auth-stat-val">Daily</span>
                <span className="auth-stat-label">Challenges</span>
              </div>
            </div>
          </div>
        </div>

        {/* ─ Form card ─ */}
        <div className="auth-form-card">
          <h2 className="auth-form-title">Welcome back</h2>
          <p className="auth-form-sub">Sign in to continue your learning streak</p>

          {error && (
            <div className="auth-error"><span>⚠️</span> {error}</div>
          )}

          {/* ── Google button ── */}
          <button
            className="auth-google-btn"
            onClick={handleGoogle}
            disabled={gLoading || loading}
            type="button"
          >
            {gLoading
              ? <span className="auth-spinner" />
              : <GoogleIcon />}
            <span>{gLoading ? "Signing in…" : "Continue with Google"}</span>
          </button>

          {/* ── Divider ── */}
          <div className="auth-divider">
            <span>or sign in with email</span>
          </div>

          {/* ── Email / password form ── */}
          <form onSubmit={handleSignIn}>
            <div className="auth-field">
              <span className="auth-field-icon">✉️</span>
              <input type="email" name="email" placeholder="Email address"
                className="auth-input" required disabled={loading || gLoading} />
            </div>
            <div className="auth-field">
              <span className="auth-field-icon">🔒</span>
              <input type="password" name="password" placeholder="Password"
                className="auth-input" required disabled={loading || gLoading} />
            </div>

            <button
              type="submit"
              className={`auth-submit${loading ? " loading" : ""}`}
              disabled={loading || gLoading}
            >
              {loading ? "Signing in…" : "Sign In"}
            </button>
          </form>

          <div className="auth-footer">
            New to MedBlitz?{" "}
            <button onClick={() => navigate("/signup")}>Create an account</button>
          </div>
        </div>

        {/* ─ Trust row ─ */}
        <div className="auth-trust">
          <div className="auth-trust-item"><span className="auth-trust-icon">🔒</span> Secure</div>
          <div className="auth-trust-item"><span className="auth-trust-icon">🏥</span> Med-focused</div>
          <div className="auth-trust-item"><span className="auth-trust-icon">🔥</span> Streak tracking</div>
        </div>

      </div>
    </div>
  );
}