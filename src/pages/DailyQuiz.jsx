// src/pages/DailyQuiz.jsx — redesigned to match Quiz.jsx dark immersive theme
import React, { useState, useEffect, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { auth } from "../firebase";
import { getDatabase, ref, get, set, update } from "firebase/database";
import correctSoundFile from "../sound/correct.wav";
import wrongSoundFile from "../sound/wrong.wav";
import "./DailyQuiz.css";

const OPTION_LABELS = ["A", "B", "C", "D"];

function DailyQuiz() {
  const location = useLocation();
  const navigate = useNavigate();
  const {
    questions, isDailyChallenge, xpBonus, streak,
    topic, userYear, questionsCount,
  } = location.state || {};

  const [index, setIndex]               = useState(0);
  const [userAnswer, setUserAnswer]      = useState("");
  const [showResult, setShowResult]      = useState(false);
  const [status, setStatus]              = useState(null); // null | "correct" | "wrong" | "timeout"
  const [timeLeft, setTimeLeft]          = useState(30);
  const [score, setScore]                = useState(0);
  const [quizCompleted, setQuizCompleted]= useState(false);
  const [totalXPEarned, setTotalXPEarned]= useState(0);
  const [correctCount, setCorrectCount]  = useState(0);
  const [answersList, setAnswersList]    = useState([]);
  const [xpPopups, setXpPopups]          = useState([]);
  const [showReview, setShowReview]      = useState(false);
  const [cardKey, setCardKey]            = useState(0);
  const [isAnimatingOut, setIsAnimatingOut] = useState(false);

  const inputRef    = useRef(null);
  const correctSound= useRef(new Audio(correctSoundFile));
  const wrongSound  = useRef(new Audio(wrongSoundFile));

  const question = questions?.[index];
  const isLast   = index === (questions?.length || 0) - 1;
  const progress = (index / (questions?.length || 1)) * 100;
  const timerPct = (timeLeft / 30) * 100;

  // Reset state on new question
  useEffect(() => {
    setUserAnswer("");
    setShowResult(false);
    setStatus(null);
    setTimeLeft(30);
    if (question?.type !== "mcq" && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [index]);

  // Countdown timer for short-answer questions
  useEffect(() => {
    if (!question || showResult || quizCompleted) return;
    if (question.options) return; // MCQ — no timer
    if (timeLeft === 0) { evaluateAnswer(userAnswer, true); return; }
    const t = setTimeout(() => setTimeLeft((v) => v - 1), 1000);
    return () => clearTimeout(t);
  }, [timeLeft, question, showResult]);

  const showXPPopup = (xp, correct) => {
    const id = Date.now() + Math.random();
    setXpPopups((p) => [...p, { id, xp, correct }]);
    setTimeout(() => setXpPopups((p) => p.filter((x) => x.id !== id)), 1200);
  };

  if (!questions || !questions.length) {
    return (
      <div className="dq-empty">
        <div className="dq-empty-icon">📭</div>
        <h2>No questions available</h2>
        <button onClick={() => navigate("/home")}>← Back to Home</button>
      </div>
    );
  }

  // ── Evaluate answer ──────────────────────────────────────────────────────
  const evaluateAnswer = (answer, timeout = false) => {
    if (showResult) return;

    const isCorrect = !timeout &&
      answer?.trim().toLowerCase() === question.answer?.trim().toLowerCase();

    setShowResult(true);

    if (timeout) {
      setStatus("timeout");
      wrongSound.current.play().catch(() => {});
      showXPPopup(0, false);
    } else if (isCorrect) {
      setStatus("correct");
      const xp = question.xpValue || 3;
      setTotalXPEarned((v) => v + xp);
      setCorrectCount((v) => v + 1);
      setScore((v) => v + 1);
      correctSound.current.play().catch(() => {});
      showXPPopup(xp, true);
    } else {
      setStatus("wrong");
      wrongSound.current.play().catch(() => {});
      showXPPopup(0, false);
    }

    setAnswersList((prev) => [
      ...prev,
      {
        question:      question.question,
        userAnswer:    answer || "No answer",
        correctAnswer: question.answer,
        isCorrect:     isCorrect && !timeout,
        explanation:   question.explanation || "",
        xpEarned:      isCorrect && !timeout ? (question.xpValue || 3) : 0,
      },
    ]);
  };

  // ── Advance to next question ─────────────────────────────────────────────
  const handleNext = () => {
    if (isLast) {
      setQuizCompleted(true);
      saveResults();
    } else {
      setIsAnimatingOut(true);
      setTimeout(() => {
        setIsAnimatingOut(false);
        setCardKey((k) => k + 1);
        setIndex((i) => i + 1);
      }, 280);
    }
  };

  // ── Save to Firebase ─────────────────────────────────────────────────────
  const saveResults = async () => {
    const user = auth.currentUser;
    if (!user) return;
    const db  = getDatabase();
    const today = new Date().toISOString().split("T")[0];
    const pct   = Math.round((correctCount / questions.length) * 100);
    const newStreak   = pct >= 60 ? (streak || 0) + 1 : 0;
    const bonusToAdd  = pct >= 60 ? (xpBonus || 0) : 0;
    const finalXP     = totalXPEarned + bonusToAdd;

    const cleanAnswers = answersList.map((a) => ({
      question:      a.question || "",
      userAnswer:    a.userAnswer || "No answer",
      correctAnswer: a.correctAnswer || "",
      isCorrect:     a.isCorrect || false,
      explanation:   a.explanation || "",
      xpEarned:      a.xpEarned || 0,
    }));

    const challengeRef = ref(db, `users/${user.uid}/dailyChallenges/${today}`);
    await set(challengeRef, {
      date: today, score: correctCount,
      totalQuestions: questions.length, percentage: pct,
      xpEarned: finalXP, bonusXP: bonusToAdd, streak: newStreak,
      completedAt: new Date().toISOString(), yearOfStudy: userYear,
      answers: cleanAnswers,
    });

    const userRef  = ref(db, `users/${user.uid}/stats`);
    const snapshot = await get(userRef);
    const cur      = snapshot.exists() ? snapshot.val() : {};
    const newTotal = (cur.totalAttempted || 0) + questions.length;
    const newCorrect = (cur.totalCorrect || 0) + correctCount;

    await update(userRef, {
      totalXP:                  (cur.totalXP || 0) + finalXP,
      totalAttempted:           newTotal,
      totalCorrect:             newCorrect,
      accuracy:                 Math.round((newCorrect / newTotal) * 100),
      streak:                   newStreak,
      lastActiveDate:           today,
      dailyChallengesCompleted: (cur.dailyChallengesCompleted || 0) + 1,
      sessionsCompleted:        (cur.sessionsCompleted || 0) + 1,
    });
  };

  // ── Option state ────────────────────────────────────────────────────────
  const getOptionState = (opt) => {
    if (!showResult) return "idle";
    if (opt === question.answer) return "correct";
    if (opt === userAnswer && opt !== question.answer) return "wrong";
    return "dim";
  };

  // ════════════════════════════════════════════════════════════════════════
  // COMPLETION — REVIEW SCREEN
  // ════════════════════════════════════════════════════════════════════════
  if (quizCompleted && showReview) {
    return (
      <div className="dq-root">
        <div className="dq-bg" aria-hidden="true">
          <div className="dq-orb dq-orb-1" /><div className="dq-orb dq-orb-2" />
        </div>
        <div className="dq-review">
          <header className="dq-review-header">
            <h1 className="dq-review-title">📋 Answer Review</h1>
            <button className="dq-review-back" onClick={() => setShowReview(false)}>
              ← Back to summary
            </button>
          </header>
          <div className="dq-review-list">
            {answersList.map((ans, i) => (
              <div key={i} className={`dq-review-card ${ans.isCorrect ? "dq-rc-ok" : "dq-rc-fail"}`}>
                <div className="dq-rc-num">Q{i + 1}</div>
                <p className="dq-rc-q">{ans.question}</p>
                <div className="dq-rc-row">
                  <span className="dq-rc-label">Your answer</span>
                  <span className={`dq-rc-val ${ans.isCorrect ? "dq-rc-green" : "dq-rc-red"}`}>
                    {ans.userAnswer}
                  </span>
                </div>
                {!ans.isCorrect && (
                  <div className="dq-rc-row">
                    <span className="dq-rc-label">Correct answer</span>
                    <span className="dq-rc-val dq-rc-green">{ans.correctAnswer}</span>
                  </div>
                )}
                {ans.explanation && (
                  <p className="dq-rc-exp">{ans.explanation}</p>
                )}
                <div className="dq-rc-xp">
                  {ans.isCorrect ? `+${ans.xpEarned} XP` : "0 XP"}
                </div>
              </div>
            ))}
          </div>
          <div className="dq-review-actions">
            <button className="dq-btn-outline" onClick={() => navigate("/home")}>🏠 Home</button>
            <button className="dq-btn-primary" onClick={() => navigate("/games-dashboard")}>🎮 More Games</button>
          </div>
        </div>
      </div>
    );
  }

  // ════════════════════════════════════════════════════════════════════════
  // COMPLETION — RESULTS SCREEN
  // ════════════════════════════════════════════════════════════════════════
  if (quizCompleted) {
    const pct      = Math.round((correctCount / questions.length) * 100);
    const passed   = pct >= 60;
    const bonusXPFinal = passed ? (xpBonus || 0) : 0;
    const totalXP  = totalXPEarned + bonusXPFinal;
    const emoji    = pct >= 80 ? "🏆" : pct >= 60 ? "💪" : "📖";
    const msg      = pct >= 80 ? "Outstanding work!" : pct >= 60 ? "Good effort — keep it up!" : "More practice needed — you've got this!";

    return (
      <div className="dq-root dq-end">
        <div className="dq-bg" aria-hidden="true">
          <div className="dq-orb dq-orb-1" /><div className="dq-orb dq-orb-2" /><div className="dq-orb dq-orb-3" />
        </div>

        <div className="dq-end-card">
          {/* Decorative top line */}
          <div className="dq-end-topline" />

          <div className="dq-end-emoji">{emoji}</div>
          <h1 className="dq-end-title">Challenge Complete!</h1>
          <p className="dq-end-msg">{msg}</p>

          {/* Score ring */}
          <div className="dq-score-ring-wrap">
            <svg className="dq-score-ring" viewBox="0 0 120 120">
              <circle cx="60" cy="60" r="50" className="dq-ring-bg" />
              <circle
                cx="60" cy="60" r="50"
                className="dq-ring-fill"
                strokeDasharray={`${pct * 3.14} 314`}
                stroke={pct >= 80 ? "#10b981" : pct >= 60 ? "#ffbe0b" : "#ef4444"}
                transform="rotate(-90 60 60)"
              />
            </svg>
            <div className="dq-ring-label">
              <span className="dq-ring-pct">{pct}%</span>
              <span className="dq-ring-sub">Score</span>
            </div>
          </div>

          {/* Stats row */}
          <div className="dq-end-stats">
            {[
              { value: `${correctCount}/${questions.length}`, label: "Correct",  color: "green" },
              { value: `+${totalXP}`,                         label: "Total XP",  color: "gold"  },
              { value: passed ? `${(streak||0)+1}` : "0",     label: "Day Streak",color: "coral" },
            ].map((s) => (
              <div key={s.label} className={`dq-end-stat dq-stat-${s.color}`}>
                <span className="dq-end-stat-val">{s.value}</span>
                <span className="dq-end-stat-lbl">{s.label}</span>
              </div>
            ))}
          </div>

          {/* Streak message */}
          <div className={`dq-streak-msg ${passed ? "dq-streak-pass" : "dq-streak-fail"}`}>
            {passed
              ? `🔥 ${(streak || 0) + 1} day streak! Keep going!`
              : "📚 Score 60%+ to build your streak"}
          </div>

          {/* Bonus XP banner */}
          {passed && bonusXPFinal > 0 && (
            <div className="dq-bonus-banner">
              <span>⚡ Streak bonus</span>
              <span>+{bonusXPFinal} XP</span>
            </div>
          )}

          <div className="dq-end-actions">
            <button className="dq-btn-ghost" onClick={() => setShowReview(true)}>
              📋 Review Answers
            </button>
            <button className="dq-btn-primary" onClick={() => navigate("/home")}>
              🏠 Home
            </button>
            <button className="dq-btn-outline" onClick={() => navigate("/games-dashboard")}>
              🎮 More Games
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ════════════════════════════════════════════════════════════════════════
  // QUIZ SCREEN
  // ════════════════════════════════════════════════════════════════════════
  return (
    <div className={`dq-root ${status ? `dq-root--${status}` : ""}`}>

      {/* ── Ambient orbs ── */}
      <div className="dq-bg" aria-hidden="true">
        <div className="dq-orb dq-orb-1" />
        <div className="dq-orb dq-orb-2" />
        <div className="dq-orb dq-orb-3" />
      </div>

      {/* ── XP Popups ── */}
      {xpPopups.map((p) => (
        <div key={p.id} className={`dq-xp-pop ${p.correct ? "dq-xp-pop--ok" : "dq-xp-pop--fail"}`}>
          {p.correct ? `+${p.xp} XP` : "✗"}
        </div>
      ))}

      {/* ── Top bar ── */}
      <header className="dq-topbar">
        <div className="dq-topbar-left">
          <div className="dq-daily-pill">
            <span>⚡</span>
            <span>Daily Challenge</span>
            {(streak || 0) > 0 && (
              <span className="dq-streak-badge">🔥 {streak}</span>
            )}
          </div>
          {topic && <span className="dq-topic">{topic}</span>}
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

      {/* ── Progress bar ── */}
      <div className="dq-progress-track">
        <div className="dq-progress-fill" style={{ width: `${progress}%` }}>
          <div className="dq-progress-shimmer" />
        </div>
        <div className="dq-progress-head" style={{ left: `calc(${progress}% - 6px)` }} />
      </div>

      {/* ── Main content ── */}
      <main className="dq-main">
        <div
          key={cardKey}
          className={`dq-card ${isAnimatingOut ? "dq-card--out" : "dq-card--in"}`}
        >
          {/* Question label */}
          <div className="dq-q-label">
            <span className="dq-q-dot" />
            Question {index + 1}
            {xpBonus > 0 && (
              <span className="dq-bonus-tag">+{xpBonus} XP streak bonus</span>
            )}
          </div>

          {/* Question text */}
          <p className="dq-question">{question?.question}</p>

          {/* ── Timer ring for short-answer ── */}
          {!question?.options && (
            <div className="dq-timer-wrap">
              <svg className="dq-timer-ring" viewBox="0 0 44 44">
                <circle cx="22" cy="22" r="18" className="dq-timer-bg" />
                <circle
                  cx="22" cy="22" r="18"
                  className="dq-timer-arc"
                  strokeDasharray={`${timerPct * 1.131} 113.1`}
                  transform="rotate(-90 22 22)"
                  style={{ stroke: timeLeft <= 5 ? "#ef4444" : "#2a9d8f" }}
                />
              </svg>
              <span
                className="dq-timer-num"
                style={{ color: timeLeft <= 5 ? "#ef4444" : "inherit" }}
              >
                {timeLeft}
              </span>
            </div>
          )}

          {/* ── MCQ options ── */}
          {question?.options && (
            <div className="dq-options">
              {question.options.map((opt, i) => {
                const state = getOptionState(opt);
                return (
                  <button
                    key={i}
                    className={`dq-option dq-option--${state}`}
                    onClick={() => !showResult && evaluateAnswer(opt)}
                    disabled={showResult}
                  >
                    <span className="dq-opt-letter">{OPTION_LABELS[i]}</span>
                    <span className="dq-opt-text">{opt}</span>
                    {state === "correct" && <span className="dq-opt-check">✓</span>}
                    {state === "wrong"   && <span className="dq-opt-check">✗</span>}
                  </button>
                );
              })}
            </div>
          )}

          {/* ── Short answer input ── */}
          {!question?.options && !showResult && (
            <div className="dq-input-area">
              <div className="dq-input-row">
                <input
                  ref={inputRef}
                  type="text"
                  className="dq-input"
                  value={userAnswer}
                  onChange={(e) => setUserAnswer(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && evaluateAnswer(userAnswer)}
                  placeholder="Type your answer and press Enter…"
                />
                <button className="dq-submit-btn" onClick={() => evaluateAnswer(userAnswer)}>
                  Submit
                </button>
              </div>
            </div>
          )}

          {/* ── Feedback panel ── */}
          {showResult && (
            <div className={`dq-feedback dq-feedback--${status}`}>
              <div className="dq-feedback-icon">
                {status === "correct" ? "✓" : status === "timeout" ? "⏰" : "✗"}
              </div>
              <div className="dq-feedback-body">
                <p className="dq-feedback-headline">
                  {status === "correct"
                    ? "Correct!"
                    : status === "timeout"
                    ? `Time's up — answer: ${question.answer}`
                    : `Answer: ${question.answer}`}
                </p>
                {question.explanation && (
                  <p className="dq-feedback-exp">{question.explanation}</p>
                )}
              </div>
            </div>
          )}
        </div>

        {/* ── Next button ── */}
        {showResult && (
          <button className="dq-next-btn" onClick={handleNext}>
            {isLast ? "See Results" : "Next Question"}
            <span className="dq-next-arrow">→</span>
          </button>
        )}

        {/* ── Progress dots ── */}
        <div className="dq-dots" aria-hidden="true">
          {questions.map((_, i) => {
            const ans = answersList[i];
            const isCur = i === index;
            return (
              <span
                key={i}
                className={`dq-dot ${isCur ? "dq-dot--cur" : ""} ${ans ? (ans.isCorrect ? "dq-dot--ok" : "dq-dot--fail") : ""}`}
              />
            );
          })}
        </div>
      </main>
    </div>
  );
}

export default DailyQuiz;
