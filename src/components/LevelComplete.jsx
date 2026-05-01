// src/components/LevelComplete.jsx
import React, { useEffect, useState } from "react";
import "./LevelComplete.css";

const MEDDY_MESSAGES = {
  1: {
    title: "Solid start, Doctor! 🧠",
    lines: [
      "Your attending would nod approvingly.",
      "That's the foundation right there.",
      "Every great clinician started exactly here.",
    ],
    cta: "Take on Level 2 🔥",
    mood: "happy",
  },
  2: {
    title: "Now we're talking! 🔥",
    lines: [
      "Even Robbins would approve of that.",
      "The questions get spicier from here.",
      "You're thinking like a doctor.",
    ],
    cta: "Bring on Level 3 💎",
    mood: "excited",
  },
  3: {
    title: "Impressive. 💎",
    lines: [
      "Most students stop here. Are you most students?",
      "That's consultant-level thinking.",
      "One more level stands between you and glory.",
    ],
    cta: "Claim the Crown 👑",
    mood: "proud",
  },
  4: {
    title: "DAILY CHAMPION! 👑",
    lines: [
      "You just outworked 90% of your class.",
      "Keep this up and you'll be the one teaching.",
      "See you tomorrow — if you dare.",
    ],
    cta: "Back to Dashboard",
    mood: "champion",
    isLast: true,
  },
};

export default function LevelComplete({ level, xpEarned, totalXP, onNext, onDone }) {
  const msg     = MEDDY_MESSAGES[level] || MEDDY_MESSAGES[1];
  const line    = msg.lines[Math.floor(Math.random() * msg.lines.length)];
  const isChamp = !!msg.isLast;

  const [displayXP, setDisplayXP] = useState(0);
  const [visible,   setVisible]   = useState(false);

  useEffect(() => {
    requestAnimationFrame(() => setVisible(true));
  }, []);

  useEffect(() => {
    if (!visible) return;
    let current = 0;
    const target = xpEarned || 0;
    const step   = Math.ceil(target / 40) || 1;
    const t = setInterval(() => {
      current += step;
      if (current >= target) { setDisplayXP(target); clearInterval(t); }
      else setDisplayXP(current);
    }, 30);
    return () => clearInterval(t);
  }, [visible, xpEarned]);

  const handleNext = () => {
    setVisible(false);
    setTimeout(() => (isChamp ? onDone() : onNext()), 280);
  };

  const handleDone = () => {
    setVisible(false);
    setTimeout(() => onDone(), 280);
  };

  return (
    <div className={`lc-overlay ${visible ? "lc-visible" : ""}`}>
      <div className={`lc-sheet ${visible ? "lc-sheet-in" : ""}`}>

        {isChamp && <Confetti />}

        <div className={`lc-meddy lc-mood-${msg.mood}`}>
          <MeddySVG mood={msg.mood} />
        </div>

        <div className="lc-level-badge">Level {level} Complete ✓</div>

        <h2 className="lc-title">{msg.title}</h2>
        <p className="lc-line">"{line}"</p>

        <div className="lc-xp-block">
          <div className="lc-xp-ring">
            <span className="lc-xp-num">+{displayXP}</span>
            <span className="lc-xp-label">XP</span>
          </div>
          <p className="lc-xp-total">Session total: {totalXP} XP</p>
        </div>

        <div className="lc-dots">
          {[1, 2, 3, 4].map(l => (
            <span
              key={l}
              className={`lc-dot ${l < level ? "lc-dot-done" : ""} ${l === level ? "lc-dot-current" : ""}`}
            />
          ))}
        </div>

        <button
          className={`lc-btn ${isChamp ? "lc-btn-champ" : "lc-btn-next"}`}
          onClick={handleNext}
        >
          {msg.cta}
        </button>

        {!isChamp && (
          <button className="lc-skip" onClick={handleDone}>
            I'm done for today
          </button>
        )}
      </div>
    </div>
  );
}

