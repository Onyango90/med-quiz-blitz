// src/pages/EndPage.jsx 
import "./EndPage.css";
import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import Confetti from "react-confetti"; // npm install react-confetti

// Utility function to calculate streak
const updateStreak = (lastDate, currentStreak, longestStreak) => {
  const today = new Date().toISOString().split("T")[0];
  const yesterday = new Date(Date.now() - 86400000).toISOString().split("T")[0];

  let continued = false;
  let newStreak = currentStreak;

  if (lastDate === today) {
    return { current: currentStreak, longest: longestStreak, continued: true };
  }

  if (lastDate === yesterday) {
    newStreak += 1;
    continued = true;
  } else {
    newStreak = 1;
  }

  return {
    current: newStreak,
    longest: Math.max(longestStreak, newStreak),
    continued,
  };
};

const EndPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const results = location.state?.results || [];

  const [totalXP, setTotalXP] = useState(0);
  const [displayXP, setDisplayXP] = useState(0); // animated XP
  const [correctCount, setCorrectCount] = useState(0);
  const [streakData, setStreakData] = useState({
    current: 1,
    longest: 1,
    continued: true,
  });

  useEffect(() => {
    // Calculate total XP and correct answers
    let xp = 0;
    let correct = 0;
    results.forEach((res) => {
      xp += res.xpEarned || 0;
      if (res.correct) correct += 1;
    });
    setTotalXP(xp);
    setCorrectCount(correct);

    // Update streak
    const lastDate = localStorage.getItem("lastDailyDate") || null;
    const currentStreak = parseInt(localStorage.getItem("currentStreak")) || 0;
    const longestStreak = parseInt(localStorage.getItem("longestStreak")) || 0;

    const updated = updateStreak(lastDate, currentStreak, longestStreak);
    setStreakData(updated);

    // Save updated streak
    localStorage.setItem("lastDailyDate", new Date().toISOString().split("T")[0]);
    localStorage.setItem("currentStreak", updated.current);
    localStorage.setItem("longestStreak", updated.longest);

    // Animate XP count up
    let xpCounter = 0;
    const interval = setInterval(() => {
      xpCounter += 1;
      if (xpCounter > xp) {
        clearInterval(interval);
        xpCounter = xp;
      }
      setDisplayXP(xpCounter);
    }, 20); // speed of animation
  }, [results]);

  return (
    <div className="end-page" style={{ textAlign: "center", padding: "2rem" }}>
      {/* Confetti if streak continued */}
      {streakData.continued && <Confetti numberOfPieces={150} recycle={false} />}

      <h1>🎉 Daily Challenge Complete!</h1>

      {/* SCORE SUMMARY */}
      <section className="score-card" style={{ margin: "1.5rem 0" }}>
        <h2>Score Summary</h2>
        <p>
          Correct Answers: {correctCount} / {results.length}
        </p>
        <p>
          Total XP Earned: <strong>{displayXP}</strong>
        </p>
      </section>

      {/* STREAK */}
      <section className="streak-card" style={{ margin: "1.5rem 0" }}>
        {streakData.continued ? (
          <p>🔥 Current Streak: {streakData.current} day{streakData.current > 1 ? "s" : ""}</p>
        ) : (
          <p>Streak reset — new streak started 💪</p>
        )}
        <small>Longest Streak: {streakData.longest}</small>
      </section>

      {/* CTA Buttons */}
      <section className="cta" style={{ marginTop: "2rem", display: "flex", gap: "15px", justifyContent: "center" }}>
        <button
          style={{
            padding: "12px 25px",
            borderRadius: "10px",
            border: "none",
            backgroundColor: "#3498db",
            color: "#fff",
            cursor: "pointer",
            fontWeight: 600,
          }}
          onClick={() => navigate("/review", { state: { results } })}
        >
          📖 Review Quiz
        </button>

        <button
          style={{
            padding: "12px 25px",
            borderRadius: "10px",
            border: "none",
            backgroundColor: "#2ecc71",
            color: "#fff",
            cursor: "pointer",
            fontWeight: 600,
          }}
          onClick={() => navigate("/home")}
        >
          🏠 Back to Home
        </button>
      </section>
    </div>
  );
};

export default EndPage;
