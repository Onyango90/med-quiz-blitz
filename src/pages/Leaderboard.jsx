// src/pages/Leaderboard.js
import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { useStats } from "../hooks/useStats";
import "./Leaderboard.css";

 const Leaderboard= () => {
  const { currentUser } = useAuth();
  const { stats, loading } = useStats();
  const [activeTab, setActiveTab] = useState("xp"); // xp, questions, streak

  if (loading || !stats) {
    return (
      <div className="leaderboard-container">
        <div className="loading-spinner">Loading leaderboard...</div>
      </div>
    );
  }

  const { basic, subjects } = stats;
  
  // Calculate rank based on XP (for now, just show "Top 1%" as demo)
  const getRankMessage = (xp) => {
    if (xp >= 1000) return "🏆 Elite Tier";
    if (xp >= 500) return "⭐ Gold Tier";
    if (xp >= 200) return "🌟 Silver Tier";
    if (xp >= 50) return "🌱 Bronze Tier";
    return "🎓 Starter Tier";
  };

  // Get top subjects
  const topSubjects = subjects.slice(0, 3);
  
  // Calculate next milestone
  const nextMilestone = basic.totalXP >= 1000 ? 2000 : 
                        basic.totalXP >= 500 ? 1000 : 
                        basic.totalXP >= 200 ? 500 : 
                        basic.totalXP >= 50 ? 200 : 50;
  const xpToNext = nextMilestone - basic.totalXP;

  return (
    <div className="leaderboard-container">
      {/* Header */}
      <div className="leaderboard-header">
        <h1>🏆 Leaderboard</h1>
        <p className="subtitle">Track your progress and climb the ranks!</p>
      </div>

      {/* Your Stats Card */}
      <div className="your-rank-card">
        <div className="rank-badge">
          <span className="rank-icon">👨‍⚕️</span>
          <div className="rank-info">
            <h3>{currentUser?.displayName || currentUser?.email?.split('@')[0]}</h3>
            <p className="rank-title">{getRankMessage(basic.totalXP)}</p>
          </div>
        </div>
        
        <div className="stats-row">
          <div className="stat">
            <span className="stat-value">{basic.totalXP}</span>
            <span className="stat-label">Total XP</span>
          </div>
          <div className="stat">
            <span className="stat-value">{basic.totalAttempted}</span>
            <span className="stat-label">Questions</span>
          </div>
          <div className="stat">
            <span className="stat-value">{basic.accuracy}%</span>
            <span className="stat-label">Accuracy</span>
          </div>
          <div className="stat">
            <span className="stat-value">{basic.currentStreak}</span>
            <span className="stat-label">Day Streak</span>
          </div>
        </div>
        
        {/* XP Progress to next tier */}
        <div className="xp-progress">
          <div className="progress-label">
            <span>Next: {nextMilestone} XP</span>
            <span>{xpToNext} XP to go</span>
          </div>
          <div className="progress-bar">
            <div 
              className="progress-fill"
              style={{ width: `${(basic.totalXP / nextMilestone) * 100}%` }}
            />
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="tabs">
        <button 
          className={`tab ${activeTab === 'xp' ? 'active' : ''}`}
          onClick={() => setActiveTab('xp')}
        >
          ⭐ Top by XP
        </button>
        <button 
          className={`tab ${activeTab === 'questions' ? 'active' : ''}`}
          onClick={() => setActiveTab('questions')}
        >
          📝 Top by Questions
        </button>
        <button 
          className={`tab ${activeTab === 'streak' ? 'active' : ''}`}
          onClick={() => setActiveTab('streak')}
        >
          🔥 Top by Streak
        </button>
      </div>

      {/* Leaderboard Content */}
      <div className="leaderboard-content">
        {activeTab === 'xp' && (
          <div className="leaderboard-list">
            <div className="leaderboard-item first">
              <div className="rank">🥇</div>
              <div className="user-info">
                <span className="user-name">You</span>
                <span className="user-tier">Current Position</span>
              </div>
              <div className="score">{basic.totalXP} XP</div>
            </div>
            
            <div className="leaderboard-item second">
              <div className="rank">🥈</div>
              <div className="user-info">
                <span className="user-name">Coming Soon</span>
                <span className="user-tier">Invite friends to compete!</span>
              </div>
              <div className="score">—</div>
            </div>
            
            <div className="leaderboard-item third">
              <div className="rank">🥉</div>
              <div className="user-info">
                <span className="user-name">Coming Soon</span>
                <span className="user-tier">More players = more fun</span>
              </div>
              <div className="score">—</div>
            </div>
          </div>
        )}

        {activeTab === 'questions' && (
          <div className="leaderboard-list">
            <div className="leaderboard-item first">
              <div className="rank">🥇</div>
              <div className="user-info">
                <span className="user-name">You</span>
                <span className="user-tier">Questions Master</span>
              </div>
              <div className="score">{basic.totalAttempted} Qs</div>
            </div>
            <div className="invite-message">
              <p>📢 Invite friends to see who answers the most questions!</p>
              <button className="invite-btn">Invite Friends</button>
            </div>
          </div>
        )}

        {activeTab === 'streak' && (
          <div className="leaderboard-list">
            <div className="leaderboard-item first">
              <div className="rank">🥇</div>
              <div className="user-info">
                <span className="user-name">You</span>
                <span className="user-tier">Consistency King/Queen</span>
              </div>
              <div className="score">{basic.currentStreak} days</div>
            </div>
            <div className="streak-tip">
              🔥 {basic.currentStreak} day streak! Keep it up for 7 days to unlock the "Weekly Warrior" badge!
            </div>
          </div>
        )}
      </div>

      {/* Top Subjects Card */}
      {topSubjects.length > 0 && (
        <div className="top-subjects-card">
          <h3>🏆 Your Top Subjects</h3>
          <div className="subjects-list">
            {topSubjects.map((subject, index) => (
              <div key={subject.name} className="subject-rank">
                <span className="subject-medal">
                  {index === 0 ? "🥇" : index === 1 ? "🥈" : "🥉"}
                </span>
                <span className="subject-name">{subject.name}</span>
                <span className="subject-accuracy">{subject.accuracy}%</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Achievements Preview */}
      {basic.longestStreak >= 7 && (
        <div className="achievement-card">
          <div className="achievement-icon">🏆</div>
          <div className="achievement-info">
            <h4>Weekly Warrior</h4>
            <p>Maintained a {basic.longestStreak} day streak!</p>
          </div>
        </div>
      )}

      {/* Invite Section */}
      <div className="invite-section">
        <h3>🚀 Invite Friends, Climb Higher!</h3>
        <p>Share MedBlitz with classmates and compete on the leaderboard</p>
        <button 
          className="share-btn"
          onClick={() => {
            const shareLink = window.location.origin;
            navigator.clipboard.writeText(shareLink);
            alert("Link copied! Share with your friends 🎉");
          }}
        >
          📤 Share MedBlitz
        </button>
      </div>

      {/* Coming Soon Note */}
      <div className="coming-soon-note">
        <p>✨ Multiplayer leaderboard with real-time rankings coming soon! ✨</p>
        <p className="small">Invite friends and get ready to compete</p>
      </div>
    </div>
  );
}

export default Leaderboard;