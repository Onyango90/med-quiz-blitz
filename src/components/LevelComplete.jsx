// src/components/LevelComplete.jsx
import React, { useEffect, useState } from "react";
import { MEDDY_MESSAGES } from "../data/dailyChallengeQuestions";
import "./LevelComplete.css";

export default function LevelComplete({ level, xpEarned, totalXP, onNext, onDone }) {
  const msg      = MEDDY_MESSAGES[level] || MEDDY_MESSAGES[1];
  const line     = msg.lines[Math.floor(Math.random() * msg.lines.length)];
  const isChamp  = msg.isLast;

  const [displayXP, setDisplayXP] = useState(0);
  const [visible,   setVisible]   = useState(false);

  // Slide in on mount
  useEffect(() => {
    requestAnimationFrame(() => setVisible(true));
  }, []);

  // Count up XP
  useEffect(() => {
    if (!visible) return;
    let start = 0;
    const step = Math.ceil(xpEarned / 40);
    const t = setInterval(() => {
      start += step;
      if (start >= xpEarned) { setDisplayXP(xpEarned); clearInterval(t); }
      else setDisplayXP(start);
    }, 30);
    return () => clearInterval(t);
  }, [visible, xpEarned]);

  const handleNext = () => {
    setVisible(false);
    setTimeout(() => (isChamp ? onDone() : onNext()), 280);
  };

  return (
    <div className={`lc-overlay ${visible ? "lc-visible" : ""}`}>
      <div className={`lc-sheet ${visible ? "lc-sheet-in" : ""}`}>

        {/* Confetti — champion only */}
        {isChamp && <Confetti />}

        {/* Meddy */}
        <div className={`lc-meddy lc-mood-${msg.mood}`}>
          <MeddySVG mood={msg.mood} />
        </div>

        {/* Level badge */}
        <div className="lc-level-badge">
          Level {level} Complete
        </div>

        {/* Title */}
        <h2 className="lc-title">{msg.title}</h2>

        {/* Quote line */}
        <p className="lc-line">"{line}"</p>

        {/* XP earned */}
        <div className="lc-xp-block">
          <div className="lc-xp-ring">
            <span className="lc-xp-num">+{displayXP}</span>
            <span className="lc-xp-label">XP</span>
          </div>
          <p className="lc-xp-total">Total today: {totalXP} XP</p>
        </div>

        {/* Dots progress */}
        <div className="lc-dots">
          {[1, 2, 3, 4].map(l => (
            <span
              key={l}
              className={`lc-dot ${l <= level ? "lc-dot-done" : ""} ${l === level ? "lc-dot-current" : ""}`}
            />
          ))}
        </div>

        {/* CTA button */}
        <button
          className={`lc-btn ${isChamp ? "lc-btn-champ" : "lc-btn-next"}`}
          onClick={handleNext}
        >
          {msg.cta}
        </button>

        {/* Skip if not last */}
        {!isChamp && (
          <button className="lc-skip" onClick={() => { setVisible(false); setTimeout(onDone, 280); }}>
            I'm done for today
          </button>
        )}
      </div>
    </div>
  );
}

