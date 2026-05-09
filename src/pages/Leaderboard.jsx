// src/pages/Leaderboard.jsx
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useStats } from "../hooks/useStats";
import { getDatabase, ref, get } from "firebase/database";
import { getFirestore, doc, getDoc } from "firebase/firestore";
import { ArrowLeft, Trophy, Zap, Flame, BookOpen, Users, Share2 } from "lucide-react";
import "./Leaderboard.css";

const TIER_CONFIG = [
  { min: 1000, label: "Elite",      icon: "👑", color: "#f59e0b" },
  { min: 500,  label: "Gold",       icon: "🏆", color: "#f59e0b" },
  { min: 200,  label: "Silver",     icon: "⭐", color: "#94a3b8" },
  { min: 50,   label: "Bronze",     icon: "🌟", color: "#b45309" },
  { min: 0,    label: "Starter",    icon: "🎓", color: "#0D7B65" },
];

const getTier = (xp) => TIER_CONFIG.find((t) => xp >= t.min) || TIER_CONFIG[TIER_CONFIG.length - 1];

const TABS = [
  { id: "xp",       label: "Top XP",     icon: <Zap size={13} /> },
  { id: "questions",label: "Questions",  icon: <BookOpen size={13} /> },
  { id: "streak",   label: "Streak",     icon: <Flame size={13} /> },
];

