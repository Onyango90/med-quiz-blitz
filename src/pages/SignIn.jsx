// src/pages/SignIn.jsx
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  signInWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithRedirect,
  getRedirectResult,
} from "firebase/auth";
import { auth } from "../firebase";
import "./Auth.css";

const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: "select_account" });

export default function SignIn() {
  const navigate = useNavigate();
  const [loading,       setLoading]       = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error,         setError]         = useState("");

  // Handle return from Google redirect
  useEffect(() => {
    setGoogleLoading(true);
    getRedirectResult(auth)
      .then((result) => {
        if (result?.user) {
          const user = result.user;
          localStorage.setItem("userName",  user.displayName || user.email.split("@")[0]);
          localStorage.setItem("userEmail", user.email);
          navigate("/home");
        }
      })
      .catch((err) => {
        if (err.code !== "auth/no-current-user") {
          setError("Google sign-in failed. Please try again.");
        }
      })
      .finally(() => setGoogleLoading(false));
  }, [navigate]);

  const handleSignIn = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    const email    = e.target.email.value.trim();
    const password = e.target.password.value.trim();
    try {
      const result = await signInWithEmailAndPassword(auth, email, password);
      localStorage.setItem("userName",  result.user.displayName || email.split("@")[0]);
      localStorage.setItem("userEmail", email);
      navigate("/home");
    } catch (err) {
      switch (err.code) {
        case "auth/user-not-found":    setError("No account found with this email."); break;
        case "auth/wrong-password":    setError("Incorrect password. Please try again."); break;
        case "auth/invalid-email":     setError("Please enter a valid email address."); break;
        case "auth/too-many-requests": setError("Too many attempts. Please try again later."); break;
        default:                       setError("Failed to sign in. Please check your connection.");
      }
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError("");
    try {
      await signInWithRedirect(auth, googleProvider);
    } catch {
      setError("Could not start Google sign-in. Please try again.");
    }
  };

  if (googleLoading) {
    return (
      <div className="auth-page">
        <div className="auth-loading-state">
          <div className="auth-spinner" />
          <p>Signing you in…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-page">
      <div className="auth-card">

        {/* Brand hero */}
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

        {/* Form card */}
        <div className="auth-form-card">
          <h2 className="auth-form-title">Welcome back</h2>
          <p className="auth-form-sub">Sign in to continue your learning streak</p>

          {error && (
            <div className="auth-error">
              <span>⚠</span> {error}
            </div>
          )}

          {/* Google button */}
          <button
            type="button"
            className="auth-google-btn"
            onClick={handleGoogleSignIn}
            disabled={loading}
          >
            <svg width="18" height="18" viewBox="0 0 48 48">
              <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
              <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
              <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
              <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.18 1.48-4.97 2.31-8.16 2.31-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
              <path fill="none" d="M0 0h48v48H0z"/>
            </svg>
            Continue with Google
          </button>

          <div className="auth-divider">
            <span>or sign in with email</span>
          </div>

          <form onSubmit={handleSignIn}>
            <div className="auth-field">
              <span className="auth-field-icon">✉</span>
              <input
                type="email"
                name="email"
                placeholder="Email address"
                className="auth-input"
                required
                disabled={loading}
              />
            </div>
            <div className="auth-field">
              <span className="auth-field-icon">🔒</span>
              <input
                type="password"
                name="password"
                placeholder="Password"
                className="auth-input"
                required
                disabled={loading}
              />
            </div>
            <button
              type="submit"
              className={`auth-submit${loading ? " loading" : ""}`}
              disabled={loading}
            >
              {loading ? "Signing in…" : "Sign In"}
            </button>
          </form>

          <div className="auth-footer">
            New to MedBlitz?{" "}
            <button onClick={() => navigate("/signup")}>Create an account</button>
          </div>
        </div>

        {/* Trust row */}
        <div className="auth-trust">
          <div className="auth-trust-item"><span className="auth-trust-icon">🔒</span> Secure</div>
          <div className="auth-trust-item"><span className="auth-trust-icon">🏥</span> Med-focused</div>
          <div className="auth-trust-item"><span className="auth-trust-icon">🔥</span> Streak tracking</div>
        </div>

      </div>
    </div>
  );
}