// ── Meddy SVG — brain mascot with 4 mood variants ─────────────────────────
function MeddySVG({ mood }) {
  // Eyes change per mood; body stays same
  const eyes = {
    happy:   { l: "M28 34 Q30 31 32 34", r: "M42 34 Q44 31 46 34", pupils: false },
    excited: { l: "M27 33 Q30 29 33 33", r: "M41 33 Q44 29 47 33", pupils: false },
    proud:   { l: "M28 34 Q30 32 32 34", r: "M42 34 Q44 32 46 34", pupils: true  },
    champion:{ l: "M27 32 Q30 27 33 32", r: "M41 32 Q44 27 47 32", pupils: true  },
  };
  const e = eyes[mood] || eyes.happy;

  // Mouth varies
  const mouths = {
    happy:   "M30 42 Q37 48 44 42",
    excited: "M29 42 Q37 50 45 42",
    proud:   "M31 43 Q37 47 43 43",
    champion:"M28 41 Q37 52 46 41",
  };

  // Sparkles for champion
  const showSparkles = mood === "champion" || mood === "proud";
  // Bounce class applied via CSS
  
  return (
    <svg viewBox="0 0 74 80" className="lc-meddy-svg" aria-hidden="true">
      {/* Brain body */}
      <ellipse cx="37" cy="35" rx="28" ry="26" fill="#fde68a" stroke="#f59e0b" strokeWidth="2.5"/>
      {/* Brain folds */}
      <path d="M15 32 Q20 22 28 28 Q33 18 37 26 Q42 16 46 26 Q54 20 59 30" 
            fill="none" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round"/>
      <path d="M18 40 Q24 34 30 38" fill="none" stroke="#f59e0b" strokeWidth="1.5" strokeLinecap="round"/>
      <path d="M44 38 Q50 34 56 40" fill="none" stroke="#f59e0b" strokeWidth="1.5" strokeLinecap="round"/>

      {/* Left eye */}
      <path d={e.l} fill="none" stroke="#1a1a1a" strokeWidth="2.5" strokeLinecap="round"/>
      {/* Right eye */}
      <path d={e.r} fill="none" stroke="#1a1a1a" strokeWidth="2.5" strokeLinecap="round"/>
      {/* Eye pupils — only for proud/champion */}
      {e.pupils && <>
        <circle cx="30" cy="36" r="2" fill="#1a1a1a"/>
        <circle cx="44" cy="36" r="2" fill="#1a1a1a"/>
        <circle cx="31" cy="35" r="0.8" fill="#fff"/>
        <circle cx="45" cy="35" r="0.8" fill="#fff"/>
      </>}

      {/* Mouth */}
      <path d={mouths[mood] || mouths.happy} fill="none" stroke="#1a1a1a" strokeWidth="2.5" strokeLinecap="round"/>

      {/* Blush marks */}
      <ellipse cx="22" cy="40" rx="5" ry="3" fill="#f87171" opacity="0.45"/>
      <ellipse cx="52" cy="40" rx="5" ry="3" fill="#f87171" opacity="0.45"/>

      {/* Little arms */}
      <path d="M9 38 Q4 33 8 28" fill="none" stroke="#fde68a" strokeWidth="4" strokeLinecap="round"/>
      <path d="M65 38 Q70 33 66 28" fill="none" stroke="#fde68a" strokeWidth="4" strokeLinecap="round"/>

      {/* Hands */}
      <circle cx="8"  cy="27" r="4" fill="#fde68a" stroke="#f59e0b" strokeWidth="1.5"/>
      <circle cx="66" cy="27" r="4" fill="#fde68a" stroke="#f59e0b" strokeWidth="1.5"/>

      {/* Stethoscope — always there */}
      <path d="M30 59 Q37 66 44 59" fill="none" stroke="#6b7280" strokeWidth="2" strokeLinecap="round"/>
      <circle cx="37" cy="68" r="4" fill="none" stroke="#6b7280" strokeWidth="2"/>

      {/* Crown — champion only */}
      {mood === "champion" && <>
        <polygon points="37,4 31,14 37,11 43,14" fill="#fbbf24" stroke="#f59e0b" strokeWidth="1"/>
        <circle cx="37" cy="4"  r="2.5" fill="#f43f5e"/>
        <circle cx="31" cy="14" r="2"   fill="#f43f5e"/>
        <circle cx="43" cy="14" r="2"   fill="#f43f5e"/>
      </>}

      {/* Sparkles */}
      {showSparkles && <>
        <text x="2"  y="18" fontSize="10" opacity="0.8">✨</text>
        <text x="60" y="16" fontSize="10" opacity="0.8">✨</text>
        <text x="30" y="6"  fontSize="8"  opacity="0.6">⭐</text>
      </>}
    </svg>
  );
}

// ── Confetti — champion screen only ───────────────────────────────────────
function Confetti() {
  const pieces = Array.from({ length: 28 }, (_, i) => ({
    id: i,
    color: ["#f43f5e","#f59e0b","#22c55e","#6366f1","#0d9488","#fff"][i % 6],
    left:  `${(i * 23 + 7) % 100}%`,
    delay: `${(i * 0.18) % 2}s`,
    dur:   `${2.2 + (i % 5) * 0.3}s`,
    size:  `${6 + (i % 4) * 3}px`,
    rot:   `${(i * 47) % 360}deg`,
  }));
  return (
    <div className="lc-confetti" aria-hidden="true">
      {pieces.map(p => (
        <div
          key={p.id}
          className="lc-confetti-piece"
          style={{
            left:            p.left,
            background:      p.color,
            width:           p.size,
            height:          p.size,
            animationDelay:  p.delay,
            animationDuration: p.dur,
            transform:       `rotate(${p.rot})`,
          }}
        />
      ))}
    </div>
  );
}