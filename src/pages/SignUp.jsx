import React from "react";
import { useNavigate } from "react-router-dom";
import "./Auth.css"; // Using the shared Auth.css

export default function SignUp() {
  const navigate = useNavigate();

  const handleSignUp = (e) => {
    e.preventDefault();

    const fullName = e.target.fullName.value.trim();
    const email = e.target.email.value.trim();
    const password = e.target.password.value.trim();

    // 🔹 Store user name in localStorage for dashboard
    // Prefer fullName if entered, otherwise use email
    const name = fullName || email.split("@")[0].split(".")[0];
    localStorage.setItem("userName", name);

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
          <input type="text" name="fullName" placeholder="Full Name (optional)" />
          <input type="email" name="email" placeholder="Email address" required />
          <input type="password" name="password" placeholder="Password" required />
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
