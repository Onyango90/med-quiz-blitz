// src/pages/GamesMode.jsx
import React from "react";
import { useNavigate } from "react-router-dom";
import "./GamesMode.css";

export default function GamesMode() {
  const navigate = useNavigate();

  return (
    <div className="games-container">
      <h1>Game Modes</h1>
      <p>Choose how you want to play</p>

      <div className="games-grid">
        <div className="game-card speed" onClick={() => navigate("/classic-challenge")}>
          <h2>⚡ Name 3 in 10 sec</h2>
          <p>Rapid recall under pressure</p>
        </div>

        <div className="game-card clues">
          <h2>🧩 Diagnosis in 3 Clues</h2>
          <p>Think. Narrow. Decide.</p>
        </div>

        <div className="game-card sprint">
          <h2>🏃 Sprint Match</h2>
          <p>Fast pattern recognition</p>
        </div>

        <div className="game-card identity">
          <h2>🧠 Who Am I?</h2>
          <p>The disease speaks — you listen</p>
        </div>

        <div className="game-card mcq">
          <h2>✍ One-Line MCQs</h2>
          <p>High-yield. No distractions.</p>
        </div>

        <div className="game-card blackbox">
          <h2>⬛ Clinical Black Box</h2>
          <p>Minimal data. Maximum reasoning.</p>
        </div>

        <div className="game-card ladder">
          <h2>🪜 The Doctor Ladder</h2>
          <p>Climb from intern to consultant</p>
        </div>
      </div>
    </div>
  );
}
