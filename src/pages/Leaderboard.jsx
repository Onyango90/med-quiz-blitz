// src/pages/Leaderboard.jsx — redesigned to match HomeDashboard
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useStats } from "../hooks/useStats";
import "./Leaderboard.css";

export default function Leaderboard() {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const { stats, loading } = useStats();
  const [activeTab, setActiveTab] = useState("xp");

  if (loading || !stats) {
    return (
      <div className="lb-loading">
        <div className="lb-spinner" />
        <p>Loading leaderboard…</p>
      </div>
    );
  }

  const { basic, subjects } = stats;
  const topSubjects = subjects.slice(0, 3);

  const getTier = (xp) => {
    if (xp >= 1000) return "🏆 Elite Tier";
    if (xp >= 500)  return "⭐ Gold Tier";
    if (xp >= 200)  return "🌟 Silver Tier";
    if (xp >= 50)   return "🌱 Bronze Tier";
    return "🎓 Starter";
  };

  const nextMilestone = basic.totalXP >= 1000 ? 2000
    : basic.totalXP >= 500 ? 1000
    : basic.totalXP >= 200 ? 500
    : basic.totalXP >= 50  ? 200 : 50;
  const xpPct = Math.min(Math.round((basic.totalXP / nextMilestone) * 100), 100);

  const userName = currentUser?.displayName || currentUser?.email?.split("@")[0] || "You";

  const tabs = [
    { id: "xp",        label: "⭐ Top XP" },
    { id: "questions", label: "📝 Questions" },
    { id: "streak",    label: "🔥 Streak" },
  ];

  const scoreFor = { xp: `${basic.totalXP} XP`, questions: `${basic.totalAttempted} Qs`, streak: `${basic.currentStreak} days` };
  const subFor   = { xp: "Current position", questions: "Questions master", streak: "Consistency king" };

  return (
    <div className="leaderboard-page">
      <div className="leaderboard-inner">

        {/* ─ Header ─ */}
        <div className="lb-page-header">
          <h1 className="lb-page-title">🏆 Leaderboard</h1>
          <button className="lb-back-btn" onClick={() => navigate("/home")}>
            ← Dashboard
          </button>
        </div>

        {/* ─ Your rank hero ─ */}
        <div className="lb-hero">
          <div className="lb-hero-bg">
            <div className="lb-hero-orb lb-orb-1" />
            <div className="lb-hero-orb lb-orb-2" />
          </div>
          <div className="lb-hero-inner">
            <div className="lb-avatar">👨‍⚕️</div>
            <div className="lb-hero-info">
              <div className="lb-hero-name">{userName}</div>
              <span className="lb-hero-tier">{getTier(basic.totalXP)}</span>
            </div>
          </div>

          <div className="lb-hero-stats">
            {[
              { val: basic.totalXP,       label: "Total XP" },
              { val: basic.totalAttempted, label: "Questions" },
              { val: `${basic.accuracy}%`, label: "Accuracy" },
              { val: basic.currentStreak,  label: "Streak" },
            ].map((s) => (
              <div className="lb-hero-stat" key={s.label}>
                <span className="lb-hero-stat-val">{s.val}</span>
                <span className="lb-hero-stat-label">{s.label}</span>
              </div>
            ))}
          </div>

          <div className="lb-xp-bar-wrap">
            <div className="lb-xp-bar-labels">
              <span>Next: {nextMilestone} XP</span>
              <span>{nextMilestone - basic.totalXP} XP to go</span>
            </div>
            <div className="lb-xp-track">
              <div className="lb-xp-fill" style={{ width: `${xpPct}%` }} />
            </div>
          </div>
        </div>

        {/* ─ Tabs ─ */}
        <div className="lb-tabs">
          {tabs.map((t) => (
            <button
              key={t.id}
              className={`lb-tab${activeTab === t.id ? " lb-tab--active" : ""}`}
              onClick={() => setActiveTab(t.id)}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* ─ Leaderboard list ─ */}
        <div className="lb-list-card">
          <div className="lb-list-header">
            <span className="lb-list-header-rank">#</span>
            <span className="lb-list-header-name">Player</span>
            <span className="lb-list-header-score">Score</span>
          </div>

          {/* Your entry */}
          <div className="lb-item lb-item--1 lb-item--you">
            <div className="lb-rank-num">🥇</div>
            <div className="lb-item-info">
              <span className="lb-item-name">{userName}</span>
              <span className="lb-item-sub">{subFor[activeTab]}</span>
            </div>
            <div className="lb-item-score">{scoreFor[activeTab]}</div>
          </div>

          {/* Placeholder entries */}
          {[2, 3].map((n) => (
            <div className={`lb-item lb-item--${n} lb-empty-row`} key={n}>
              <div className="lb-rank-num">{n === 2 ? "🥈" : "🥉"}</div>
              <div className="lb-item-info">
                <span className="lb-item-name">Coming Soon</span>
                <span className="lb-item-sub">Invite friends to compete!</span>
              </div>
              <div className="lb-item-score">—</div>
            </div>
          ))}
        </div>

        {/* ─ Top subjects ─ */}
        {topSubjects.length > 0 && (
          <div className="lb-subjects-card">
            <p className="lb-section-title">Your Top Subjects</p>
            {topSubjects.map((s, i) => (
              <div className="lb-subject-row" key={s.name}>
                <span className="lb-subject-medal">{i === 0 ? "🥇" : i === 1 ? "🥈" : "🥉"}</span>
                <span className="lb-subject-name">{s.name}</span>
                <span className="lb-subject-acc">{s.accuracy}%</span>
              </div>
            ))}
          </div>
        )}

        {/* ─ Achievement ─ */}
        {basic.longestStreak >= 7 && (
          <div className="lb-achievement">
            <div className="lb-achievement-icon">🏆</div>
            <div>
              <h4>Weekly Warrior</h4>
              <p>Maintained a {basic.longestStreak}-day streak!</p>
            </div>
          </div>
        )}

        {/* ─ Invite banner ─ */}
        <div className="lb-invite">
          <div className="lb-invite-left">
            <h3>🚀 Invite friends, climb higher!</h3>
            <p>Share MedBlitz with classmates and compete on the leaderboard</p>
          </div>
          <button
            className="lb-invite-btn"
            onClick={() => {
              navigator.clipboard.writeText(window.location.origin);
              alert("Link copied! Share with your friends 🎉");
            }}
          >
            📤 Share MedBlitz
          </button>
        </div>

        {/* ─ Coming soon ─ */}
        <div className="lb-coming-note">
          ✨ Multiplayer leaderboard with real-time rankings coming soon!
          <span>Invite friends and get ready to compete</span>
        </div>

      </div>
    </div>
  );
}