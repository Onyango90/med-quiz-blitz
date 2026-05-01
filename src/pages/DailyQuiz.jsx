// src/pages/DailyQuiz.jsx
import React, { useState, useEffect, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { auth } from "../firebase";
import { getDatabase, ref, get, set, update } from "firebase/database";
import LevelComplete from "../components/LevelComplete";
import correctSoundFile from "../sound/correct.wav";
import wrongSoundFile from "../sound/wrong.wav";
import "./DailyQuiz.css";

const OPTION_LABELS = ["A", "B", "C", "D"];

function DailyQuiz() {
  const location = useLocation();
  const navigate = useNavigate();

  const {
    questions, isDailyChallenge, xpBonus, streak,
    topic, userYear, levelNumber, totalLevels,
  } = location.state || {};

  const [index,          setIndex]         = useState(0);
  const [userAnswer,     setUserAnswer]     = useState("");
  const [showResult,     setShowResult]     = useState(false);
  const [status,         setStatus]         = useState(null);
  const [timeLeft,       setTimeLeft]       = useState(30);
  const [totalXPEarned,  setTotalXPEarned]  = useState(0);
  const [xpPopups,       setXpPopups]       = useState([]);
  const [cardKey,        setCardKey]        = useState(0);
  const [isAnimatingOut, setIsAnimatingOut] = useState(false);
  const [showReview,     setShowReview]     = useState(false);
  // SCREEN STATE MACHINE: "quiz" | "meddy" | "results"
  const [screen,         setScreen]         = useState("quiz");
  const [finalXP,        setFinalXP]        = useState(0);
  const [finalCorrect,   setFinalCorrect]   = useState(0);
  const [finalPct,       setFinalPct]       = useState(0);
  const [finalAnswers,   setFinalAnswers]   = useState([]);

  // Use refs so handleNext can read latest values synchronously
  const answersRef     = useRef([]);
  const correctRef     = useRef(0);
  const xpRef          = useRef(0);
  const inputRef       = useRef(null);
  const correctSound   = useRef(new Audio(correctSoundFile));
  const wrongSound     = useRef(new Audio(wrongSoundFile));

  const question = questions?.[index];
  const isLast   = index === (questions?.length || 0) - 1;
  const progress  = (index / (questions?.length || 1)) * 100;

  useEffect(() => {
    setUserAnswer("");
    setShowResult(false);
    setStatus(null);
    setTimeLeft(30);
  }, [index]);

  // Timer for short-answer questions (no options array)
  useEffect(() => {
    if (!question || showResult || screen !== "quiz") return;
    if (question.options) return;
    if (timeLeft === 0) { handleAnswer(userAnswer, true); return; }
    const t = setTimeout(() => setTimeLeft(v => v - 1), 1000);
    return () => clearTimeout(t);
  }, [timeLeft, question, showResult, screen]);

  if (!questions || !questions.length) {
    return (
      <div className="dq-empty">
        <div className="dq-empty-icon">📭</div>
        <h2>No questions available</h2>
        <button onClick={() => navigate("/home")}>← Back to Home</button>
      </div>
    );
  }

  const showXPPopup = (xp, correct) => {
    const id = Date.now() + Math.random();
    setXpPopups(p => [...p, { id, xp, correct }]);
    setTimeout(() => setXpPopups(p => p.filter(x => x.id !== id)), 1200);
  };

  const handleAnswer = (answer, timeout = false) => {
    if (showResult) return;

    const isCorrect = !timeout &&
      answer?.trim().toLowerCase() === question?.answer?.trim().toLowerCase();

    setShowResult(true);

    if (timeout) {
      setStatus("timeout");
      wrongSound.current.play().catch(() => {});
      showXPPopup(0, false);
    } else if (isCorrect) {
      const xp = question.xpValue || 10;
      setStatus("correct");
      setTotalXPEarned(v => v + xp);
      correctRef.current += 1;
      xpRef.current += xp;
      correctSound.current.play().catch(() => {});
      showXPPopup(xp, true);
    } else {
      setStatus("wrong");
      wrongSound.current.play().catch(() => {});
      showXPPopup(0, false);
    }

    const record = {
      question:      question.question,
      userAnswer:    answer || "No answer",
      correctAnswer: question.answer,
      isCorrect:     isCorrect && !timeout,
      explanation:   question.explanation || "",
      xpEarned:      (isCorrect && !timeout) ? (question.xpValue || 10) : 0,
    };
    answersRef.current = [...answersRef.current, record];
  };

  const handleNext = () => {
    if (isLast) {
      // Snapshot all values from refs (guaranteed up-to-date)
      const answers = answersRef.current;
      const correct = correctRef.current;
      const xpFromQs = xpRef.current;
      const pct = Math.round((correct / (questions.length || 1)) * 100);
      const bonus = (levelNumber === 1 && pct >= 60) ? (xpBonus || 0) : 0;
      const totalXP = xpFromQs + bonus;

      setFinalXP(totalXP);
      setFinalCorrect(correct);
      setFinalPct(pct);
      setFinalAnswers(answers);

      // Save then transition screen
      saveResults(answers, correct, xpFromQs, pct, bonus).finally(() => {
        if (isDailyChallenge && levelNumber) {
          setScreen("meddy");   // ← SHOW MEDDY
        } else {
          setScreen("results"); // ← show results
        }
      });
    } else {
      setIsAnimatingOut(true);
      setTimeout(() => {
        setIsAnimatingOut(false);
        setCardKey(k => k + 1);
        setIndex(i => i + 1);
      }, 280);
    }
  };

  const saveResults = async (answers, correct, xpFromQs, pct, bonus) => {
    const user = auth.currentUser;
    if (!user) return;
    const db    = getDatabase();
    const today = new Date().toISOString().split("T")[0];
    const totalXP    = xpFromQs + bonus;
    const newStreak  = pct >= 60 ? (streak || 0) + 1 : 0;

    try {
      const challengeRef = ref(db, `users/${user.uid}/dailyChallenges/${today}`);
      const snap = await get(challengeRef);
      const prev = snap.exists() ? snap.val() : {};

      await set(challengeRef, {
        ...prev,
        date:            today,
        levelsCompleted: Math.max(prev.levelsCompleted || 0, levelNumber || 1),
        score:           (prev.score || 0) + correct,
        totalQuestions:  (prev.totalQuestions || 0) + questions.length,
        xpEarned:        (prev.xpEarned || 0) + totalXP,
        streak:          newStreak,
        completedAt:     new Date().toISOString(),
        yearOfStudy:     userYear,
        [`level${levelNumber || 1}Answers`]: answers,
      });

      const userRef  = ref(db, `users/${user.uid}/stats`);
      const userSnap = await get(userRef);
      const cur      = userSnap.exists() ? userSnap.val() : {};
      const newTotal   = (cur.totalAttempted || 0) + questions.length;
      const newCorrect = (cur.totalCorrect || 0) + correct;

      await update(userRef, {
        totalXP:                  (cur.totalXP || 0) + totalXP,
        totalAttempted:           newTotal,
        totalCorrect:             newCorrect,
        accuracy:                 Math.round((newCorrect / newTotal) * 100),
        streak:                   newStreak,
        lastActiveDate:           today,
        dailyChallengesCompleted: (cur.dailyChallengesCompleted || 0) + 1,
        sessionsCompleted:        (cur.sessionsCompleted || 0) + 1,
      });
    } catch (err) {
      console.error("saveResults error:", err);
    }
  };

  const getOptionState = (opt) => {
    if (!showResult) return "idle";
    if (opt === question.answer) return "correct";
    if (opt === userAnswer && opt !== question.answer) return "wrong";
    return "dim";
  };

  // ══════════════════════════════════════════════════════════
  // SCREEN: MEDDY 🧠
  // ══════════════════════════════════════════════════════════
  if (screen === "meddy") {
    return (
      <LevelComplete
        level={levelNumber || 1}
        xpEarned={finalXP}
        totalXP={finalXP}
        onNext={() => navigate("/daily-challenge")}
        onDone={() => navigate("/home")}
      />
    );
  }

  // ══════════════════════════════════════════════════════════
  // SCREEN: REVIEW
  // ══════════════════════════════════════════════════════════
  if (screen === "results" && showReview) {
    return (
      <div className="dq-root">
        <div className="dq-bg" aria-hidden="true">
          <div className="dq-orb dq-orb-1" />
          <div className="dq-orb dq-orb-2" />
        </div>
        <div className="dq-review">
          <header className="dq-review-header">
            <h1 className="dq-review-title">📋 Answer Review</h1>
            <button className="dq-review-back" onClick={() => setShowReview(false)}>← Back</button>
          </header>
          <div className="dq-review-list">
            {finalAnswers.map((ans, i) => (
              <div key={i} className={`dq-review-card ${ans.isCorrect ? "dq-rc-ok" : "dq-rc-fail"}`}>
                <div className="dq-rc-num">Q{i + 1}</div>
                <p className="dq-rc-q">{ans.question}</p>
                <div className="dq-rc-row">
                  <span className="dq-rc-label">Your answer</span>
                  <span className={`dq-rc-val ${ans.isCorrect ? "dq-rc-green" : "dq-rc-red"}`}>{ans.userAnswer}</span>
                </div>
                {!ans.isCorrect && (
                  <div className="dq-rc-row">
                    <span className="dq-rc-label">Correct answer</span>
                    <span className="dq-rc-val dq-rc-green">{ans.correctAnswer}</span>
                  </div>
                )}
                {ans.explanation && <p className="dq-rc-exp">{ans.explanation}</p>}
                <div className="dq-rc-xp">{ans.isCorrect ? `+${ans.xpEarned} XP` : "0 XP"}</div>
              </div>
            ))}
          </div>
          <div className="dq-review-actions">
            <button className="dq-btn-outline" onClick={() => navigate("/home")}>🏠 Home</button>
            <button className="dq-btn-primary" onClick={() => navigate("/daily-challenge")}>⚡ Next Level</button>
          </div>
        </div>
      </div>
    );
  }

  // ══════════════════════════════════════════════════════════
  // SCREEN: RESULTS SUMMARY
  // ══════════════════════════════════════════════════════════
  if (screen === "results") {
    const emoji = finalPct >= 80 ? "🏆" : finalPct >= 60 ? "💪" : "📖";
    const msg   = finalPct >= 80 ? "Outstanding!" : finalPct >= 60 ? "Good effort!" : "Keep practising!";
    const passed = finalPct >= 60;
    const bonusXPFinal = (levelNumber === 1 && passed) ? (xpBonus || 0) : 0;

    return (
      <div className="dq-root dq-end">
        <div className="dq-bg" aria-hidden="true">
          <div className="dq-orb dq-orb-1" />
          <div className="dq-orb dq-orb-2" />
          <div className="dq-orb dq-orb-3" />
        </div>
        <div className="dq-end-card">
          <div className="dq-end-topline" />
          <div className="dq-end-emoji">{emoji}</div>
          <h1 className="dq-end-title">Level Complete!</h1>
          <p className="dq-end-msg">{msg}</p>
          <div className="dq-score-ring-wrap">
            <svg className="dq-score-ring" viewBox="0 0 120 120">
              <circle cx="60" cy="60" r="50" className="dq-ring-bg" />
              <circle cx="60" cy="60" r="50" className="dq-ring-fill"
                strokeDasharray={`${finalPct * 3.14} 314`}
                stroke={finalPct >= 80 ? "#10b981" : finalPct >= 60 ? "#ffbe0b" : "#ef4444"}
                transform="rotate(-90 60 60)" />
            </svg>
            <div className="dq-ring-label">
              <span className="dq-ring-pct">{finalPct}%</span>
              <span className="dq-ring-sub">Score</span>
            </div>
          </div>
          <div className="dq-end-stats">
            {[
              { value: `${finalCorrect}/${questions.length}`, label: "Correct",  color: "green" },
              { value: `+${finalXP}`,                         label: "XP Earned", color: "gold"  },
              { value: passed ? `${(streak||0)+1}` : "—",     label: "Streak",    color: "coral" },
            ].map(s => (
              <div key={s.label} className={`dq-end-stat dq-stat-${s.color}`}>
                <span className="dq-end-stat-val">{s.value}</span>
                <span className="dq-end-stat-lbl">{s.label}</span>
              </div>
            ))}
          </div>
          <div className={`dq-streak-msg ${passed ? "dq-streak-pass" : "dq-streak-fail"}`}>
            {passed ? `🔥 ${(streak||0)+1} day streak!` : "📚 Score 60%+ to build your streak"}
          </div>
          {bonusXPFinal > 0 && (
            <div className="dq-bonus-banner">
              <span>⚡ Streak bonus</span><span>+{bonusXPFinal} XP</span>
            </div>
          )}
          <div className="dq-end-actions">
            <button className="dq-btn-ghost"   onClick={() => setShowReview(true)}>📋 Review</button>
            <button className="dq-btn-outline"  onClick={() => navigate("/daily-challenge")}>⚡ Next Level</button>
            <button className="dq-btn-primary"  onClick={() => navigate("/home")}>🏠 Home</button>
          </div>
        </div>
      </div>
    );
  }

  // ══════════════════════════════════════════════════════════
  // SCREEN: QUIZ
  // ══════════════════════════════════════════════════════════
  const timerPct = (timeLeft / 30) * 100;

  return (
    <div className={`dq-root ${status ? `dq-root--${status}` : ""}`}>
      <div className="dq-bg" aria-hidden="true">
        <div className="dq-orb dq-orb-1" />
        <div className="dq-orb dq-orb-2" />
        <div className="dq-orb dq-orb-3" />
      </div>

      {xpPopups.map(p => (
        <div key={p.id} className={`dq-xp-pop ${p.correct ? "dq-xp-pop--ok" : "dq-xp-pop--fail"}`}>
          {p.correct ? `+${p.xp} XP` : "✗"}
        </div>
      ))}

      <header className="dq-topbar">
        <div className="dq-topbar-left">
          <div className="dq-daily-pill">
            <span>⚡</span>
            <span>Daily</span>
            {(streak || 0) > 0 && <span className="dq-streak-badge">🔥 {streak}</span>}
          </div>
          {levelNumber && <span className="dq-topic">Level {levelNumber}</span>}
        </div>
        <div className="dq-counter">
          <span className="dq-counter-cur">{index + 1}</span>
          <span className="dq-counter-sep">/</span>
          <span className="dq-counter-tot">{questions.length}</span>
        </div>
        <div className="dq-topbar-right">
          <div className="dq-xp-pill">⭐ {totalXPEarned}</div>
        </div>
      </header>

      <div className="dq-progress-track">
        <div className="dq-progress-fill" style={{ width: `${progress}%` }}>
          <div className="dq-progress-shimmer" />
        </div>
        <div className="dq-progress-head" style={{ left: `calc(${progress}% - 6px)` }} />
      </div>

      <main className="dq-main">
        <div key={cardKey} className={`dq-card ${isAnimatingOut ? "dq-card--out" : "dq-card--in"}`}>

          <div className="dq-q-label">
            <span className="dq-q-dot" />
            Question {index + 1}
            {xpBonus > 0 && levelNumber === 1 && (
              <span className="dq-bonus-tag">+{xpBonus} XP streak bonus</span>
            )}
          </div>

          <p className="dq-question">{question?.question}</p>

          {!question?.options && (
            <div className="dq-timer-wrap">
              <svg className="dq-timer-ring" viewBox="0 0 44 44">
                <circle cx="22" cy="22" r="18" className="dq-timer-bg" />
                <circle cx="22" cy="22" r="18" className="dq-timer-arc"
                  strokeDasharray={`${timerPct * 1.131} 113.1`}
                  transform="rotate(-90 22 22)"
                  style={{ stroke: timeLeft <= 5 ? "#ef4444" : "#2a9d8f" }} />
              </svg>
              <span className="dq-timer-num" style={{ color: timeLeft <= 5 ? "#ef4444" : "inherit" }}>
                {timeLeft}
              </span>
            </div>
          )}

          {question?.options && (
            <div className="dq-options">
              {question.options.map((opt, i) => {
                const state = getOptionState(opt);
                return (
                  <button key={i} className={`dq-option dq-option--${state}`}
                    onClick={() => !showResult && handleAnswer(opt)}
                    disabled={showResult}>
                    <span className="dq-opt-letter">{OPTION_LABELS[i]}</span>
                    <span className="dq-opt-text">{opt}</span>
                    {state === "correct" && <span className="dq-opt-check">✓</span>}
                    {state === "wrong"   && <span className="dq-opt-check">✗</span>}
                  </button>
                );
              })}
            </div>
          )}

          {!question?.options && !showResult && (
            <div className="dq-input-area">
              <div className="dq-input-row">
                <input ref={inputRef} type="text" className="dq-input"
                  value={userAnswer}
                  onChange={e => setUserAnswer(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && handleAnswer(userAnswer)}
                  placeholder="Type your answer and press Enter…" />
                <button className="dq-submit-btn" onClick={() => handleAnswer(userAnswer)}>Submit</button>
              </div>
            </div>
          )}

          {showResult && (
            <div className={`dq-feedback dq-feedback--${status}`}>
              <div className="dq-feedback-icon">
                {status === "correct" ? "✓" : status === "timeout" ? "⏰" : "✗"}
              </div>
              <div className="dq-feedback-body">
                <p className="dq-feedback-headline">
                  {status === "correct" ? "Correct!"
                    : status === "timeout" ? `Time's up — answer: ${question.answer}`
                    : `Answer: ${question.answer}`}
                </p>
                {question.explanation && (
                  <p className="dq-feedback-exp">{question.explanation}</p>
                )}
              </div>
            </div>
          )}
        </div>

        {showResult && (
          <button className="dq-next-btn" onClick={handleNext}>
            {isLast ? "Finish Level" : "Next Question"}
            <span className="dq-next-arrow">→</span>
          </button>
        )}

        <div className="dq-dots" aria-hidden="true">
          {questions.map((_, i) => {
            const ans = answersRef.current[i];
            return (
              <span key={i} className={`dq-dot
                ${i === index ? "dq-dot--cur" : ""}
                ${ans ? (ans.isCorrect ? "dq-dot--ok" : "dq-dot--fail") : ""}
              `} />
            );
          })}
        </div>
      </main>
    </div>
  );
}

export default DailyQuiz;