// src/pages/GamesMode.jsx — redesigned with click-to-show description
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Lock, ChevronRight, Zap, Trophy, X } from "lucide-react";
import "./GamesMode.css";

const GAME_MODES = [
  {
    id: "classic",
    icon: "⚡",
    label: "Name 3 in 10 sec",
    description: "Rapid-fire recall under pressure. Three correct answers before the clock hits zero.",
    tag: "Speed",
    tagColor: "cyan",
    difficulty: "Medium",
    available: true,
    path: "/classic-challenge",
    accent: "#22d3ee",
    players: "Solo",
  },
  {
    id: "clues",
    icon: "🧩",
    label: "Diagnosis in 3 Clues",
    description: "You get three clinical clues. Think laterally, narrow your differentials, commit.",
    tag: "Clinical",
    tagColor: "purple",
    difficulty: "Hard",
    available: false,
    accent: "#a78bfa",
    players: "Solo",
  },
  {
    id: "sprint",
    icon: "🏃",
    label: "Sprint Match",
    description: "Pattern recognition at pace. Match symptoms, drugs, or diagnoses before time runs out.",
    tag: "Speed",
    tagColor: "green",
    difficulty: "Easy",
    available: false,
    accent: "#4ade80",
    players: "Solo",
  },
  {
    id: "whoami",
    icon: "🧠",
    label: "Who Am I?",
    description: "The disease speaks. Listen to its clues and name the condition before it's too late.",
    tag: "Reasoning",
    tagColor: "yellow",
    difficulty: "Hard",
    available: false,
    accent: "#facc15",
    players: "Solo",
  },
  {
    id: "mcq",
    icon: "✍️",
    label: "One-Line MCQs",
    description: "High-yield, no-fluff single-line questions. Pure knowledge, no distractions.",
    tag: "Exam Prep",
    tagColor: "blue",
    difficulty: "Medium",
    available: false,
    accent: "#60a5fa",
    players: "Solo",
  },
  {
    id: "blackbox",
    icon: "⬛",
    label: "Clinical Black Box",
    description: "Minimal data, maximum reasoning. Work through incomplete clinical scenarios.",
    tag: "Clinical",
    tagColor: "red",
    difficulty: "Expert",
    available: false,
    accent: "#f87171",
    players: "Solo",
  },
  {
    id: "ladder",
    icon: "🪜",
    label: "The Doctor Ladder",
    description: "Climb from intern to consultant. Harder questions unlock at each rung.",
    tag: "Progression",
    tagColor: "orange",
    difficulty: "Variable",
    available: false,
    accent: "#fb923c",
    players: "Solo",
  },
];

const DIFFICULTY_COLOR = {
  Easy: { bg: "#f0fdf4", text: "#15803d", border: "#bbf7d0" },
  Medium: { bg: "#fffbeb", text: "#b45309", border: "#fde68a" },
  Hard: { bg: "#fef2f2", text: "#b91c1c", border: "#fecaca" },
  Expert: { bg: "#fdf4ff", text: "#7e22ce", border: "#e9d5ff" },
  Variable: { bg: "#f0f9ff", text: "#0369a1", border: "#bae6fd" },
};

