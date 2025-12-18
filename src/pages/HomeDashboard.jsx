// src/pages/HomeDashboard.jsx
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./HomeDashboard.css";

function HomeDashboard() {
  const navigate = useNavigate();
  const [isCollapsed, setIsCollapsed] = useState(false);

  // Collapse sidebar by default on small screens
  useEffect(() => {
    if (window.innerWidth < 768) {
      setIsCollapsed(true);
    }
  }, []);

  const toggleSidebar = () => {
    setIsCollapsed(!isCollapsed);
  };

  return (
    <div className="home-dashboard">
      {/* Sidebar */}
      <div className={`sidebar ${isCollapsed ? "collapsed" : ""}`}>
        <div className="collapse-btn" onClick={toggleSidebar}>
          {isCollapsed ? "▶" : "◀"}
        </div>
        <h2>Med Game Blitz</h2>

        <div className="nav-item" onClick={() => navigate("/")}>🏠 Dashboard</div>
        <div className="nav-item" onClick={() => navigate("/study-dashboard")}>📚 Study Centre</div>
        <div className="nav-item" onClick={() => navigate("/games-dashboard")}>🕹 Game Modes</div>
        <div className="nav-item" onClick={() => navigate("/battle")}>⚔️ Battle</div>
        <div className="nav-item" onClick={() => navigate("/leaderboard")}>🏆 Leaderboard</div>
        <div className="nav-item" onClick={() => navigate("/stats")}>📊 Stats</div>
        <div className="nav-item" onClick={() => navigate("/settings")}>⚙ Settings</div>
      </div>

      {/* Main Content */}
      <div className="main-content">
        <h1>Welcome, Dr. Onyango!</h1>
        <p>Choose a mode to start your learning adventure:</p>

        {/* DAILY CHALLENGE – HERO SECTION */}
        <div className="extra-section">
          <div className="challenge-header">
            <h2>🔥 Daily Challenge</h2>
            <span className="streak">Streak: 5 days</span>
          </div>

          <div className="challenge-rewards">
            <span className="xp">+120 XP</span>
          </div>

          <div className="progress-bar">
            <div className="progress-fill" style={{ width: "60%" }} />
          </div>
          <small className="progress-text">Progress: 6 / 10 questions</small>

          <button onClick={() => navigate("/classic-challenge")}>Start Challenge</button>
        </div>

        {/* DASHBOARD CARDS */}
        <div className="cards-container">
          <div className="dashboard-card" onClick={() => navigate("/study-dashboard")}> 
            <h2>📚 Study Centre</h2>
            <p>Revise medical topics with guided quizzes.</p>
          </div>

          <div className="dashboard-card" onClick={() => navigate("/games-dashboard")}> 
            <h2>🕹 Game Modes</h2>
            <p>Timed quizzes, rapid fire & challenge modes.</p>
          </div>

          <div className="dashboard-card" onClick={() => navigate("/battle")}> 
            <h2>⚔️ Battle Mode</h2>
            <p>Compete head‑to‑head with other med students.</p>
          </div>

          <div className="dashboard-card" onClick={() => navigate("/leaderboard")}> 
            <h2>🏆 Leaderboard</h2>
            <p>Track top performers and global rankings.</p>
          </div>

          <div className="dashboard-card" onClick={() => navigate("/stats")}> 
            <h2>📊 Stats</h2>
            <p>Analyze your accuracy, speed & consistency.</p>
          </div>

          <div className="dashboard-card" onClick={() => navigate("/settings")}> 
            <h2>⚙ Settings</h2>
            <p>Personalize themes, sounds & preferences.</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default HomeDashboard;
