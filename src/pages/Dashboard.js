import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./Dashboard.css";
import clickSoundFile from "../sound/click.wav";

function Dashboard() {
  const navigate = useNavigate();
  const [clickSound] = useState(new Audio(clickSoundFile));

  const handleCardClick = (path) => {
    clickSound.play();
    navigate(path);
  };

  const studyTopics = [
    { name: "Anatomy", emoji: "🦴", path: "/study/anatomy" },
    { name: "Physiology", emoji: "🧬", path: "/study/physiology" },
    { name: "Microbiology", emoji: "🦠", path: "/study/microbiology" },
    { name: "Pharmacology", emoji: "💊", path: "/study/pharmacology" },
    { name: "Pathology", emoji: "🔬", path: "/study/pathology" },
    { name: "Clinical Skills", emoji: "🏥", path: "/study/clinicalSkills" },
    { name: "Exam Prep", emoji: "🎯", path: "/study/examPrep" },
  ];

  const gameModes = [
    { name: "3 in 15", emoji: "⏱", path: "/game/threeInFifteen" },
    { name: "Who Am I?", emoji: "🧠", path: "/game/whoAmI" },
    { name: "Diagnose with 3 clues", emoji: "🔍", path: "/game/name3" },
    { name: "One Line MCQs", emoji: "📄", path: "/game/oneLineMCQ" },
    { name: "Clinical Black Box", emoji: "🩺", path: "/game/clinicalBlackBox" },
    { name: "The Doc Ladder", emoji: "🚀", path: "/game/levelUp" },
    { name: "Create Your Own Game", emoji: "🛠", path: "/game/customGame" },
  ];

  return (
    <div className="dashboard-container">
      {/* Sidebar */}
      <div className="sidebar">
        <h2>Med Game Blitz</h2>
        <div className="nav-item" onClick={() => navigate("/")}>🏆 Dashboard</div>
        <h3>📚 Study Centre</h3>
        {studyTopics.map((topic) => (
          <div
            key={topic.name}
            className="nav-item"
            onClick={() => handleCardClick(topic.path)}
          >
            {topic.emoji} {topic.name}
          </div>
        ))}
        <h3>🕹 Game Modes</h3>
        {gameModes.map((mode) => (
          <div
            key={mode.name}
            className="nav-item"
            onClick={() => handleCardClick(mode.path)}
          >
            {mode.emoji} {mode.name}
          </div>
        ))}
        <div className="nav-item" onClick={() => navigate("/ai-quiz")}>🤖 AI Quiz</div>
        <div className="nav-item" onClick={() => navigate("/battle")}>⚔️ Battle</div>
        <div className="nav-item" onClick={() => navigate("/leaderboard")}>🏆 Leaderboard</div>
        <div className="nav-item" onClick={() => navigate("/stats")}>📊 Stats</div>
        <div className="nav-item" onClick={() => navigate("/settings")}>⚙ Settings</div>
      </div>

      {/* Main Content */}
      <div className="main-content">
        <h1>Welcome, Dr. Onyango!</h1>
        <div className="cards-container">
          {studyTopics.map((topic) => (
            <div
              key={topic.name}
              className="topic-card"
              onClick={() => handleCardClick(topic.path)}
            >
              <div className="emoji">{topic.emoji}</div>
              <h2>{topic.name}</h2>
            </div>
          ))}
        </div>

        <h2>🔥 Game Modes</h2>
        <div className="cards-container">
          {gameModes.map((mode) => (
            <div
              key={mode.name}
              className="game-card"
              onClick={() => handleCardClick(mode.path)}
            >
              <div className="emoji">{mode.emoji}</div>
              <h2>{mode.name}</h2>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
