import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./Auth.css"; // Using the shared Auth.css

export default function SignUp() {
  const navigate = useNavigate();
  const [isDoctor, setIsDoctor] = useState(false);

  const handleSignUp = (e) => {
    e.preventDefault();

    const fullName = e.target.fullName.value.trim();
    const username = e.target.username.value.trim();
    const email = e.target.email.value.trim();
    const password = e.target.password.value.trim();

    if (!fullName || !username) {
      alert("Full Name and Username are required");
      return;
    }

    // Store user name in localStorage for dashboard
    localStorage.setItem("userName", username);

    // Store doctor status in localStorage
    localStorage.setItem("isDoctor", isDoctor);

    // Navigate to dashboard
    navigate("/home");
  };

  return (
    <div
      className="auth-container"
      onKeyDown={(e) => e.key === "Enter" && handleSignUp(e)}
      tabIndex={0}
    >
      <div className="auth-card">
        <h1 className="auth-title">
          Join <span>MedBlitz</span>
        </h1>
        <p className="auth-subtitle">
          Create an account and start your medical learning streak!
        </p>

        <form className="auth-card" onSubmit={handleSignUp}>
          <input
            type="text"
            name="fullName"
            placeholder="Full Name"
            className="auth-input"
            required
          />
          <input
            type="text"
            name="username"
            placeholder="I want to be called Dr (your username)"
            className="auth-input"
            required
          />
          <input
            type="email"
            name="email"
            placeholder="Email address"
            className="auth-input"
            required
          />
          <input
            type="password"
            name="password"
            placeholder="Password"
            className="auth-input"
            required
          />

          {/* ✅ Doctor checkbox */}
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={isDoctor}
              onChange={(e) => setIsDoctor(e.target.checked)}
            />
            I am a doctor
          </label>

          <button type="submit">Sign Up</button>
        </form>

        <div className="auth-footer">
          Already have an account?{" "}
          <span onClick={() => navigate("/signin")}>
            Sign In
          </span>
        </div>
      </div>
    </div>
  );
}
