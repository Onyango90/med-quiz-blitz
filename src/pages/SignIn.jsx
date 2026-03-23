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
      localStorage.setItem("userYear", "2"); // Default to year 2 for now
      
      navigate("/home");
      
    } catch (err) {
      console.error("Signin error:", err);
      
      switch (err.code) {
        case 'auth/user-not-found':
          setError("No account found with this email. Please sign up first.");
          break;
        case 'auth/wrong-password':
          setError("Incorrect password. Please try again.");
          break;
        case 'auth/invalid-email':
          setError("Please enter a valid email address.");
          break;
        case 'auth/too-many-requests':
          setError("Too many failed attempts. Please try again later.");
          break;
        default:
          setError("Failed to sign in. Please check your connection and try again.");
      }
      setLoading(false);
    }
  };

  return (
    <div
      className="auth-container"
      onKeyDown={(e) => e.key === "Enter" && !loading && handleSignIn(e)}
      tabIndex={0}
    >
      <div className="auth-card">
        <h1 className="auth-title">
          Welcome to <span>MedBlitz</span>
        </h1>
        <p className="auth-subtitle">Sign in to continue your learning streak!</p>

        {error && (
          <div style={{ 
            backgroundColor: "#fee", 
            color: "#c33", 
            padding: "10px", 
            borderRadius: "8px", 
            marginBottom: "15px",
            textAlign: "center",
            fontSize: "14px"
          }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSignIn}>
          <input 
            type="email" 
            name="email" 
            placeholder="Email address" 
            className="auth-input"
            required 
            disabled={loading}
          />
          <input 
            type="password" 
            name="password" 
            placeholder="Password" 
            className="auth-input"
            required 
            disabled={loading}
          />
          <button type="submit" disabled={loading}>
            {loading ? "Signing In..." : "Sign In"}
          </button>
        </form>

        <div className="auth-footer">
          New here?{" "}
          <span onClick={() => navigate("/signup")}>
            Sign Up
          </span>
        </div>
      </div>
    </div>
  );
}