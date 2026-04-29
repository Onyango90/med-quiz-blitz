// src/pages/DailyChallenge.jsx
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { auth } from "../firebase";
import { getFirestore, doc, getDoc } from "firebase/firestore";
import { getDailyLevels, getCurriculumLabel, LEVEL_CONFIG } from "../data/dailyChallengeQuestions";
import "./DailyChallenge.css";

const DailyChallenge = () => {
  const navigate = useNavigate();
  const [loading,          setLoading]        = useState(true);
  const [levels,           setLevels]         = useState([]);
  const [completedLevels,  setCompletedLevels]= useState(0); // how many levels done today
  const [streak,           setStreak]         = useState(0);
  const [xpBonus,          setXpBonus]        = useState(0);
  const [userYear,         setUserYear]        = useState("");
  const [curriculumLabel,  setCurriculumLabel] = useState("");
  const [timeUntilReset,   setTimeUntilReset]  = useState("");
  const [allComplete,      setAllComplete]     = useState(false);

  useEffect(() => {
    loadDailyChallenge();
    calculateTimeUntilReset();
    const timer = setInterval(calculateTimeUntilReset, 60000);
    return () => clearInterval(timer);
  }, []);

  const calculateTimeUntilReset = () => {
    const now      = new Date();
    const midnight = new Date();
    midnight.setHours(24, 0, 0, 0);
    const diff    = midnight - now;
    const hours   = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    setTimeUntilReset(`${hours}h ${minutes}m`);
  };

  const loadDailyChallenge = async () => {
    setLoading(true);
    const today = new Date().toISOString().split("T")[0];
    const user  = auth.currentUser;

    if (user) {
      const db              = getFirestore();
      const userDocRef      = doc(db, "users", user.uid);
      const userSnapshot    = await getDoc(userDocRef);
      const userData        = userSnapshot.exists() ? userSnapshot.data() : {};
      const yearOfStudy     = userData.profile?.year || localStorage.getItem("userYear") || "1";

      const yearText = { "1":"1st Year","2":"2nd Year","3":"3rd Year","4":"4th Year","5":"5th Year","6":"6th Year" }[String(yearOfStudy)] || `Year ${yearOfStudy}`;
      setUserYear(yearText);
      setCurriculumLabel(getCurriculumLabel(yearOfStudy));

      // Build today's 4 levels
      const dailyLevels = getDailyLevels(parseInt(yearOfStudy));
      setLevels(dailyLevels);

      // Streak bonus
      const currentStreak = userData.stats?.streak || 0;
      setStreak(currentStreak);
      setXpBonus(Math.min(20 + currentStreak * 2, 40));

      // Check how many levels completed today from Firestore
      const challengeRef      = doc(db, "users", user.uid, "dailyChallenges", today);
      const challengeSnapshot = await getDoc(challengeRef);

      if (challengeSnapshot.exists()) {
        const data = challengeSnapshot.data();
        setCompletedLevels(data.levelsCompleted || 0);
        setStreak(data.streak || currentStreak);
        if ((data.levelsCompleted || 0) >= 4) setAllComplete(true);
      }
    }

    setLoading(false);
  };

  // Start a specific level
  const handleStartLevel = (levelIndex) => {
    const level = levels[levelIndex];
    if (!level) return;

    navigate("/daily-quiz", {
      state: {
        questions:        level.questions,
        isDailyChallenge: true,
        xpBonus:          levelIndex === 0 ? xpBonus : 0, // bonus only on Level 1
        streak,
        topic:            `Daily Challenge — ${level.label}`,
        levelNumber:      level.level,
        levelConfig:      level,
        totalLevels:      levels.length,
        userYear,
        questionsCount:   level.questions.length,
        completedLevels,
      },
    });
  };

  if (loading) {
    return (
      <div className="dc-loading">
        <div className="dc-spinner" />
        <p>Loading your challenge…</p>
      </div>
    );
  }

  const nextLevelIndex = completedLevels; // 0-based index of the next level to do
  const nextLevel      = levels[nextLevelIndex];
  const totalXPToday   = LEVEL_CONFIG.slice(0, completedLevels).reduce((a, c) => a + c.xpPerQ * 5, 0);

  return (
    <div className="dc-page">

      {/* ── Hero ── */}
      <div className="dc-hero">
        <div className="dc-hero-mesh">
          <div className="dc-orb dc-orb-1" />
          <div className="dc-orb dc-orb-2" />
        </div>
        <div className="dc-hero-content">
          <div className="dc-hero-icon">⭐</div>
          <h1 className="dc-hero-title">Daily Challenge</h1>
          <p className="dc-hero-sub">Today's knowledge blitz, tailored for you</p>
          <div className="dc-hero-tags">
            <span className="dc-tag dc-tag-year">{userYear}</span>
            <span className="dc-tag dc-tag-curr">{curriculumLabel}</span>
          </div>
        </div>
      </div>

      <div className="dc-body">

        {/* ── Streak + reset ── */}
        <div className="dc-meta-row">
          <div className="dc-streak-pill">
            <span>🔥</span>
            <span>{streak} day streak</span>
          </div>
          <div className="dc-reset-pill">
            <span>⏰</span>
            <span>Resets in {timeUntilReset}</span>
          </div>
        </div>

        {/* ── XP earned today ── */}
        {completedLevels > 0 && (
          <div className="dc-progress-banner">
            <span>⭐ {totalXPToday} XP earned today</span>
            <span className="dc-prog-levels">{completedLevels}/4 levels done</span>
          </div>
        )}

        {/* ── All complete ── */}
        {allComplete ? (
          <div className="dc-complete-card">
            <div className="dc-complete-emoji">👑</div>
            <h2>Daily Champion!</h2>
            <p>You conquered all 4 levels today. Outstanding work, Doctor.</p>
            <p className="dc-complete-sub">Come back tomorrow for a fresh challenge.</p>
            <div className="dc-complete-stats">
              <div className="dc-cs-item"><span>{totalXPToday + xpBonus}</span><small>XP Today</small></div>
              <div className="dc-cs-item"><span>{streak}🔥</span><small>Day Streak</small></div>
            </div>
            <button className="dc-home-btn" onClick={() => navigate("/home")}>Back to Dashboard</button>
          </div>
        ) : (
          <>
            {/* ── Next level CTA ── */}
            {nextLevel && (
              <div
                className="dc-next-card"
                style={{ "--level-color": nextLevel.color }}
                onClick={() => handleStartLevel(nextLevelIndex)}
              >
                <div className="dc-next-glow" />
                <div className="dc-next-left">
                  <div className="dc-next-icon">{nextLevel.icon}</div>
                  <div>
                    <div className="dc-next-label">
                      Level {nextLevel.level} · {nextLevel.label}
                    </div>
                    <div className="dc-next-tagline">
                      {nextLevel.tagline}
                    </div>
                  </div>
                </div>
                <div className="dc-next-right">
                  <div className="dc-next-xp">+{nextLevel.xpPerQ * 5} XP</div>
                  <button className="dc-start-btn">
                    {completedLevels === 0 ? "Start ⚡" : "Continue →"}
                  </button>
                </div>
              </div>
            )}

            {/* ── Level grid ── */}
            <div className="dc-levels-grid">
              {levels.map((level, i) => {
                const done    = i < completedLevels;
                const current = i === nextLevelIndex;
                const locked  = i > nextLevelIndex;
                return (
                  <div
                    key={level.level}
                    className={`dc-level-tile ${done ? "dc-done" : ""} ${current ? "dc-current" : ""} ${locked ? "dc-locked" : ""}`}
                    style={{ "--level-color": level.color }}
                    onClick={() => !locked && handleStartLevel(i)}
                  >
                    <div className="dc-tile-icon">
                      {done ? "✓" : locked ? "🔒" : level.icon}
                    </div>
                    <div className="dc-tile-name">{level.label}</div>
                    <div className="dc-tile-xp">{level.xpPerQ * 5} XP</div>
                    <div className="dc-tile-qs">5 Qs</div>
                  </div>
                );
              })}
            </div>

            {/* Streak note */}
            {completedLevels === 0 && (
              <p className="dc-streak-note">
                💡 Complete Level 1 to keep your streak alive. Levels 2–4 are bonus!
              </p>
            )}
            {completedLevels >= 1 && completedLevels < 4 && (
              <p className="dc-streak-note dc-streak-note-green">
                ✅ Streak secured! Keep going for bonus XP.
              </p>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default DailyChallenge;