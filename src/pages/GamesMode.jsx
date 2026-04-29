// src/pages/GamesMode.jsx — redesigned: preclinical / clinical split
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Lock, Zap, Stethoscope, FlaskConical, ChevronRight, X, Flame } from "lucide-react";
import "./GamesMode.css";

const PRECLINICAL = [
  {
    id: "name3", icon: "⚡", label: "Name 3 in 10",
    tagline: "Recall 3 facts before the clock dies",
    description: "Rapid-fire retrieval under pressure. Three correct answers before the clock hits zero. Tests pure memory speed — anatomy, physiology, biochemistry.",
    difficulty: "Medium", xp: 30, available: true, path: "/classic-challenge", accent: "#22d3ee", tag: "Speed",
  },
  {
    id: "boss", icon: "⚔️", label: "Boss Battle",
    tagline: "Defeat medical villains with your knowledge",
    description: "Face 10 medical villains — each one harder than the last. Answer correctly to deal damage. One wrong answer costs a life. Lose all 3 lives and it's over. Year-aware questions tailored to your curriculum.",
    difficulty: "Hard", xp: 50, available: true, path: "/boss-battle", accent: "#ef4444", tag: "Endless",
  },
  {
    id: "mcq-blitz", icon: "🎯", label: "MCQ Blitz",
    tagline: "High-yield questions, no time to think",
    description: "Single-line stem MCQs at pace. Pure knowledge tested against the clock — ideal for preclinical exam prep.",
    difficulty: "Medium", xp: 25, available: false, accent: "#818cf8", tag: "Exam Prep",
  },
  {
    id: "ladder", icon: "🪜", label: "The Doctor Ladder",
    tagline: "Climb from Y1 to registrar",
    description: "Questions get harder as you climb. Each correct streak unlocks the next rung — wrong answer drops you back.",
    difficulty: "Variable", xp: 50, available: false, accent: "#fb923c", tag: "Progression",
  },
];

const CLINICAL = [
  {
    id: "clues", icon: "🔍", label: "Diagnosis in 3 Clues",
    tagline: "Think laterally. Commit to a diagnosis.",
    description: "Three clinical clues revealed one at a time. Narrow your differentials with each clue and commit to a diagnosis before the final reveal.",
    difficulty: "Hard", xp: 40, available: false, accent: "#a78bfa", tag: "Clinical Reasoning",
  },
  {
    id: "whoami", icon: "🧠", label: "Who Am I?",
    tagline: "The disease speaks — can you name it?",
    description: "A condition describes itself in cryptic clues. Listen carefully, think pathophysiology, name it before time expires.",
    difficulty: "Hard", xp: 45, available: false, accent: "#facc15", tag: "Reasoning",
  },
  {
    id: "blackbox", icon: "⬛", label: "Clinical Black Box",
    tagline: "Incomplete data. Maximum reasoning.",
    description: "Work through clinical scenarios with deliberately limited information. Mirrors real ward decision-making under uncertainty.",
    difficulty: "Expert", xp: 60, available: false, accent: "#f87171", tag: "Clinical",
  },
  {
    id: "ward", icon: "🏥", label: "Ward Round",
    tagline: "5 patients. 3 minutes. Go.",
    description: "Rapid-fire patient management decisions. Triage, investigate, prescribe — against the clock across 5 cases.",
    difficulty: "Expert", xp: 70, available: false, accent: "#34d399", tag: "Clinical",
  },
];

const DIFF_STYLES = {
  Easy:     { bg: "rgba(74,222,128,0.12)",  color: "#4ade80",  border: "1px solid rgba(74,222,128,0.3)"  },
  Medium:   { bg: "rgba(251,191,36,0.12)",  color: "#fbbf24",  border: "1px solid rgba(251,191,36,0.3)"  },
  Hard:     { bg: "rgba(248,113,113,0.12)", color: "#f87171",  border: "1px solid rgba(248,113,113,0.3)" },
  Expert:   { bg: "rgba(192,132,252,0.12)", color: "#c084fc",  border: "1px solid rgba(192,132,252,0.3)" },
  Variable: { bg: "rgba(251,146,60,0.12)",  color: "#fb923c",  border: "1px solid rgba(251,146,60,0.3)"  },
};

