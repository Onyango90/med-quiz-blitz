// src/pages/AdminDashboard.jsx
import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
  getFirestore, collection, getDocs, doc,
  setDoc, query, orderBy, limit, where,
  getDoc, Timestamp,
} from "firebase/firestore";
import { getDatabase, ref, get } from "firebase/database";
import "./AdminDashboard.css";

const ADMIN_EMAILS = ["chrisonyango25@gmail.com"];

const QUESTION_BANKS = [
  { key: "pharmacology",       label: "Pharmacology",       year: [2,3,4,5,6], count: 50  },
  { key: "pathology",          label: "Pathology",          year: [3,4,5,6],   count: 53  },
  { key: "haematology",        label: "Haematology",        year: [3,4,5,6],   count: 54  },
  { key: "physiology_level2",  label: "Physiology L2",      year: [2,3,4,5,6], count: 82  },
  { key: "physiology_level1",  label: "Physiology L1",      year: [1,2],       count: 10  },
  { key: "clinical_chemistry", label: "Clinical Chemistry", year: [4,5,6],     count: 26  },
  { key: "immunology",         label: "Immunology",         year: [2,3,4,5,6], count: 20  },
  { key: "microbiology",       label: "Microbiology",       year: [2,3,4,5,6], count: 10  },
  { key: "gross_anatomy",      label: "Gross Anatomy",      year: [1,2],       count: 115 },
  { key: "histology",          label: "Histology",          year: [1,2],       count: 5   },
  { key: "embryology",         label: "Embryology",         year: [1],         count: 5   },
  { key: "antibiotics",        label: "Antibiotics",        year: [2,3,4,5,6], count: 23  },
  { key: "clinicalSkills",     label: "Clinical Skills",    year: [2,3],       count: 100 },
  { key: "antiparasitics",     label: "Antiparasitics",     year: [3,4,5,6],   count: 4   },
  { key: "antifungals",        label: "Antifungals",        year: [3,4,5,6],   count: 1   },
];

const TABS = ["overview", "analytics", "users", "questions", "add-question", "feedback"];
const TAB_LABELS = {
  overview:        "Overview",
  analytics:       "Analytics",
  users:           "Users",
  questions:       "Questions",
  "add-question":  "Add Question",
  feedback:        "Feedback",
};
const TAB_ICONS = {
  overview:        "◉",
  analytics:       "↗",
  users:           "⊙",
  questions:       "≡",
  "add-question":  "+",
  feedback:        "◎",
};

const BLANK_QUESTION = {
  id: "", type: "mcq", subject: "Pharmacology", topic: "",
  difficulty: "medium", year: 2, source: "",
  question: "", options: ["", "", "", ""],
  answer: "", explanation: "",
};

// ── Helpers ───────────────────────────────────────────────────────────────────
function fmtNum(n) {
  if (n >= 1000) return (n / 1000).toFixed(1) + "k";
  return String(n);
}
function daysSince(dateStr) {
  if (!dateStr) return null;
  const diff = Date.now() - new Date(dateStr).getTime();
  return Math.floor(diff / 86400000);
}
function getLastNDays(n) {
  return Array.from({ length: n }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (n - 1 - i));
    return d.toISOString().split("T")[0];
  });
}

