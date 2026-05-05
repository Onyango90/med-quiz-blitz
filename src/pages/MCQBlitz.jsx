// src/pages/MCQBlitz.jsx — MCQ Blitz game mode
import React, { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useStats } from "../hooks/useStats";
import { getFirestore, doc, getDoc, updateDoc, increment } from "firebase/firestore";
import "./MCQBlitz.css";

// ── Import all MCQ banks ───────────────────────────────────────────────────────
import pharmacology      from "../data/questions/pharmacology.json";
import pathology         from "../data/questions/pathology.json";
import haematology       from "../data/questions/haematology.json";
import physiologyL1      from "../data/questions/physiology_level1.json";
import physiologyL2      from "../data/questions/physiology_level2.json";
import physiology        from "../data/questions/physiology.json";
import immunology        from "../data/questions/immunology.json";
import microbiology      from "../data/questions/microbiology.json";
import clinicalChemistry from "../data/questions/clinical_chemistry.json";
import grossAnatomy      from "../data/questions/gross_anatomy.json";
import histology         from "../data/questions/histology.json";
import embryology        from "../data/questions/embryology.json";
import antibiotics       from "../data/questions/pharmacology/antibiotics.json";
import antiparasitics    from "../data/questions/pharmacology/antiparasitics.json";
import antifungals       from "../data/questions/pharmacology/antifungals.json";
import disinfectants     from "../data/questions/pharmacology/disinfectants.json";

// ── Normalise both question formats ──────────────────────────────────────────
function norm(q, subject) {
  if (!q) return null;
  // Format A: { question, options, answer }
  if (q.question && q.answer && q.options?.length) {
    return { ...q, subject: q.subject || subject, type: "mcq" };
  }
  // Format B: { text, options, correctAnswer (index) }
  if (q.text && q.options && typeof q.correctAnswer === "number") {
    return {
      id: q.id, type: "mcq",
      question: q.text, options: q.options,
      answer: q.options[q.correctAnswer],
      explanation: q.explanation || "",
      difficulty: q.difficulty || "medium",
      subject, year: q.year,
    };
  }
  return null;
}

// ── Full MCQ pool by subject ──────────────────────────────────────────────────
const SUBJECT_POOLS = {
  "Pharmacology":       [...pharmacology, ...antibiotics, ...antifungals, ...disinfectants, ...antiparasitics].map(q => norm(q, "Pharmacology")).filter(Boolean),
  "Pathology":          pathology.map(q => norm(q, "Pathology")).filter(Boolean),
  "Haematology":        haematology.map(q => norm(q, "Haematology")).filter(Boolean),
  "Physiology":         [...physiologyL1, ...physiologyL2, ...physiology].map(q => norm(q, "Physiology")).filter(Boolean),
  "Immunology":         immunology.map(q => norm(q, "Immunology")).filter(Boolean),
  "Microbiology":       microbiology.map(q => norm(q, "Microbiology")).filter(Boolean),
  "Clinical Chemistry": clinicalChemistry.map(q => norm(q, "Clinical Chemistry")).filter(Boolean),
  "Anatomy":            [...grossAnatomy, ...histology, ...embryology].map(q => norm(q, "Anatomy")).filter(Boolean),
};

// Year → which subjects to draw from
const YEAR_SUBJECTS = {
  1: ["Anatomy", "Physiology"],
  2: ["Anatomy", "Physiology", "Pharmacology", "Microbiology"],
  3: ["Pharmacology", "Pathology", "Microbiology", "Haematology"],
  4: ["Pharmacology", "Pathology", "Haematology", "Immunology", "Clinical Chemistry"],
  5: ["Pharmacology", "Pathology", "Haematology", "Immunology", "Clinical Chemistry"],
  6: ["Pharmacology", "Pathology", "Haematology", "Immunology", "Clinical Chemistry"],
};