function MeddySVG({ mood }) {
  const mouths = {
    happy:   "M30 42 Q37 48 44 42",
    excited: "M29 42 Q37 50 45 42",
    proud:   "M31 43 Q37 47 43 43",
    champion:"M28 41 Q37 52 46 41",
  };
  const showCrown     = mood === "champion";
  const showSparkles  = mood === "proud" || mood === "champion";
  const showWideEyes  = mood === "excited" || mood === "champion";

  return (
    <svg viewBox="0 0 74 84" className="lc-meddy-svg" aria-hidden="true">
      {/* Crown */}
      {showCrown && (
        <>
          <polygon points="37,3 30,14 37,10 44,14" fill="#fbbf24" stroke="#f59e0b" strokeWidth="1"/>
          <circle cx="37" cy="3"  r="2.5" fill="#f43f5e"/>
          <circle cx="30" cy="14" r="2"   fill="#f43f5e"/>
          <circle cx="44" cy="14" r="2"   fill="#f43f5e"/>
        </>
      )}

      {/* Body */}
      <ellipse cx="37" cy="38" rx="28" ry="26" fill="#fde68a" stroke="#f59e0b" strokeWidth="2.5"/>

      {/* Brain folds */}
      <path d="M15 35 Q20 25 28 31 Q33 21 37 29 Q42 19 46 29 Q54 23 59 33"
            fill="none" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round"/>
      <path d="M18 43 Q24 37 30 41" fill="none" stroke="#f59e0b" strokeWidth="1.5" strokeLinecap="round"/>
      <path d="M44 41 Q50 37 56 43" fill="none" stroke="#f59e0b" strokeWidth="1.5" strokeLinecap="round"/>

      {/* Eyes */}
      {showWideEyes ? (
        <>
          <circle cx="30" cy="37" r="4.5" fill="#fff" stroke="#1a1a1a" strokeWidth="1.5"/>
          <circle cx="44" cy="37" r="4.5" fill="#fff" stroke="#1a1a1a" strokeWidth="1.5"/>
          <circle cx="31" cy="37" r="2"   fill="#1a1a1a"/>
          <circle cx="45" cy="37" r="2"   fill="#1a1a1a"/>
          <circle cx="31.8" cy="36" r="0.9" fill="#fff"/>
          <circle cx="45.8" cy="36" r="0.9" fill="#fff"/>
        </>
      ) : (
        <>
          <path d="M27 36 Q30 32 33 36" fill="none" stroke="#1a1a1a" strokeWidth="2.5" strokeLinecap="round"/>
          <path d="M41 36 Q44 32 47 36" fill="none" stroke="#1a1a1a" strokeWidth="2.5" strokeLinecap="round"/>
        </>
      )}

      {/* Mouth */}
      <path d={mouths[mood] || mouths.happy} fill="none" stroke="#1a1a1a" strokeWidth="2.5" strokeLinecap="round"/>

      {/* Blush */}
      <ellipse cx="22" cy="43" rx="5" ry="3" fill="#f87171" opacity="0.4"/>
      <ellipse cx="52" cy="43" rx="5" ry="3" fill="#f87171" opacity="0.4"/>

      {/* Arms */}
      <path d="M9 41 Q3 35 7 29"  fill="none" stroke="#fde68a" strokeWidth="5" strokeLinecap="round"/>
      <path d="M65 41 Q71 35 67 29" fill="none" stroke="#fde68a" strokeWidth="5" strokeLinecap="round"/>
      <circle cx="7"  cy="28" r="4.5" fill="#fde68a" stroke="#f59e0b" strokeWidth="1.5"/>
      <circle cx="67" cy="28" r="4.5" fill="#fde68a" stroke="#f59e0b" strokeWidth="1.5"/>

      {/* Stethoscope */}
      <path d="M30 62 Q37 70 44 62" fill="none" stroke="#6b7280" strokeWidth="2" strokeLinecap="round"/>
      <circle cx="37" cy="71" r="4" fill="none" stroke="#6b7280" strokeWidth="2"/>

      {/* Sparkles */}
      {showSparkles && (
        <>
          <text x="1"  y="22" fontSize="11">✨</text>
          <text x="59" y="20" fontSize="11">✨</text>
          <text x="30" y="9"  fontSize="9">⭐</text>
        </>
      )}
    </svg>
  );
}

function Confetti() {
  const pieces = Array.from({ length: 30 }, (_, i) => ({
    id: i,
    color: ["#f43f5e","#f59e0b","#22c55e","#6366f1","#0d9488","#fff"][i % 6],
    left:  `${(i * 23 + 7) % 100}%`,
    delay: `${(i * 0.15) % 2}s`,
    dur:   `${2 + (i % 5) * 0.3}s`,
    size:  `${6 + (i % 4) * 3}px`,
  }));
  return (
    <div className="lc-confetti" aria-hidden="true">
      {pieces.map(p => (
        <div key={p.id} className="lc-confetti-piece"
          style={{ left:p.left, background:p.color, width:p.size, height:p.size,
                   animationDelay:p.delay, animationDuration:p.dur }} />
      ))}
    </div>
  );
}