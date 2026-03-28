import React, { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { db } from "../firebase";
import { ref, get } from "firebase/database";
import "./Stats.css";

function Stats() {
  const { currentUser } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (currentUser) {
      loadStats();
    } else {
      setLoading(false);
    }
  }, [currentUser]);

  const loadStats = async () => {
    setLoading(true);
    try {
      const userRef = ref(db, `users/${currentUser.uid}/stats`);
      const snapshot = await get(userRef);
      
      console.log("Stats data:", snapshot.val());
      
      if (snapshot.exists()) {
        setStats(snapshot.val());
      } else {
        setStats({
          totalXP: 0,
          totalAttempted: 0,
          totalCorrect: 0,
          accuracy: 0,
          currentStreak: 0,
          longestStreak: 0,
          totalTimeSpent: 0,
          sessionsCompleted: 0,
          dailyChallengesCompleted: 0
        });
      }
    } catch (err) {
      console.error("Error loading stats:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="stats-container">
        <div className="loading-spinner"></div>
        <p>Loading your stats...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="stats-container">
        <div className="error-card">
          <h3>Error loading stats</h3>
          <p>{error}</p>
          <button onClick={loadStats}>Try Again</button>
        </div>
      </div>
    );
  }

  if (!stats || stats.totalAttempted === 0) {
    return (
      <div className="stats-container">
        <div className="empty-stats">
          <div className="empty-icon">📊</div>
          <h3>No stats yet!</h3>
          <p>Complete the Daily Challenge or study some topics to see your progress here.</p>
          <div className="empty-buttons">
            <button onClick={() => window.location.href = "/daily-challenge"}>⭐ Daily Challenge</button>
            <button onClick={() => window.location.href = "/study-dashboard"} className="secondary">📚 Study Centre</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="stats-container">
      <div className="stats-header">
        <h1>📊 My Progress</h1>
        <p className="subtitle">Track your medical journey</p>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon">📝</div>
          <div className="stat-value">{stats.totalAttempted || 0}</div>
          <div className="stat-label">Questions Answered</div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">🎯</div>
          <div className="stat-value">{stats.accuracy || 0}%</div>
          <div className="stat-label">Overall Accuracy</div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">🔥</div>
          <div className="stat-value">{stats.currentStreak || 0}</div>
          <div className="stat-label">Current Streak</div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">⭐</div>
          <div className="stat-value">{stats.totalXP || 0}</div>
          <div className="stat-label">Total XP</div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">🏆</div>
          <div className="stat-value">{stats.dailyChallengesCompleted || 0}</div>
          <div className="stat-label">Daily Challenges</div>
        </div>
      </div>

      {stats.currentStreak >= 3 && (
        <div className="motivation-card">
          🔥 {stats.currentStreak} day streak! You're on fire! Keep going!
        </div>
      )}
    </div>
  );
}

export default Stats;
