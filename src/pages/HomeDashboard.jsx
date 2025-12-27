import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./HomeDashboard.css";

// ✅ Icons (gamified, professional)
import {
  Gamepad2,
  Swords,
  BookOpen,
  Trophy,
  BarChart3,
  Settings,
  Flame
} from "lucide-react";

// ✅ Import Daily Challenge questions
import { getDailyChallengeQuestions } from "../game/dailyChallenge";

function HomeDashboard() {
  const navigate = useNavigate();
  const [isCollapsed, setIsCollapsed] = useState(false);

  // ✅ Dynamic user name
  const userName = localStorage.getItem("userName") || "Onyango";

  // ✅ Daily Challenge state
  const [dailyProgress, setDailyProgress] = useState({
    answered: 0,
    total: 10,
    xpEarned: 0,
    streak: 0,
  });

  // ✅ Total XP state
  const [totalXP, setTotalXP] = useState(0);

  useEffect(() => {
    if (window.innerWidth < 768) {
      setIsCollapsed(true);
    }

    const today = new Date().toISOString().split("T")[0];
    const dailyData = JSON.parse(localStorage.getItem("dailyChallenge")) || {};

    // Load today's daily progress
    if (dailyData[today]) {
      setDailyProgress(dailyData[today]);
    }

    // Calculate total XP across all days
    const xpSum = Object.values(dailyData).reduce(
      (acc, day) => acc + (day.xpEarned || 0),
      0
    );
    setTotalXP(xpSum);
  }, []);

  const toggleSidebar = () => {
    setIsCollapsed(!isCollapsed);
  };

  return (
    <div className="home-dashboard">
      {/* ---------------- Top Header ---------------- */}
      <div
        className="top-header"
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between"
        }}
      >
        {/* Welcome message */}
        <h1 className="welcome-text">
          Welcome, <span>Dr. {userName}</span>
        </h1>

        {/* Total XP on the top right */}
        <div style={{ display: "flex", alignItems: "center", gap: "6px", fontWeight: "600", color: "#ffbe0b" }}>
          <Flame size={20} color="#ffbe0b" />
          <span>Total XP: {totalXP}</span>
        </div>

        {/* Hamburger menu */}
        <div className="collapse-btn" onClick={toggleSidebar}>
          <div className="hamburger">
            <span style={{ display: "block", width: "24px", height: "3px", backgroundColor: "#000", borderRadius: "2px", margin: "3px 0" }} />
            <span style={{ display: "block", width: "24px", height: "3px", backgroundColor: "#000", borderRadius: "2px", margin: "3px 0" }} />
            <span style={{ display: "block", width: "24px", height: "3px", backgroundColor: "#000", borderRadius: "2px", margin: "3px 0" }} />
          </div>
        </div>
      </div>

      {/* ---------------- Content Below Header ---------------- */}
      <div className="below-header-wrapper">
        {/* Sidebar */}
        <div className={`sidebar ${isCollapsed ? "collapsed" : ""}`}>
          {!isCollapsed && (
            <>
              <div
                className="nav-item"
                style={{
                  color: "#ffbe0b",
                  fontWeight: "700",
                  cursor: "default"
                }}
              >
                Dashboard
              </div>

              <div className="nav-item" onClick={() => navigate("/games-dashboard")}>
                <Gamepad2 size={18} style={{ marginRight: "8px" }} />
                Game Modes
              </div>

              <div className="nav-item" onClick={() => navigate("/battle")}>
                <Swords size={18} style={{ marginRight: "8px" }} />
                Battle
              </div>

              <div className="nav-item" onClick={() => navigate("/study-dashboard")}>
                <BookOpen size={18} style={{ marginRight: "8px" }} />
                Study Centre
              </div>

              <div className="nav-item" onClick={() => navigate("/leaderboard")}>
                <Trophy size={18} style={{ marginRight: "8px" }} />
                Leaderboard
              </div>

              <div className="nav-item" onClick={() => navigate("/stats")}>
                <BarChart3 size={18} style={{ marginRight: "8px" }} />
                Stats
              </div>

              <div className="nav-item" onClick={() => navigate("/settings")}>
                <Settings size={18} style={{ marginRight: "8px" }} />
                Settings
              </div>
            </>
          )}
        </div>

        {/* Main Content */}
        <div className="main-content">
          {/* DAILY CHALLENGE */}
          <div className="daily-challenge enhanced">
            <div className="challenge-header">
              <h2 style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <Flame size={20} color="#ff595e" />
                Daily Challenge
              </h2>
              <span className="streak">Streak: {dailyProgress.streak} days</span>
            </div>

            <div className="challenge-rewards">
              <span className="xp">+{dailyProgress.xpEarned} XP</span>
            </div>

            <div className="progress-bar">
              <div
                className="progress-fill"
                style={{ width: `${(dailyProgress.answered / dailyProgress.total) * 100}%` }}
              />
            </div>
            <small className="progress-text">
              Progress: {dailyProgress.answered} / {dailyProgress.total} questions
            </small>

            <button
              onClick={() =>
                navigate("/quiz", {
                  state: { questions: getDailyChallengeQuestions() },
                })
              }
            >
              Start Blitz
            </button>

            {[...Array(8)].map((_, i) => (
              <div
                key={i}
                className="particle"
                style={{
                  left: `${Math.random() * 90}%`,
                  top: `${Math.random() * 50 + 30}%`,
                  width: `${Math.random() * 6 + 6}px`,
                  height: `${Math.random() * 6 + 6}px`,
                  backgroundColor: ["#ffbe0b", "#ff595e", "#8ac926", "#1982c4"][
                    Math.floor(Math.random() * 4)
                  ],
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
              <h2 style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <Gamepad2 size={22} />
                Game Modes
              </h2>
              <p>Rapid fire, timed quizzes & special challenges.</p>
            </div>

            <div
              className="dashboard-card"
              onClick={() => navigate("/stats")}
            >
              <h2 style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <BarChart3 size={22} />
                Personal Stats
              </h2>
              <p>Track accuracy, speed, streaks & consistency.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default HomeDashboard;