export default function GamesMode() {
  const navigate = useNavigate();
  const [modal, setModal] = useState(null);
  const [activeTab, setActiveTab] = useState("preclinical");

  const games = activeTab === "preclinical" ? PRECLINICAL : CLINICAL;

  const handleCard = (game) => {
    if (game.available) navigate(game.path);
    else setModal(game);
  };

  return (
    <div className="gm-page">

      <header className="gm-topbar">
        <button className="gm-back" onClick={() => navigate("/home")}>
          <ArrowLeft size={16} />
        </button>
        <span className="gm-topbar-title">Game Zone</span>
        <div className="gm-xp-pill">
          <Flame size={13} /><span>XP x2</span>
        </div>
      </header>

      {/* Hero */}
      <div className="gm-hero">
        <div className="gm-hero-mesh" aria-hidden="true">
          <div className="gm-mesh-orb gm-orb-1" />
          <div className="gm-mesh-orb gm-orb-2" />
          <div className="gm-mesh-orb gm-orb-3" />
        </div>
        <div className="gm-hero-content">
          <div className="gm-hero-badge"><Zap size={11} /> Challenge Mode</div>
          <h1 className="gm-hero-title">Test Your<br />Clinical Edge</h1>
          <p className="gm-hero-sub">Earn double XP on every game. Build speed, reasoning, and recall.</p>
          <div className="gm-hero-stats">
            <div className="gm-hs"><span className="gm-hs-val">2</span><span className="gm-hs-lbl">Available</span></div>
            <div className="gm-hdiv" />
            <div className="gm-hs"><span className="gm-hs-val">6</span><span className="gm-hs-lbl">Coming soon</span></div>
            <div className="gm-hdiv" />
            <div className="gm-hs"><span className="gm-hs-val">2×</span><span className="gm-hs-lbl">XP boost</span></div>
          </div>
        </div>
      </div>

      {/* Tab switcher */}
      <div className="gm-tabs-wrap">
        <div className="gm-tabs">
          <button
            className={`gm-tab ${activeTab === "preclinical" ? "active" : ""}`}
            onClick={() => setActiveTab("preclinical")}
          >
            <FlaskConical size={14} /> Preclinical
          </button>
          <button
            className={`gm-tab ${activeTab === "clinical" ? "active" : ""}`}
            onClick={() => setActiveTab("clinical")}
          >
            <Stethoscope size={14} /> Clinical
          </button>
        </div>
        <p className="gm-tab-sub">
          {activeTab === "preclinical"
            ? "Anatomy · Physiology · Biochemistry · Pharmacology"
            : "Reasoning · Diagnosis · Patient management"}
        </p>
      </div>

      {/* Grid */}
      <div className="gm-grid">
        {games.map((game, i) => (
          <GameCard key={game.id} game={game} index={i} onClick={() => handleCard(game)} />
        ))}
      </div>

      {/* Modal */}
      {modal && (
        <div className="gm-overlay" onClick={() => setModal(null)}>
          <div className="gm-modal" onClick={(e) => e.stopPropagation()}>
            <button className="gm-modal-close" onClick={() => setModal(null)}><X size={18} /></button>
            <div className="gm-modal-icon">{modal.icon}</div>
            <h3 className="gm-modal-title">{modal.label}</h3>
            <p className="gm-modal-tagline">"{modal.tagline}"</p>
            <p className="gm-modal-desc">{modal.description}</p>
            <div className="gm-modal-meta">
              <span className="gm-diff-pill" style={DIFF_STYLES[modal.difficulty]}>{modal.difficulty}</span>
              <span className="gm-xp-tag"><Zap size={11} /> +{modal.xp} XP per game</span>
            </div>
            <div className="gm-modal-soon">🚧 In development — coming soon</div>
          </div>
        </div>
      )}
    </div>
  );
}

function GameCard({ game, index, onClick }) {
  const diff = DIFF_STYLES[game.difficulty] || DIFF_STYLES.Medium;
  return (
    <div
      className={`gm-card ${game.available ? "gm-live" : "gm-locked"}`}
      style={{ "--accent": game.accent, animationDelay: `${index * 0.07}s` }}
      onClick={onClick}
    >
      <div className="gm-card-glow" />
      <div className="gm-card-top">
        <span className="gm-card-emoji">{game.icon}</span>
        {game.available
          ? <span className="gm-badge-play"><Zap size={10} /> Play</span>
          : <span className="gm-badge-soon"><Lock size={10} /> Soon</span>
        }
      </div>
      <div className="gm-card-mid">
        <h3 className="gm-card-name">{game.label}</h3>
        <p className="gm-card-tagline">{game.tagline}</p>
      </div>
      <div className="gm-card-bot">
        <span className="gm-diff-pill" style={diff}>{game.difficulty}</span>
        <span className="gm-xp-tag"><Zap size={10} /> {game.xp} XP</span>
        <ChevronRight size={14} className="gm-arrow" />
      </div>
      {!game.available && <div className="gm-fog" />}
    </div>
  );
}