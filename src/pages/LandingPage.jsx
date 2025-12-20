// src/pages/LandingPage.jsx
import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./LandingPage.css";

export default function LandingPage() {
  const navigate = useNavigate();

  useEffect(() => {
    // Auto-navigate to SignIn after 6 seconds
    const timer = setTimeout(() => {
      navigate("/signin");
    }, 6000);

    return () => clearTimeout(timer);
  }, [navigate]);

  return (
    <div className="landing-container">
      {/* Single blue streak over letters */}
      <div className="blue-streak" />

      <h1 className="landing-title">
        {["M", "e", "d", "B", "l", "i", "t", "z"].map((letter, index) => (
          <span key={index} style={{ animationDelay: `${index * 0.15}s` }}>
            {letter}
          </span>
        ))}
      </h1>
    </div>
  );
}
