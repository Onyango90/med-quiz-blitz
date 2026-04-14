// src/pages/SignIn.jsx — redesigned to match HomeDashboard
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "../firebase";
import "./Auth.css";

export default function SignIn() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSignIn = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const email = e.target.email.value.trim();
    const password = e.target.password.value.trim();

    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      const userName = user.displayName || email.split("@")[0];
      localStorage.setItem("userName", userName);
      localStorage.setItem("userEmail", email);
      localStorage.setItem("userYear", "2");
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
            <div className="auth-error">
              <span>⚠️</span> {error}
            </div>
          )}

          <form onSubmit={handleSignIn}>
            <div className="auth-field">
              <span className="auth-field-icon">✉️</span>
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
              {loading ? "Signing in" : "Sign In"}
            </button>
          </form>

          <div className="auth-footer">
            New to MedBlitz?{" "}
            <button onClick={() => navigate("/signup")}>Create an account</button>
          </div>
        </div>

        {/* ─ Trust row ─ */}
        <div className="auth-trust">
          <div className="auth-trust-item">
            <span className="auth-trust-icon">🔒</span> Secure
          </div>
          <div className="auth-trust-item">
            <span className="auth-trust-icon">🏥</span> Med-focused
          </div>
          <div className="auth-trust-item">
            <span className="auth-trust-icon">🔥</span> Streak tracking
          </div>
        </div>

      </div>
    </div>
  );
}