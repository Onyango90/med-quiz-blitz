// src/pages/WhoAmI.jsx
// "Who Am I?" — a condition/drug/organism speaks in first person.
// Tap to reveal clues one at a time (5 total). Guess early for max XP.

import React, { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import WHO_AM_I from "../data/whoAmIData";
import "./WhoAmI.css";

// ── XP by clue number when answered correctly ─────────────────────────────────
const XP_TABLE = { 1: 20, 2: 14, 3: 9, 4: 5, 5: 2 };

// ── Category colours ──────────────────────────────────────────────────────────
const CAT_STYLE = {
  Disease:      { bg: "rgba(239,68,68,0.12)",    color: "#f87171",  label: "🩺 Disease"      },
  Drug:         { bg: "rgba(251,191,36,0.12)",   color: "#fbbf24",  label: "💊 Drug"          },
  Anatomy:      { bg: "rgba(99,102,241,0.12)",   color: "#a5b4fc",  label: "🦴 Anatomy"       },
  Microorganism:{ bg: "rgba(16,185,129,0.12)",   color: "#6ee7b7",  label: "🦠 Microorganism" },
  Physiology:   { bg: "rgba(99,102,241,0.12)",   color: "#a5b4fc",  label: "⚡ Physiology"    },
};

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function normalise(s) {
  return (s || "").toLowerCase().replace(/[^a-z0-9]/g, "").trim();
}

export default function WhoAmI() {
  const navigate = useNavigate();

  const [pool]          = useState(() => shuffle(WHO_AM_I));
  const [caseIdx,        setCaseIdx]        = useState(0);
  const [cluesShown,     setCluesShown]     = useState(1);
  const [phase,          setPhase]          = useState("clue"); // clue | type | options | result
  const [typedAnswer,    setTypedAnswer]    = useState("");
  const [selectedOption, setSelectedOption] = useState(null);
  const [isCorrect,      setIsCorrect]      = useState(null);
  const [totalXP,        setTotalXP]        = useState(0);
  const [streak,         setStreak]         = useState(0);
  const [bestStreak,     setBestStreak]     = useState(0);
  const [sessionScore,   setSessionScore]   = useState({ correct: 0, total: 0 });
  const [history,        setHistory]        = useState([]);
  const [xpPopups,       setXpPopups]       = useState([]);
  const [cardKey,        setCardKey]        = useState(0);
  const [showSummary,    setShowSummary]    = useState(false);

  const inputRef = useRef(null);
  const current  = pool[caseIdx] || pool[0];
  const isLast   = caseIdx >= pool.length - 1;
  const catStyle = CAT_STYLE[current?.category] || CAT_STYLE.Disease;

  useEffect(() => {
    if (phase === "type" && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [phase]);

  const popXP = useCallback((xp) => {
    const id = Date.now() + Math.random();
    setXpPopups((p) => [...p, { id, xp }]);
    setTimeout(() => setXpPopups((p) => p.filter((x) => x.id !== id)), 1400);
  }, []);

  const resolveAnswer = (answer) => {
    const correct = normalise(answer) === normalise(current.answer) ||
      normalise(current.answer).includes(normalise(answer)) ||
      normalise(answer).includes(normalise(current.answer.split(" ")[0]));

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
        answer:   current.answer,
        category: current.category,
        correct,
        xpEarned: xp,
        cluesUsed: cluesShown,
      },
    ]);
  };

  const nextCase = () => {
    if (isLast) { setShowSummary(true); return; }
    setCardKey((k) => k + 1);
    setCaseIdx((i) => i + 1);
    setCluesShown(1);
    setPhase("clue");
    setTypedAnswer("");
    setSelectedOption(null);
    setIsCorrect(null);
  };

  const replay = () => {
    setCaseIdx(0); setCluesShown(1); setPhase("clue");
    setTypedAnswer(""); setSelectedOption(null); setIsCorrect(null);
    setTotalXP(0); setSessionScore({ correct: 0, total: 0 });
    setStreak(0); setBestStreak(0); setHistory([]);
    setShowSummary(false); setCardKey((k) => k + 1);
  };

  // ── SUMMARY SCREEN ─────────────────────────────────────────────────────────
  if (showSummary) {
    const pct   = Math.round((sessionScore.correct / sessionScore.total) * 100);
    const emoji = pct >= 80 ? "🧠" : pct >= 60 ? "💪" : "📖";
    const msg   = pct >= 80 ? "You think like a clinician!" : pct >= 60 ? "Good — keep studying!" : "More revision needed!";

    return (
      <div className="wai-root wai-summary-root">
        <div className="wai-bg"><div className="wai-orb wai-orb-1"/><div className="wai-orb wai-orb-2"/></div>

        <div className="wai-summary-card">
          <div className="wai-summary-topline" />
          <div className="wai-summary-emoji">{emoji}</div>
          <h1 className="wai-summary-title">Session Complete!</h1>
          <p className="wai-summary-msg">{msg}</p>

          {/* Ring */}
          <div className="wai-ring-wrap">
            <svg className="wai-ring" viewBox="0 0 120 120">
              <circle cx="60" cy="60" r="50" className="wai-ring-bg" />
              <circle cx="60" cy="60" r="50" className="wai-ring-fill"
                strokeDasharray={`${pct * 3.14} 314`}
                stroke={pct >= 80 ? "#10b981" : pct >= 60 ? "#ffbe0b" : "#ef4444"}
                transform="rotate(-90 60 60)" />
            </svg>
            <div className="wai-ring-label">
              <span className="wai-ring-pct">{pct}%</span>
              <span className="wai-ring-sub">Score</span>
            </div>
          </div>

          <div className="wai-summary-stats">
            {[
              { val: `${sessionScore.correct}/${sessionScore.total}`, lbl: "Correct",     color: "#10b981" },
              { val: `+${totalXP}`,                                    lbl: "XP Earned",   color: "#ffbe0b" },
              { val: bestStreak,                                        lbl: "Best Streak", color: "#f97316" },
            ].map((s) => (
              <div key={s.lbl} className="wai-sum-stat">
                <span className="wai-ss-val" style={{ color: s.color }}>{s.val}</span>
                <span className="wai-ss-lbl">{s.lbl}</span>
              </div>
            ))}
          </div>

          {/* History */}
          <div className="wai-history">
            {history.map((h, i) => (
              <div key={i} className={`wai-hist-row ${h.correct ? "wai-hist-ok" : "wai-hist-fail"}`}>
                <span className="wai-hist-icon">{h.correct ? "✓" : "✗"}</span>
                <span className="wai-hist-ans">{h.answer}</span>
                <span className="wai-hist-cat" style={{ color: CAT_STYLE[h.category]?.color }}>{h.category}</span>
                <span className="wai-hist-clue">{h.cluesUsed} clue{h.cluesUsed > 1 ? "s" : ""}</span>
                <span className="wai-hist-xp">{h.correct ? `+${h.xpEarned} XP` : "0 XP"}</span>
              </div>
            ))}
          </div>

          <div className="wai-summary-actions">
            <button className="wai-btn-ghost"   onClick={() => navigate("/games-dashboard")}>← Games</button>
            <button className="wai-btn-primary" onClick={replay}>Play Again</button>
            <button className="wai-btn-outline" onClick={() => navigate("/home")}>🏠 Home</button>
          </div>
        </div>
      </div>
    );
  }

  // ── MAIN GAME SCREEN ───────────────────────────────────────────────────────
  const progress = (caseIdx / pool.length) * 100;
  const clueXP   = XP_TABLE[cluesShown] || 1;
  const allCluesShown = cluesShown >= 5;

  return (
    <div className={`wai-root ${phase === "result" ? (isCorrect ? "wai-root--correct" : "wai-root--wrong") : ""}`}>

      {/* Orbs */}
      <div className="wai-bg" aria-hidden="true">
        <div className="wai-orb wai-orb-1" />
        <div className="wai-orb wai-orb-2" />
        <div className="wai-orb wai-orb-3" />
      </div>

      {/* XP pops */}
      {xpPopups.map((p) => (
        <div key={p.id} className="wai-xp-pop">+{p.xp} XP</div>
      ))}

      {/* Top bar */}
      <header className="wai-topbar">
        <div className="wai-topbar-left">
          <button className="wai-back-btn" onClick={() => navigate("/games-dashboard")}>←</button>
          <div className="wai-mode-pill">🧠 Who Am I?</div>
        </div>

        <div className="wai-counter">
          <span className="wai-counter-cur">{caseIdx + 1}</span>
          <span className="wai-counter-sep">/</span>
          <span className="wai-counter-tot">{pool.length}</span>
        </div>

        <div className="wai-topbar-right">
          {streak >= 2 && <div className="wai-streak-pill">🔥 {streak}</div>}
          <div className="wai-xp-pill">⭐ {totalXP}</div>
        </div>
      </header>

      {/* Progress bar */}
      <div className="wai-progress-track">
        <div className="wai-progress-fill" style={{ width: `${progress}%` }}>
          <div className="wai-progress-shimmer" />
        </div>
      </div>

      {/* Main */}
      <main className="wai-main">
        <div key={cardKey} className="wai-card wai-card--in">

          {/* Header row */}
          <div className="wai-card-header">
            <div className="wai-card-label">
              <span className="wai-card-dot" />
              <span>Case {caseIdx + 1}</span>
            </div>
            <div className="wai-cat-badge" style={{ background: catStyle.bg, color: catStyle.color }}>
              {catStyle.label}
            </div>
          </div>

          {/* XP strip */}
          <div className="wai-xp-strip">
            {[1,2,3,4,5].map((n) => (
              <div
                key={n}
                className={`wai-xp-node ${n === cluesShown && phase !== "result" ? "wai-xp-active" : ""} ${n < cluesShown ? "wai-xp-used" : ""} ${n > cluesShown ? "wai-xp-locked" : ""}`}
              >
                <span className="wai-xp-clue-n">{n}</span>
                <span className="wai-xp-val">+{XP_TABLE[n]}</span>
              </div>
            ))}
          </div>

          {/* Speech bubble intro */}
          <div className="wai-speech-intro">
            <div className="wai-speech-avatar">🧬</div>
            <div className="wai-speech-bubble">
              <span className="wai-speech-tag">I am speaking…</span>
              <p className="wai-speech-hint">Listen carefully. Guess with fewer clues for more XP.</p>
            </div>
          </div>

          {/* Clue cards */}
          <div className="wai-clues">
            {[0,1,2,3,4].map((i) => (
              <div
                key={i}
                className={`wai-clue ${i < cluesShown ? "wai-clue--on" : "wai-clue--off"} ${i === cluesShown - 1 && i < cluesShown ? "wai-clue--latest" : ""}`}
              >
                <div className="wai-clue-num">Clue {i + 1}</div>
                {i < cluesShown
                  ? <p className="wai-clue-text">"{current.clues[i]}"</p>
                  : <div className="wai-clue-lock">🔒 Not yet revealed</div>
                }
              </div>
            ))}
          </div>

          {/* ── Actions: clue phase ── */}
          {phase === "clue" && (
            <div className="wai-actions">
              {!allCluesShown && (
                <button className="wai-reveal-btn" onClick={() => setCluesShown((n) => n + 1)}>
                  <span>Reveal Clue {cluesShown + 1}</span>
                  <span className="wai-reveal-cost">−{clueXP - (XP_TABLE[cluesShown + 1] || 1)} XP</span>
                </button>
              )}
              <button className="wai-answer-btn" onClick={() => setPhase("type")}>
                I know who I am →
              </button>
            </div>
          )}

          {/* ── Actions: type phase ── */}
          {phase === "type" && (
            <div className="wai-type-area">
              <p className="wai-type-label">Who am I?</p>
              <div className="wai-type-row">
                <input
                  ref={inputRef}
                  type="text"
                  className="wai-type-input"
                  value={typedAnswer}
                  onChange={(e) => setTypedAnswer(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && typedAnswer.trim() && resolveAnswer(typedAnswer)}
                  placeholder="Type your answer…"
                  autoComplete="off"
                  spellCheck={false}
                />
                <button
                  className="wai-submit-btn"
                  onClick={() => typedAnswer.trim() && resolveAnswer(typedAnswer)}
                >
                  →
                </button>
              </div>
              <button className="wai-hint-btn" onClick={() => setPhase("options")}>
                Show options instead
              </button>
            </div>
          )}

          {/* ── Actions: options phase ── */}
          {phase === "options" && (
            <div className="wai-options-area">
              <p className="wai-type-label">Pick the correct answer:</p>
              <div className="wai-options">
                {shuffle(current.options).map((opt, i) => (
                  <button
                    key={i}
                    className="wai-option"
                    onClick={() => { setSelectedOption(opt); resolveAnswer(opt); }}
                  >
                    <span className="wai-opt-letter">{["A","B","C","D"][i]}</span>
                    <span className="wai-opt-text">{opt}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* ── Result panel ── */}
          {phase === "result" && (
            <div className={`wai-result wai-result--${isCorrect ? "correct" : "wrong"}`}>
              <div className="wai-result-icon">{isCorrect ? "✓" : "✗"}</div>
              <div className="wai-result-body">
                <p className="wai-result-headline">
                  {isCorrect
                    ? `I am ${current.answer}! +${XP_TABLE[cluesShown] || 1} XP`
                    : `I am ${current.answer}`}
                </p>
                <p className="wai-result-exp">{current.explanation}</p>
              </div>
            </div>
          )}
        </div>

        {/* Next button */}
        {phase === "result" && (
          <button className="wai-next-btn" onClick={nextCase}>
            {isLast ? "See Results" : "Next Case"}
            <span className="wai-next-arrow">→</span>
          </button>
        )}

        {/* Progress dots */}
        <div className="wai-dots">
          {pool.map((_, i) => {
            const h = history[i];
            return (
              <span
                key={i}
                className={`wai-dot ${i === caseIdx ? "wai-dot--cur" : ""} ${h ? (h.correct ? "wai-dot--ok" : "wai-dot--fail") : ""}`}
              />
            );
          })}
        </div>
      </main>
    </div>
  );
}