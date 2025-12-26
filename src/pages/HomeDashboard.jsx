import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./HomeDashboard.css";

// ✅ Import Daily Challenge questions
import { getDailyChallengeQuestions } from "../game/dailyChallenge";

function HomeDashboard() {
  const navigate = useNavigate();
  const [isCollapsed, setIsCollapsed] = useState(false);

  // ✅ Dynamic user name
  const userName = localStorage.getItem("userName") || "Onyango";

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
      {/* ---------------- Top Header ---------------- */}
      <div
        className="top-header"
        style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}
      >
        <h1 className="welcome-text">
          Welcome, <span>Dr. {userName}</span> 👋
        </h1>

        <div className="collapse-btn" onClick={toggleSidebar}>
          <div className="hamburger">
            <span style={{ display: 'block', width: '24px', height: '3px', backgroundColor: '#000', borderRadius: '2px', margin: '3px 0' }}></span>
            <span style={{ display: 'block', width: '24px', height: '3px', backgroundColor: '#000', borderRadius: '2px', margin: '3px 0' }}></span>
            <span style={{ display: 'block', width: '24px', height: '3px', backgroundColor: '#000', borderRadius: '2px', margin: '3px 0' }}></span>
          </div>
        </div>
      </div>

      {/* ---------------- Content Below Header ---------------- */}
      <div className="below-header-wrapper">
        {/* Sidebar */}
        <div className={`sidebar ${isCollapsed ? "collapsed" : ""}`}>
          {!isCollapsed && (
            <>
              <div className="nav-item" onClick={() => navigate("/")}>
                Dashboard
              </div>
              <div className="nav-item" onClick={() => navigate("/study-dashboard")}>
                📚 Study Centre
              </div>
              <div className="nav-item" onClick={() => navigate("/games-dashboard")}>
                🕹 Game Modes
              </div>
              <div className="nav-item" onClick={() => navigate("/battle")}>
                ⚔️ Battle
              </div>
              <div className="nav-item" onClick={() => navigate("/leaderboard")}>
                🏆 Leaderboard
              </div>
              <div className="nav-item" onClick={() => navigate("/stats")}>
                📊 Stats
              </div>
              <div className="nav-item" onClick={() => navigate("/settings")}>
                ⚙ Settings
              </div>
            </>
          )}
        </div>

        {/* Main Content */}
        <div className="main-content">
          {/* DAILY CHALLENGE */}
          <div className="daily-challenge enhanced">
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

            <button
              onClick={() =>
                navigate("/quiz", {
                  state: { questions: getDailyChallengeQuestions() },
                })
              }
            >
              Start Blitz
            </button>

            {/* ---------------- Gamified Floating Particles ---------------- */}
            {[...Array(8)].map((_, i) => (
              <div
                key={i}
                className="particle"
                style={{
                  left: `${Math.random() * 90}%`,
                  top: `${Math.random() * 50 + 30}%`,
                  width: `${Math.random() * 6 + 6}px`,
                  height: `${Math.random() * 6 + 6}px`,
                  backgroundColor: ['#ffbe0b','#ff595e','#8ac926','#1982c4'][Math.floor(Math.random() * 4)]
                }}
              />
            ))}
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
    </div>
  );
}

export default HomeDashboard;
