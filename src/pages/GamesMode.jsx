// src/pages/GamesMode.jsx — gamified lobby, warm cream, rotating spotlight
import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Zap, Stethoscope, FlaskConical, ChevronLeft, ChevronRight, Flame, Star } from "lucide-react";
import "./GamesMode.css";

const ALL_GAMES = [
  // ── PRECLINICAL ────────────────────────────────────────────────────────────
  {
    id: "name3", category: "preclinical",
    icon: "⚡", emoji_bg: "#fef9c3",
    label: "Name 3 in 20",
    tagline: "Recall 3 facts before the clock dies",
    description: "Rapid-fire retrieval under pressure. Three correct answers before the clock hits zero. Tests pure memory speed — anatomy, physiology, biochemistry.",
    difficulty: "Medium", xp: 30, available: true, path: "/classic-challenge",
    accent: "#0891b2", accent_lt: "#e0f7fa", tag: "Speed",
    stats: ["20 sec rounds", "Pure recall", "Year-aware"],
  },
  {
    id: "boss", category: "preclinical",
    icon: "⚔️", emoji_bg: "#fee2e2",
    label: "Boss Battle",
    tagline: "Defeat medical villains with your knowledge",
    description: "Face 10 medical villains — each one harder than the last. Answer correctly to deal damage. One wrong answer costs a life. Lose all 3 lives and it's over.",
    difficulty: "Hard", xp: 50, available: true, path: "/boss-battle",
    accent: "#dc2626", accent_lt: "#fee2e2", tag: "Epic",
    stats: ["10 bosses", "3 lives", "Escalating"],
  },
  {
    id: "mcq-blitz", category: "preclinical",
    icon: "🎯", emoji_bg: "#ede9fe",
    label: "MCQ Blitz",
    tagline: "High-yield questions, no time to think",
    description: "20 MCQs. 15 seconds each. Build a streak to multiply your XP — but 3 wrong answers ends the run early.",
    difficulty: "Medium", xp: 25, available: true, path: "/mcq-blitz",
    accent: "#7c3aed", accent_lt: "#ede9fe", tag: "Exam Prep",
    stats: ["20 questions", "15s per Q", "Streak XP"],
  },
  {
    id: "ladder", category: "preclinical",
    icon: "🪜", emoji_bg: "#fff7ed",
    label: "The Doctor Ladder",
    tagline: "Climb from Intern to Professor",
    description: "Start as an Intern and climb 6 rungs to Professor. Answer as many as you can in 60 seconds per rung. One wrong answer drops you back.",
    difficulty: "Variable", xp: 50, available: true, path: "/doctor-ladder",
    accent: "#ea580c", accent_lt: "#fff7ed", tag: "Progression",
    stats: ["6 levels", "60s per rung", "Climb up"],
  },
  {
    id: "pharma-roulette", category: "preclinical",
    icon: "💊", emoji_bg: "#f3f0ff",
    label: "PharmaRoulette",
    tagline: "Spin the wheel. Name the drug.",
    description: "A wheel of 8 drug categories spins and lands on a random class — Antibiotics, Cardiovascular, CNS, Endocrine, Respiratory, GI, Analgesics, or Antimalarials. A specific drug is revealed and you must answer questions about it under pressure.",
    difficulty: "Medium", xp: 35, available: true, path: "/pharma-roulette",
    accent: "#6d28d9", accent_lt: "#ede9fe", tag: "Pharmacology",
    stats: ["8 categories", "Random drug", "Kenya-relevant"],
  },
  // ── CLINICAL ───────────────────────────────────────────────────────────────
  {
    id: "clues", category: "clinical",
    icon: "🔬", emoji_bg: "#e6f7f4",
    label: "Diagnose in 3 Clues",
    tagline: "Think laterally. Commit to a diagnosis.",
    description: "Three clinical clues revealed one at a time. Narrow your differentials and commit early — fewer clues used means more XP earned.",
    difficulty: "Hard", xp: 40, available: true, path: "/diagnose-game",
    accent: "#0d7c6e", accent_lt: "#e6f7f4", tag: "Clinical Reasoning",
    stats: ["3 clues max", "Early = more XP", "25 cases"],
  },
  {
    id: "whoami", category: "clinical",
    icon: "🧠", emoji_bg: "#f3f0ff",
    label: "Who Am I?",
    tagline: "The disease speaks — can you name it?",
    description: "A condition describes itself in 5 cryptic first-person clues. Think pathophysiology, name it with as few clues as possible.",
    difficulty: "Hard", xp: 45, available: true, path: "/who-am-i",
    accent: "#6d28d9", accent_lt: "#f3f0ff", tag: "Reasoning",
    stats: ["5 clues", "All subjects", "25 cases"],
  },
  {
    id: "ward", category: "clinical",
    icon: "🏥", emoji_bg: "#dcfce7",
    label: "Ward Round",
    tagline: "One patient. Full case. Your decisions matter.",
    description: "A real patient is waiting. Take the history, examine, order investigations, make the diagnosis — every wrong management decision has consequences.",
    difficulty: "Expert", xp: 80, available: true, path: "/ward-round",
    accent: "#15803d", accent_lt: "#dcfce7", tag: "Full Case",
    stats: ["6 cases", "Full workup", "Consequences"],
  },
  {
    id: "blackbox", category: "clinical",
    icon: "⬛", emoji_bg: "#ffe4e6",
    label: "Clinical Black Box",
    tagline: "Incomplete data. Maximum reasoning.",
    description: "A case with deliberately missing information. Spend tokens to unlock redacted panels — the less you need, the smarter you are.",
    difficulty: "Expert", xp: 100, available: true, path: "/clinical-blackbox",
    accent: "#be123c", accent_lt: "#ffe4e6", tag: "Advanced",
    stats: ["Token system", "Red herrings", "Expert only"],
  },
];

