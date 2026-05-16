// src/pages/PharmaRoulette.jsx
import React, { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useStats } from "../hooks/useStats";
import { getFirestore, doc, getDoc } from "firebase/firestore";
import { ArrowLeft, Zap, Clock, CheckCircle, XCircle, RotateCcw, Trophy, Flame } from "lucide-react";
import { ALL_ROULETTE_DRUGS, WHEEL_SEGMENTS } from "../data/pharmaRouletteData";
import correctSoundFile from "../sound/correct.wav";
import wrongSoundFile   from "../sound/wrong.wav";
import "./PharmaRoulette.css";

const TIME_PER_QUESTION  = 20;
const TIME_BONUS_CORRECT = 15;
const STREAK_THRESHOLD   = 10;
const HARD_CATEGORIES    = ["cns"];

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function pickRandomDrug(excludeId = null, streak = 0) {
  let pool = [...ALL_ROULETTE_DRUGS];
  if (streak < STREAK_THRESHOLD) {
    pool = pool.filter(d => !HARD_CATEGORIES.includes(d.category) || d.difficulty !== "hard");
  }
  if (excludeId) pool = pool.filter(d => d.name !== excludeId);
  return pool[Math.floor(Math.random() * pool.length)];
}

// ── Wheel SVG component ───────────────────────────────────────────────────────
function SpinWheel({ spinning, targetSegment, onSpinEnd }) {
  const canvasRef = useRef(null);
  const rotRef    = useRef(0);
  const rafRef    = useRef(null);
  const segments  = WHEEL_SEGMENTS;
  const segAngle  = (2 * Math.PI) / segments.length;

  const draw = useCallback((rotation) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const cx  = canvas.width  / 2;
    const cy  = canvas.height / 2;
    const r   = cx - 8;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    segments.forEach((seg, i) => {
      const start = i * segAngle + rotation;
      const end   = start + segAngle;

      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.arc(cx, cy, r, start, end);
      ctx.closePath();
      ctx.fillStyle = seg.colour;
      ctx.fill();
      ctx.strokeStyle = "#0f172a";
      ctx.lineWidth = 2;
      ctx.stroke();

      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(start + segAngle / 2);
      ctx.textAlign = "right";
      ctx.fillStyle = "#ffffff";
      ctx.font      = "bold 11px DM Sans, sans-serif";
      ctx.shadowColor = "rgba(0,0,0,0.5)";
      ctx.shadowBlur  = 4;
      ctx.fillText(seg.icon + " " + seg.label, r - 10, 4);
      ctx.restore();
    });

    // Centre circle
    ctx.beginPath();
    ctx.arc(cx, cy, 22, 0, 2 * Math.PI);
    ctx.fillStyle = "#0f172a";
    ctx.fill();
    ctx.strokeStyle = "#334155";
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.fillStyle = "#fff";
    ctx.font = "bold 13px DM Sans, sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("Rx", cx, cy);
  }, [segments, segAngle]);

  useEffect(() => {
    draw(rotRef.current);
  }, [draw]);

  useEffect(() => {
    if (!spinning) return;

    const targetIdx = segments.findIndex(s => s.key === targetSegment?.key);

    // ── THE FIX ──────────────────────────────────────────────────────────────
    // The pointer (▼) sits at the TOP of the wheel = -Math.PI / 2 (270°).
    // We want the CENTRE of the target segment to align under the pointer.
    // Segment i starts at: i * segAngle (from canvas default 0 = right / 3 o'clock).
    // Centre of segment i is at: i * segAngle + segAngle / 2.
    // To bring that centre to the top (-π/2), the wheel rotation needed is:
    //   rotation = -Math.PI / 2 - (targetIdx * segAngle + segAngle / 2)
    // We normalise this into a positive value with modulo so the animation
    // always spins forward (clockwise).
    const segCentreAngle = targetIdx * segAngle + segAngle / 2;
    const rawTarget      = -Math.PI / 2 - segCentreAngle;

    // Normalise to [0, 2π) so we always spin in the positive (clockwise) direction
    const normalised = ((rawTarget % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI);

    // Add several full clockwise spins for dramatic effect
    const fullSpins  = (4 + Math.floor(Math.random() * 3)) * 2 * Math.PI;
    const finalAngle = fullSpins + normalised - (((rotRef.current % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI));

    const duration  = 3200;
    const startTime = performance.now();
    const startRot  = rotRef.current;

    const animate = (now) => {
      const elapsed  = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // Quartic ease-out — fast start, smooth stop
      const ease     = 1 - Math.pow(1 - progress, 4);
      rotRef.current = startRot + finalAngle * ease;
      draw(rotRef.current);
      if (progress < 1) {
        rafRef.current = requestAnimationFrame(animate);
      } else {
        rotRef.current = startRot + finalAngle;
        draw(rotRef.current);
        onSpinEnd?.();
      }
    };
    rafRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(rafRef.current);
  }, [spinning, targetSegment, draw, segAngle, segments, onSpinEnd]);

  return (
    <div className="pr-wheel-wrap">
      {/* Pointer at the top — ▼ points INTO the wheel */}
      <div className="pr-pointer">▼</div>
      <canvas ref={canvasRef} width={280} height={280} className="pr-canvas" />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
export default function PharmaRoulette() {
  const navigate        = useNavigate();
  const { currentUser } = useAuth();
  const { processAnswer } = useStats();

  const [phase,        setPhase]        = useState("idle");
  const [currentDrug,  setCurrentDrug]  = useState(null);
  const [qIdx,         setQIdx]         = useState(0);
  const [timeLeft,     setTimeLeft]     = useState(TIME_PER_QUESTION);
  const [totalTime,    setTotalTime]    = useState(60);
  const [streak,       setStreak]       = useState(0);
  const [score,        setScore]        = useState(0);
  const [xpEarned,     setXpEarned]     = useState(0);
  const [drugsPlayed,  setDrugsPlayed]  = useState([]);
  const [selected,     setSelected]     = useState(null);
  const [spinning,     setSpinning]     = useState(false);
  const [targetSeg,    setTargetSeg]    = useState(null);
  const [userYear,     setUserYear]     = useState(6);
  const [results,      setResults]      = useState([]);

  const timerRef     = useRef(null);
  const globalRef    = useRef(null);
  const correctSound = useRef(new Audio(correctSoundFile));
  const wrongSound   = useRef(new Audio(wrongSoundFile));

  useEffect(() => {
    if (!currentUser) return;
    getDoc(doc(getFirestore(), "users", currentUser.uid))
      .then(snap => {
        if (snap.exists()) setUserYear(parseInt(snap.data()?.profile?.year) || 6);
      }).catch(() => {});
  }, [currentUser]);

  // Global timer
  useEffect(() => {
    if (phase !== "question") return;
    globalRef.current = setInterval(() => {
      setTotalTime(t => {
        if (t <= 1) { clearInterval(globalRef.current); setPhase("gameover"); return 0; }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(globalRef.current);
  }, [phase]);

  // Per-question timer
  useEffect(() => {
    if (phase !== "question") { clearInterval(timerRef.current); return; }
    setTimeLeft(TIME_PER_QUESTION);
    timerRef.current = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) { clearInterval(timerRef.current); handleTimeout(); return 0; }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(timerRef.current);
  }, [phase, qIdx, currentDrug]); // eslint-disable-line

  const spinWheel = useCallback(() => {
    const drug = pickRandomDrug(currentDrug?.name, streak);
    // Match the wheel segment to the drug's category
    const seg  = WHEEL_SEGMENTS.find(s => s.key === drug.category) || WHEEL_SEGMENTS[0];
    setCurrentDrug(drug);
    setTargetSeg(seg);
    setQIdx(0);
    setSelected(null);
    setSpinning(true);
    setPhase("spinning");
  }, [currentDrug, streak]);

  const handleSpinEnd = useCallback(() => {
    setSpinning(false);
    setPhase("reveal");
  }, []);

  const startQuestion = () => {
    setPhase("question");
    setSelected(null);
  };

  const handleAnswer = (optionIdx) => {
    if (selected !== null || !currentDrug) return;
    clearInterval(timerRef.current);
    setSelected(optionIdx);

    const q         = currentDrug.questions[qIdx];
    const isCorrect = optionIdx === q.correct;
    const xp        = isCorrect ? 10 + Math.floor(streak / 3) * 5 : 0;

    if (isCorrect) {
      correctSound.current.play().catch(() => {});
      setStreak(s => s + 1);
      setScore(s => s + 100 + streak * 10);
      setXpEarned(x => x + xp);
      setTotalTime(t => Math.min(t + TIME_BONUS_CORRECT, 120));
      setPhase("correct");
    } else {
      wrongSound.current.play().catch(() => {});
      setStreak(0);
      setPhase("wrong");
    }

    setResults(r => [...r, {
      drug:     currentDrug.name,
      category: currentDrug.categoryLabel,
      type:     q.type,
      question: q.q,
      correct:  isCorrect,
      xp,
    }]);

    processAnswer(
      { subject: "Pharmacology", difficulty: currentDrug.difficulty, xpValue: xp },
      isCorrect, 0, "pharma-roulette"
    );

    setTimeout(() => advanceAfterAnswer(isCorrect), 1800);
  };

  const handleTimeout = () => {
    clearInterval(timerRef.current);
    wrongSound.current.play().catch(() => {});
    setStreak(0);
    setPhase("wrong");
    setResults(r => [...r, {
      drug:     currentDrug?.name || "",
      category: currentDrug?.categoryLabel || "",
      type:     currentDrug?.questions[qIdx]?.type || "",
      question: currentDrug?.questions[qIdx]?.q || "",
      correct:  false,
      xp:       0,
    }]);
    setTimeout(() => advanceAfterAnswer(false), 1800);
  };

  const advanceAfterAnswer = (wasCorrect) => {
    if (!currentDrug) return;
    const nextQ = qIdx + 1;
    if (nextQ >= currentDrug.questions.length || !wasCorrect) {
      setDrugsPlayed(d => [...d, currentDrug.name]);
      setPhase("idle");
    } else {
      setQIdx(nextQ);
      setSelected(null);
      setPhase("question");
    }
  };

  const startGame = () => {
    setPhase("idle");
    setScore(0);
    setStreak(0);
    setXpEarned(0);
    setTotalTime(60);
    setDrugsPlayed([]);
    setResults([]);
    setCurrentDrug(null);
    spinWheel();
  };

  const q         = currentDrug?.questions[qIdx];
  const timerPct  = (timeLeft / TIME_PER_QUESTION) * 100;
  const globalPct = (totalTime / 120) * 100;

  return (
    <div className="pr-page">

      <header className="pr-topbar">
        <button className="pr-back" onClick={() => navigate("/games-dashboard")}>
          <ArrowLeft size={16} />
        </button>
        <div className="pr-topbar-brand">
          <span>Pharmacology Roulette</span>
        </div>
        {(phase === "question" || phase === "correct" || phase === "wrong") && (
          <div className="pr-topbar-stats">
            <span className="pr-streak"><Flame size={13} />{streak}</span>
            <span className="pr-score"><Zap size={13} />{score}</span>
          </div>
        )}
      </header>

      {/* IDLE / START */}
      {phase === "idle" && !currentDrug && (
        <div className="pr-start">
          <div className="pr-start-icon">Rx</div>
          <h1 className="pr-start-title">Pharmacology<br />Roulette</h1>
          <p className="pr-start-desc">
            Spin the wheel. Get a drug. Answer 5 questions before the clock runs out.
            Every correct answer adds time. Wrong answer — the wheel spins again.
          </p>
          <div className="pr-start-rules">
            <div className="pr-rule"><Zap size={14} />+15s per correct answer</div>
            <div className="pr-rule"><Flame size={14} />Streak x10 = bonus XP</div>
            <div className="pr-rule"><Clock size={14} />Global timer — don't run out</div>
          </div>
          <button className="pr-btn-spin" onClick={startGame}>
            Spin the Wheel
          </button>
        </div>
      )}

      {/* WHEEL */}
      {(phase === "spinning" || phase === "reveal" || phase === "idle") && currentDrug && (
        <div className="pr-wheel-screen">
          <div className="pr-global-timer">
            <div className="pr-global-fill" style={{
              width: `${globalPct}%`,
              background: totalTime <= 15 ? "#ef4444" : totalTime <= 30 ? "#f59e0b" : "#0D7B65"
            }} />
          </div>
          <div className="pr-global-label">
            <Clock size={12} />{totalTime}s remaining
            {streak >= STREAK_THRESHOLD && <span className="pr-hard-badge">Hard drugs unlocked!</span>}
          </div>

          <SpinWheel
            spinning={spinning}
            targetSegment={targetSeg}
            onSpinEnd={handleSpinEnd}
          />

          {phase === "reveal" && currentDrug && (
            <div className="pr-reveal" style={{ "--col": currentDrug.categoryColour, "--glow": currentDrug.categoryGlow }}>
              <div className="pr-reveal-badge">{currentDrug.categoryIcon} {currentDrug.categoryLabel}</div>
              <h2 className="pr-reveal-drug">{currentDrug.name}</h2>
              <p className="pr-reveal-sub">5 questions • {currentDrug.difficulty}</p>
              <button className="pr-btn-start" onClick={startQuestion}>
                Start Questions
              </button>
            </div>
          )}

          {phase === "idle" && currentDrug && (
            <div className="pr-between">
              <button className="pr-btn-spin" onClick={spinWheel}>
                <RotateCcw size={16} /> Spin Again
              </button>
            </div>
          )}
        </div>
      )}

      {/* QUESTION */}
      {(phase === "question" || phase === "correct" || phase === "wrong") && q && (
        <div className="pr-question-screen">
          <div className="pr-global-timer">
            <div className="pr-global-fill" style={{
              width: `${globalPct}%`,
              background: totalTime <= 15 ? "#ef4444" : totalTime <= 30 ? "#f59e0b" : "#0D7B65"
            }} />
          </div>

          <div className="pr-q-header" style={{ "--col": currentDrug.categoryColour }}>
            <div className="pr-q-drug-info">
              <span className="pr-q-cat">{currentDrug.categoryIcon} {currentDrug.categoryLabel}</span>
              <span className="pr-q-drug">{currentDrug.name}</span>
            </div>
            <div className="pr-q-progress">
              {currentDrug.questions.map((_, i) => (
                <div key={i}
                  className={`pr-q-dot ${i < qIdx ? "pr-q-dot--done" : i === qIdx ? "pr-q-dot--active" : ""}`}
                  style={i === qIdx ? { background: currentDrug.categoryColour } : {}}
                />
              ))}
            </div>
          </div>

          <div className="pr-q-type-badge">
            {q.type === "mechanism"        && "Mechanism of Action"}
            {q.type === "indication"       && "Clinical Indication"}
            {q.type === "side_effect"      && "Side Effects"}
            {q.type === "contraindication" && "Contraindication"}
            {q.type === "interaction"      && "Drug Interaction"}
          </div>

          <div className="pr-q-timer-track">
            <div className={`pr-q-timer-fill ${timeLeft <= 5 ? "pr-urgent" : ""}`}
              style={{ width: `${timerPct}%`, background: timeLeft <= 5 ? "#ef4444" : currentDrug.categoryColour }} />
          </div>
          <div className="pr-q-timer-label" style={{ color: timeLeft <= 5 ? "#ef4444" : "#64748b" }}>
            <Clock size={11} /> {timeLeft}s
          </div>

          <div className="pr-q-card">
            <p className="pr-q-text">{q.q}</p>
          </div>

          <div className="pr-options">
            {q.options.map((opt, i) => {
              let cls = "pr-opt";
              if (selected !== null) {
                if (i === q.correct)     cls += " pr-opt--correct";
                else if (i === selected) cls += " pr-opt--wrong";
                else                     cls += " pr-opt--dim";
              }
              return (
                <button key={i} className={cls}
                  onClick={() => handleAnswer(i)}
                  disabled={selected !== null}
                >
                  <span className="pr-opt-letter">{String.fromCharCode(65 + i)}</span>
                  <span className="pr-opt-text">{opt}</span>
                  {selected !== null && i === q.correct && <CheckCircle size={16} className="pr-opt-icon pr-correct" />}
                  {selected !== null && i === selected && i !== q.correct && <XCircle size={16} className="pr-opt-icon pr-wrong" />}
                </button>
              );
            })}
          </div>

          {phase === "correct" && (
            <div className="pr-status pr-status--correct">
              <CheckCircle size={18} /> Correct! +{TIME_BONUS_CORRECT}s added
              {streak > 0 && <span className="pr-streak-tag">Streak: {streak}</span>}
            </div>
          )}
          {phase === "wrong" && (
            <div className="pr-status pr-status--wrong">
              <XCircle size={18} /> {selected === null ? "Time's up!" : "Incorrect"} — wheel spins again
            </div>
          )}
        </div>
      )}

      {/* GAME OVER */}
      {phase === "gameover" && (
        <div className="pr-gameover">
          <div className="pr-go-icon">
            {score > 500 ? "🏆" : score > 200 ? "⭐" : "💊"}
          </div>
          <h2 className="pr-go-title">Time's Up!</h2>
          <div className="pr-go-stats">
            <div className="pr-go-stat">
              <span className="pr-go-val">{score}</span>
              <span className="pr-go-label">Score</span>
            </div>
            <div className="pr-go-stat">
              <span className="pr-go-val">{xpEarned}</span>
              <span className="pr-go-label">XP</span>
            </div>
            <div className="pr-go-stat">
              <span className="pr-go-val">{drugsPlayed.length}</span>
              <span className="pr-go-label">Drugs</span>
            </div>
            <div className="pr-go-stat">
              <span className="pr-go-val">{results.filter(r => r.correct).length}/{results.length}</span>
              <span className="pr-go-label">Correct</span>
            </div>
          </div>

          <div className="pr-go-results">
            {results.slice(-8).map((r, i) => (
              <div key={i} className={`pr-go-result ${r.correct ? "pr-go-result--correct" : "pr-go-result--wrong"}`}>
                {r.correct ? <CheckCircle size={12} /> : <XCircle size={12} />}
                <span className="pr-go-drug">{r.drug}</span>
                <span className="pr-go-type">{r.type?.replace("_", " ")}</span>
              </div>
            ))}
          </div>

          <div className="pr-go-actions">
            <button className="pr-btn-spin" onClick={startGame}>
              <RotateCcw size={15} /> Play Again
            </button>
            <button className="pr-btn-outline" onClick={() => navigate("/games-dashboard")}>
              Game Zone
            </button>
          </div>
        </div>
      )}

    </div>
  );
}