function seededShuffle(arr, seed) {
  const a = [...arr];
  let s = seed;
  for (let i = a.length - 1; i > 0; i--) {
    s = (s * 1664525 + 1013904223) & 0xffffffff;
    const j = Math.abs(s) % (i + 1);
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function buildQuestionPool(year = 1, count = 20) {
  const subjects = YEAR_SUBJECTS[Math.min(Math.max(year, 1), 6)] || YEAR_SUBJECTS[1];
  const seed     = Date.now();
  let pool = [];
  subjects.forEach(s => { pool = pool.concat(SUBJECT_POOLS[s] || []); });
  // Fallback: add all subjects if pool too small
  if (pool.length < count) {
    Object.values(SUBJECT_POOLS).forEach(p => { pool = pool.concat(p); });
  }
  const seen = new Set();
  return seededShuffle(pool, seed)
    .filter(q => { if (seen.has(q.id)) return false; seen.add(q.id); return true; })
    .slice(0, count);
}

// ── Game constants ────────────────────────────────────────────────────────────
const TOTAL_QUESTIONS = 20;
const TIME_PER_Q      = 15;   // seconds
const MAX_LIVES       = 3;

const STREAK_MULTIPLIER = { 3: 1.5, 5: 2.0, 10: 3.0 };

function getMultiplier(streak) {
  if (streak >= 10) return 3.0;
  if (streak >= 5)  return 2.0;
  if (streak >= 3)  return 1.5;
  return 1.0;
}

// ── Phases ────────────────────────────────────────────────────────────────────
const PHASE = { LOBBY: "lobby", PLAYING: "playing", RESULT: "result" };

export default function MCQBlitz() {
  const navigate          = useNavigate();
  const { currentUser }   = useAuth();
  const { processAnswer } = useStats();

  // ── Setup ──
  const [phase,     setPhase]     = useState(PHASE.LOBBY);
  const [userYear,  setUserYear]  = useState(1);
  const [questions, setQuestions] = useState([]);
  const [loading,   setLoading]   = useState(true);

  // ── In-game ──
  const [qIndex,    setQIndex]    = useState(0);
  const [lives,     setLives]     = useState(MAX_LIVES);
  const [score,     setScore]     = useState(0);   // correct count
  const [totalXP,   setTotalXP]   = useState(0);
  const [streak,    setStreak]    = useState(0);
  const [maxStreak, setMaxStreak] = useState(0);
  const [timeLeft,  setTimeLeft]  = useState(TIME_PER_Q);
  const [selected,  setSelected]  = useState(null);  // chosen option text
  const [feedback,  setFeedback]  = useState(null);  // "correct"|"wrong"|"timeout"
  const [xpPopup,   setXpPopup]   = useState(null);
  const [results,   setResults]   = useState([]);    // per-question log

  // ── Refs ──
  const timerRef       = useRef(null);
  const answerLocked   = useRef(false);
  const timeLeftRef    = useRef(TIME_PER_Q);
  const qIndexRef      = useRef(0);
  const livesRef       = useRef(MAX_LIVES);
  const streakRef      = useRef(0);
  const scoreRef       = useRef(0);
  const totalXPRef     = useRef(0);
  const questionsRef   = useRef([]);
  const resultsRef     = useRef([]);

  // ── Load year + questions ─────────────────────────────────────────────────
  useEffect(() => {
    async function load() {
      let year = 1;
      if (currentUser) {
        try {
          const db   = getFirestore();
          const snap = await getDoc(doc(db, "users", currentUser.uid));
          year = parseInt(snap.data()?.profile?.year || "1") || 1;
        } catch {}
      }
      setUserYear(year);
      const qs = buildQuestionPool(year, TOTAL_QUESTIONS);
      setQuestions(qs);
      questionsRef.current = qs;
      setLoading(false);
    }
    load();
  }, [currentUser]);

  // ── End question (correct/wrong/timeout) ─────────────────────────────────
  const endQuestion = useCallback((chosenAnswer) => {
    if (answerLocked.current) return;
    answerLocked.current = true;
    clearInterval(timerRef.current);

    const q         = questionsRef.current[qIndexRef.current];
    const timedOut  = chosenAnswer === null;
    const isCorrect = !timedOut && chosenAnswer === q.answer;
    const fb        = timedOut ? "timeout" : isCorrect ? "correct" : "wrong";

    setFeedback(fb);
    setSelected(chosenAnswer);

    let newStreak = isCorrect ? streakRef.current + 1 : 0;
    let xpEarned  = 0;

    if (isCorrect) {
      const mult = getMultiplier(newStreak);
      xpEarned   = Math.round(10 * mult);
      scoreRef.current  += 1;
      totalXPRef.current += xpEarned;
      setScore(scoreRef.current);
      setTotalXP(totalXPRef.current);
      setXpPopup({ xp: xpEarned, mult });
      setTimeout(() => setXpPopup(null), 900);
      processAnswer({ subject: q.subject }, true, TIME_PER_Q - timeLeftRef.current, "mcq_blitz");
    } else {
      newStreak = 0;
      livesRef.current -= 1;
      setLives(livesRef.current);
      processAnswer({ subject: q.subject }, false, TIME_PER_Q - timeLeftRef.current, "mcq_blitz");
    }

    streakRef.current = newStreak;
    setStreak(newStreak);
    setMaxStreak(prev => Math.max(prev, newStreak));

    resultsRef.current = [...resultsRef.current, {
      question: q.question,
      subject:  q.subject,
      chosen:   chosenAnswer,
      correct:  q.answer,
      isCorrect,
      timedOut,
      xp: xpEarned,
    }];
    setResults([...resultsRef.current]);

    // Advance after brief delay
    setTimeout(() => {
      const noLives   = livesRef.current <= 0;
      const lastQ     = qIndexRef.current + 1 >= questionsRef.current.length;

      if (noLives || lastQ) {
        // Save XP
        if (currentUser) {
          try {
            const db = getFirestore();
            updateDoc(doc(db, "users", currentUser.uid), {
              "stats.totalXP":    increment(totalXPRef.current),
              "stats.totalGames": increment(1),
            });
          } catch {}
        }
        setPhase(PHASE.RESULT);
      } else {
        qIndexRef.current += 1;
        setQIndex(qIndexRef.current);
        setSelected(null);
        setFeedback(null);
        answerLocked.current = false;
        startTimer();
      }
    }, isCorrect ? 600 : 900);
  }, [currentUser, processAnswer]);

  // ── Timer ─────────────────────────────────────────────────────────────────
  const startTimer = useCallback(() => {
    clearInterval(timerRef.current);
    timeLeftRef.current = TIME_PER_Q;
    setTimeLeft(TIME_PER_Q);
    timerRef.current = setInterval(() => {
      timeLeftRef.current -= 1;
      setTimeLeft(timeLeftRef.current);
      if (timeLeftRef.current <= 0) {
        clearInterval(timerRef.current);
        endQuestion(null); // timeout
      }
    }, 1000);
  }, [endQuestion]);

  // ── Start game ────────────────────────────────────────────────────────────
  const startGame = useCallback(() => {
    // Reset all refs
    qIndexRef.current   = 0;
    livesRef.current    = MAX_LIVES;
    streakRef.current   = 0;
    scoreRef.current    = 0;
    totalXPRef.current  = 0;
    resultsRef.current  = [];
    answerLocked.current = false;
    // Reset state
    setQIndex(0); setLives(MAX_LIVES); setStreak(0);
    setMaxStreak(0); setScore(0); setTotalXP(0);
    setSelected(null); setFeedback(null); setResults([]);
    setPhase(PHASE.PLAYING);
  }, []);

  // Start timer when game starts
  useEffect(() => {
    if (phase === PHASE.PLAYING) startTimer();
    return () => clearInterval(timerRef.current);
  }, [phase]);

  // ── Render ────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="mb-loading">
        <div className="mb-spinner" />
        <p>Loading question blitz…</p>
      </div>
    );
  }

  const question   = questions[qIndex];
  const timerPct   = (timeLeft / TIME_PER_Q) * 100;
  const timerColor = timeLeft > 8 ? "#818cf8" : timeLeft > 4 ? "#d97706" : "#ef4444";
  const multiplier = getMultiplier(streak);
  const accuracy   = results.length > 0
    ? Math.round((results.filter(r => r.isCorrect).length / results.length) * 100)
    : 0;

  // ── LOBBY ─────────────────────────────────────────────────────────────────
  if (phase === PHASE.LOBBY) {
    return (
      <div className="mb-page">
        <div className="mb-inner">
          <button className="mb-back-btn" onClick={() => navigate("/games-dashboard")}>← Back</button>

          <div className="mb-lobby-hero">
            <div className="mb-orb mb-orb-1" /><div className="mb-orb mb-orb-2" />
            <div className="mb-lobby-content">
              <span className="mb-lobby-icon">🎯</span>
              <h1 className="mb-lobby-title">MCQ Blitz</h1>
              <p className="mb-lobby-sub">
                20 questions. 15 seconds each. No second chances.
                Build a streak to multiply your XP — but 3 wrong answers ends the run.
              </p>
              <div className="mb-lobby-stats">
                <div className="mb-ls"><span className="mb-ls-val">20</span><span className="mb-ls-lbl">Questions</span></div>
                <div className="mb-ls"><span className="mb-ls-val">15s</span><span className="mb-ls-lbl">Per question</span></div>
                <div className="mb-ls"><span className="mb-ls-val">3×</span><span className="mb-ls-lbl">Max XP multiplier</span></div>
                <div className="mb-ls"><span className="mb-ls-val">{MAX_LIVES}</span><span className="mb-ls-lbl">Lives</span></div>
              </div>
            </div>
          </div>

          {/* Multiplier guide */}
          <div className="mb-mult-card">
            <p className="mb-mult-title">🔥 Streak Multipliers</p>
            <div className="mb-mult-rows">
              {[
                { streak: "1–2 correct", mult: "1×",  xp: "+10 XP",  cls: "" },
                { streak: "3+ correct",  mult: "1.5×", xp: "+15 XP", cls: "mb-mult--amber" },
                { streak: "5+ correct",  mult: "2×",   xp: "+20 XP", cls: "mb-mult--indigo" },
                { streak: "10+ correct", mult: "3×",   xp: "+30 XP", cls: "mb-mult--coral" },
              ].map(m => (
                <div key={m.streak} className={`mb-mult-row ${m.cls}`}>
                  <span className="mb-mult-streak">{m.streak}</span>
                  <span className="mb-mult-val">{m.mult}</span>
                  <span className="mb-mult-xp">{m.xp}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="mb-rules-card">
            <p className="mb-rules-title">Rules</p>
            <div className="mb-rule"><span>⏱️</span><span>15 seconds per question — time runs out = wrong answer</span></div>
            <div className="mb-rule"><span>💀</span><span>3 wrong answers and the game ends early</span></div>
            <div className="mb-rule"><span>🔥</span><span>Keep your streak alive to multiply your XP</span></div>
            <div className="mb-rule"><span>🎓</span><span>Questions tailored to Year {userYear} curriculum</span></div>
          </div>

          <button className="mb-start-btn" onClick={startGame}>🎯 Start Blitz</button>
        </div>
      </div>
    );
  }

  // ── RESULT ────────────────────────────────────────────────────────────────
  if (phase === PHASE.RESULT) {
    const outOfLives = lives <= 0 && qIndex < TOTAL_QUESTIONS - 1;
    const perfect    = score === questions.length;
    return (
      <div className="mb-page">
        <div className="mb-inner">

          <div className="mb-result-hero">
            <div className="mb-orb mb-orb-1" /><div className="mb-orb mb-orb-2" />
            <div className="mb-result-inner">
              <span className="mb-result-icon">
                {perfect ? "🏆" : score >= 15 ? "⭐" : score >= 10 ? "💪" : outOfLives ? "💀" : "🎯"}
              </span>
              <h2 className="mb-result-title">
                {perfect ? "Perfect!" : outOfLives ? "Out of lives!" : "Blitz complete!"}
              </h2>
              <p className="mb-result-sub">
                {score} / {results.length} correct · {accuracy}% accuracy
              </p>
              <div className="mb-result-stats">
                <div className="mb-rs"><span className="mb-rs-val">{totalXP}</span><span className="mb-rs-lbl">XP earned</span></div>
                <div className="mb-rs"><span className="mb-rs-val">{maxStreak}</span><span className="mb-rs-lbl">Best streak</span></div>
                <div className="mb-rs"><span className="mb-rs-val">{accuracy}%</span><span className="mb-rs-lbl">Accuracy</span></div>
                <div className="mb-rs"><span className="mb-rs-val">{MAX_LIVES - lives}</span><span className="mb-rs-lbl">Lives lost</span></div>
              </div>
            </div>
          </div>

          {/* Per-question recap */}
          <div className="mb-recap-card">
            <p className="mb-recap-title">Question recap</p>
            <div className="mb-recap-list">
              {results.map((r, i) => (
                <div key={i} className={`mb-recap-row ${r.isCorrect ? "mb-recap--correct" : "mb-recap--wrong"}`}>
                  <span className="mb-recap-num">{i + 1}</span>
                  <div className="mb-recap-body">
                    <span className="mb-recap-q">{r.question.length > 60 ? r.question.slice(0, 60) + "…" : r.question}</span>
                    <span className="mb-recap-sub">
                      {r.timedOut ? "⏱️ Timed out" : r.isCorrect ? `✅ Correct · +${r.xp} XP` : `❌ Wrong · ${r.correct.length > 40 ? r.correct.slice(0,40)+"…" : r.correct}`}
                    </span>
                  </div>
                  <span className={`mb-recap-tag mb-recap-tag--${r.subject?.toLowerCase().replace(/\s/g,"-")}`}>{r.subject}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="mb-result-btns">
            <button className="mb-retry-btn" onClick={startGame}>Play Again</button>
            <button className="mb-home-btn" onClick={() => navigate("/games-dashboard")}>Back to Games</button>
          </div>
        </div>
      </div>
    );
  }

  // ── PLAYING ───────────────────────────────────────────────────────────────
  if (!question) return null;

  return (
    <div className="mb-page">
      <div className="mb-inner">

        {/* Top bar */}
        <div className="mb-topbar">
          <button className="mb-topbar-x" onClick={() => { clearInterval(timerRef.current); navigate("/games-dashboard"); }}>✕</button>

          {/* Progress bar */}
          <div className="mb-progress-track">
            <div className="mb-progress-fill" style={{ width: `${((qIndex) / TOTAL_QUESTIONS) * 100}%` }} />
          </div>

          <div className="mb-topbar-right">
            {/* Lives */}
            <div className="mb-lives">
              {Array.from({ length: MAX_LIVES }).map((_, i) => (
                <span key={i} className={`mb-heart ${i < lives ? "mb-heart--full" : "mb-heart--lost"}`}>❤️</span>
              ))}
            </div>
          </div>
        </div>

        {/* Meta row */}
        <div className="mb-meta-row">
          <span className="mb-q-counter">{qIndex + 1} <span className="mb-q-total">/ {TOTAL_QUESTIONS}</span></span>
          {streak >= 3 && (
            <span className="mb-streak-badge">🔥 {streak} streak · {multiplier}×</span>
          )}
          <span className="mb-xp-counter">⭐ {totalXP} XP</span>
        </div>

        {/* Timer bar */}
        <div className="mb-timer-wrap">
          <div className="mb-timer-track">
            <div
              className="mb-timer-fill"
              style={{
                width: `${timerPct}%`,
                background: timerColor,
                transition: "width 0.95s linear, background 0.3s",
              }}
            />
          </div>
          <span className="mb-timer-num" style={{ color: timerColor }}>{timeLeft}s</span>
        </div>

        {/* XP popup */}
        {xpPopup && (
          <div className="mb-xp-popup">
            +{xpPopup.xp} XP{xpPopup.mult > 1 ? ` (${xpPopup.mult}×)` : ""}
          </div>
        )}

        {/* Question card */}
        <div className={`mb-question-card ${feedback ? `mb-question--${feedback}` : ""}`}>
          <div className="mb-q-subject">{question.subject}</div>
          <p className="mb-q-text">{question.question}</p>

          <div className="mb-options">
            {question.options.map((opt, i) => {
              let cls = "mb-option";
              if (feedback) {
                if (opt === question.answer)       cls += " mb-option--correct";
                else if (opt === selected)         cls += " mb-option--wrong";
                else                              cls += " mb-option--dim";
              }
              return (
                <button
                  key={i}
                  className={cls}
                  onClick={() => endQuestion(opt)}
                  disabled={!!feedback}
                >
                  <span className="mb-opt-letter">{String.fromCharCode(65 + i)}</span>
                  <span className="mb-opt-text">{opt}</span>
                </button>
              );
            })}
          </div>

          {/* Feedback overlay */}
          {feedback && (
            <div className={`mb-feedback-banner mb-feedback--${feedback}`}>
              {feedback === "correct"
                ? `✅ Correct! +${results[results.length - 1]?.xp || 10} XP${multiplier > 1 ? ` (${multiplier}×)` : ""}`
                : feedback === "timeout"
                ? `⏱️ Time's up! Answer: ${question.answer.length > 50 ? question.answer.slice(0,50)+"…" : question.answer}`
                : `❌ Wrong! Answer: ${question.answer.length > 50 ? question.answer.slice(0,50)+"…" : question.answer}`
              }
            </div>
          )}
        </div>

      </div>
    </div>
  );
}