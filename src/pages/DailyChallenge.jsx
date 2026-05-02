// src/pages/DailyChallenge.jsx
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { auth } from "../firebase";
import { getFirestore, doc, getDoc } from "firebase/firestore";
import { getDatabase, ref, get } from "firebase/database";
import { getDailyLevels, getCurriculumLabel, LEVEL_CONFIG } from "../data/dailyChallengeQuestions";
import "./DailyChallenge.css";

const DailyChallenge = () => {
  const navigate = useNavigate();
  const [loading,         setLoading]        = useState(true);
  const [levels,          setLevels]         = useState([]);
  const [completedLevels, setCompletedLevels]= useState(0);
  const [streak,          setStreak]         = useState(0);
  const [xpBonus,         setXpBonus]        = useState(0);
  const [userYear,        setUserYear]        = useState("");
  const [curriculumLabel, setCurriculumLabel] = useState("");
  const [timeUntilReset,  setTimeUntilReset]  = useState("");

  useEffect(() => {
    loadDailyChallenge();
    tick();
    const t = setInterval(tick, 60000);
    return () => clearInterval(t);
  }, []);

  const tick = () => {
    const now = new Date();
    const midnight = new Date();
    midnight.setHours(24, 0, 0, 0);
    const diff = midnight - now;
    const h = Math.floor(diff / 3600000);
    const m = Math.floor((diff % 3600000) / 60000);
    setTimeUntilReset(`${h}h ${m}m`);
  };

  const loadDailyChallenge = async () => {
    setLoading(true);
    const today = new Date().toISOString().split("T")[0];
    const user  = auth.currentUser;

    if (user) {
      // --- Get user profile from Firestore (year of study) ---
      const fs          = getFirestore();
      const userDocRef  = doc(fs, "users", user.uid);
      const userSnap    = await getDoc(userDocRef);
      const userData    = userSnap.exists() ? userSnap.data() : {};
      const yearOfStudy = userData.profile?.year || localStorage.getItem("userYear") || "1";

      const yearText = {"1":"1st Year","2":"2nd Year","3":"3rd Year","4":"4th Year","5":"5th Year","6":"6th Year"}[String(yearOfStudy)] || `Year ${yearOfStudy}`;
      setUserYear(yearText);
      setCurriculumLabel(getCurriculumLabel(yearOfStudy));

      const dailyLevels = getDailyLevels(parseInt(yearOfStudy));
      setLevels(dailyLevels);

      const currentStreak = userData.stats?.streak || 0;
      setStreak(currentStreak);
      setXpBonus(Math.min(20 + currentStreak * 2, 40));

      // --- Check completed levels from Realtime Database (same DB DailyQuiz writes to) ---
      try {
        const rtdb       = getDatabase();
        const chalRef    = ref(rtdb, `users/${user.uid}/dailyChallenges/${today}`);
        const chalSnap   = await get(chalRef);
        if (chalSnap.exists()) {
          const data = chalSnap.val();
          setCompletedLevels(data.levelsCompleted || 0);
          setStreak(data.streak || currentStreak);
        }
      } catch (e) {
        console.warn("RTDB read failed, defaulting to 0 levels completed", e);
      }
    }
    setLoading(false);
  };

  const handleStartLevel = (levelIndex) => {
    const level = levels[levelIndex];
    if (!level) return;
    navigate("/daily-quiz", {
      state: {
        questions:        level.questions,
        isDailyChallenge: true,
        xpBonus:          levelIndex === 0 ? xpBonus : 0,
        streak,
        topic:            `Daily Challenge — ${level.label}`,
        levelNumber:      level.level,
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

  const nextIndex    = completedLevels;           // 0-based index of next level to do
  const nextLevel    = levels[nextIndex];
  const allComplete  = completedLevels >= 4;
  const totalXPToday = LEVEL_CONFIG
    .slice(0, completedLevels)
    .reduce((a, c) => a + c.xpPerQ * 5, 0);

  return (
    <div className="dc-page">

      {/* ── Hero ── */}
      <div className="dc-hero">
        <div className="dc-hero-orb dc-orb-1" />
        <div className="dc-hero-orb dc-orb-2" />
        <div className="dc-hero-content">
          <div className="dc-hero-icon">⭐</div>
          <h1 className="dc-hero-title">Daily Challenge</h1>
          <p className="dc-hero-sub">Today's knowledge blitz, tailored for you</p>
          <div className="dc-hero-tags">
            <span className="dc-tag">{userYear}</span>
            <span className="dc-tag dc-tag-curr">{curriculumLabel}</span>
          </div>
        </div>
      </div>

      <div className="dc-body">

        {/* ── Meta row ── */}
        <div className="dc-meta-row">
          <div className="dc-pill dc-pill-streak">🔥 {streak} day streak</div>
          <div className="dc-pill dc-pill-reset">⏰ Resets in {timeUntilReset}</div>
        </div>

        {/* ── XP earned today ── */}
        {completedLevels > 0 && (
          <div className="dc-progress-banner">
            <span>⭐ {totalXPToday} XP earned today</span>
            <span className="dc-prog-right">{completedLevels}/4 levels done</span>
          </div>
        )}

        {/* ── ALL COMPLETE ── */}
        {allComplete ? (
          <div className="dc-complete-card">
            <div className="dc-complete-emoji">👑</div>
            <h2 className="dc-complete-title">Daily Champion!</h2>
            <p className="dc-complete-msg">You conquered all 4 levels. Outstanding work, Doctor.</p>
            <p className="dc-complete-sub">Come back tomorrow for a fresh challenge.</p>
            <div className="dc-complete-stats">
              <div className="dc-cs"><span>{totalXPToday + xpBonus}</span><small>XP Today</small></div>
              <div className="dc-cs"><span>{streak}🔥</span><small>Streak</small></div>
            </div>
            <button className="dc-home-btn" onClick={() => navigate("/home")}>Back to Dashboard</button>
          </div>
        ) : (
          <>
            {/* ── Next level CTA card ── */}
            {nextLevel && (
              <div className="dc-next-card" style={{"--lvl-color": nextLevel.color}}>
                <div className="dc-next-glow" />
                <div className="dc-next-left">
                  <div className="dc-next-icon">{nextLevel.icon}</div>
                  <div>
                    <div className="dc-next-label">Level {nextLevel.level} · {nextLevel.label}</div>
                    <div className="dc-next-tagline">{nextLevel.tagline}</div>
                  </div>
                </div>
                <div className="dc-next-right">
                  <div className="dc-next-xp">+{nextLevel.xpPerQ * 5} XP</div>
                  <button className="dc-start-btn" onClick={() => handleStartLevel(nextIndex)}>
                    {completedLevels === 0 ? "Start ⚡" : "Continue →"}
                  </button>
                </div>
              </div>
            )}

            {/* ── Level tiles ── */}
            <div className="dc-tiles">
              {levels.map((level, i) => {
                const done    = i < completedLevels;
                const current = i === nextIndex;
                const locked  = i > nextIndex;
                return (
                  <button
                    key={level.level}
                    className={`dc-tile ${done ? "dc-tile-done" : ""} ${current ? "dc-tile-current" : ""} ${locked ? "dc-tile-locked" : ""}`}
                    style={{"--lvl-color": level.color}}
                    onClick={() => !locked && handleStartLevel(i)}
                    disabled={locked}
                  >
                    <div className="dc-tile-icon">
                      {done ? "✓" : locked ? "🔒" : level.icon}
                    </div>
                    <div className="dc-tile-name">{level.label}</div>
                    <div className="dc-tile-xp">{level.xpPerQ * 5} XP</div>
                    <div className="dc-tile-qs">5 Qs</div>
                  </button>
                );
              })}
            </div>

            {/* ── Hint ── */}
            <p className="dc-hint">
              {completedLevels === 0
                ? "💡 Complete Level 1 to keep your streak. Levels 2–4 are bonus!"
                : "✅ Streak secured! Keep going for bonus XP."}
            </p>
          </>
        )}
      </div>
    </div>
  );
};

export default DailyChallenge;