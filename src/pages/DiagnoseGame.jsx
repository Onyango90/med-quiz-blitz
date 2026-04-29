// src/pages/DiagnoseGame.jsx
// "Diagnose in 3 Clues" — reveal clues one at a time, guess early for more XP.

import React, { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import CASES from "../data/diagnoseIn3Clues";
import "./DiagnoseGame.css";

// ── XP per clue used ──────────────────────────────────────────────────────────
const XP_TABLE = { 1: 15, 2: 8, 3: 3 }; // clues revealed when answered correctly

// ── Shuffle array ─────────────────────────────────────────────────────────────
function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// ── Normalise text for loose comparison ──────────────────────────────────────
function normalise(str) {
  return str.toLowerCase().replace(/[^a-z0-9]/g, "").trim();
}

export default function DiagnoseGame() {
  const navigate   = useNavigate();
  const location   = useLocation();
  const subject    = location.state?.subject || null; // optional filter

  // ── Question pool ──────────────────────────────────────────────────────────
  const [pool] = useState(() => {
    const filtered = subject
      ? CASES.filter((c) => c.subject === subject)
      : CASES;
    return shuffle(filtered);
  });

  // ── Game state ─────────────────────────────────────────────────────────────
  const [caseIdx,       setCaseIdx]       = useState(0);
  const [cluesShown,    setCluesShown]    = useState(1);   // 1, 2, or 3
  const [phase,         setPhase]         = useState("clue"); // clue | type | options | result
  const [typedAnswer,   setTypedAnswer]   = useState("");
  const [isCorrect,     setIsCorrect]     = useState(null);
  const [totalXP,       setTotalXP]       = useState(0);
  const [sessionScore,  setSessionScore]  = useState({ correct: 0, total: 0 });
  const [xpPopups,      setXpPopups]      = useState([]);
  const [cardKey,       setCardKey]       = useState(0);
  const [streak,        setStreak]        = useState(0);
  const [bestStreak,    setBestStreak]    = useState(0);
  const [history,       setHistory]       = useState([]); // { diagnosis, correct, xpEarned, cluesUsed }
  const [showSummary,   setShowSummary]   = useState(false);

  const inputRef = useRef(null);
  const current  = pool[caseIdx] || pool[0];
  const isLast   = caseIdx >= pool.length - 1;

  // ── Auto-focus input ───────────────────────────────────────────────────────
  useEffect(() => {
    if (phase === "type" && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [phase]);

  // ── XP popup helper ────────────────────────────────────────────────────────
  const popXP = useCallback((xp) => {
    const id = Date.now() + Math.random();
    setXpPopups((p) => [...p, { id, xp }]);
    setTimeout(() => setXpPopups((p) => p.filter((x) => x.id !== id)), 1400);
  }, []);

  // ── Reveal next clue ───────────────────────────────────────────────────────
  const revealClue = () => {
    if (cluesShown < 3) setCluesShown((n) => n + 1);
  };

  // ── Start answering ────────────────────────────────────────────────────────
  const startAnswer = () => {
    setTypedAnswer("");
    setPhase("type");
  };

  // ── Submit typed answer ────────────────────────────────────────────────────
  const submitTyped = () => {
    if (!typedAnswer.trim()) return;
    const correct = normalise(typedAnswer) === normalise(current.diagnosis);
    resolveAnswer(correct);
  };

  // ── Show MCQ options (if stuck) ────────────────────────────────────────────
  const showOptions = () => {
    setPhase("options");
  };

  // ── MCQ option selected ────────────────────────────────────────────────────
  const selectOption = (opt) => {
    const correct = normalise(opt) === normalise(current.diagnosis);
    resolveAnswer(correct);
  };

  // ── Resolve answer (shared) ────────────────────────────────────────────────
  const resolveAnswer = (correct) => {
    const xp = correct ? (XP_TABLE[cluesShown] || 1) : 0;

    setIsCorrect(correct);
    setPhase("result");

    if (correct) {
      setTotalXP((v) => v + xp);
      setStreak((s) => {
        const ns = s + 1;
        setBestStreak((b) => Math.max(b, ns));
        return ns;
      });
      if (xp > 0) popXP(xp);
    } else {
      setStreak(0);
    }

    setSessionScore((s) => ({
      correct: s.correct + (correct ? 1 : 0),
      total:   s.total + 1,
    }));

    setHistory((h) => [
      ...h,
      {
        diagnosis: current.diagnosis,
        subject:   current.subject,
        correct,
        xpEarned:  xp,
        cluesUsed: cluesShown,
      },
    ]);
  };

  // ── Next case ──────────────────────────────────────────────────────────────
  const nextCase = () => {
    if (isLast) {
      setShowSummary(true);
      return;
    }
    setCardKey((k) => k + 1);
    setCaseIdx((i) => i + 1);
    setCluesShown(1);
    setPhase("clue");
    setTypedAnswer("");
    setIsCorrect(null);
  };

  // ── Replay ─────────────────────────────────────────────────────────────────
  const replay = () => {
    setCaseIdx(0); setCluesShown(1); setPhase("clue");
    setTypedAnswer(""); setIsCorrect(null);
    setTotalXP(0); setSessionScore({ correct: 0, total: 0 });
    setStreak(0); setBestStreak(0); setHistory([]);
    setShowSummary(false); setCardKey((k) => k + 1);
  };

  // ─────────────────────────────────────────────────────────────────────────
  // SUMMARY SCREEN
  // ─────────────────────────────────────────────────────────────────────────
  if (showSummary) {
    const accuracy = Math.round((sessionScore.correct / sessionScore.total) * 100);
    const emoji    = accuracy >= 80 ? "🏆" : accuracy >= 60 ? "💪" : "📖";

    return (
      <div className="dg-root dg-summary-root">
        <div className="dg-bg" aria-hidden="true">
          <div className="dg-orb dg-orb-1" /><div className="dg-orb dg-orb-2" />
        </div>

        <div className="dg-summary-card">
          <div className="dg-summary-topline" />
          <div className="dg-summary-emoji">{emoji}</div>
          <h1 className="dg-summary-title">Session Complete!</h1>

          {/* Ring */}
          <div className="dg-ring-wrap">
            <svg className="dg-ring" viewBox="0 0 120 120">
              <circle cx="60" cy="60" r="50" className="dg-ring-bg" />
              <circle cx="60" cy="60" r="50" className="dg-ring-fill"
                strokeDasharray={`${accuracy * 3.14} 314`}
                stroke={accuracy >= 80 ? "#10b981" : accuracy >= 60 ? "#ffbe0b" : "#ef4444"}
                transform="rotate(-90 60 60)" />
            </svg>
            <div className="dg-ring-label">
              <span className="dg-ring-pct">{accuracy}%</span>
              <span className="dg-ring-sub">Accuracy</span>
            </div>
          </div>

          {/* Stats */}
          <div className="dg-summary-stats">
            {[
              { val: `${sessionScore.correct}/${sessionScore.total}`, label: "Correct", color: "green" },
              { val: `+${totalXP}`,                                    label: "XP Earned", color: "gold"  },
              { val: bestStreak,                                        label: "Best Streak", color: "coral" },
            ].map((s) => (
              <div key={s.label} className={`dg-summary-stat dg-stat-${s.color}`}>
                <span className="dg-ss-val">{s.val}</span>
                <span className="dg-ss-lbl">{s.label}</span>
              </div>
            ))}
          </div>

          {/* History */}
          <div className="dg-history">
            {history.map((h, i) => (
              <div key={i} className={`dg-hist-row ${h.correct ? "dg-hist-ok" : "dg-hist-fail"}`}>
                <span className="dg-hist-icon">{h.correct ? "✓" : "✗"}</span>
                <span className="dg-hist-diag">{h.diagnosis}</span>
                <span className="dg-hist-clues">{h.cluesUsed} clue{h.cluesUsed > 1 ? "s" : ""}</span>
                <span className="dg-hist-xp">{h.correct ? `+${h.xpEarned} XP` : "0 XP"}</span>
              </div>
            ))}
          </div>

          <div className="dg-summary-actions">
            <button className="dg-btn-ghost"  onClick={() => navigate("/games-dashboard")}>← Games</button>
            <button className="dg-btn-primary" onClick={replay}>Play Again</button>
            <button className="dg-btn-outline" onClick={() => navigate("/home")}>🏠 Home</button>
          </div>
        </div>
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────────────────────
  // MAIN GAME SCREEN
  // ─────────────────────────────────────────────────────────────────────────
  const progress = (caseIdx / pool.length) * 100;

  return (
    <div className={`dg-root ${phase === "result" ? (isCorrect ? "dg-root--correct" : "dg-root--wrong") : ""}`}>

      {/* Ambient orbs */}
      <div className="dg-bg" aria-hidden="true">
        <div className="dg-orb dg-orb-1" />
        <div className="dg-orb dg-orb-2" />
        <div className="dg-orb dg-orb-3" />
      </div>

      {/* XP popups */}
      {xpPopups.map((p) => (
        <div key={p.id} className="dg-xp-pop">+{p.xp} XP</div>
      ))}

      {/* Top bar */}
      <header className="dg-topbar">
        <div className="dg-topbar-left">
          <button className="dg-back-btn" onClick={() => navigate("/games-dashboard")}>←</button>
          <div className="dg-mode-pill">🔬 Diagnose in 3</div>
        </div>

        <div className="dg-counter">
          <span className="dg-counter-cur">{caseIdx + 1}</span>
          <span className="dg-counter-sep">/</span>
          <span className="dg-counter-tot">{pool.length}</span>
        </div>

        <div className="dg-topbar-right">
          {streak >= 2 && (
            <div className="dg-streak-pill">🔥 {streak}</div>
          )}
          <div className="dg-xp-pill">⭐ {totalXP}</div>
        </div>
      </header>

      {/* Progress bar */}
      <div className="dg-progress-track">
        <div className="dg-progress-fill" style={{ width: `${progress}%` }}>
          <div className="dg-progress-shimmer" />
        </div>
      </div>

      {/* Main */}
      <main className="dg-main">
        <div key={cardKey} className="dg-card dg-card--in">

          {/* Card top label */}
          <div className="dg-card-label">
            <span className="dg-card-dot" />
            <span>Case {caseIdx + 1}</span>
            <span className="dg-subject-tag">{current.subject}</span>
            <span className="dg-diff-tag dg-diff-{current.difficulty}">{current.difficulty}</span>
          </div>

          {/* XP preview strip */}
          <div className="dg-xp-preview">
            {[1, 2, 3].map((n) => (
              <div key={n} className={`dg-xp-step ${n <= cluesShown ? "dg-xp-step--used" : ""} ${n === cluesShown && phase !== "result" ? "dg-xp-step--current" : ""}`}>
                <span className="dg-xp-step-clue">{n} clue{n > 1 ? "s" : ""}</span>
                <span className="dg-xp-step-val">+{XP_TABLE[n]} XP</span>
              </div>
            ))}
          </div>

          {/* Clues */}
          <div className="dg-clues">
            {[1, 2, 3].map((n) => (
              <div
                key={n}
                className={`dg-clue ${n <= cluesShown ? "dg-clue--visible" : "dg-clue--hidden"} ${n === cluesShown && n <= cluesShown ? "dg-clue--latest" : ""}`}
              >
                <div className="dg-clue-num">Clue {n}</div>
                {n <= cluesShown ? (
                  <p className="dg-clue-text">{current.clues[n - 1]}</p>
                ) : (
                  <div className="dg-clue-locked">🔒 Locked</div>
                )}
              </div>
            ))}
          </div>

          {/* ── PHASE: clue — action buttons ── */}
          {phase === "clue" && (
            <div className="dg-actions">
              {cluesShown < 3 && (
                <button className="dg-reveal-btn" onClick={revealClue}>
                  Reveal Clue {cluesShown + 1}
                  <span className="dg-reveal-cost">–{XP_TABLE[cluesShown] - XP_TABLE[cluesShown + 1]} XP</span>
                </button>
              )}
              <button className="dg-answer-btn" onClick={startAnswer}>
                I know the diagnosis →
              </button>
            </div>
          )}

          {/* ── PHASE: type — text input ── */}
          {phase === "type" && (
            <div className="dg-type-area">
              <p className="dg-type-label">What is the diagnosis?</p>
              <div className="dg-type-row">
                <input
                  ref={inputRef}
                  type="text"
                  className="dg-type-input"
                  value={typedAnswer}
                  onChange={(e) => setTypedAnswer(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && submitTyped()}
                  placeholder="Type your diagnosis…"
                  autoComplete="off"
                  spellCheck={false}
                />
                <button className="dg-submit-btn" onClick={submitTyped}>Submit</button>
              </div>
              <button className="dg-hint-btn" onClick={showOptions}>
                Show options instead
              </button>
            </div>
          )}

          {/* ── PHASE: options — MCQ fallback ── */}
          {phase === "options" && (
            <div className="dg-options-area">
              <p className="dg-type-label">Pick the correct diagnosis:</p>
              <div className="dg-options">
                {shuffle(current.options).map((opt, i) => (
                  <button key={i} className="dg-option" onClick={() => selectOption(opt)}>
                    <span className="dg-option-letter">{["A","B","C","D"][i]}</span>
                    <span className="dg-option-text">{opt}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* ── PHASE: result ── */}
          {phase === "result" && (
            <div className={`dg-result dg-result--${isCorrect ? "correct" : "wrong"}`}>
              <div className="dg-result-icon">{isCorrect ? "✓" : "✗"}</div>
              <div className="dg-result-body">
                <p className="dg-result-headline">
                  {isCorrect
                    ? `Correct! ${XP_TABLE[cluesShown] > 1 ? `+${XP_TABLE[cluesShown]} XP` : "+1 XP"}`
                    : `The answer was: ${current.diagnosis}`}
                </p>
                <p className="dg-result-explanation">{current.explanation}</p>
              </div>
            </div>
          )}
        </div>

        {/* Next button */}
        {phase === "result" && (
          <button className="dg-next-btn" onClick={nextCase}>
            {isLast ? "See Results" : "Next Case"}
            <span className="dg-next-arrow">→</span>
          </button>
        )}

        {/* Dot trail */}
        <div className="dg-dots" aria-hidden="true">
          {pool.map((_, i) => {
            const h = history[i];
            return (
              <span
                key={i}
                className={`dg-dot ${i === caseIdx ? "dg-dot--cur" : ""} ${h ? (h.correct ? "dg-dot--ok" : "dg-dot--fail") : ""}`}
              />
            );
          })}
        </div>
      </main>
    </div>
  );
}