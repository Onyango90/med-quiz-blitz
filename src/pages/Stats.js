// src/pages/Stats.js
import React, { useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { useStats } from "../hooks/useStats";
import "./Stats.css";

function Stats() {
  const { currentUser } = useAuth();
  const { stats, loading, refreshStats } = useStats();

  useEffect(() => {
    refreshStats();
  }, [currentUser]);

  if (loading || !stats) {
    return <div className="stats-container">Loading your stats...</div>;
  }

  const { basic, today, subjects, weekly, featureUsage, achievements } = stats;

  const strongestSubject = subjects[0];
  const weakestSubject = subjects[subjects.length - 1];

  // Format time
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const hrs = Math.floor(mins / 60);
    if (hrs > 0) return `${hrs}h ${mins % 60}m`;
    return `${mins} min`;
  };

  return (
    <div className="stats-container">
      <div className="stats-header">
        <h1>📊 My Progress</h1>
        <p className="subtitle">Track your medical journey</p>
      </div>

      {/* Stats Cards */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon">📝</div>
          <div className="stat-value">{basic.totalAttempted}</div>
          <div className="stat-label">Questions Answered</div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">🎯</div>
          <div className="stat-value">{basic.accuracy}%</div>
          <div className="stat-label">Overall Accuracy</div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">🔥</div>
          <div className="stat-value">{basic.currentStreak}</div>
          <div className="stat-label">Current Streak</div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">⭐</div>
          <div className="stat-value">{basic.totalXP}</div>
          <div className="stat-label">Total XP</div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">⏱️</div>
          <div className="stat-value">{formatTime(basic.totalTimeSpent)}</div>
          <div className="stat-label">Time Studied</div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">📅</div>
          <div className="stat-value">{basic.sessionsCompleted}</div>
          <div className="stat-label">Study Sessions</div>
        </div>
      </div>

      {/* Today's Progress */}
      <div className="section-card">
        <h2>Today's Progress</h2>
        <div className="today-stats">
          <div>
            <span className="today-value">{today.attempted}</span>
            <span className="today-label">Questions</span>
          </div>
          <div>
            <span className="today-value">{today.accuracy}%</span>
            <span className="today-label">Accuracy</span>
          </div>
          <div>
            <span className="today-value">{today.xpEarned}</span>
            <span className="today-label">XP Earned</span>
          </div>
          <div>
            <span className="today-value">{formatTime(today.timeSpent)}</span>
            <span className="today-label">Time</span>
          </div>
        </div>
        <div className="progress-bar">
          <div 
            className="progress-fill"
            style={{ width: `${Math.min(100, (today.attempted / 20) * 100)}%` }}
          />
        </div>
        <p className="daily-goal">{today.attempted}/20 daily goal</p>
      </div>

      {/* Subject Performance */}
      {subjects.length > 0 && (
        <div className="section-card">
          <h2>📚 Subject Performance</h2>
          
          {strongestSubject && (
            <div className="strength-card">
              <span className="strength-icon">💪</span>
              <div>
                <div className="strength-label">Strongest</div>
                <div className="strength-subject">{strongestSubject.name}</div>
                <div className="strength-accuracy">{strongestSubject.accuracy}% accuracy</div>
                <div className="strength-xp">{strongestSubject.xpEarned} XP earned</div>
              </div>
            </div>
          )}
          
          {weakestSubject && weakestSubject.accuracy < 70 && (
            <div className="weakness-card">
              <span className="weakness-icon">📚</span>
              <div>
                <div className="weakness-label">Needs Practice</div>
                <div className="weakness-subject">{weakestSubject.name}</div>
                <div className="weakness-accuracy">{weakestSubject.accuracy}% accuracy</div>
                <div className="weakness-xp">{weakestSubject.xpEarned} XP earned</div>
              </div>
            </div>
          )}
          
          <div className="subject-list">
            {subjects.map(subject => (
              <div key={subject.name} className="subject-item">
                <div className="subject-name">{subject.name}</div>
                <div className="subject-bar">
                  <div 
                    className="subject-fill"
                    style={{ width: `${subject.accuracy}%` }}
                  />
                </div>
                <div className="subject-stats">
                  <span>{subject.accuracy}%</span>
                  <span>{subject.correct}/{subject.total}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Weekly Progress Chart */}
      <div className="section-card">
        <h2>📈 Weekly Activity</h2>
        <div className="weekly-chart">
          {weekly.map(day => (
            <div key={day.name} className="chart-bar-container">
              <div className="chart-label">{day.name}</div>
              <div 
                className="chart-bar"
                style={{ height: `${Math.min(100, (day.questions / 30) * 100)}px` }}
              />
              <div className="chart-value">{day.questions}</div>
              <div className="chart-xp">+{day.xp}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Feature Usage */}
      {Object.keys(featureUsage).length > 0 && (
        <div className="section-card">
          <h2>🎮 Favorite Features</h2>
          <div className="feature-list">
            {Object.entries(featureUsage).map(([feature, data]) => (
              <div key={feature} className="feature-item">
                <span className="feature-name">
                  {feature.replace('_', ' ').toUpperCase()}
                </span>
                <span className="feature-count">{data.count} sessions</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Motivational Message */}
      {basic.currentStreak >= 3 && (
        <div className="motivation-card">
          🔥 {basic.currentStreak} day streak! You're on fire! Keep going!
        </div>
      )}

      {/* Longest Streak Achievement */}
      {basic.longestStreak >= 7 && (
        <div className="motivation-card" style={{ background: "linear-gradient(135deg, #ffd700, #ffb347)" }}>
          🏆 {basic.longestStreak} day longest streak! You're a champion!
        </div>
      )}

      {/* Export Button */}
      <div className="export-section">
        <button 
          className="export-btn"
          onClick={() => {
            const dataStr = JSON.stringify(stats, null, 2);
            const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
            const exportFileDefaultName = `medblitz_stats_${currentUser?.uid}_${new Date().toISOString().split('T')[0]}.json`;
            const linkElement = document.createElement('a');
            linkElement.setAttribute('href', dataUri);
            linkElement.setAttribute('download', exportFileDefaultName);
            linkElement.click();
          }}
        >
          📥 Export My Stats (Share with MedBlitz Team)
        </button>
        <p className="export-note">
          Please export and share your stats after 1 week of use to help us improve MedBlitz!
        </p>
      </div>
    </div>
  );
}

export default Stats;