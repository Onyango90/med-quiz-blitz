// src/pages/HomeDashboard.jsx — warm cream redesign with rotating spotlight
import React, { useState, useEffect, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useStats } from "../hooks/useStats";
import { getDailyQuestions, getCurriculumLabel } from "../data/dailyChallengeQuestions";
import { getFirestore, doc, getDoc } from "firebase/firestore";
import { getDatabase, ref, get } from "firebase/database";
import {
  Gamepad2, BookOpen, Trophy, BarChart3, Settings,
  Flame, Sparkles, FileText, ChevronRight, ChevronLeft,
  Zap, Target, Clock, Star, Award, Menu, MessageSquare,
  FileUp, Swords, Home, TrendingUp, Radio,
} from "lucide-react";
import "./HomeDashboard.css";
import FeedbackForm from "../components/FeedbackForm";

const ADMIN_EMAIL = process.env.REACT_APP_ADMIN_EMAIL || "admin@medblitz.app";

const QUOTES = [
  "The expert in anything was once a beginner.",
  "Every question you answer is a patient you'll save.",
  "Consistency beats intensity. Show up daily.",
  "Knowledge is the best medicine you can carry.",
  "One question at a time. One day at a time.",
];

// ── Spotlight feature cards ───────────────────────────────────────────────────
const SPOTLIGHT_FEATURES = [
  {
    id: "daily",
    icon: "⚡", emoji_bg: "#fef9c3",
    label: "Daily Challenge",
    tagline: "Your daily dose of medicine",
    desc: "20 curated questions every day, tailored to your year. Build your streak, earn bonus XP, and stay consistent.",
    accent: "#0d7c6e", accent_lt: "#e6f7f4",
    action: "start-daily", cta: "Start Today's Challenge",
    stats: ["20 questions", "Streak XP", "Year-aware"],
  },
  {
    id: "games",
    icon: "🎮", emoji_bg: "#ede9fe",
    label: "Game Zone",
    tagline: "8 game modes. All live.",
    desc: "From Boss Battle to Diagnose in 3 Clues — every mode is a different way to test your knowledge under pressure.",
    accent: "#6d28d9", accent_lt: "#f3f0ff",
    action: "navigate", path: "/games-dashboard", cta: "Enter Game Zone",
    stats: ["8 modes", "Double XP", "Preclinical + Clinical"],
  },
  {
    id: "blitzhost",
    icon: "🔴", emoji_bg: "#fce7f3",
    label: "BlitzHost Live",
    tagline: "Host a live quiz session",
    desc: "Create, upload and run live quiz sessions for your students. Upload PDFs, generate AI questions, and monitor everyone in real time.",
    accent: "#0D7B65", accent_lt: "#d1fae5",
    action: "navigate", path: "/blitzhost", cta: "Host a Session",
    stats: ["Live sessions", "AI questions", "Real-time analytics"],
    adminOnly: true,
  },
  {
    id: "pdf",
    icon: "📄", emoji_bg: "#dcfce7",
    label: "PDF Quiz",
    tagline: "Your notes. Your questions.",
    desc: "Upload any PDF — lecture slides, past papers, textbook chapters. AI reads it and generates gamified questions instantly.",
    accent: "#15803d", accent_lt: "#dcfce7",
    action: "navigate", path: "/study-pdf-quiz", cta: "Upload & Play",
    stats: ["Any PDF", "AI-powered", "3 game modes"],
  },
  {
    id: "ai",
    icon: "✨", emoji_bg: "#fff7ed",
    label: "AI Quiz",
    tagline: "Custom questions on demand",
    desc: "Pick a subject, topic, difficulty and year — AI generates a fresh set of questions built just for you in seconds.",
    accent: "#b45309", accent_lt: "#fef9c3",
    action: "navigate", path: "/ai-quiz", cta: "Generate Questions",
    stats: ["All subjects", "Any difficulty", "Instant"],
  },
  {
    id: "study",
    icon: "📚", emoji_bg: "#e0f7fa",
    label: "Study Centre",
    tagline: "Browse. Learn. Master.",
    desc: "Topic-by-topic question banks across Anatomy, Physiology, Pharmacology, Pathology and more — filtered by year.",
    accent: "#0891b2", accent_lt: "#e0f7fa",
    action: "navigate", path: "/study-dashboard", cta: "Browse Topics",
    stats: ["All subjects", "Flashcard mode", "Year filter"],
  },
];

