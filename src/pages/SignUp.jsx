// src/pages/SignUp.jsx — redesigned to match HomeDashboard
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { getAuth, createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import { getFirestore, doc, setDoc } from "firebase/firestore";
import "./Auth.css";

export default function SignUp() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError]   = useState("");
  const [year, setYear]     = useState("");

  const handleSignUp = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const username = e.target.username?.value?.trim() || e.target.email.value.split("@")[0];
    const email    = e.target.email.value.trim();
    const password = e.target.password.value.trim();

    const authFB = getAuth();
    const db     = getFirestore();

    try {
      const userCredential = await createUserWithEmailAndPassword(authFB, email, password);
      const user = userCredential.user;
      await updateProfile(user, { displayName: username });
      await setDoc(doc(db, "users", user.uid), {
        profile: { name: username, username, email, year, joinDate: new Date().toISOString() },
        stats: { totalAttempted: 0, totalCorrect: 0, streak: 0, lastActiveDate: null, totalTimeSpent: 0, sessionsCompleted: 0 },
        subjectStats: {},
        dailyActivity: {},
      });
      localStorage.setItem("userName", username);
      localStorage.setItem("userYear", year);
      navigate("/home");
    } catch (err) {
      if      (err.code === "auth/email-already-in-use") setError("This email is already registered. Try signing in.");
      else if (err.code === "auth/weak-password")        setError("Password should be at least 6 characters.");
      else if (err.code === "auth/invalid-email")        setError("Please enter a valid email address.");
      else                                               setError(err.message);
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
              Join thousands of med students.<br />Build your streak from day one.
            </span>
          </div>
        </div>

        {/* ─ Form card ─ */}
        <div className="auth-form-card">
          <h2 className="auth-form-title">Create your account</h2>
          <p className="auth-form-sub">Set up your profile and start studying</p>

          {error && (
            <div className="auth-error">
              <span>⚠️</span> {error}
            </div>
          )}

          <form onSubmit={handleSignUp}>
            <div className="auth-field">
              <span className="auth-field-icon">👤</span>
              <input
                type="text"
                name="username"
                placeholder="Username"
                className="auth-input"
                required
                disabled={loading}
              />
            </div>
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
                placeholder="Password (min 6 characters)"
                className="auth-input"
                required
                minLength="6"
                disabled={loading}
              />
            </div>
            <div className="auth-field">
              <span className="auth-field-icon">🎓</span>
              <select
                name="year"
                className="auth-select"
                required
                value={year}
                onChange={(e) => setYear(e.target.value)}
                disabled={loading}
              >
                <option value="">Year of study</option>
                <option value="1">1st Year</option>
                <option value="2">2nd Year</option>
                <option value="3">3rd Year</option>
                <option value="4">4th Year</option>
                <option value="5">5th Year</option>
                <option value="6">6th Year</option>
              </select>
            </div>

            <button
              type="submit"
              className={`auth-submit${loading ? " loading" : ""}`}
              disabled={loading}
            >
              {loading ? "Creating account" : "Create Account"}
            </button>
          </form>

          <div className="auth-footer">
            Already have an account?{" "}
            <button onClick={() => navigate("/signin")}>Sign in</button>
          </div>
        </div>

        {/* ─ Trust row ─ */}
        <div className="auth-trust">
          <div className="auth-trust-item">
            <span className="auth-trust-icon">🆓</span> Free to join
          </div>
          <div className="auth-trust-item">
            <span className="auth-trust-icon">📊</span> Track progress
          </div>
          <div className="auth-trust-item">
            <span className="auth-trust-icon">🏆</span> Earn XP
          </div>
        </div>

      </div>
    </div>
  );
}