import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./HomeDashboard.css";

function HomeDashboard() {
  const navigate = useNavigate();
  const [isCollapsed, setIsCollapsed] = useState(false);

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
      {/* Sidebar (UNCHANGED) */}
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
        <h1 className="welcome-text">
          Welcome, <span>Dr. Onyango</span> 👋
        </h1>
        <p className="subtitle">Today’s mission starts here ⚡</p>

        {/* DAILY CHALLENGE */}
        <div className="daily-challenge">
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

          <button onClick={() => navigate("/classic-challenge")}>
            Start Blitz
          </button>
        </div>

        {/* DASHBOARD CARDS */}
        <div className="cards-container">
          <div
            className="dashboard-card"
            onClick={() => navigate("/games-dashboard")}
          >
            <h2>🕹 Game Modes</h2>
            <p>Rapid fire, timed quizzes & special challenges.</p>
          </div>

          <div
            className="dashboard-card"
            onClick={() => navigate("/stats")}
          >
            <h2>📊 Personal Stats</h2>
            <p>Track accuracy, speed, streaks & consistency.</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default HomeDashboard;
