// src/pages/SignUp.jsx — redesigned to match HomeDashboard
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  getAuth, createUserWithEmailAndPassword, updateProfile,
  GoogleAuthProvider, signInWithRedirect, getRedirectResult,
} from "firebase/auth";
import { getFirestore, doc, setDoc } from "firebase/firestore";
import "./Auth.css";

const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: "select_account" });

export default function SignUp() {
  const navigate = useNavigate();
  const [loading,       setLoading]       = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error,         setError]         = useState("");
  const [year,          setYear]          = useState("");

  // Handle Google redirect result on return
  useEffect(() => {
    const auth = getAuth();
    const db   = getFirestore();
    setGoogleLoading(true);
    getRedirectResult(auth)
      .then(async (result) => {
        if (result?.user) {
          const user = result.user;
          await setDoc(doc(db, "users", user.uid), {
            profile: {
              name:  user.displayName || user.email.split("@")[0],
              email: user.email,
              year:  1,
              photo: user.photoURL || "",
            },
            createdAt: new Date().toISOString(),
          }, { merge: true });
          localStorage.setItem("userName",  user.displayName || user.email.split("@")[0]);
          localStorage.setItem("userEmail", user.email);
          localStorage.setItem("userYear",  "1");
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

  const handleGoogleSignUp = async () => {
    setError("");
    try {
      await signInWithRedirect(getAuth(), googleProvider);
    } catch {
      setError("Could not start Google sign-in. Please try again.");
    }
  };

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
              <span>⚠</span> {error}
            </div>
          )}

          {/* Google Sign-Up */}
          <button type="button" className="auth-google-btn" onClick={handleGoogleSignUp} disabled={loading}>
            <svg width="18" height="18" viewBox="0 0 48 48">
              <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
              <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
              <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
              <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.18 1.48-4.97 2.31-8.16 2.31-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
              <path fill="none" d="M0 0h48v48H0z"/>
            </svg>
            Continue with Google
          </button>

          <div className="auth-divider"><span>or create with email</span></div>

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