export default function Leaderboard() {
  const navigate  = useNavigate();
  const { currentUser } = useAuth();
  const { stats, loading } = useStats();
  const [activeTab, setActiveTab]   = useState("xp");
  const [userName,  setUserName]    = useState("You");
  const [copied,    setCopied]      = useState(false);

  // Resolve display name from Firestore profile if needed
  useEffect(() => {
    if (!currentUser) return;
    const resolve = async () => {
      try {
        const snap = await getDoc(doc(getFirestore(), "users", currentUser.uid));
        const name = snap.exists()
          ? snap.data()?.profile?.name
          : null;
        setUserName(
          name ||
          currentUser.displayName ||
          currentUser.email?.split("@")[0] ||
          "You"
        );
      } catch {
        setUserName(currentUser.displayName || currentUser.email?.split("@")[0] || "You");
      }
    };
    resolve();
  }, [currentUser]);

  if (loading || !stats) {
    return (
      <div className="lb-loading">
        <div className="lb-spinner" />
        <p>Loading your stats…</p>
      </div>
    );
  }

  const { basic, subjects = [] } = stats;
  const tier = getTier(basic.totalXP);

  const nextMilestone =
    basic.totalXP >= 1000 ? 2000
    : basic.totalXP >= 500  ? 1000
    : basic.totalXP >= 200  ? 500
    : basic.totalXP >= 50   ? 200 : 50;
  const xpPct = Math.min(Math.round((basic.totalXP / nextMilestone) * 100), 100);

  const scoreFor = {
    xp:        `${basic.totalXP} XP`,
    questions: `${basic.totalAttempted} Qs`,
    streak:    `${basic.currentStreak} days`,
  };

  const topSubjects = [...subjects]
    .filter((s) => s.attempted > 0)
    .sort((a, b) => b.accuracy - a.accuracy)
    .slice(0, 3);

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.origin).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    });
  };

  return (
    <div className="lb-page">
      {/* Top bar */}
      <header className="lb-topbar">
        <button className="lb-back-btn" onClick={() => navigate("/home")}>
          <ArrowLeft size={16} />
        </button>
        <div className="lb-topbar-title">
          <Trophy size={16} />
          <span>Leaderboard</span>
        </div>
        <div className="lb-topbar-right" />
      </header>

      <div className="lb-scroll">

        {/* ── Hero card ─────────────────────────────── */}
        <div className="lb-hero">
          <div className="lb-hero-glow" />

          <div className="lb-hero-top">
            <div className="lb-avatar">
              <span>{(userName[0] || "?").toUpperCase()}</span>
            </div>
            <div className="lb-hero-id">
              <p className="lb-hero-name">{userName}</p>
              <span className="lb-hero-tier" style={{ color: tier.color }}>
                {tier.icon} {tier.label} Tier
              </span>
            </div>
          </div>

          {/* Stats row */}
          <div className="lb-stats-row">
            {[
              { val: basic.totalXP,         label: "Total XP",   accent: "#0D7B65" },
              { val: basic.totalAttempted,   label: "Questions",  accent: "#7c3aed" },
              { val: `${basic.accuracy}%`,   label: "Accuracy",   accent: "#f59e0b" },
              { val: basic.currentStreak,    label: "Streak 🔥",  accent: "#dc2626" },
            ].map((s) => (
              <div className="lb-stat-pill" key={s.label}>
                <span className="lb-stat-val" style={{ color: s.accent }}>{s.val}</span>
                <span className="lb-stat-label">{s.label}</span>
              </div>
            ))}
          </div>

          {/* XP progress */}
          <div className="lb-xp-section">
            <div className="lb-xp-labels">
              <span>Progress to {nextMilestone} XP</span>
              <span>{nextMilestone - basic.totalXP} XP to go</span>
            </div>
            <div className="lb-xp-track">
              <div className="lb-xp-fill" style={{ width: `${xpPct}%` }} />
            </div>
          </div>
        </div>

        {/* ── Tabs ──────────────────────────────────── */}
        <div className="lb-tabs">
          {TABS.map((t) => (
            <button
              key={t.id}
              className={`lb-tab ${activeTab === t.id ? "lb-tab--active" : ""}`}
              onClick={() => setActiveTab(t.id)}
            >
              {t.icon}
              <span>{t.label}</span>
            </button>
          ))}
        </div>

        {/* ── Rankings card ─────────────────────────── */}
        <div className="lb-card">
          <div className="lb-card-header">
            <span className="lb-col-rank">#</span>
            <span className="lb-col-player">Player</span>
            <span className="lb-col-score">Score</span>
          </div>

          {/* You — always 1st for now */}
          <div className="lb-row lb-row--you lb-row--gold">
            <span className="lb-col-rank lb-medal">🥇</span>
            <div className="lb-col-player lb-row-info">
              <span className="lb-row-name">{userName}</span>
              <span className="lb-row-sub">That's you! 🎉</span>
            </div>
            <span className="lb-col-score lb-row-score">{scoreFor[activeTab]}</span>
          </div>

          <div className="lb-row lb-row--empty">
            <span className="lb-col-rank lb-medal">🥈</span>
            <div className="lb-col-player lb-row-info">
              <span className="lb-row-name">Coming Soon</span>
              <span className="lb-row-sub">Invite friends to compete!</span>
            </div>
            <span className="lb-col-score lb-row-score lb-dash">—</span>
          </div>

          <div className="lb-row lb-row--empty">
            <span className="lb-col-rank lb-medal">🥉</span>
            <div className="lb-col-player lb-row-info">
              <span className="lb-row-name">Coming Soon</span>
              <span className="lb-row-sub">Invite friends to compete!</span>
            </div>
            <span className="lb-col-score lb-row-score lb-dash">—</span>
          </div>
        </div>

        {/* ── Top subjects ──────────────────────────── */}
        {topSubjects.length > 0 && (
          <div className="lb-card lb-subjects-card">
            <p className="lb-section-title">
              <BookOpen size={14} /> Your Top Subjects
            </p>
            {topSubjects.map((s, i) => (
              <div className="lb-subject-row" key={s.name}>
                <span className="lb-subject-medal">
                  {i === 0 ? "🥇" : i === 1 ? "🥈" : "🥉"}
                </span>
                <span className="lb-subject-name">{s.name}</span>
                <div className="lb-subject-bar-wrap">
                  <div
                    className="lb-subject-bar"
                    style={{ width: `${s.accuracy}%` }}
                  />
                </div>
                <span className="lb-subject-pct">{s.accuracy}%</span>
              </div>
            ))}
          </div>
        )}

        {/* ── Achievement badge ─────────────────────── */}
        {basic.longestStreak >= 7 && (
          <div className="lb-achievement">
            <span className="lb-achievement-icon">🏆</span>
            <div className="lb-achievement-text">
              <strong>Weekly Warrior</strong>
              <span>You kept a {basic.longestStreak}-day streak!</span>
            </div>
          </div>
        )}

        {/* ── Invite banner ─────────────────────────── */}
        <div className="lb-invite">
          <div className="lb-invite-copy">
            <Users size={16} />
            <div>
              <strong>Climb higher — invite friends</strong>
              <p>Share MedBlitz and compete on the board</p>
            </div>
          </div>
          <button className="lb-invite-btn" onClick={handleShare}>
            <Share2 size={14} />
            {copied ? "Copied! 🎉" : "Share"}
          </button>
        </div>

        {/* ── Coming soon note ──────────────────────── */}
        <div className="lb-coming-note">
          <span className="lb-coming-icon">✨</span>
          <div>
            <strong>Real-time multiplayer leaderboard coming soon</strong>
            <span>Invite classmates and get ready to compete</span>
          </div>
        </div>

        <div className="lb-bottom-pad" />
      </div>
    </div>
  );
}