// ── Sparkline SVG ─────────────────────────────────────────────────────────────
function Sparkline({ data = [], color = "#0d9488", height = 36 }) {
  if (!data.length) return null;
  const max  = Math.max(...data, 1);
  const w    = 120;
  const pts  = data.map((v, i) => {
    const x = (i / (data.length - 1)) * w;
    const y = height - (v / max) * (height - 4) - 2;
    return `${x},${y}`;
  }).join(" ");
  return (
    <svg width={w} height={height} style={{ overflow: "visible" }}>
      <polyline points={pts} fill="none" stroke={color} strokeWidth="2"
        strokeLinecap="round" strokeLinejoin="round" />
      <polyline points={`0,${height} ${pts} ${w},${height}`}
        fill={color} fillOpacity="0.1" stroke="none" />
    </svg>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
export default function AdminDashboard() {
  const navigate = useNavigate();
  const { currentUser, loading: authLoading } = useAuth();
  const [tab,         setTab]         = useState("overview");
  const [users,       setUsers]       = useState([]);
  const [feedback,    setFeedback]    = useState([]);
  const [loadingData, setLoadingData] = useState(false);
  const [saveMsg,     setSaveMsg]     = useState("");
  const [newQ,        setNewQ]        = useState({ ...BLANK_QUESTION });
  const [userSearch,  setUserSearch]  = useState("");
  const [sortBy,      setSortBy]      = useState("xp");

  // ── Analytics state ───────────────────────────────────────────────────────
  const [dailyStats,    setDailyStats]    = useState([]);   // last 14 days
  const [sessionStats,  setSessionStats]  = useState([]);   // recent sessions
  const [topUsers,      setTopUsers]      = useState([]);
  const [gameModeStats, setGameModeStats] = useState({});
  const [analyticsLoad, setAnalyticsLoad] = useState(false);
  const [rtdbStats,     setRtdbStats]     = useState({
    totalDailyChallenges: 0,
    totalBlitzSessions: 0,
  });

  // ── Auth guard ────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!authLoading && (!currentUser || !ADMIN_EMAILS.includes(currentUser.email))) {
      navigate("/home");
    }
  }, [currentUser, authLoading, navigate]);

  // ── Load users ────────────────────────────────────────────────────────────
  const loadUsers = useCallback(async () => {
    setLoadingData(true);
    try {
      const db   = getFirestore();
      const snap = await getDocs(collection(db, "users"));
      setUsers(snap.docs.map(d => ({ uid: d.id, ...d.data() })));
    } catch (e) { console.error(e); }
    setLoadingData(false);
  }, []);

  // ── Load feedback ─────────────────────────────────────────────────────────
  const loadFeedback = useCallback(async () => {
    setLoadingData(true);
    try {
      const db   = getFirestore();
      const snap = await getDocs(
        query(collection(db, "feedback"), orderBy("createdAt", "desc"), limit(50))
      );
      setFeedback(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    } catch { setFeedback([]); }
    setLoadingData(false);
  }, []);

  // ── Load analytics from Firestore + RTDB ──────────────────────────────────
  const loadAnalytics = useCallback(async () => {
    setAnalyticsLoad(true);
    const db   = getFirestore();
    const rtdb = getDatabase();

    try {
      // 1. Daily stats — last 14 days
      const days   = getLastNDays(14);
      const daily  = await Promise.all(
        days.map(async d => {
          const snap = await getDoc(doc(db, "dailyStats", d));
          const data = snap.exists() ? snap.data() : {};
          return {
            date:         d,
            sessions:     data.totalSessions     || 0,
            questions:    data.totalQuestions    || 0,
            xp:           data.totalXP           || 0,
            activeUsers:  Object.keys(data.activeUsers || {}).length,
            logins:       data.logins            || 0,
          };
        })
      );
      setDailyStats(daily);

      // 2. Recent sessions
      try {
        const sesSnap = await getDocs(
          query(collection(db, "sessions"), orderBy("timestamp", "desc"), limit(50))
        );
        const sessions = sesSnap.docs.map(d => ({ id: d.id, ...d.data() }));
        setSessionStats(sessions);

        // Aggregate game mode stats from sessions
        const modes = {};
        sessions.forEach(s => {
          modes[s.gameMode] = (modes[s.gameMode] || 0) + 1;
        });
        setGameModeStats(modes);
      } catch { /* sessions collection may not exist yet */ }

      // 3. Top users by XP from userStats
      try {
        const topSnap = await getDocs(
          query(collection(db, "userStats"), orderBy("totalXP", "desc"), limit(10))
        );
        setTopUsers(topSnap.docs.map(d => ({ id: d.id, ...d.data() })));
      } catch { /* may not exist yet */ }

      // 4. RTDB stats — count blitzhost sessions and daily challenges
      try {
        const blitzSnap = await get(ref(rtdb, "blitzhost"));
        const totalBlitz = blitzSnap.exists() ? Object.keys(blitzSnap.val()).length : 0;
        setRtdbStats(prev => ({ ...prev, totalBlitzSessions: totalBlitz }));
      } catch { /* ignore */ }

    } catch (e) { console.error("Analytics load error:", e); }
    setAnalyticsLoad(false);
  }, []);

  useEffect(() => {
    if (tab === "users")     loadUsers();
    if (tab === "feedback")  loadFeedback();
    if (tab === "analytics" || tab === "overview") loadAnalytics();
  }, [tab]); // eslint-disable-line

  // ── Derived stats ─────────────────────────────────────────────────────────
  const totalUsers     = users.length;
  const totalQuestions = QUESTION_BANKS.reduce((s, b) => s + b.count, 0);
  const avgXP          = totalUsers
    ? Math.round(users.reduce((s, u) => s + (u.stats?.totalXP || 0), 0) / totalUsers) : 0;
  const today          = new Date().toISOString().split("T")[0];
  const todayStats     = dailyStats.find(d => d.date === today) || {};
  const totalSessions  = dailyStats.reduce((s, d) => s + d.sessions, 0);
  const totalXPearned  = dailyStats.reduce((s, d) => s + d.xp, 0);

  const activeThisWeek = users.filter(u => {
    const last = u.stats?.lastActiveDate;
    return last && daysSince(last) <= 7;
  }).length;

  const yearDistribution = [1,2,3,4,5,6].map(y => ({
    year: y,
    count: users.filter(u => parseInt(u.profile?.year) === y).length,
  }));

  const filteredUsers = users
    .filter(u => {
      const s = userSearch.toLowerCase();
      return !s || (u.profile?.name || "").toLowerCase().includes(s)
                || (u.profile?.email || "").toLowerCase().includes(s);
    })
    .sort((a, b) => {
      if (sortBy === "xp")     return (b.stats?.totalXP || 0) - (a.stats?.totalXP || 0);
      if (sortBy === "year")   return (parseInt(a.profile?.year) || 0) - (parseInt(b.profile?.year) || 0);
      if (sortBy === "joined") return (b.profile?.joinDate || "").localeCompare(a.profile?.joinDate || "");
      return 0;
    });

  // Sparkline data arrays
  const sessionSparkline    = dailyStats.map(d => d.sessions);
  const activeUserSparkline = dailyStats.map(d => d.activeUsers);
  const xpSparkline         = dailyStats.map(d => d.xp);

  // ── Save question ─────────────────────────────────────────────────────────
  const handleSaveQuestion = async () => {
    if (!newQ.question.trim() || !newQ.answer.trim()) {
      setSaveMsg("Question text and answer are required."); return;
    }
    setSaveMsg("Saving…");
    try {
      const db = getFirestore();
      const id = `admin_${Date.now()}`;
      await setDoc(doc(db, "adminQuestions", id), {
        ...newQ,
        id,
        options:   newQ.type === "mcq" ? newQ.options.filter(o => o.trim()) : [],
        createdAt: new Date().toISOString(),
        createdBy: currentUser.email,
      });
      setSaveMsg("Question saved successfully.");
      setNewQ({ ...BLANK_QUESTION });
    } catch (e) {
      setSaveMsg("Error: " + e.message);
    }
  };

  if (authLoading) return (
    <div className="adm-loading">
      <div className="adm-spinner" />
      <p>Checking access…</p>
    </div>
  );
  if (!currentUser || !ADMIN_EMAILS.includes(currentUser.email)) return null;

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div className="adm-page">

      {/* ── Sidebar ── */}
      <aside className="adm-sidebar">
        <div className="adm-sidebar-brand">
          <span className="adm-brand-m">M</span>
          <div>
            <span className="adm-brand-name">MedBlitz</span>
            <span className="adm-brand-role">Admin</span>
          </div>
        </div>

        <nav className="adm-nav">
          {TABS.map(t => (
            <button key={t}
              className={`adm-nav-item ${tab === t ? "adm-nav-item--active" : ""}`}
              onClick={() => setTab(t)}
            >
              <span className="adm-nav-icon">{TAB_ICONS[t]}</span>
              {TAB_LABELS[t]}
            </button>
          ))}
        </nav>

        <div className="adm-sidebar-footer">
          <div className="adm-admin-pill">{currentUser.email}</div>
          <button className="adm-exit-btn" onClick={() => navigate("/home")}>
            Back to App
          </button>
        </div>
      </aside>

      {/* ── Main ── */}
      <main className="adm-main">

        {/* ══ OVERVIEW ══════════════════════════════════════════════════════ */}
        {tab === "overview" && (
          <div className="adm-content">
            <div className="adm-page-header">
              <h1 className="adm-page-title">Overview</h1>
              <p className="adm-page-sub">Live snapshot of MedBlitz</p>
            </div>

            {/* KPI cards */}
            <div className="adm-stat-grid">
              {[
                { icon: "⊙", label: "Total Users",      val: fmtNum(totalUsers),    sub: "Registered accounts",    color: "#0d9488", spark: null },
                { icon: "◎", label: "Active This Week",  val: fmtNum(activeThisWeek), sub: "Studied in last 7 days", color: "#6366f1", spark: activeUserSparkline },
                { icon: "↗", label: "Sessions (14d)",   val: fmtNum(totalSessions), sub: "Game sessions played",    color: "#d97706", spark: sessionSparkline },
                { icon: "★", label: "XP Earned (14d)",  val: fmtNum(totalXPearned), sub: "Total XP across users",   color: "#ef4444", spark: xpSparkline },
              ].map(s => (
                <div key={s.label} className="adm-stat-card" style={{ "--sc": s.color }}>
                  <div className="adm-stat-top">
                    <div>
                      <div className="adm-stat-val">{s.val}</div>
                      <div className="adm-stat-label">{s.label}</div>
                      <div className="adm-stat-sub">{s.sub}</div>
                    </div>
                    {s.spark && s.spark.some(v => v > 0) && (
                      <Sparkline data={s.spark} color={s.color} />
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Today snapshot */}
            <div className="adm-card">
              <h3 className="adm-card-title">Today — {today}</h3>
              <div className="adm-today-row">
                {[
                  { label: "Active Users",  val: todayStats.activeUsers || 0 },
                  { label: "Sessions",      val: todayStats.sessions    || 0 },
                  { label: "Questions",     val: todayStats.questions   || 0 },
                  { label: "XP Earned",     val: fmtNum(todayStats.xp  || 0) },
                  { label: "Logins",        val: todayStats.logins     || 0 },
                  { label: "BlitzHost",     val: rtdbStats.totalBlitzSessions },
                ].map(s => (
                  <div key={s.label} className="adm-today-item">
                    <span className="adm-today-val">{s.val}</span>
                    <span className="adm-today-label">{s.label}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Year distribution */}
            <div className="adm-card">
              <h3 className="adm-card-title">Users by Year of Study</h3>
              <div className="adm-year-bars">
                {yearDistribution.map(({ year, count }) => {
                  const pct = totalUsers ? Math.round((count / totalUsers) * 100) : 0;
                  return (
                    <div key={year} className="adm-year-row">
                      <span className="adm-year-label">Year {year}</span>
                      <div className="adm-bar-track">
                        <div className="adm-bar-fill" style={{ width: `${pct}%` }} />
                      </div>
                      <span className="adm-year-count">{count}</span>
                      <span className="adm-year-pct">{pct}%</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Question bank health */}
            <div className="adm-card">
              <h3 className="adm-card-title">Question Bank Health</h3>
              <p className="adm-card-sub">Banks under 20 questions need attention</p>
              <div className="adm-bank-list">
                {[...QUESTION_BANKS].sort((a, b) => a.count - b.count).map(bank => {
                  const status = bank.count < 10 ? "critical" : bank.count < 20 ? "low" : "good";
                  return (
                    <div key={bank.key} className="adm-bank-row">
                      <span className="adm-bank-name">{bank.label}</span>
                      <div className="adm-bank-bar-track">
                        <div className={`adm-bank-bar adm-bank-bar--${status}`}
                          style={{ width: `${Math.min((bank.count / 120) * 100, 100)}%` }} />
                      </div>
                      <span className={`adm-bank-count adm-bank-count--${status}`}>{bank.count}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* ══ ANALYTICS ═════════════════════════════════════════════════════ */}
        {tab === "analytics" && (
          <div className="adm-content">
            <div className="adm-page-header">
              <h1 className="adm-page-title">Analytics</h1>
              <p className="adm-page-sub">Real-time usage data from Firestore</p>
              <button className="adm-refresh-btn" onClick={loadAnalytics}>
                Refresh
              </button>
            </div>

            {analyticsLoad ? (
              <div className="adm-loading-inline"><div className="adm-spinner" /></div>
            ) : (
              <>
                {/* 14-day activity table */}
                <div className="adm-card">
                  <h3 className="adm-card-title">14-Day Activity</h3>
                  <p className="adm-card-sub">
                    {dailyStats.every(d => d.sessions === 0)
                      ? "No session data yet — sessions are tracked automatically once users play games."
                      : "Daily breakdown of user activity"}
                  </p>
                  <div className="adm-activity-table-wrap">
                    <table className="adm-table">
                      <thead>
                        <tr>
                          <th>Date</th>
                          <th>Active Users</th>
                          <th>Sessions</th>
                          <th>Questions</th>
                          <th>XP Earned</th>
                          <th>Logins</th>
                        </tr>
                      </thead>
                      <tbody>
                        {[...dailyStats].reverse().map(d => (
                          <tr key={d.date} className={d.date === today ? "adm-row-today" : ""}>
                            <td className="adm-date">
                              {d.date === today ? <strong>Today</strong> : d.date}
                            </td>
                            <td>{d.activeUsers || 0}</td>
                            <td>{d.sessions    || 0}</td>
                            <td>{d.questions   || 0}</td>
                            <td>{fmtNum(d.xp   || 0)}</td>
                            <td>{d.logins      || 0}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Game mode breakdown */}
                <div className="adm-card">
                  <h3 className="adm-card-title">Game Mode Usage</h3>
                  <p className="adm-card-sub">Sessions played per game mode (last 50 sessions)</p>
                  {Object.keys(gameModeStats).length === 0 ? (
                    <p className="adm-no-data">
                      No game mode data yet. Data appears here once users play sessions that are tracked via the useAnalytics hook.
                    </p>
                  ) : (
                    <div className="adm-mode-list">
                      {Object.entries(gameModeStats)
                        .sort((a, b) => b[1] - a[1])
                        .map(([mode, count]) => {
                          const max = Math.max(...Object.values(gameModeStats));
                          const pct = Math.round((count / max) * 100);
                          return (
                            <div key={mode} className="adm-mode-row">
                              <span className="adm-mode-name">{mode}</span>
                              <div className="adm-bar-track">
                                <div className="adm-bar-fill adm-bar-fill--indigo"
                                  style={{ width: `${pct}%` }} />
                              </div>
                              <span className="adm-mode-count">{count}</span>
                            </div>
                          );
                        })}
                    </div>
                  )}
                </div>

                {/* Top users leaderboard */}
                <div className="adm-card">
                  <h3 className="adm-card-title">Top 10 Users by XP</h3>
                  <p className="adm-card-sub">From userStats collection (tracked per session)</p>
                  {topUsers.length === 0 ? (
                    <p className="adm-no-data">
                      No userStats data yet. Stats populate here as users play games tracked via the analytics hook.
                    </p>
                  ) : (
                    <div className="adm-table-wrap">
                      <table className="adm-table">
                        <thead>
                          <tr>
                            <th>#</th>
                            <th>User</th>
                            <th>Total XP</th>
                            <th>Sessions</th>
                            <th>Questions</th>
                            <th>Last Active</th>
                          </tr>
                        </thead>
                        <tbody>
                          {topUsers.map((u, i) => (
                            <tr key={u.id}>
                              <td><span className="adm-rank">#{i + 1}</span></td>
                              <td>
                                <div className="adm-user-cell">
                                  <span className="adm-user-name">
                                    {u.displayName || u.email?.split("@")[0] || "—"}
                                  </span>
                                  <span className="adm-user-email">{u.email}</span>
                                </div>
                              </td>
                              <td><span className="adm-xp-val">{fmtNum(u.totalXP || 0)}</span></td>
                              <td>{u.totalSessions   || 0}</td>
                              <td>{u.totalQuestions  || 0}</td>
                              <td className="adm-date">
                                {u.lastActive?.toDate
                                  ? u.lastActive.toDate().toLocaleDateString()
                                  : "—"}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>

                {/* How to get data */}
                <div className="adm-setup-note">
                  <h4>How to populate analytics data</h4>
                  <p>
                    Analytics data fills in automatically once you add{" "}
                    <code>trackGameSession()</code> calls from the{" "}
                    <code>useAnalytics</code> hook into each game mode.
                    Import the hook and call it when a game session ends:
                  </p>
                  <pre>{`import { useAnalytics } from "../hooks/useAnalytics";

const { trackGameSession } = useAnalytics();

// Call at the end of a game session:
trackGameSession({
  gameMode: "mcq-blitz",
  score: 850,
  xpEarned: 40,
  questionsAnswered: 20,
  correctAnswers: 16,
  durationSeconds: 180,
  subject: "Pharmacology",
});`}</pre>
                </div>
              </>
            )}
          </div>
        )}

        {/* ══ USERS ═════════════════════════════════════════════════════════ */}
        {tab === "users" && (
          <div className="adm-content">
            <div className="adm-page-header">
              <h1 className="adm-page-title">Users</h1>
              <p className="adm-page-sub">{totalUsers} registered accounts</p>
            </div>

            <div className="adm-toolbar">
              <input className="adm-search" placeholder="Search by name or email…"
                value={userSearch} onChange={e => setUserSearch(e.target.value)} />
              <select className="adm-sort" value={sortBy}
                onChange={e => setSortBy(e.target.value)}>
                <option value="xp">Most XP</option>
                <option value="year">Year</option>
                <option value="joined">Newest</option>
              </select>
              <button className="adm-refresh-btn" onClick={loadUsers}>Refresh</button>
            </div>

            {loadingData ? (
              <div className="adm-loading-inline"><div className="adm-spinner" /></div>
            ) : (
              <div className="adm-table-wrap">
                <table className="adm-table">
                  <thead>
                    <tr>
                      <th>User</th><th>Year</th><th>XP</th>
                      <th>Questions</th><th>Accuracy</th><th>Streak</th><th>Joined</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredUsers.length === 0 ? (
                      <tr><td colSpan={7} className="adm-empty">No users found</td></tr>
                    ) : filteredUsers.map(u => {
                      const p = u.profile || {};
                      const s = u.stats   || {};
                      const acc = s.totalAttempted
                        ? Math.round((s.totalCorrect / s.totalAttempted) * 100) : 0;
                      const days = daysSince(p.joinDate);
                      return (
                        <tr key={u.uid}>
                          <td>
                            <div className="adm-user-cell-col">
                              <span className="adm-user-name">
                                {p.name || p.username || "—"}
                              </span>
                              <span className="adm-user-email">
                                {p.email || u.uid.slice(0, 8)}
                              </span>
                            </div>
                          </td>
                          <td><span className="adm-year-pill">Y{p.year || "?"}</span></td>
                          <td><span className="adm-xp-val">{fmtNum(s.totalXP || 0)}</span></td>
                          <td>{s.totalAttempted || 0}</td>
                          <td>
                            <span className={`adm-acc adm-acc--${acc >= 70 ? "good" : acc >= 50 ? "mid" : "low"}`}>
                              {acc}%
                            </span>
                          </td>
                          <td>{s.currentStreak || 0}d</td>
                          <td className="adm-date">
                            {days !== null ? `${days}d ago` : "—"}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* ══ QUESTIONS ═════════════════════════════════════════════════════ */}
        {tab === "questions" && (
          <div className="adm-content">
            <div className="adm-page-header">
              <h1 className="adm-page-title">Question Banks</h1>
              <p className="adm-page-sub">
                {totalQuestions} questions across {QUESTION_BANKS.length} banks
              </p>
            </div>
            <div className="adm-bank-cards">
              {QUESTION_BANKS.map(bank => {
                const status = bank.count < 10 ? "critical" : bank.count < 20 ? "low" : "good";
                const pct    = Math.min(Math.round((bank.count / 120) * 100), 100);
                return (
                  <div key={bank.key} className={`adm-bank-card adm-bank-card--${status}`}>
                    <div className="adm-bank-card-top">
                      <span className="adm-bank-card-name">{bank.label}</span>
                      <span className={`adm-bank-pill adm-bank-pill--${status}`}>
                        {status === "good" ? "Good" : status === "low" ? "Low" : "Critical"}
                      </span>
                    </div>
                    <div className="adm-bank-card-count">{bank.count}</div>
                    <div className="adm-bank-track">
                      <div className={`adm-bank-fill adm-bank-fill--${status}`}
                        style={{ width: `${pct}%` }} />
                    </div>
                    <div className="adm-bank-years">Years: {bank.year.join(", ")}</div>
                    <button className="adm-add-q-btn"
                      onClick={() => {
                        setNewQ({ ...BLANK_QUESTION, subject: bank.label });
                        setTab("add-question");
                      }}>
                      Add question
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ══ ADD QUESTION ══════════════════════════════════════════════════ */}
        {tab === "add-question" && (
          <div className="adm-content">
            <div className="adm-page-header">
              <h1 className="adm-page-title">Add Question</h1>
              <p className="adm-page-sub">
                Saves to Firestore adminQuestions collection
              </p>
            </div>
            <div className="adm-qform">
              <div className="adm-form-row">
                <label className="adm-label">Question Type</label>
                <div className="adm-type-btns">
                  {["mcq", "short"].map(t => (
                    <button key={t}
                      className={`adm-type-btn ${newQ.type === t ? "adm-type-btn--active" : ""}`}
                      onClick={() => setNewQ(q => ({ ...q, type: t }))}>
                      {t === "mcq" ? "Multiple Choice" : "Short Answer"}
                    </button>
                  ))}
                </div>
              </div>
              <div className="adm-form-grid">
                <div className="adm-form-field">
                  <label className="adm-label">Subject</label>
                  <select className="adm-input" value={newQ.subject}
                    onChange={e => setNewQ(q => ({ ...q, subject: e.target.value }))}>
                    {QUESTION_BANKS.map(b =>
                      <option key={b.key} value={b.label}>{b.label}</option>)}
                  </select>
                </div>
                <div className="adm-form-field">
                  <label className="adm-label">Topic</label>
                  <input className="adm-input" placeholder="e.g. Beta-blockers"
                    value={newQ.topic}
                    onChange={e => setNewQ(q => ({ ...q, topic: e.target.value }))} />
                </div>
                <div className="adm-form-field">
                  <label className="adm-label">Difficulty</label>
                  <select className="adm-input" value={newQ.difficulty}
                    onChange={e => setNewQ(q => ({ ...q, difficulty: e.target.value }))}>
                    <option value="easy">Easy</option>
                    <option value="medium">Medium</option>
                    <option value="hard">Hard</option>
                  </select>
                </div>
                <div className="adm-form-field">
                  <label className="adm-label">Year</label>
                  <select className="adm-input" value={newQ.year}
                    onChange={e => setNewQ(q => ({ ...q, year: parseInt(e.target.value) }))}>
                    {[1,2,3,4,5,6].map(y =>
                      <option key={y} value={y}>Year {y}</option>)}
                  </select>
                </div>
              </div>
              <div className="adm-form-field">
                <label className="adm-label">
                  Source <span className="adm-label-opt">(optional)</span>
                </label>
                <input className="adm-input" placeholder="e.g. MBCHB CAT 1 2024"
                  value={newQ.source}
                  onChange={e => setNewQ(q => ({ ...q, source: e.target.value }))} />
              </div>
              <div className="adm-form-field">
                <label className="adm-label">Question Text</label>
                <textarea className="adm-textarea" rows={3}
                  placeholder="Write the question here…"
                  value={newQ.question}
                  onChange={e => setNewQ(q => ({ ...q, question: e.target.value }))} />
              </div>
              {newQ.type === "mcq" && (
                <div className="adm-form-field">
                  <label className="adm-label">Options</label>
                  {newQ.options.map((opt, i) => (
                    <input key={i} className="adm-input adm-option-input"
                      placeholder={`Option ${String.fromCharCode(65 + i)}`}
                      value={opt}
                      onChange={e => {
                        const opts = [...newQ.options];
                        opts[i] = e.target.value;
                        setNewQ(q => ({ ...q, options: opts }));
                      }} />
                  ))}
                </div>
              )}
              <div className="adm-form-field">
                <label className="adm-label">Correct Answer</label>
                <input className="adm-input adm-input--correct"
                  placeholder="Correct answer…"
                  value={newQ.answer}
                  onChange={e => setNewQ(q => ({ ...q, answer: e.target.value }))} />
              </div>
              <div className="adm-form-field">
                <label className="adm-label">
                  Explanation <span className="adm-label-opt">(recommended)</span>
                </label>
                <textarea className="adm-textarea" rows={3}
                  placeholder="Explain why this is the correct answer…"
                  value={newQ.explanation}
                  onChange={e => setNewQ(q => ({ ...q, explanation: e.target.value }))} />
              </div>
              {saveMsg && (
                <div className={`adm-save-msg ${saveMsg.includes("Error") ? "adm-save-msg--err" : "adm-save-msg--ok"}`}>
                  {saveMsg}
                </div>
              )}
              <div className="adm-form-actions">
                <button className="adm-save-btn" onClick={handleSaveQuestion}>
                  Save Question
                </button>
                <button className="adm-clear-btn"
                  onClick={() => { setNewQ({ ...BLANK_QUESTION }); setSaveMsg(""); }}>
                  Clear
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ══ FEEDBACK ══════════════════════════════════════════════════════ */}
        {tab === "feedback" && (
          <div className="adm-content">
            <div className="adm-page-header">
              <h1 className="adm-page-title">Feedback</h1>
              <p className="adm-page-sub">User-submitted feedback</p>
              <button className="adm-refresh-btn" onClick={loadFeedback}>Refresh</button>
            </div>
            {loadingData ? (
              <div className="adm-loading-inline"><div className="adm-spinner" /></div>
            ) : feedback.length === 0 ? (
              <div className="adm-empty-state">
                <p>No feedback yet. Once users submit feedback it will appear here.</p>
              </div>
            ) : (
              <div className="adm-feedback-list">
                {feedback.map(f => (
                  <div key={f.id} className="adm-feedback-card">
                    <div className="adm-feedback-top">
                      <span className="adm-feedback-email">{f.email || "Anonymous"}</span>
                      <span className="adm-feedback-date">
                        {f.createdAt?.split?.("T")[0] || "—"}
                      </span>
                    </div>
                    <p className="adm-feedback-text">{f.text || f.message || "—"}</p>
                    {f.type && (
                      <span className="adm-feedback-tag">{f.type}</span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

      </main>
    </div>
  );
}