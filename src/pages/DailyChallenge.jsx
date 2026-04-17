// src/pages/DailyChallenge.jsx
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { auth } from "../firebase";
import { getFirestore, doc, getDoc } from "firebase/firestore";
import { getDailyQuestions, getYearSubjectLabel } from "../data/dailyChallengeQuestions";
import "./DailyChallenge.css";

const DailyChallenge = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [dailyQuestions, setDailyQuestions] = useState([]);
  const [completed, setCompleted] = useState(false);
  const [streak, setStreak] = useState(0);
  const [xpBonus, setXpBonus] = useState(0);
  const [userYear, setUserYear] = useState("");
  const [questionsCount, setQuestionsCount] = useState(20);
  const [timeUntilReset, setTimeUntilReset] = useState("");
  const [subjectLabel, setSubjectLabel]     = useState("");

  useEffect(() => {
    loadDailyChallenge();
    calculateTimeUntilReset();
    const timer = setInterval(calculateTimeUntilReset, 60000);
    return () => clearInterval(timer);
  }, []);

  const calculateTimeUntilReset = () => {
    const now = new Date();
    const midnight = new Date();
    midnight.setHours(24, 0, 0, 0);
    const diff = midnight - now;
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    setTimeUntilReset(`${hours}h ${minutes}m`);
  };

  const calculateBonus = (currentStreak) => {
    return Math.min(20 + (currentStreak * 2), 40);
  };

  const loadDailyChallenge = async () => {
    setLoading(true);
    
    const today = new Date().toISOString().split('T')[0];
    const user = auth.currentUser;
    
    if (user) {
      const db = getFirestore();
      
      const userDocRef = doc(db, "users", user.uid);
      const userSnapshot = await getDoc(userDocRef);
      const userData = userSnapshot.exists() ? userSnapshot.data() : {};
      const yearOfStudy = userData.profile?.year || "1";
      
      const yearText = {
        "1": "1st Year",
        "2": "2nd Year", 
        "3": "3rd Year",
        "4": "4th Year",
        "5": "5th Year",
        "6": "6th Year"
      }[yearOfStudy] || `${yearOfStudy}th Year`;
      
      setUserYear(yearText);
      setSubjectLabel(getYearSubjectLabel(yearOfStudy));
      
      const questions = getDailyQuestions(parseInt(yearOfStudy));
      setDailyQuestions(questions);
      setQuestionsCount(questions.length);
      
      const challengeRef = doc(db, "users", user.uid, "dailyChallenges", today);
      const challengeSnapshot = await getDoc(challengeRef);
      
      if (challengeSnapshot.exists()) {
        const data = challengeSnapshot.data();
        setCompleted(true);
        setStreak(data.streak || 0);
        const bonus = calculateBonus(data.streak || 0);
        setXpBonus(bonus);
      } else {
        const currentStreak = userData.stats?.streak || 0;
        setStreak(currentStreak);
        const bonus = calculateBonus(currentStreak);
        setXpBonus(bonus);
      }
    }
    
    setLoading(false);
  };

  const handleStartChallenge = () => {
    navigate("/daily-quiz", { 
      state: { 
        questions: dailyQuestions,
        isDailyChallenge: true,
        xpBonus: xpBonus,
        streak: streak,
        topic: "Daily Challenge",
        userYear: userYear,
        questionsCount: questionsCount
      } 
    });
  };

  if (loading) {
    return (
      <div className="daily-challenge-loading">
        <div className="loading-spinner"></div>
        <p>Loading your challenge...</p>
      </div>
    );
  }

  return (
    <div className="daily-challenge-container">
      {/* Hero Section */}
      <div className="daily-challenge-hero">
        <div className="hero-content">
          <div className="hero-icon">⭐</div>
          <h1 className="hero-title">Daily Challenge</h1>
          <p className="hero-subtitle">Test your knowledge with today's curated questions</p>
          <div className="hero-year-badge">{userYear}</div>
          {subjectLabel && (
            <div className="hero-subject-label">📚 {subjectLabel}</div>
          )}
        </div>
        <div className="hero-decoration"></div>
      </div>

      {/* Main Challenge Card */}
      <div className="challenge-card">
        {!completed ? (
          <>
            {/* Glowing Effect for Active Challenge */}
            <div className="challenge-glow"></div>
            
            {/* Streak Banner */}
            <div className="streak-banner">
              <div className="streak-fire">🔥</div>
              <div className="streak-count">{streak} Day Streak</div>
              <div className="streak-fire">🔥</div>
            </div>
            
            {/* Timer Until Reset */}
            <div className="reset-timer">
              <span className="timer-icon">⏰</span>
              <span>Resets in {timeUntilReset}</span>
            </div>
            
            {/* Main CTA Button */}
            <button className="start-blitz-btn" onClick={handleStartChallenge}>
              <span className="btn-icon">⚡</span>
              <span className="btn-text">START TODAY'S BLITZ</span>
              <span className="btn-icon">⚡</span>
            </button>
            
            {/* Simplified Rewards Section - Clean and Simple */}
            <div className="rewards-simple">
              <div className="reward-simple-item">
                <div className="reward-simple-value">{questionsCount}</div>
                <div className="reward-simple-label">Questions</div>
              </div>
              <div className="reward-simple-item">
                <div className="reward-simple-value">3</div>
                <div className="reward-simple-label">XP Each</div>
              </div>
              <div className="reward-simple-item">
                <div className="reward-simple-value">+{xpBonus}</div>
                <div className="reward-simple-label">Streak Bonus</div>
              </div>
              <div className="reward-simple-item">
                <div className="reward-simple-value">{questionsCount * 3 + xpBonus}</div>
                <div className="reward-simple-label">Max XP</div>
              </div>
            </div>
          </>
        ) : (
          // Completed State
          <div className="completed-state">
            <div className="completed-icon">✅</div>
            <h3>Challenge Completed Today!</h3>
            <p>You've already conquered today's challenge</p>
            <div className="completed-stats">
              <div className="completed-stat">
                <span>🔥</span>
                <span>{streak} Day Streak</span>
              </div>
            </div>
            <button 
              className="back-to-games-btn"
              onClick={() => navigate("/games-dashboard")}
            >
              🎮 Back to Games
            </button>
          </div>
        )}
      </div>

      {/* What to Expect Section */}
      <div className="expect-section">
        <h3>What to expect</h3>
        <div className="expect-grid">
          <div className="expect-item">
            <div className="expect-icon">🎓</div>
            <div className="expect-text">{subjectLabel || `Tailored to ${userYear}`}</div>
          </div>
          <div className="expect-item">
            <div className="expect-icon">⚡</div>
            <div className="expect-text">20 questions, 3 XP each</div>
          </div>
          <div className="expect-item">
            <div className="expect-icon">🏆</div>
            <div className="expect-text">Build your streak daily</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DailyChallenge