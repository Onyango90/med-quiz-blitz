import React, { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useStats } from "../hooks/useStats";
import "./Leaderboard.css";

const Leaderboard = () => {
  const { currentUser } = useAuth();
  const { stats, loading } = useStats();
  const [activeTab, setActiveTab] = useState("xp");

  if (loading || !stats) {
    return (
      <div className="leaderboard-container">
        <div className="loading-spinner">Loading leaderboard...</div>
      </div>
    );
  }

  const { basic, subjects } = stats;
  
  const getRankMessage = (xp) => {
    if (xp >= 1000) return "🏆 Elite Tier";
    if (xp >= 500) return "⭐ Gold Tier";
    if (xp >= 200) return "🌟 Silver Tier";
    if (xp >= 50) return "🌱 Bronze Tier";
    return "🎓 Starter Tier";
  };

  const topSubjects = subjects?.slice(0, 3) || [];
  
  const nextMilestone = basic.totalXP >= 1000 ? 2000 : 
                        basic.totalXP >= 500 ? 1000 : 
                        basic.totalXP >= 200 ? 500 : 
                        basic.totalXP >= 50 ? 200 : 50;
  const xpToNext = nextMilestone - basic.totalXP;

  return (
    <div className="leaderboard-container">
      <div className="leaderboard-header">
        <h1>🏆 Leaderboard</h1>
        <p className="subtitle">Track your progress and climb the ranks!</p>
      </div>

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

      <div className="tabs">
        <button 
          className={activeTab === 'xp' ? "tab active" : "tab"}
          onClick={() => setActiveTab('xp')}
        >
          ⭐ Top by XP
        </button>
        <button 
          className={activeTab === 'questions' ? "tab active" : "tab"}
          onClick={() => setActiveTab('questions')}
        >
          📝 Top by Questions
        </button>
        <button 
          className={activeTab === 'streak' ? "tab active" : "tab"}
          onClick={() => setActiveTab('streak')}
        >
          🔥 Top by Streak
        </button>
      </div>

      <div className="leaderboard-list">
        {activeTab === 'xp' && (
          <>
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
          </>
        )}
      </div>

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

      <div className="coming-soon-note">
        <p>✨ Multiplayer leaderboard with real-time rankings coming soon! ✨</p>
        <p className="small">Invite friends and get ready to compete</p>
      </div>
    </div>
  );
};

export default Leaderboard;
