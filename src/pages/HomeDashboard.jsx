// src/pages/HomeDashboard.jsx
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useStats } from "../hooks/useStats";
import "./HomeDashboard.css";

// Icons
import {
  Gamepad2,
  Swords,
  BookOpen,
  Trophy,
  BarChart3,
  Settings,
  Flame
} from "lucide-react";

// Import the updated daily questions generator
import { getDailyQuestions } from "../data/dailyChallengeQuestions";

function HomeDashboard() {
  const navigate = useNavigate();
  const [isCollapsed, setIsCollapsed] = useState(false);
  
  const { currentUser, userData, loading: authLoading } = useAuth();
  const { stats, loading: statsLoading } = useStats();

  const userName = currentUser?.displayName || 
                   localStorage.getItem("userName") || 
                   currentUser?.email?.split('@')[0] || 
                   "Onyango";

  const totalXP = stats?.basic?.totalXP || 0;
  const currentStreak = stats?.basic?.currentStreak || 0;

  // Daily Challenge state - updated to 20 questions
  const [dailyProgress, setDailyProgress] = useState({
    answered: 0,
    total: 20,
    xpEarned: 0,
    streak: 0,
  });

  useEffect(() => {
    if (window.innerWidth < 768) {
      setIsCollapsed(true);
    }

    const today = new Date().toISOString().split("T")[0];
    const dailyData = JSON.parse(localStorage.getItem("dailyChallenge")) || {};

    if (dailyData[today]) {
      setDailyProgress(dailyData[today]);
    }
  }, []);

  if (authLoading || statsLoading) {
    return (
      <div className="home-dashboard" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <div>Loading your dashboard...</div>
      </div>
    );
  }

  const toggleSidebar = () => {
    setIsCollapsed(!isCollapsed);
  };

  const userYear = userData?.profile?.year || 2;
  
  // Calculate streak bonus AFTER currentStreak is defined
  const streakBonus = Math.min(20 + (currentStreak * 2), 40);

  return (
    <div className="home-dashboard">
      {/* Top Header */}
      <div
        className="top-header"
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between"
        }}
      >
        <h1 className="welcome-text">
          Welcome, <span>Dr. {userName}</span>
          {currentStreak > 0 && (
            <span style={{ fontSize: "0.875rem", marginLeft: "12px", color: "#ff9800" }}>
              🔥 {currentStreak} day streak!
            </span>
          )}
        </h1>

        <div style={{ display: "flex", alignItems: "center", gap: "6px", fontWeight: "600", color: "#ffbe0b" }}>
          <Flame size={20} color="#ffbe0b" />
          <span>Total XP: {totalXP}</span>
        </div>

        <div className="collapse-btn" onClick={toggleSidebar}>
          <div className="hamburger">
            <span style={{ display: "block", width: "24px", height: "3px", backgroundColor: "#000", borderRadius: "2px", margin: "3px 0" }} />
            <span style={{ display: "block", width: "24px", height: "3px", backgroundColor: "#000", borderRadius: "2px", margin: "3px 0" }} />
            <span style={{ display: "block", width: "24px", height: "3px", backgroundColor: "#000", borderRadius: "2px", margin: "3px 0" }} />
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="below-header-wrapper">
        {/* Sidebar */}
        <div className={`sidebar ${isCollapsed ? "collapsed" : ""}`}>
          {!isCollapsed && (
            <>
              <div className="nav-item" style={{ color: "#ffbe0b", fontWeight: "700", cursor: "default" }}>
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
          {/* DAILY CHALLENGE - Clean and Simple */}
          <div className="daily-challenge premium">
            {/* Animated Background Glow */}
            <div className="challenge-glow-ring"></div>
            
            {/* Header with Animated Streak */}
            <div className="challenge-header-premium">
              <div className="header-left">
                <div className="challenge-icon pulse">⭐</div>
                <div>
                  <h2>Daily Challenge</h2>
                  <p className="challenge-subtitle">Test your skills & earn rewards</p>
                </div>
              </div>
              <div className="streak-badge-premium">
                <span className="streak-fire">🔥</span>
                <span className="streak-number">{currentStreak}</span>
                <span className="streak-text">day streak</span>
              </div>
            </div>

            {/* Progress Section */}
            <div className="progress-section-premium">
              <div className="progress-header">
                <span>Today's Progress</span>
                <span className="progress-percent">
                  {Math.round((dailyProgress.answered / dailyProgress.total) * 100)}%
                </span>
              </div>
              <div className="progress-bar-premium">
                <div 
                  className="progress-fill-premium" 
                  style={{ width: `${(dailyProgress.answered / dailyProgress.total) * 100}%` }}
                >
                  <div className="progress-glow"></div>
                </div>
              </div>
              <div className="progress-stats">
                <span>✅ {dailyProgress.answered} completed</span>
                <span>⏳ {dailyProgress.total - dailyProgress.answered} remaining</span>
              </div>
            </div>

            {/* Action Button */}
            <button 
              className="start-blitz-premium"
              onClick={() => {
                const questions = getDailyQuestions(parseInt(userYear));
                navigate("/daily-quiz", { 
                  state: { 
                    questions: questions,
                    isDailyChallenge: true,
                    xpBonus: streakBonus,
                    streak: currentStreak,
                    topic: "Daily Challenge",
                    userYear: userYear,
                    questionsCount: dailyProgress.total
                  } 
                });
              }}
            >
              <span className="btn-glow"></span>
              <span className="btn-content">
                <span className="btn-icon">⚡</span>
                START TODAY'S BLITZ
                <span className="btn-icon">⚡</span>
              </span>
              <span className="btn-arrow">→</span>
            </button>

            {/* Motivational Quote */}
            <div className="challenge-quote">
              <span className="quote-icon">💪</span>
              <span>Complete today's challenge to maintain your {currentStreak > 0 ? `${currentStreak}-day` : "new"} streak!</span>
            </div>

            {/* Animated Particles */}
            <div className="challenge-particles">
              {[...Array(12)].map((_, i) => (
                <div
                  key={i}
                  className="particle"
                  style={{
                    left: `${Math.random() * 100}%`,
                    top: `${Math.random() * 100}%`,
                    animationDelay: `${Math.random() * 3}s`,
                    animationDuration: `${2 + Math.random() * 3}s`
                  }}
                />
              ))}
            </div>
          </div>

          {/* Dashboard Cards */}
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

          {/* Motivational Messages */}
          {currentStreak >= 5 && (
            <div className="motivation-banner">
              🔥 {currentStreak} day streak! You're on fire! Keep pushing!
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default HomeDashboard;