export default function HomeDashboard() {
  const navigate  = useNavigate();
  const location  = useLocation();
  const { currentUser, userData, loading: authLoading } = useAuth();
  const { stats, loading: statsLoading } = useStats();

  const [sidebarOpen,     setSidebarOpen]     = useState(window.innerWidth >= 1024);
  const [quote]                               = useState(() => QUOTES[Math.floor(Math.random() * QUOTES.length)]);
  const [dailyProgress,   setDailyProgress]   = useState({ answered: 0, total: 20, xpEarned: 0 });
  const [dailyComplete,   setDailyComplete]   = useState(false);
  const [userYearResolved,setUserYearResolved] = useState(null);
  const [time,            setTime]            = useState(new Date());
  const [showFeedback,    setShowFeedback]    = useState(false);
  const [spotIdx,         setSpotIdx]         = useState(0);
  const [spotAnim,        setSpotAnim]        = useState("in");
  const [spotAnimating,   setSpotAnimating]   = useState(false);
  const [isMobile,        setIsMobile]        = useState(window.innerWidth < 1024);

  const isAdmin  = currentUser?.email === ADMIN_EMAIL;
  const userName = currentUser?.displayName || userData?.profile?.name || localStorage.getItem("userName") || currentUser?.email?.split("@")[0] || "Doctor";

  const totalXP       = stats?.basic?.totalXP       || 0;
  const streak        = stats?.basic?.currentStreak  || 0;
  const accuracy      = stats?.basic?.accuracy       || 0;
  const totalAnswered = stats?.basic?.totalAttempted || 0;
  const userYear      = userYearResolved || userData?.profile?.year || localStorage.getItem("userYear") || 1;
  const streakBonus   = Math.min(20 + streak * 2, 40);
  const curriculumLabel = getCurriculumLabel(userYear);
  const dailyPct      = Math.round((dailyProgress.answered / dailyProgress.total) * 100);

  // Filter spotlight features — hide adminOnly cards for non-admins
  const visibleSpotFeatures = SPOTLIGHT_FEATURES.filter(f => !f.adminOnly || isAdmin);
  const spot = visibleSpotFeatures[spotIdx] || visibleSpotFeatures[0];

  const greeting = (() => {
    const h = time.getHours();
    if (h < 12) return "Good morning";
    if (h < 18) return "Good afternoon";
    return "Good evening";
  })();

  // Clock
  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 60000);
    return () => clearInterval(t);
  }, []);

  // Resize
  useEffect(() => {
    const onResize = () => {
      const mobile = window.innerWidth < 1024;
      setIsMobile(mobile);
      if (!mobile) setSidebarOpen(true);
      else setSidebarOpen(false);
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  // Firebase load
  useEffect(() => {
    if (!currentUser) return;
    const today = new Date().toISOString().split("T")[0];
    const load = async () => {
      try {
        const fs = getFirestore();
        const snap = await getDoc(doc(fs, "users", currentUser.uid));
        const year = snap.exists() ? snap.data()?.profile?.year : null;
        setUserYearResolved(year || localStorage.getItem("userYear") || 1);
        const rtdb = getDatabase();
        const chalSnap = await get(ref(rtdb, `users/${currentUser.uid}/dailyChallenges/${today}`));
        if (chalSnap.exists()) {
          const data = chalSnap.val();
          const levelsCompleted = data.levelsCompleted || 0;
          setDailyProgress({ answered: Math.min(levelsCompleted * 5, 20), total: 20, xpEarned: data.xpEarned || 0 });
          setDailyComplete(levelsCompleted >= 4);
        }
      } catch {
        const data = JSON.parse(localStorage.getItem("dailyChallenge") || "{}");
        if (data[today]) setDailyProgress(data[today]);
      }
    };
    load();
  }, [currentUser]);

  // Spotlight rotation
  const goSpot = useCallback((dir) => {
    if (spotAnimating) return;
    setSpotAnimating(true);
    setSpotAnim(dir === "right" ? "out-right" : "out-left");
    setTimeout(() => {
      setSpotIdx((i) => dir === "right"
        ? (i + 1) % visibleSpotFeatures.length
        : (i - 1 + visibleSpotFeatures.length) % visibleSpotFeatures.length
      );
      setSpotAnim("in");
      setSpotAnimating(false);
    }, 220);
  }, [spotAnimating, visibleSpotFeatures.length]);

  const goSpotTo = useCallback((idx) => {
    if (idx === spotIdx || spotAnimating) return;
    setSpotAnimating(true);
    setSpotAnim(idx > spotIdx ? "out-right" : "out-left");
    setTimeout(() => {
      setSpotIdx(idx);
      setSpotAnim("in");
      setSpotAnimating(false);
    }, 220);
  }, [spotIdx, spotAnimating]);

  const handleSpotCTA = () => {
    if (spot.action === "start-daily") {
      const questions = getDailyQuestions(parseInt(userYear));
      navigate("/daily-quiz", { state: { questions, isDailyChallenge: true, xpBonus: streakBonus, streak, topic: "Daily Challenge", userYear, questionsCount: dailyProgress.total } });
    } else if (spot.path) {
      navigate(spot.path);
    }
  };

  // Swipe support
  let touchX = 0;
  const onTouchStart = (e) => { touchX = e.touches[0].clientX; };
  const onTouchEnd   = (e) => {
    const dx = e.changedTouches[0].clientX - touchX;
    if (Math.abs(dx) > 50) goSpot(dx < 0 ? "right" : "left");
  };

  // Nav items
  const allNavItems = [
    { icon: BookOpen,  label: "Study Centre",    path: "/study-dashboard",  accent: "#0891b2", adminOnly: false, special: false },
    { icon: Gamepad2,  label: "Game Modes",       path: "/games-dashboard",  accent: "#6d28d9", adminOnly: false, special: false },
    { icon: Sparkles,  label: "AI Quiz",          path: "/ai-quiz",          accent: "#b45309", adminOnly: false, special: false },
    { icon: FileUp,    label: "PDF Quiz",          path: "/study-pdf-quiz",   accent: "#15803d", adminOnly: false, special: true,  price: "15" },
    { icon: FileText,  label: "Import Questions", path: "/import-questions", accent: "#10b981", adminOnly: true,  special: false },
    { icon: Radio,     label: "BlitzHost Live",   path: "/blitzhost",        accent: "#0D7B65", adminOnly: true,  special: false },
    { icon: Swords,    label: "Battle",           path: "/battle",           accent: "#dc2626", adminOnly: false, special: false },
    { icon: Trophy,    label: "Leaderboard",      path: "/leaderboard",      accent: "#ea580c", adminOnly: false, special: false },
    { icon: BarChart3, label: "My Stats",         path: "/stats",            accent: "#0891b2", adminOnly: false, special: false },
    { icon: Settings,  label: "Settings",         path: "/settings",         accent: "#7c3aed", adminOnly: false, special: false },
  ];
  const navItems = allNavItems.filter((i) => !i.adminOnly || isAdmin);

  // Bottom tab items (mobile)
  const bottomTabs = [
    { icon: Home,     label: "Home",   path: "/home" },
    { icon: BookOpen, label: "Study",  path: "/study-dashboard" },
    { icon: Gamepad2, label: "Games",  path: "/games-dashboard" },
    { icon: BarChart3,label: "Stats",  path: "/stats" },
    { icon: Settings, label: "More",   path: "/settings" },
  ];

  if (authLoading || statsLoading) {
    return (
      <div className="hd-loading">
        <div className="hd-loading-logo">M</div>
        <div className="hd-spinner" />
        <p>Loading your dashboard…</p>
      </div>
    );
  }

  return (
    <div className={`hd-root ${sidebarOpen && !isMobile ? "hd-sidebar-open" : "hd-sidebar-closed"}`}>

      {/* Warm background */}
      <div className="hd-bg" aria-hidden="true">
        <div className="hd-bg-blob hd-bg-1" style={{ background: `radial-gradient(circle, ${spot.accent}18 0%, transparent 70%)` }} />
        <div className="hd-bg-blob hd-bg-2" />
        <div className="hd-bg-blob hd-bg-3" />
      </div>

      {/* Mobile overlay */}
      {sidebarOpen && isMobile && (
        <div className="hd-overlay" onClick={() => setSidebarOpen(false)} />
      )}

      {/* ════════════════════════════════════
          SIDEBAR
      ════════════════════════════════════ */}
      <aside className={`hd-sidebar ${sidebarOpen ? "hd-sb-open" : "hd-sb-closed"} ${isMobile ? "hd-sb-mobile" : ""}`}>
        <div className="hd-sb-logo">
          <div className="hd-logo-mark">M</div>
          {sidebarOpen && <span className="hd-logo-text">MedBlitz</span>}
        </div>

        <nav className="hd-sb-nav">
          {navItems.map((item) => (
            <button
              key={item.path}
              className={`hd-sb-item ${item.special ? "hd-sb-item--special" : ""} ${location.pathname === item.path ? "hd-sb-item--active" : ""}`}
              style={{ "--accent": item.accent }}
              onClick={() => {
                navigate(item.path);
                if (isMobile) setSidebarOpen(false);
              }}
              title={item.label}
            >
              <item.icon size={18} className="hd-sb-icon" />
              {sidebarOpen && (
                <>
                  <span className="hd-sb-label">{item.label}</span>
                  {item.price && <span className="hd-sb-price">KES {item.price}</span>}
                </>
              )}
            </button>
          ))}
        </nav>

        {!isMobile && (
          <button className="hd-sb-toggle" onClick={() => setSidebarOpen((v) => !v)}>
            <ChevronRight size={15} className={`hd-sb-chevron ${sidebarOpen ? "flipped" : ""}`} />
          </button>
        )}
      </aside>

      {/* ════════════════════════════════════
          MAIN CONTENT
      ════════════════════════════════════ */}
      <main className="hd-main">

        {/* ── Top bar ── */}
        <header className="hd-topbar">
          <div className="hd-topbar-left">
            {isMobile && (
              <button className="hd-hamburger" onClick={() => setSidebarOpen((v) => !v)}>
                <Menu size={20} />
              </button>
            )}
            <div className="hd-greeting">
              <p className="hd-greeting-sub">{greeting} 👋</p>
              <h1 className="hd-greeting-name">Dr. {userName}</h1>
            </div>
          </div>
          <div className="hd-topbar-right">
            {streak > 0 && (
              <div className="hd-streak-pill">
                <Flame size={13} />
                <span>{streak}d</span>
              </div>
            )}
            <div className="hd-xp-pill">
              <Star size={13} />
              <span>{totalXP.toLocaleString()}</span>
            </div>
            <div className="hd-time">
              {time.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
            </div>
          </div>
        </header>

        <div className="hd-content">

          {/* ── Quote ── */}
          <div className="hd-quote">
            <span>💡</span>
            <p>"{quote}"</p>
          </div>

          {/* ── Stats row ── */}
          <div className="hd-stats-row">
            {[
              { icon: Zap,    label: "XP",       value: totalXP.toLocaleString(), color: "#b45309", bg: "#fef9c3", border: "#fde68a" },
              { icon: Target, label: "Accuracy",  value: `${accuracy}%`,           color: "#0d7c6e", bg: "#e6f7f4", border: "#a7f3d0" },
              { icon: Flame,  label: "Streak",    value: `${streak}d`,             color: "#dc2626", bg: "#fee2e2", border: "#fecaca" },
              { icon: Clock,  label: "Questions", value: totalAnswered.toLocaleString(), color: "#6d28d9", bg: "#f3f0ff", border: "#ddd6fe" },
            ].map((s) => (
              <div key={s.label} className="hd-stat-card" style={{ "--sc": s.color, "--sb": s.bg, "--sbd": s.border }}>
                <div className="hd-stat-icon"><s.icon size={16} /></div>
                <div>
                  <p className="hd-stat-value">{s.value}</p>
                  <p className="hd-stat-label">{s.label}</p>
                </div>
              </div>
            ))}
          </div>

          {/* ══════════════════════════════════════════════
              ROTATING SPOTLIGHT HERO
          ══════════════════════════════════════════════ */}
          <section className="hd-spot-section">
            <div className="hd-spot-header">
              <span className="hd-spot-heading">Featured</span>
              <div className="hd-spot-dots">
                {visibleSpotFeatures.map((f, i) => (
                  <button
                    key={f.id}
                    className={`hd-spot-dot ${i === spotIdx ? "hd-spot-dot-on" : ""}`}
                    style={i === spotIdx ? { background: spot.accent, width: 20 } : {}}
                    onClick={() => goSpotTo(i)}
                  />
                ))}
              </div>
            </div>

            <div
              className="hd-spot-carousel"
              onTouchStart={onTouchStart}
              onTouchEnd={onTouchEnd}
            >
              <button className="hd-spot-arrow hd-spot-arrow-l" onClick={() => goSpot("left")} style={{ "--sa": spot.accent, "--sa-lt": spot.accent_lt }}>
                <ChevronLeft size={18} />
              </button>

              <div className={`hd-spotlight hd-spot-${spotAnim}`} style={{ "--accent": spot.accent, "--accent-lt": spot.accent_lt }}>
                {/* Top colour stripe */}
                <div className="hd-spot-stripe" style={{ background: spot.accent }} />

                {/* Counter */}
                <div className="hd-spot-counter">{spotIdx + 1}/{visibleSpotFeatures.length}</div>

                {/* Decorative circle */}
                <div className="hd-spot-deco" style={{ background: `${spot.accent}10` }} />

                {/* Content */}
                <div className="hd-spot-top">
                  <div className="hd-spot-emoji-bubble" style={{ background: spot.emoji_bg, boxShadow: `0 6px 20px ${spot.accent}25` }}>
                    <span className="hd-spot-emoji">{spot.icon}</span>
                  </div>
                  <div className="hd-spot-top-right">
                    {spot.id === "daily" ? (
                      <div className="hd-spot-daily-ring">
                        <svg viewBox="0 0 44 44" className="hd-spot-ring-svg">
                          <circle cx="22" cy="22" r="18" className="hd-spot-ring-bg" />
                          <circle cx="22" cy="22" r="18" className="hd-spot-ring-fill"
                            strokeDasharray={`${dailyPct * 1.131} 113.1`}
                            stroke={spot.accent}
                            transform="rotate(-90 22 22)"
                          />
                        </svg>
                        <span className="hd-spot-ring-label">{dailyPct}%</span>
                      </div>
                    ) : null}
                    <span className="hd-spot-tag" style={{ color: spot.accent, background: spot.accent_lt, border: `1.5px solid ${spot.accent}35` }}>
                      {spot.label}
                    </span>
                  </div>
                </div>

                <div className="hd-spot-body">
                  <h2 className="hd-spot-title">{spot.tagline}</h2>
                  <p className="hd-spot-desc">{spot.desc}</p>
                </div>

                {/* Stat pills */}
                <div className="hd-spot-stats">
                  {spot.stats.map((s) => (
                    <div key={s} className="hd-spot-stat" style={{ borderColor: `${spot.accent}30`, background: spot.accent_lt }}>
                      <Zap size={9} style={{ color: spot.accent }} />
                      <span>{s}</span>
                    </div>
                  ))}
                </div>

                {/* Daily-specific progress bar */}
                {spot.id === "daily" && (
                  <div className="hd-spot-daily-bar">
                    <div className="hd-spot-bar-row">
                      <span className="hd-spot-bar-label">{curriculumLabel}</span>
                      <span className="hd-spot-bar-count">{dailyProgress.answered}/{dailyProgress.total}</span>
                    </div>
                    <div className="hd-spot-bar-track">
                      <div className="hd-spot-bar-fill" style={{ width: `${dailyPct}%`, background: spot.accent }} />
                    </div>
                  </div>
                )}

                {/* CTA */}
                <button
                  className="hd-spot-cta"
                  style={{ background: spot.accent }}
                  onClick={handleSpotCTA}
                  disabled={spot.id === "daily" && dailyComplete}
                >
                  {spot.id === "daily" && dailyComplete ? (
                    <><Award size={15} /> Done for today!</>
                  ) : (
                    <><Zap size={15} /> {spot.cta}</>
                  )}
                </button>
              </div>

              <button className="hd-spot-arrow hd-spot-arrow-r" onClick={() => goSpot("right")} style={{ "--sa": spot.accent, "--sa-lt": spot.accent_lt }}>
                <ChevronRight size={18} />
              </button>
            </div>
          </section>

          {/* ── Feedback banner ── */}
          <div className="hd-feedback-banner" onClick={() => setShowFeedback(true)}>
            <div className="hd-fb-left">
              <span className="hd-fb-icon">💬</span>
              <div>
                <p className="hd-fb-title">Share your feedback</p>
                <p className="hd-fb-sub">Help us make MedBlitz better</p>
              </div>
            </div>
            <button className="hd-fb-btn"><MessageSquare size={14} /> Give Feedback</button>
          </div>

        </div>

        {isMobile && <div style={{ height: 80 }} />}
      </main>

      {/* ════════════════════════════════════
          BOTTOM TAB BAR (mobile only)
      ════════════════════════════════════ */}
      {isMobile && (
        <nav className="hd-bottom-tabs">
          {bottomTabs.map((t) => {
            const active = location.pathname === t.path;
            return (
              <button
                key={t.path}
                className={`hd-bottom-tab ${active ? "hd-bt-active" : ""}`}
                onClick={() => navigate(t.path)}
              >
                <t.icon size={20} />
                <span>{t.label}</span>
              </button>
            );
          })}
        </nav>
      )}

      {/* FAB */}
      <button className="hd-fab" onClick={() => setShowFeedback(true)} title="Give feedback">
        <MessageSquare size={19} />
      </button>

      {showFeedback && <FeedbackForm onClose={() => setShowFeedback(false)} />}
    </div>
  );
}