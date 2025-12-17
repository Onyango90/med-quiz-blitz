// src/pages/LandingPage.jsx
import React from "react";
import { useNavigate } from "react-router-dom";
import "./LandingPage.css";

export default function LandingPage() {
  const navigate = useNavigate();

  const handleStart = () => {
    navigate("/home");
  };

  return (
    <div
      className="landing-container"
      onKeyDown={(e) => e.key === "Enter" && handleStart()}
      tabIndex={0}
    >
      <h1 className="landing-title">
        <span>M</span><span>e</span><span>d</span>{" "}
        <span>G</span><span>a</span><span>m</span><span>e</span>{" "}
        <span>B</span><span>l</span><span>i</span><span>t</span><span>z</span>
      </h1>

      <p className="landing-subtitle">
        Learn medicine. Play smart.
      </p>

      <button className="landing-start" onClick={handleStart}>
        Start
      </button>
    </div>
  );
}