const DIFF_COLOR = {
  Medium:   { color: "#b45309", bg: "#fef9c3", border: "#fde68a" },
  Hard:     { color: "#be123c", bg: "#ffe4e6", border: "#fecdd3" },
  Expert:   { color: "#6d28d9", bg: "#f3f0ff", border: "#ddd6fe" },
  Variable: { color: "#c2410c", bg: "#fff7ed", border: "#fed7aa" },
};

const CAT_GAMES = {
  preclinical: ALL_GAMES.filter((g) => g.category === "preclinical"),
  clinical:    ALL_GAMES.filter((g) => g.category === "clinical"),
};

export default function GamesMode() {
  const navigate = useNavigate();
  const [activeTab,    setActiveTab]    = useState("preclinical");
  const [spotlightIdx, setSpotlightIdx] = useState(0);
  const [animDir,      setAnimDir]      = useState("right");
  const [isAnimating,  setIsAnimating]  = useState(false);

  const games   = CAT_GAMES[activeTab];
  const current = games[spotlightIdx] || games[0];
  const diff    = DIFF_COLOR[current.difficulty] || DIFF_COLOR.Medium;

  useEffect(() => { setSpotlightIdx(0); }, [activeTab]);

  const go = useCallback((dir) => {
    if (isAnimating) return;
    setIsAnimating(true);
    setAnimDir(dir);
    setTimeout(() => {
      setSpotlightIdx((idx) =>
        dir === "right"
          ? (idx + 1) % games.length
          : (idx - 1 + games.length) % games.length
      );
      setIsAnimating(false);
    }, 220);
  }, [isAnimating, games.length]);

  const goTo = useCallback((idx) => {
    if (idx === spotlightIdx || isAnimating) return;
    setAnimDir(idx > spotlightIdx ? "right" : "left");
    setIsAnimating(true);
    setTimeout(() => { setSpotlightIdx(idx); setIsAnimating(false); }, 220);
  }, [isAnimating, spotlightIdx]);

  useEffect(() => {
    const handler = (e) => {
      if (e.key === "ArrowRight") go("right");
      if (e.key === "ArrowLeft")  go("left");
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [go]);

  // touch swipe support
  let touchStartX = 0;
  const onTouchStart = (e) => { touchStartX = e.touches[0].clientX; };
  const onTouchEnd   = (e) => {
    const dx = e.changedTouches[0].clientX - touchStartX;
    if (Math.abs(dx) > 50) go(dx < 0 ? "right" : "left");
  };

  return (
    <div className="gm-page" style={{ "--cur-accent": current.accent, "--cur-lt": current.accent_lt }}>

      {/* Warm background blobs that shift with each game */}
      <div className="gm-bg" aria-hidden="true">
        <div className="gm-blob gm-blob-1" style={{ background: `radial-gradient(circle, ${current.accent}1a 0%, transparent 70%)` }} />
        <div className="gm-blob gm-blob-2" />
        <div className="gm-blob gm-blob-3" />
      </div>

      {/* ── Top bar ── */}
      <header className="gm-topbar">
        <button className="gm-back" onClick={() => navigate("/home")}>
          <ArrowLeft size={16} />
        </button>
        <div className="gm-topbar-center">
          <span className="gm-topbar-title">🎮 Game Zone</span>
          <span className="gm-topbar-sub">{ALL_GAMES.length} games · Double XP active</span>
        </div>
        <div className="gm-xp-pill">
          <Flame size={13} />
          <span>×2 XP</span>
        </div>
      </header>

      {/* ── Category tabs ── */}
      <div className="gm-tabs-wrap">
        <div className="gm-tabs">
          <button
            className={`gm-tab ${activeTab === "preclinical" ? "active" : ""}`}
            onClick={() => setActiveTab("preclinical")}
          >
            <FlaskConical size={13} />
            Preclinical
            <span className="gm-tab-count">{CAT_GAMES.preclinical.length}</span>
          </button>
          <button
            className={`gm-tab ${activeTab === "clinical" ? "active" : ""}`}
            onClick={() => setActiveTab("clinical")}
          >
            <Stethoscope size={13} />
            Clinical
            <span className="gm-tab-count">{CAT_GAMES.clinical.length}</span>
          </button>
        </div>
        <p className="gm-tab-hint">
          {activeTab === "preclinical"
            ? "Anatomy · Physiology · Pharmacology · Biochemistry"
            : "Clinical Reasoning · Diagnosis · Patient Management"}
        </p>
      </div>

      {/* ══════════════════════════════════════════════════
          SPOTLIGHT CAROUSEL
      ══════════════════════════════════════════════════ */}
      <div
        className="gm-spotlight-wrap"
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
      >
        <button className="gm-arrow gm-arrow-l" onClick={() => go("left")} aria-label="Previous">
          <ChevronLeft size={20} />
        </button>

        <div className={`gm-spotlight ${isAnimating ? `gm-sl-out-${animDir}` : "gm-sl-in"}`}>

          {/* Accent stripe */}
          <div className="gm-sl-stripe" style={{ background: current.accent }} />

          {/* Floating game number */}
          <div className="gm-sl-num">{spotlightIdx + 1}/{games.length}</div>

          {/* Top: emoji + tags */}
          <div className="gm-sl-top">
            <div className="gm-sl-emoji-bubble" style={{ background: current.emoji_bg, boxShadow: `0 8px 24px ${current.accent}30` }}>
              <span className="gm-sl-emoji">{current.icon}</span>
            </div>
            <div className="gm-sl-top-right">
              <span className="gm-sl-tag" style={{ color: current.accent, background: current.accent_lt, border: `1.5px solid ${current.accent}40` }}>
                {current.tag}
              </span>
              <span className="gm-sl-diff" style={{ color: diff.color, background: diff.bg, border: `1px solid ${diff.border}` }}>
                {current.difficulty}
              </span>
              <span className="gm-sl-xp">
                <Star size={11} style={{ color: "#b07d12" }} />
                {current.xp} XP
              </span>
            </div>
          </div>

          {/* Title + tagline + description */}
          <div className="gm-sl-content">
            <h2 className="gm-sl-title">{current.label}</h2>
            <p className="gm-sl-tagline">"{current.tagline}"</p>
            <p className="gm-sl-desc">{current.description}</p>
          </div>

          {/* Stats strip */}
          <div className="gm-sl-stats">
            {current.stats.map((s) => (
              <div key={s} className="gm-sl-stat" style={{ borderColor: `${current.accent}30`, background: current.accent_lt }}>
                <Zap size={10} style={{ color: current.accent, flexShrink: 0 }} />
                <span>{s}</span>
              </div>
            ))}
          </div>

          {/* Play button */}
          <button
            className="gm-sl-play"
            style={{ background: current.accent }}
            onClick={() => navigate(current.path)}
          >
            <Zap size={16} />
            Play Now
          </button>

          {/* Decorative accent circle */}
          <div className="gm-sl-deco" style={{ background: `${current.accent}0d` }} />
        </div>

        <button className="gm-arrow gm-arrow-r" onClick={() => go("right")} aria-label="Next">
          <ChevronRight size={20} />
        </button>
      </div>

      {/* ── Dot indicators ── */}
      <div className="gm-dots">
        {games.map((g, i) => (
          <button
            key={g.id}
            className={`gm-dot ${i === spotlightIdx ? "gm-dot-on" : ""}`}
            style={i === spotlightIdx ? { background: current.accent, transform: "scale(1.4)" } : {}}
            onClick={() => goTo(i)}
            aria-label={g.label}
          />
        ))}
      </div>

      {/* ── Thumbnail rail ── */}
      <div className="gm-rail-section">
        <p className="gm-rail-label">All {activeTab === "preclinical" ? "Preclinical" : "Clinical"} Modes</p>
        <div className="gm-rail">
          {games.map((g, i) => (
            <button
              key={g.id}
              className={`gm-rail-card ${i === spotlightIdx ? "gm-rc-active" : ""}`}
              style={{ "--rc": g.accent, "--rc-lt": g.accent_lt }}
              onClick={() => goTo(i)}
            >
              {/* Active indicator strip */}
              {i === spotlightIdx && (
                <div className="gm-rc-strip" style={{ background: g.accent }} />
              )}
              <div className="gm-rc-emoji-wrap" style={{ background: g.emoji_bg }}>
                <span>{g.icon}</span>
              </div>
              <div className="gm-rc-body">
                <span className="gm-rc-name">{g.label}</span>
                <span className="gm-rc-meta" style={{ color: g.accent }}>
                  <Zap size={9} /> {g.xp} XP · {g.difficulty}
                </span>
              </div>
            </button>
          ))}
        </div>
      </div>

    </div>
  );
}