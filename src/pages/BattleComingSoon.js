// src/pages/BattleComingSoon.js — redesigned to match HomeDashboard
import React from "react";
import { useNavigate } from "react-router-dom";
import "./BattleComingSoon.css";

const FEATURES = [
  { icon: "🎮", label: "Real-time 1v1 Battles",       desc: "Face off against classmates live",   variant: "coral"  },
  { icon: "🏆", label: "Weekly Tournaments",           desc: "Compete for top spot each week",     variant: "amber"  },
  { icon: "📊", label: "Battle Rankings & ELO",        desc: "Climb the competitive ladder",       variant: "indigo" },
  { icon: "💪", label: "Challenge by Link",            desc: "Invite anyone with a share link",    variant: "teal"   },
];

export default function BattleComingSoon() {
  const navigate = useNavigate();

  return (
    <div className="battle-page">
      <div className="battle-inner">

        {/* ─ Header ─ */}
        <div className="bt-page-header">
          <h1 className="bt-page-title">⚔️ Battle Mode</h1>
          <button className="bt-back-btn" onClick={() => navigate("/home")}>
            ← Dashboard
          </button>
        </div>

        {/* ─ Hero ─ */}
        <div className="bt-hero">
          <div className="bt-hero-bg">
            <div className="bt-hero-orb bt-orb-1" />
            <div className="bt-hero-orb bt-orb-2" />
            <div className="bt-hero-orb bt-orb-3" />
          </div>
          <div className="bt-hero-inner">
            <span className="bt-hero-icon">⚔️</span>
            <h2 className="bt-hero-title">Battle Mode</h2>
            <span className="bt-hero-badge">Coming Soon</span>
            <p className="bt-hero-desc">
              Challenge your friends in real-time medical quizzes!
              Test your knowledge against classmates and climb the ranks.
            </p>
          </div>
          <div className="bt-progress-wrap">
            <div className="bt-progress-row">
              <span>Development Progress</span>
              <span>80%</span>
            </div>
            <div className="bt-progress-track">
              <div className="bt-progress-fill" style={{ width: "80%" }} />
            </div>
            <p className="bt-progress-note">Launching soon!</p>
          </div>
        </div>

        {/* ─ Features ─ */}
        <div className="bt-features-grid">
          {FEATURES.map((f) => (
            <div key={f.label} className={`bt-feature-card bt-feature-card--${f.variant}`}>
              <div className="bt-feature-icon">{f.icon}</div>
              <div>
                <div className="bt-feature-label">{f.label}</div>
                <div className="bt-feature-desc">{f.desc}</div>
              </div>
            </div>
          ))}
        </div>

        {/* ─ Notify ─ */}
        <div className="bt-notify-card">
          <h3>🔔 Be the First to Know</h3>
          <p>Want early access when Battle Mode launches? Tap below and we'll let you know.</p>
          <button
            className="bt-notify-btn"
            onClick={() => alert("📧 We'll notify you when Battle Mode is ready!")}
          >
            Get Notified
          </button>
        </div>

      </div>
    </div>
  );
}