// src/pages/HomeDashboard.jsx  — full redesign
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useStats } from "../hooks/useStats";
import { getDailyQuestions } from "../data/dailyChallengeQuestions";
import {
  Gamepad2, Swords, BookOpen, Trophy,
  BarChart3, Settings, Flame, Sparkles,
  FileText, ChevronRight, Zap, Target,
  Clock, TrendingUp, Star, Award
} from "lucide-react";
import "./HomeDashboard.css";

// ── Motivational quotes ───────────────────────────────────────────────────────
const QUOTES = [
  "The expert in anything was once a beginner.",
  "Every question you answer is a patient you'll save.",
  "Consistency beats intensity. Show up daily.",
  "Knowledge is the best medicine you can carry.",
  "One question at a time. One day at a time.",
];

export default function HomeDashboard() {
  const navigate = useNavigate();
  const { currentUser, userData, loading: authLoading } = useAuth();
  const { stats, loading: statsLoading } = useStats();
  const [sidebarOpen, setSidebarOpen] = useState(window.innerWidth >= 1024);
  const [quote] = useState(() => QUOTES[Math.floor(Math.random() * QUOTES.length)]);
  const [dailyProgress, setDailyProgress] = useState({ answered: 0, total: 20, xpEarned: 0 });
  const [time, setTime] = useState(new Date());

  const userName = currentUser?.displayName ||
    localStorage.getItem("userName") ||
    currentUser?.email?.split("@")[0] ||
    "Doctor";

  const totalXP      = stats?.basic?.totalXP       || 0;
  const streak       = stats?.basic?.currentStreak  || 0;
  const accuracy     = stats?.basic?.accuracy       || 0;
  const totalAnswered= stats?.basic?.totalAttempted || 0;
  const userYear     = userData?.profile?.year      || 2;
  const streakBonus  = Math.min(20 + streak * 2, 40);

  // Clock
  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 60000);
    return () => clearInterval(t);
  }, []);

  // Daily progress
  useEffect(() => {
    const today = new Date().toISOString().split("T")[0];
    const data  = JSON.parse(localStorage.getItem("dailyChallenge")) || {};
    if (data[today]) setDailyProgress(data[today]);
  }, []);

  if (authLoading || statsLoading) {
    return (
      <div className="hd-loading">
        <div className="hd-spinner" />
        <p>Loading your dashboard…</p>
      </div>
    );
  }

  const dailyPct = Math.round((dailyProgress.answered / dailyProgress.total) * 100);
  const greeting = (() => {
    const h = time.getHours();
    if (h < 12) return "Good morning";
    if (h < 18) return "Good afternoon";
    return "Good evening";
  })();

  const startDaily = () => {
    const questions = getDailyQuestions(parseInt(userYear));
    navigate("/daily-quiz", {
      state: {
        questions,
        isDailyChallenge: true,
        xpBonus: streakBonus,
        streak,
        topic: "Daily Challenge",
        userYear,
        questionsCount: dailyProgress.total,
      },
    });
  };

  // ── Nav items ───────────────────────────────────────────────────────────────
  const navItems = [
    { icon: BookOpen,  label: "Study Centre",    path: "/study-dashboard",   accent: "#2a9d8f" },
    { icon: Gamepad2,  label: "Game Modes",       path: "/games-dashboard",   accent: "#6366f1" },
    { icon: Sparkles,  label: "AI Quiz",          path: "/ai-quiz",           accent: "#f59e0b" },
    { icon: FileText,  label: "Import Questions", path: "/import-questions",  accent: "#10b981" },
    { icon: Swords,    label: "Battle",           path: "/battle",            accent: "#ef4444" },
    { icon: Trophy,    label: "Leaderboard",      path: "/leaderboard",       accent: "#f97316" },
    { icon: BarChart3, label: "My Stats",         path: "/stats",             accent: "#3b82f6" },
    { icon: Settings,  label: "Settings",         path: "/settings",          accent: "#8b5cf6" },
  ];

  // ── Quick action cards ──────────────────────────────────────────────────────
  const quickActions = [
    {
      icon: BookOpen, label: "Study Centre",
      desc: "Browse topics & flashcards",
      path: "/study-dashboard", color: "teal",
    },
    {
      icon: Gamepad2, label: "Game Modes",
      desc: "Rapid fire & timed quizzes",
      path: "/games-dashboard", color: "indigo",
    },
    {
      icon: Sparkles, label: "AI Quiz",
      desc: "Generate custom questions",
      path: "/ai-quiz", color: "amber",
    },
    {
      icon: Trophy, label: "Leaderboard",
      desc: "See how you rank",
      path: "/leaderboard", color: "orange",
    },
  ];

  return (
    <div className={`hd-root ${sidebarOpen ? "sidebar-open" : "sidebar-closed"}`}>

      {/* ── Sidebar ───────────────────────────────────────────────────────── */}
      <aside className={`hd-sidebar ${sidebarOpen ? "open" : "closed"}`}>
        <div className="hd-sidebar-logo">
          <div className="hd-logo-mark">M</div>
          {sidebarOpen && <span className="hd-logo-text">MedBlitz</span>}
        </div>

        <nav className="hd-nav">
          {navItems.map((item) => (
            <button
              key={item.path}
              className="hd-nav-item"
              style={{ "--accent": item.accent }}
              onClick={() => navigate(item.path)}
              title={item.label}
            >
              <item.icon size={18} className="hd-nav-icon" />
              {sidebarOpen && <span className="hd-nav-label">{item.label}</span>}
            </button>
          ))}
        </nav>

        <button
          className="hd-sidebar-toggle"
          onClick={() => setSidebarOpen((v) => !v)}
          title={sidebarOpen ? "Collapse" : "Expand"}
        >
          <ChevronRight size={16} className={`hd-chevron ${sidebarOpen ? "flipped" : ""}`} />
        </button>
      </aside>

      {/* ── Main ─────────────────────────────────────────────────────────── */}
      <main className="hd-main">

        {/* ── Top bar ─────────────────────────────────────────────────── */}
        <header className="hd-topbar">
          <div className="hd-topbar-left">
            <button
              className="hd-hamburger"
              onClick={() => setSidebarOpen((v) => !v)}
            >
              <span /><span /><span />
            </button>
            <div className="hd-greeting">
              <p className="hd-greeting-sub">{greeting} 👋</p>
              <h1 className="hd-greeting-name">Dr. {userName}</h1>
            </div>
          </div>

          <div className="hd-topbar-right">
            {streak > 0 && (
              <div className="hd-streak-pill">
                <Flame size={14} />
                <span>{streak} day streak</span>
              </div>
            )}
            <div className="hd-xp-pill">
              <Star size={14} />
              <span>{totalXP.toLocaleString()} XP</span>
            </div>
            <div className="hd-time">
              {time.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
            </div>
          </div>
        </header>

        <div className="hd-content">

          {/* ── Quote banner ───────────────────────────────────────────── */}
          <div className="hd-quote">
            <span className="hd-quote-icon">💡</span>
            <p>"{quote}"</p>
          </div>

          {/* ── Stats row ──────────────────────────────────────────────── */}
          <div className="hd-stats-row">
            {[
              { icon: Zap,       label: "Total XP",       value: totalXP.toLocaleString(),         color: "amber"  },
              { icon: Target,    label: "Accuracy",        value: `${accuracy}%`,                   color: "teal"   },
              { icon: Flame,     label: "Day Streak",      value: streak,                           color: "coral"  },
              { icon: Clock,     label: "Qs Answered",     value: totalAnswered.toLocaleString(),   color: "indigo" },
            ].map((s) => (
              <div key={s.label} className={`hd-stat-card hd-stat-${s.color}`}>
                <div className="hd-stat-icon-wrap">
                  <s.icon size={18} />
                </div>
                <div>
                  <p className="hd-stat-value">{s.value}</p>
                  <p className="hd-stat-label">{s.label}</p>
                </div>
              </div>
            ))}
          </div>

          {/* ── Daily Challenge hero ────────────────────────────────────── */}
          <div className="hd-daily">
            {/* Background mesh */}
            <div className="hd-daily-bg" aria-hidden="true">
              <div className="hd-daily-orb hd-orb-1" />
              <div className="hd-daily-orb hd-orb-2" />
              <div className="hd-daily-orb hd-orb-3" />
            </div>

            <div className="hd-daily-inner">
              {/* Left */}
              <div className="hd-daily-left">
                <div className="hd-daily-badge">
                  <Zap size={12} />
                  <span>Daily Challenge</span>
                </div>

                <h2 className="hd-daily-title">
                  {dailyPct === 100 ? "Challenge Complete! 🎉" : "Today's Blitz"}
                </h2>
                <p className="hd-daily-sub">
                  {dailyPct === 100
                    ? "Exceptional work. Come back tomorrow for more!"
                    : `${dailyProgress.total - dailyProgress.answered} questions remaining · +${streakBonus} streak bonus XP`}
                </p>

                {/* Progress bar */}
                <div className="hd-daily-progress-wrap">
                  <div className="hd-daily-progress-row">
                    <span>{dailyProgress.answered} / {dailyProgress.total} completed</span>
                    <span className="hd-daily-pct">{dailyPct}%</span>
                  </div>
                  <div className="hd-daily-track">
                    <div
                      className="hd-daily-fill"
                      style={{ width: `${dailyPct}%` }}
                    >
                      <div className="hd-daily-shimmer" />
                    </div>
                  </div>
                </div>

                <button
                  className="hd-daily-btn"
                  onClick={startDaily}
                  disabled={dailyPct === 100}
                >
                  {dailyPct === 0
                    ? <><Zap size={16} /> Start Today's Blitz</>
                    : dailyPct === 100
                    ? <><Award size={16} /> Completed</>
                    : <><Zap size={16} /> Continue</>}
                </button>
              </div>

              {/* Right: streak & stats */}
              <div className="hd-daily-right">
                <div className="hd-daily-streak-ring">
                  <div className="hd-daily-streak-inner">
                    <Flame size={28} className="hd-daily-flame" />
                    <span className="hd-daily-streak-num">{streak}</span>
                    <span className="hd-daily-streak-label">day streak</span>
                  </div>
                </div>

                <div className="hd-daily-mini-stats">
                  <div className="hd-daily-mini">
                    <TrendingUp size={14} />
                    <span>+{streakBonus} bonus XP</span>
                  </div>
                  <div className="hd-daily-mini">
                    <Star size={14} />
                    <span>{dailyProgress.xpEarned || 0} earned today</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Particles */}
            <div className="hd-daily-particles" aria-hidden="true">
              {Array.from({ length: 18 }).map((_, i) => (
                <span
                  key={i}
                  className="hd-particle"
                  style={{
                    left: `${(i * 37 + 11) % 100}%`,
                    top:  `${(i * 53 + 7)  % 100}%`,
                    animationDelay: `${(i * 0.4) % 3}s`,
                    animationDuration: `${2.5 + (i % 4) * 0.7}s`,
                  }}
                />
              ))}
            </div>
          </div>

          {/* ── Quick actions ───────────────────────────────────────────── */}
          <section className="hd-section">
            <h2 className="hd-section-title">Quick Actions</h2>
            <div className="hd-quick-grid">
              {quickActions.map((a) => (
                <button
                  key={a.path}
                  className={`hd-quick-card hd-quick-${a.color}`}
                  onClick={() => navigate(a.path)}
                >
                  <div className="hd-quick-icon">
                    <a.icon size={22} />
                  </div>
                  <div className="hd-quick-text">
                    <span className="hd-quick-label">{a.label}</span>
                    <span className="hd-quick-desc">{a.desc}</span>
                  </div>
                  <ChevronRight size={16} className="hd-quick-arrow" />
                </button>
              ))}
            </div>
          </section>

          {/* ── Streak motivation ───────────────────────────────────────── */}
          {streak >= 3 && (
            <div className="hd-motivation">
              <Flame size={18} />
              <span>
                {streak >= 14
                  ? `🔥 ${streak} days strong! You're unstoppable!`
                  : streak >= 7
                  ? `🔥 ${streak} day streak! You're on fire!`
                  : `🔥 ${streak} days in a row! Keep it up!`}
              </span>
            </div>
          )}

        </div>
      </main>
    </div>
  );
}
