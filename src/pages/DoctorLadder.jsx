// src/pages/DoctorLadder.jsx
import React, { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { auth } from "../firebase";
import { getDatabase, ref, get, update } from "firebase/database";
import "./DoctorLadder.css";

// ── All question pools ─────────────────────────────────────────────────────
import pharmacology    from "../data/questions/pharmacology.json";
import antibiotics     from "../data/questions/pharmacology/antibiotics.json";
import pathology       from "../data/questions/pathology.json";
import microbiology    from "../data/questions/microbiology.json";
import immunology      from "../data/questions/immunology.json";
import haematology     from "../data/questions/haematology.json";
import clinChem        from "../data/questions/clinical_chemistry.json";
import physioL1        from "../data/questions/physiology_level1.json";
import physioL2        from "../data/questions/physiology_level2.json";
import antiparasitics  from "../data/questions/pharmacology/antiparasitics.json";

import correctSoundFile from "../sound/correct.wav";
import wrongSoundFile   from "../sound/wrong.wav";

// ── Ladder rungs ────────────────────────────────────────────────────────────
const RUNGS = [
  {
    level:      1,
    title:      "Intern",
    icon:       "🩺",
    color:      "#22c55e",
    timeLimit:  60,
    difficulty: "easy",
    xpPerQ:     5,
    desc:       "Fresh out of med school. Prove you remember the basics.",
    pool:       [...physioL1, ...pharmacology.filter(q => q.difficulty === "easy"),
                 ...pathology.filter(q => q.difficulty === "easy")],
  },
  {
    level:      2,
    title:      "Junior Doctor",
    icon:       "👨‍⚕️",
    color:      "#84cc16",
    timeLimit:  60,
    difficulty: "easy",
    xpPerQ:     8,
    desc:       "First year on the wards. Attendings are watching.",
    pool:       [...physioL2.filter(q => q.difficulty === "easy"),
                 ...microbiology, ...haematology.filter(q => q.difficulty === "easy")],
  },
  {
    level:      3,
    title:      "Senior Doctor",
    icon:       "🔬",
    color:      "#f59e0b",
    timeLimit:  60,
    difficulty: "medium",
    xpPerQ:     12,
    desc:       "You've seen enough to know what you don't know.",
    pool:       [...pharmacology.filter(q => q.difficulty === "medium"),
                 ...pathology.filter(q => q.difficulty === "medium"),
                 ...immunology, ...clinChem],
  },
  {
    level:      4,
    title:      "Specialist",
    icon:       "🧬",
    color:      "#f97316",
    timeLimit:  60,
    difficulty: "medium",
    xpPerQ:     18,
    desc:       "Years of training distilled into clinical instinct.",
    pool:       [...physioL2.filter(q => q.difficulty === "medium"),
                 ...haematology.filter(q => q.difficulty === "medium"),
                 ...antibiotics, ...antiparasitics],
  },
  {
    level:      5,
    title:      "Consultant",
    icon:       "🏥",
    color:      "#6366f1",
    timeLimit:  60,
    difficulty: "hard",
    xpPerQ:     25,
    desc:       "The buck stops with you. Think fast, think right.",
    pool:       [...pharmacology.filter(q => q.difficulty === "hard"),
                 ...pathology.filter(q => q.difficulty === "hard"),
                 ...physioL2.filter(q => q.difficulty === "hard")],
  },
  {
    level:      6,
    title:      "Professor",
    icon:       "🎓",
    color:      "#f43f5e",
    timeLimit:  60,
    difficulty: "hard",
    xpPerQ:     40,
    desc:       "You teach the teachers. Only the elite reach this rung.",
    pool:       [
      ...pharmacology.filter(q => q.difficulty === "hard"),
      ...pathology.filter(q => q.difficulty === "hard"),
      ...physioL2.filter(q => q.difficulty === "hard"),
      ...haematology.filter(q => q.difficulty === "hard"),
      ...clinChem,
    ],
  },
];

// Fallback: if a difficulty filter yields < 5 questions, use all from that topic
RUNGS.forEach(r => {
  if (r.pool.length < 5) {
    r.pool = [...pharmacology, ...pathology, ...physioL2];
  }
  // Shuffle pool
  r.pool = r.pool.sort(() => Math.random() - 0.5);
});

const OPTION_LABELS = ["A", "B", "C", "D"];

// ── Screens: "lobby" | "countdown" | "playing" | "result" | "gameover" | "complete"
export default function DoctorLadder() {
  const navigate = useNavigate();

  const [screen,       setScreen]      = useState("lobby");
  const [rungIndex,    setRungIndex]   = useState(0);
  const [countdown,    setCountdown]   = useState(3);
  const [timeLeft,     setTimeLeft]    = useState(60);
  const [qIndex,       setQIndex]      = useState(0);
  const [answered,     setAnswered]    = useState(0);
  const [correct,      setCorrect]     = useState(0);
  const [totalXP,      setTotalXP]     = useState(0);
  const [feedback,     setFeedback]    = useState(null); // null | "correct" | "wrong"
  const [selected,     setSelected]    = useState(null);
  const [showExp,      setShowExp]     = useState(false);
  const [rungHistory,  setRungHistory] = useState([]); // [{rung, correct, answered, xp}]
  const [highestRung,  setHighestRung] = useState(0);
  const [xpPopups,     setXpPopups]    = useState([]);
  const [dropAnim,     setDropAnim]    = useState(false);
  const [lives,        setLives]       = useState(3);

  const correctSound = useRef(new Audio(correctSoundFile));
  const wrongSound   = useRef(new Audio(wrongSoundFile));
  const timerRef     = useRef(null);
  const inputRef     = useRef(null);

  const [typedAnswer, setTypedAnswer] = useState("");

  const rung     = RUNGS[rungIndex];
  const question = rung?.pool[qIndex % rung.pool.length];

  // ── Load saved high score ──────────────────────────────────────────────
  useEffect(() => {
    const load = async () => {
      const user = auth.currentUser;
      if (!user) return;
      try {
        const db   = getDatabase();
        const snap = await get(ref(db, `users/${user.uid}/doctorLadder`));
        if (snap.exists()) setHighestRung(snap.val().highestRung || 0);
      } catch {}
    };
    load();
  }, []);

  // ── Countdown ─────────────────────────────────────────────────────────
  useEffect(() => {
    if (screen !== "countdown") return;
    if (countdown === 0) { setScreen("playing"); return; }
    const t = setTimeout(() => setCountdown(c => c - 1), 1000);
    return () => clearTimeout(t);
  }, [screen, countdown]);

  // ── Timer ──────────────────────────────────────────────────────────────
  const handleTimeUp = useCallback(() => {
    clearInterval(timerRef.current);
    endRung();
  }, [rungIndex, correct, answered, totalXP]);

  useEffect(() => {
    if (screen !== "playing" || feedback !== null) return;
    timerRef.current = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) { handleTimeUp(); return 0; }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(timerRef.current);
  }, [screen, qIndex, feedback, handleTimeUp]);

  // ── End of a rung ─────────────────────────────────────────────────────
  const endRung = () => {
    clearInterval(timerRef.current);
    setScreen("result");
  };

  // ── Answer ─────────────────────────────────────────────────────────────
  const livesRef = useRef(3); // mirrors lives state, readable in closures

  const handleAnswer = (opt) => {
    if (feedback !== null) return;
    clearInterval(timerRef.current);

    const isCorrect = opt.trim().toLowerCase() === question.answer.trim().toLowerCase();
    setSelected(opt);
    setFeedback(isCorrect ? "correct" : "wrong");
    setAnswered(a => a + 1);

    if (isCorrect) {
      const xp = rung.xpPerQ;
      setCorrect(c => c + 1);
      setTotalXP(t => t + xp);
      correctSound.current.play().catch(() => {});
      const id = Date.now();
      setXpPopups(p => [...p, { id, xp }]);
      setTimeout(() => setXpPopups(p => p.filter(x => x.id !== id)), 1000);
    } else {
      wrongSound.current.play().catch(() => {});
      livesRef.current = livesRef.current - 1;
      setLives(livesRef.current);
    }

    setShowExp(true);

    setTimeout(() => {
      setFeedback(null);
      setSelected(null);
      setTypedAnswer("");
      setShowExp(false);

      if (!isCorrect && livesRef.current <= 0) {
        // No lives left — end rung (drops to previous)
        endRung();
      } else {
        // Still alive — next question
        setQIndex(qi => qi + 1);
        setTimeLeft(t => t);
      }
    }, 1400);
  };

  // ── Rung result: passed or failed ──────────────────────────────────────
  const handleRungResult = (passed) => {
    const record = { rung: rungIndex + 1, title: rung.title, correct, answered, xp: totalXP };

    if (!passed) {
      // Drop back one rung
      const prevRung = Math.max(0, rungIndex - 1);
      setRungHistory(h => [...h, { ...record, result: "dropped" }]);
      setDropAnim(true);
      setTimeout(() => {
        setDropAnim(false);
        if (prevRung === rungIndex) {
          // Already at rung 0 — game over
          setScreen("gameover");
          saveScore(rungIndex);
        } else {
          setRungIndex(prevRung);
          resetForRung();
          setScreen("playing");
        }
      }, 1200);
    } else {
      setRungHistory(h => [...h, { ...record, result: "climbed" }]);
      // Check if highest rung reached
      if (rungIndex + 1 > highestRung) setHighestRung(rungIndex + 1);

      if (rungIndex >= RUNGS.length - 1) {
        // Completed all rungs!
        setScreen("complete");
        saveScore(RUNGS.length);
      } else {
        setRungIndex(ri => ri + 1);
        resetForRung();
        setCountdown(3);
        setScreen("countdown");
      }
    }
  };

  const resetForRung = () => {
    setQIndex(0);
    setAnswered(0);
    setCorrect(0);
    setFeedback(null);
    setSelected(null);
    setShowExp(false);
    setTypedAnswer("");
    setLives(3);
    livesRef.current = 3;
  };

  const resetAll = () => {
    setRungIndex(0);
    setCountdown(3);
    setTotalXP(0);
    setRungHistory([]);
    resetForRung();
  };

  const saveScore = async (reachedRung) => {
    const user = auth.currentUser;
    if (!user) return;
    try {
      const db = getDatabase();
      await update(ref(db, `users/${user.uid}/doctorLadder`), {
        highestRung: Math.max(highestRung, reachedRung),
        lastPlayed:  new Date().toISOString(),
        totalXP:     totalXP,
      });
      await update(ref(db, `users/${user.uid}/stats`), {
        totalXP: totalXP,
      });
    } catch {}
  };

  // ── Timers are consistent per rung ─────────────────────────────────────
  const startRung = () => {
    resetForRung();
    setTimeLeft(rung.timeLimit);
    setCountdown(3);
    setScreen("countdown");
  };

  const timerPct = (timeLeft / (rung?.timeLimit || 60)) * 100;
  const timerColor = timerPct > 50 ? "#22c55e" : timerPct > 25 ? "#f59e0b" : "#ef4444";

  // ══════════════════════════════════════════════════════════
  // SCREEN: LOBBY
  // ══════════════════════════════════════════════════════════
  if (screen === "lobby") {
    return (
      <div className="dl-page">
        <div className="dl-lobby">
          {/* Header */}
          <div className="dl-lobby-header">
            <button className="dl-back" onClick={() => navigate("/games-dashboard")}>← Back</button>
          </div>

          {/* Hero */}
          <div className="dl-lobby-hero">
            <div className="dl-lobby-orb dl-lorb-1" />
            <div className="dl-lobby-orb dl-lorb-2" />
            <div className="dl-lobby-content">
              <div className="dl-lobby-icon">🪜</div>
              <h1 className="dl-lobby-title">The Doctor Ladder</h1>
              <p className="dl-lobby-sub">Climb from Intern to Professor.<br/>Answer as many as you can in 60 seconds per rung.<br/>One wrong answer drops you back a rung.</p>
              {highestRung > 0 && (
                <div className="dl-best-badge">
                  🏆 Your best: {RUNGS[highestRung - 1]?.title || "Intern"}
                </div>
              )}
            </div>
          </div>

          {/* Rungs preview */}
          <div className="dl-rungs-preview">
            {RUNGS.map((r, i) => (
              <div key={r.level} className="dl-rung-row" style={{ "--rc": r.color }}>
                <div className="dl-rung-icon">{r.icon}</div>
                <div className="dl-rung-info">
                  <span className="dl-rung-name">{r.title}</span>
                  <span className="dl-rung-xp">+{r.xpPerQ} XP / question</span>
                </div>
                <div className="dl-rung-diff">{r.difficulty}</div>
              </div>
            ))}
          </div>

          {/* Rules */}
          <div className="dl-rules">
            <div className="dl-rule"><span>⏱</span><span>60 seconds per rung</span></div>
            <div className="dl-rule"><span>✅</span><span>Correct = stay &amp; keep answering</span></div>
            <div className="dl-rule"><span>❌</span><span>Wrong = drop back one rung</span></div>
            <div className="dl-rule"><span>🎓</span><span>Reach Professor to win</span></div>
          </div>

          <button className="dl-start-btn" onClick={startRung}>
            Start Climbing 🪜
          </button>
        </div>
      </div>
    );
  }

  // ══════════════════════════════════════════════════════════
  // SCREEN: COUNTDOWN
  // ══════════════════════════════════════════════════════════
  if (screen === "countdown") {
    return (
      <div className="dl-page dl-countdown-page" style={{ "--rc": rung.color }}>
        <div className="dl-cd-rung-icon">{rung.icon}</div>
        <h2 className="dl-cd-title">{rung.title}</h2>
        <p className="dl-cd-desc">{rung.desc}</p>
        <div className="dl-cd-num">{countdown === 0 ? "GO!" : countdown}</div>
        <p className="dl-cd-hint">+{rung.xpPerQ} XP per correct answer · 60 seconds</p>
      </div>
    );
  }

  // ══════════════════════════════════════════════════════════
  // SCREEN: PLAYING
  // ══════════════════════════════════════════════════════════
  if (screen === "playing") {
    return (
      <div className={`dl-page dl-game ${dropAnim ? "dl-drop" : ""}`} style={{ "--rc": rung.color }}>

        {/* XP popups */}
        {xpPopups.map(p => (
          <div key={p.id} className="dl-xp-pop">+{p.xp} XP</div>
        ))}

        {/* Top bar */}
        <header className="dl-game-header">
          <div className="dl-rung-badge" style={{ background: rung.color }}>
            {rung.icon} {rung.title}
          </div>
          <div className="dl-score-pill">✓ {correct} | ⭐ {totalXP} XP</div>
        </header>

        {/* Timer bar */}
        <div className="dl-timer-track">
          <div className="dl-timer-fill"
            style={{ width: `${timerPct}%`, background: timerColor, transition: "width 1s linear, background 0.5s" }} />
        </div>
        <div className="dl-timer-row">
          <span className="dl-timer-num" style={{ color: timerColor }}>{timeLeft}s</span>
          <span className="dl-q-count">Q{answered + 1}</span>
        </div>

        {/* Question card */}
        <main className="dl-game-main">
          <div className={`dl-qcard ${feedback ? `dl-qcard-${feedback}` : ""}`}>

            {/* Rung indicator dots */}
            <div className="dl-rungs-strip">
              {RUNGS.map((r, i) => (
                <div key={r.level}
                  className={`dl-strip-dot ${i < rungIndex ? "dl-dot-done" : i === rungIndex ? "dl-dot-current" : "dl-dot-future"}`}
                  style={{ "--rc": r.color }} title={r.title}>
                  {i === rungIndex ? r.icon : i < rungIndex ? "✓" : "·"}
                </div>
              ))}
            </div>

            <p className="dl-question">{question?.question}</p>

            {question?.options && (
              <div className="dl-options">
                {question.options.map((opt, i) => {
                  let cls = "dl-opt";
                  if (feedback) {
                    if (opt === question.answer) cls += " dl-opt-correct";
                    else if (opt === selected)   cls += " dl-opt-wrong";
                    else                         cls += " dl-opt-dim";
                  }
                  return (
                    <button key={i} className={cls}
                      onClick={() => handleAnswer(opt)} disabled={!!feedback}>
                      <span className="dl-opt-letter">{OPTION_LABELS[i]}</span>
                      <span className="dl-opt-text">{opt}</span>
                      {feedback && opt === question.answer && <span className="dl-opt-tick">✓</span>}
                      {feedback && opt === selected && opt !== question.answer && <span className="dl-opt-tick">✗</span>}
                    </button>
                  );
                })}
              </div>
            )}

            {/* ── Short answer input ── */}
            {!question?.options && (
              <div className="dl-saq-wrap">
                <div className="dl-saq-row">
                  <input
                    ref={inputRef}
                    type="text"
                    className={`dl-saq-input ${feedback === "correct" ? "dl-saq-correct" : feedback === "wrong" ? "dl-saq-wrong" : ""}`}
                    value={typedAnswer}
                    onChange={e => !feedback && setTypedAnswer(e.target.value)}
                    onKeyDown={e => e.key === "Enter" && !feedback && typedAnswer.trim() && handleAnswer(typedAnswer.trim())}
                    placeholder="Type your answer and press Enter…"
                    disabled={!!feedback}
                    autoFocus
                  />
                  {!feedback && (
                    <button
                      className="dl-saq-btn"
                      onClick={() => typedAnswer.trim() && handleAnswer(typedAnswer.trim())}
                      disabled={!typedAnswer.trim()}
                    >
                      Submit
                    </button>
                  )}
                </div>
                {feedback && (
                  <div className="dl-saq-answer">
                    {feedback === "correct"
                      ? <span className="dl-saq-ok">✓ Correct!</span>
                      : <span className="dl-saq-fail">✗ Answer: <strong>{question.answer}</strong></span>
                    }
                  </div>
                )}
              </div>
            )}

            {showExp && question?.explanation && (
              <div className={`dl-exp dl-exp-${feedback}`}>
                {feedback === "correct" ? "✓ Correct! " : "✗ "}
                {question.explanation}
              </div>
            )}
          </div>
        </main>
      </div>
    );
  }

  // ══════════════════════════════════════════════════════════
  // SCREEN: RUNG RESULT
  // ══════════════════════════════════════════════════════════
  if (screen === "result") {
    const pct    = answered > 0 ? Math.round((correct / answered) * 100) : 0;
    const passed = correct > 0; // at least 1 correct = climbs
    const nextR  = RUNGS[rungIndex + 1];
    const prevR  = RUNGS[Math.max(0, rungIndex - 1)];

    return (
      <div className="dl-page dl-result-page" style={{ "--rc": rung.color }}>
        <div className="dl-result-card">
          <div className="dl-result-icon">{passed ? "🎉" : "📉"}</div>

          <div className="dl-result-rung">
            <span style={{ color: rung.color }}>{rung.icon} {rung.title}</span>
          </div>

          <h2 className="dl-result-title">
            {passed
              ? rungIndex >= RUNGS.length - 1 ? "Legendary!" : `${nextR?.title} unlocked!`
              : rungIndex === 0 ? "Game Over" : `Dropped to ${prevR?.title}`}
          </h2>

          <div className="dl-result-stats">
            <div className="dl-rs"><span>{correct}/{answered}</span><small>Correct</small></div>
            <div className="dl-rs"><span>{pct}%</span><small>Accuracy</small></div>
            <div className="dl-rs"><span>+{correct * rung.xpPerQ}</span><small>XP</small></div>
          </div>

          {passed && nextR && (
            <div className="dl-next-rung-preview" style={{ "--rc": nextR.color }}>
              <span>Next: {nextR.icon} {nextR.title}</span>
              <span>+{nextR.xpPerQ} XP/Q</span>
            </div>
          )}

          {!passed && rungIndex > 0 && (
            <div className="dl-drop-banner">
              ⬇ Dropping to {prevR?.icon} {prevR?.title}
            </div>
          )}

          <div className="dl-result-actions">
            {passed && rungIndex < RUNGS.length - 1 && (
              <button className="dl-btn-climb" onClick={() => handleRungResult(true)}
                style={{ background: nextR?.color }}>
                Climb to {nextR?.title} {nextR?.icon}
              </button>
            )}
            {!passed && rungIndex > 0 && (
              <button className="dl-btn-drop" onClick={() => handleRungResult(false)}>
                ⬇ Drop to {prevR?.title}
              </button>
            )}
            {(!passed && rungIndex === 0) && (
              <button className="dl-btn-drop" onClick={() => { saveScore(0); setScreen("gameover"); }}>
                See Results
              </button>
            )}
            {passed && rungIndex >= RUNGS.length - 1 && (
              <button className="dl-btn-climb" onClick={() => { setScreen("complete"); saveScore(RUNGS.length); }}
                style={{ background: rung.color }}>
                Claim your title! 🎓
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // ══════════════════════════════════════════════════════════
  // SCREEN: GAME OVER
  // ══════════════════════════════════════════════════════════
  if (screen === "gameover") {
    return (
      <div className="dl-page dl-over-page">
        <div className="dl-over-card">
          <div className="dl-over-icon">💔</div>
          <h2 className="dl-over-title">Back to the drawing board</h2>
          <p className="dl-over-msg">You fell off the first rung. Every expert was once a beginner.</p>
          <div className="dl-over-xp">You earned <strong>{totalXP} XP</strong> this session</div>

          <div className="dl-history">
            {rungHistory.map((r, i) => (
              <div key={i} className={`dl-hist-row ${r.result === "climbed" ? "dl-hr-ok" : "dl-hr-fail"}`}>
                <span>{RUNGS[r.rung - 1]?.icon} {r.title}</span>
                <span>{r.correct}/{r.answered} correct</span>
                <span>{r.result === "climbed" ? "✓ Climbed" : "✗ Dropped"}</span>
              </div>
            ))}
          </div>

          <div className="dl-over-actions">
            <button className="dl-btn-retry" onClick={() => { resetAll(); setScreen("lobby"); }}>Try Again 🪜</button>
            <button className="dl-btn-home" onClick={() => navigate("/home")}>Home</button>
          </div>
        </div>
      </div>
    );
  }

  // ══════════════════════════════════════════════════════════
  // SCREEN: COMPLETE — reached Professor!
  // ══════════════════════════════════════════════════════════
  if (screen === "complete") {
    return (
      <div className="dl-page dl-complete-page">
        <Confetti />
        <div className="dl-complete-card">
          <div className="dl-complete-icon">🎓</div>
          <h1 className="dl-complete-title">Professor!</h1>
          <p className="dl-complete-msg">You climbed every rung of the Doctor Ladder.<br/>That's elite-level performance.</p>
          <div className="dl-complete-xp">⭐ {totalXP} XP earned</div>

          <div className="dl-history">
            {RUNGS.map((r, i) => (
              <div key={i} className="dl-hist-row dl-hr-ok">
                <span>{r.icon} {r.title}</span>
                <span style={{ color: r.color }}>✓ Cleared</span>
              </div>
            ))}
          </div>

          <div className="dl-over-actions">
            <button className="dl-btn-retry" onClick={() => { resetAll(); setScreen("lobby"); }}>Play Again 🪜</button>
            <button className="dl-btn-home"  onClick={() => navigate("/home")}>Home 🏠</button>
          </div>
        </div>
      </div>
    );
  }

  return null;
}

function Confetti() {
  const pieces = Array.from({ length: 36 }, (_, i) => ({
    id: i,
    color: ["#f43f5e","#f59e0b","#22c55e","#6366f1","#0d9488","#fff"][i % 6],
    left:  `${(i * 19 + 5) % 100}%`,
    delay: `${(i * 0.12) % 2}s`,
    dur:   `${2 + (i % 5) * 0.35}s`,
    size:  `${6 + (i % 4) * 3}px`,
  }));
  return (
    <div className="dl-confetti" aria-hidden="true">
      {pieces.map(p => (
        <div key={p.id} className="dl-confetti-piece"
          style={{ left:p.left, background:p.color, width:p.size, height:p.size,
                   animationDelay:p.delay, animationDuration:p.dur }} />
      ))}
    </div>
  );
}