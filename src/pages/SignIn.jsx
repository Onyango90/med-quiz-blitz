import React from "react";
import { useNavigate } from "react-router-dom";
import "./Auth.css";

export default function SignIn() {
  const navigate = useNavigate();

  const handleSignIn = (e) => {
    e.preventDefault();

    const email = e.target.email.value.trim();
    const password = e.target.password.value.trim();

    // 🔹 Extract name from email for dashboard
    const name = email.split("@")[0].split(".")[0];
    localStorage.setItem("userName", name);

    // Navigate to dashboard
    navigate("/home");
  };

  return (
    <div
      className="auth-container"
      onKeyDown={(e) => e.key === "Enter" && handleSignIn(e)}
      tabIndex={0}
    >
      <div className="auth-card">
        <h1 className="auth-title">
          Welcome to <span>MedBlitz</span>
        </h1>
        <p className="auth-subtitle">Sign in to continue your learning streak!</p>

        <form className="auth-card" onSubmit={handleSignIn}>
          <input type="email" name="email" placeholder="Email address" required />
          <input type="password" name="password" placeholder="Password" required />
          <button type="submit">Sign In</button>
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