export default function GamesMode() {
  const navigate = useNavigate();
  const [hovered, setHovered] = useState(null);
  const [selectedGame, setSelectedGame] = useState(null);

  const available = GAME_MODES.filter((g) => g.available);
  const coming = GAME_MODES.filter((g) => !g.available);

  const handleCardClick = (game) => {
    if (game.available) {
      navigate(game.path);
    } else {
      setSelectedGame(game);
    }
  };

  return (
    <div className="gm-page">

      {/* ── Header ── */}
      <header className="gm-header">
        <button className="gm-back" onClick={() => navigate("/home")}>
          <ArrowLeft size={16} /> Back
        </button>
        <div className="gm-header-center">
          <div className="gm-header-icon">🎮</div>
          <div>
            <h1 className="gm-title">Game Modes</h1>
            <p className="gm-subtitle">Choose your challenge</p>
          </div>
        </div>
        <div className="gm-header-right">
          <div className="gm-stat"><Trophy size={14} /><span>1 unlocked</span></div>
        </div>
      </header>

      <div className="gm-body">

        {/* Hero banner */}
        <div className="gm-hero">
          <div className="gm-hero-bg" aria-hidden="true">
            <div className="gm-hero-orb gm-orb-a" />
            <div className="gm-hero-orb gm-orb-b" />
          </div>
          <div className="gm-hero-inner">
            <div className="gm-hero-badge"><Zap size={12} /> Game Zone</div>
            <h2 className="gm-hero-title">Test your medical knowledge</h2>
            <p className="gm-hero-sub">Tap any card to learn more. Available modes are ready to play!</p>
          </div>
        </div>

        {/* Available modes */}
        <section className="gm-section">
          <h2 className="gm-section-title">Play Now</h2>
          <div className="gm-grid gm-grid-available">
            {available.map((game) => (
              <GameCard
                key={game.id}
                game={game}
                hovered={hovered === game.id}
                onEnter={() => setHovered(game.id)}
                onLeave={() => setHovered(null)}
                onClick={() => handleCardClick(game)}
              />
            ))}
          </div>
        </section>

        {/* Coming soon */}
        <section className="gm-section">
          <h2 className="gm-section-title">Coming Soon</h2>
          <div className="gm-grid gm-grid-locked">
            {coming.map((game) => (
              <GameCard
                key={game.id}
                game={game}
                locked
                hovered={hovered === game.id}
                onEnter={() => setHovered(game.id)}
                onLeave={() => setHovered(null)}
                onClick={() => handleCardClick(game)}
              />
            ))}
          </div>
        </section>

      </div>

      {/* Description Modal */}
      {selectedGame && (
        <div className="gm-modal-overlay" onClick={() => setSelectedGame(null)}>
          <div className="gm-modal" onClick={(e) => e.stopPropagation()}>
            <button className="gm-modal-close" onClick={() => setSelectedGame(null)}>
              <X size={20} />
            </button>
            <div className="gm-modal-icon">{selectedGame.icon}</div>
            <h3 className="gm-modal-title">{selectedGame.label}</h3>
            <p className="gm-modal-desc">{selectedGame.description}</p>
            <div className="gm-modal-footer">
              <span className="gm-diff-badge" style={DIFFICULTY_COLOR[selectedGame.difficulty]}>
                {selectedGame.difficulty}
              </span>
              <span className="gm-modal-players">{selectedGame.players}</span>
            </div>
            {!selectedGame.available && (
              <button className="gm-modal-notify" onClick={() => setSelectedGame(null)}>
                Coming Soon
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Game Card (No Description) ──
function GameCard({ game, locked, hovered, onEnter, onLeave, onClick }) {
  const diff = DIFFICULTY_COLOR[game.difficulty] || DIFFICULTY_COLOR.Medium;

  return (
    <div
      className={`gm-card ${locked ? "gm-card-locked" : "gm-card-live"} ${hovered ? "gm-card-hovered" : ""}`}
      style={{ "--gm-accent": game.accent }}
      onMouseEnter={onEnter}
      onMouseLeave={onLeave}
      onClick={onClick}
    >
      <div className="gm-card-glow" />
      <div className="gm-card-top">
        <div className="gm-card-emoji">{game.icon}</div>
        {locked
          ? <div className="gm-lock-badge"><Lock size={12} /> Soon</div>
          : <div className="gm-play-badge"><Zap size={12} /> Play</div>
        }
      </div>
      <div className="gm-card-content">
        <h3 className="gm-card-label">{game.label}</h3>
        {/* Description removed - will show in modal on click */}
      </div>
      <div className="gm-card-footer">
        <span
          className="gm-diff-badge"
          style={{ background: diff.bg, color: diff.text, borderColor: diff.border }}
        >
          {game.difficulty}
        </span>
        <span className="gm-players">{game.players}</span>
        <div className="gm-card-arrow">
          <ChevronRight size={16} />
        </div>
      </div>
    </div>
  );
}