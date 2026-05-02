// src/pages/AdminDashboard.jsx
import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
  getFirestore, collection, getDocs, doc,
  setDoc, deleteDoc, query, orderBy, limit
} from "firebase/firestore";
import "./AdminDashboard.css";

// ── ADMIN GUARD ────────────────────────────────────────────────────────────────
// Add your email here — only this email can access the dashboard
const ADMIN_EMAILS = [
  "chrisonyango25@gmail.com", // ← REPLACE with your actual email
];

// ── Question bank metadata (for the questions panel) ─────────────────────────
const QUESTION_BANKS = [
  { key: "pharmacology",      label: "Pharmacology",       year: [2,3,4,5,6], count: 50  },
  { key: "pathology",         label: "Pathology",          year: [3,4,5,6],   count: 53  },
  { key: "haematology",       label: "Haematology",        year: [3,4,5,6],   count: 54  },
  { key: "physiology_level2", label: "Physiology L2",      year: [2,3,4,5,6], count: 82  },
  { key: "physiology_level1", label: "Physiology L1",      year: [1,2],       count: 10  },
  { key: "clinical_chemistry",label: "Clinical Chemistry", year: [4,5,6],     count: 26  },
  { key: "immunology",        label: "Immunology",         year: [2,3,4,5,6], count: 20  },
  { key: "microbiology",      label: "Microbiology",       year: [2,3,4,5,6], count: 10  },
  { key: "gross_anatomy",     label: "Gross Anatomy",      year: [1,2],       count: 5   },
  { key: "histology",         label: "Histology",          year: [1,2],       count: 5   },
  { key: "embryology",        label: "Embryology",         year: [1],         count: 5   },
  { key: "antibiotics",       label: "Antibiotics",        year: [2,3,4,5,6], count: 23  },
  { key: "antiparasitics",    label: "Antiparasitics",     year: [3,4,5,6],   count: 4   },
  { key: "antifungals",       label: "Antifungals",        year: [3,4,5,6],   count: 1   },
];

const TABS = ["overview", "users", "questions", "add-question", "feedback"];

const TAB_LABELS = {
  overview:      "📊 Overview",
  users:         "👥 Users",
  questions:     "📝 Questions",
  "add-question":"➕ Add Question",
  feedback:      "💬 Feedback",
};

// ── Blank new question template ───────────────────────────────────────────────
const BLANK_QUESTION = {
  id: "", type: "mcq", subject: "Pharmacology", topic: "",
  difficulty: "medium", year: 2, source: "",
  question: "", options: ["", "", "", ""],
  answer: "", explanation: "",
};

export default function AdminDashboard() {
  const navigate   = useNavigate();
  const { currentUser, loading: authLoading } = useAuth();
  const [tab,      setTab]      = useState("overview");
  const [users,    setUsers]    = useState([]);
  const [feedback, setFeedback] = useState([]);
  const [loadingData, setLoadingData] = useState(false);
  const [saveMsg,  setSaveMsg]  = useState("");
  const [newQ,     setNewQ]     = useState({ ...BLANK_QUESTION });
  const [userSearch, setUserSearch] = useState("");
  const [sortBy,   setSortBy]   = useState("xp"); // xp | year | joined

  // ── Auth guard ────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!authLoading && (!currentUser || !ADMIN_EMAILS.includes(currentUser.email))) {
      navigate("/home");
    }
  }, [currentUser, authLoading, navigate]);

  // ── Load users from Firestore ─────────────────────────────────────────────
  const loadUsers = useCallback(async () => {
    setLoadingData(true);
    try {
      const db   = getFirestore();
      const snap = await getDocs(collection(db, "users"));
      const list = snap.docs.map(d => ({ uid: d.id, ...d.data() }));
      setUsers(list);
    } catch (e) {
      console.error("Error loading users:", e);
    }
    setLoadingData(false);
  }, []);

  // ── Load feedback from Firestore ──────────────────────────────────────────
  const loadFeedback = useCallback(async () => {
    setLoadingData(true);
    try {
      const db   = getFirestore();
      const snap = await getDocs(
        query(collection(db, "feedback"), orderBy("createdAt", "desc"), limit(50))
      );
      setFeedback(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    } catch (e) {
      // Feedback collection may not exist yet
      setFeedback([]);
    }
    setLoadingData(false);
  }, []);

  useEffect(() => {
    if (tab === "users")    loadUsers();
    if (tab === "feedback") loadFeedback();
  }, [tab]);

  // ── Derived stats ─────────────────────────────────────────────────────────
  const totalUsers    = users.length;
  const totalQuestions = QUESTION_BANKS.reduce((s, b) => s + b.count, 0);
  const avgXP         = totalUsers
    ? Math.round(users.reduce((s, u) => s + (u.stats?.totalXP || 0), 0) / totalUsers)
    : 0;
  const activeToday   = users.filter(u => {
    const last = u.stats?.lastActiveDate;
    return last && last.startsWith(new Date().toISOString().split("T")[0]);
  }).length;

  const yearDistribution = [1,2,3,4,5,6].map(y => ({
    year: y,
    count: users.filter(u => parseInt(u.profile?.year) === y).length,
  }));

  // ── Sorted / filtered users ───────────────────────────────────────────────
  const filteredUsers = users
    .filter(u => {
      const name  = (u.profile?.name || u.profile?.email || "").toLowerCase();
      const email = (u.profile?.email || "").toLowerCase();
      const s     = userSearch.toLowerCase();
      return !s || name.includes(s) || email.includes(s);
    })
    .sort((a, b) => {
      if (sortBy === "xp")     return (b.stats?.totalXP || 0) - (a.stats?.totalXP || 0);
      if (sortBy === "year")   return (parseInt(a.profile?.year) || 0) - (parseInt(b.profile?.year) || 0);
      if (sortBy === "joined") return (b.profile?.joinDate || "").localeCompare(a.profile?.joinDate || "");
      return 0;
    });

  // ── Add question ──────────────────────────────────────────────────────────
  const handleSaveQuestion = async () => {
    if (!newQ.question.trim() || !newQ.answer.trim()) {
      setSaveMsg("❌ Question text and answer are required.");
      return;
    }
    setSaveMsg("Saving…");
    try {
      const db = getFirestore();
      const id = `admin_${Date.now()}`;
      await setDoc(doc(db, "adminQuestions", id), {
        ...newQ,
        id,
        options: newQ.type === "mcq" ? newQ.options.filter(o => o.trim()) : [],
        createdAt:  new Date().toISOString(),
        createdBy:  currentUser.email,
      });
      setSaveMsg("✅ Question saved to Firestore!");
      setNewQ({ ...BLANK_QUESTION });
    } catch (e) {
      setSaveMsg("❌ Error saving: " + e.message);
    }
  };

  // ── Render guard ──────────────────────────────────────────────────────────
  if (authLoading) return <div className="adm-loading"><div className="adm-spinner" /><p>Checking access…</p></div>;
  if (!currentUser || !ADMIN_EMAILS.includes(currentUser.email)) return null;

  return (
    <div className="adm-page">

      {/* Sidebar */}
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
              {TAB_LABELS[t]}
            </button>
          ))}
        </nav>

        <div className="adm-sidebar-footer">
          <div className="adm-admin-pill">🔒 {currentUser.email}</div>
          <button className="adm-exit-btn" onClick={() => navigate("/home")}>← Back to App</button>
        </div>
      </aside>

      {/* Main content */}
      <main className="adm-main">

        {/* ── OVERVIEW ── */}
        {tab === "overview" && (
          <div className="adm-content">
            <h1 className="adm-page-title">Overview</h1>
            <p className="adm-page-sub">Real-time snapshot of MedBlitz</p>

            {/* Stat cards */}
            <div className="adm-stat-grid">
              {[
                { icon: "👥", label: "Total Users",      val: totalUsers,     sub: "Registered accounts",        color: "#0d9488" },
                { icon: "📝", label: "Total Questions",  val: totalQuestions, sub: "Across all banks",            color: "#6366f1" },
                { icon: "⭐", label: "Avg XP per User",  val: avgXP,          sub: "Across all registered users", color: "#d97706" },
                { icon: "🔥", label: "Active Today",     val: activeToday,    sub: "Users active in last 24h",    color: "#ef4444" },
              ].map(s => (
                <div key={s.label} className="adm-stat-card" style={{ "--sc": s.color }}>
                  <div className="adm-stat-icon">{s.icon}</div>
                  <div className="adm-stat-val">{s.val}</div>
                  <div className="adm-stat-label">{s.label}</div>
                  <div className="adm-stat-sub">{s.sub}</div>
                </div>
              ))}
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
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Question bank health */}
            <div className="adm-card">
              <h3 className="adm-card-title">Question Bank Health</h3>
              <p className="adm-card-sub">Banks with fewer than 20 questions need attention</p>
              <div className="adm-bank-list">
                {QUESTION_BANKS.sort((a,b) => a.count - b.count).map(bank => {
                  const status = bank.count < 10 ? "critical" : bank.count < 20 ? "low" : "good";
                  return (
                    <div key={bank.key} className="adm-bank-row">
                      <span className="adm-bank-name">{bank.label}</span>
                      <div className="adm-bank-bar-track">
                        <div className={`adm-bank-bar adm-bank-bar--${status}`}
                          style={{ width: `${Math.min((bank.count / 100) * 100, 100)}%` }} />
                      </div>
                      <span className={`adm-bank-count adm-bank-count--${status}`}>{bank.count}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Game modes live */}
            <div className="adm-card">
              <h3 className="adm-card-title">Live Game Modes</h3>
              <div className="adm-games-list">
                {[
                  { name: "Boss Battle",          icon: "⚔️", status: "live" },
                  { name: "Ward Round",            icon: "🏥", status: "live" },
                  { name: "Name 3 in 20",          icon: "⚡", status: "live" },
                  { name: "Diagnose in 3 Clues",   icon: "🔬", status: "live" },
                  { name: "Daily Challenge",        icon: "📅", status: "live" },
                  { name: "MCQ Blitz",              icon: "🎯", status: "soon" },
                  { name: "The Doctor Ladder",      icon: "🪜", status: "soon" },
                  { name: "Who Am I?",              icon: "🧠", status: "soon" },
                  { name: "Clinical Black Box",     icon: "⬛", status: "soon" },
                ].map(g => (
                  <div key={g.name} className="adm-game-row">
                    <span className="adm-game-icon">{g.icon}</span>
                    <span className="adm-game-name">{g.name}</span>
                    <span className={`adm-game-status adm-game-status--${g.status}`}>
                      {g.status === "live" ? "✅ Live" : "🔧 Soon"}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── USERS ── */}
        {tab === "users" && (
          <div className="adm-content">
            <h1 className="adm-page-title">Users</h1>
            <p className="adm-page-sub">{totalUsers} registered accounts</p>

            <div className="adm-toolbar">
              <input className="adm-search" placeholder="Search by name or email…"
                value={userSearch} onChange={e => setUserSearch(e.target.value)} />
              <select className="adm-sort" value={sortBy} onChange={e => setSortBy(e.target.value)}>
                <option value="xp">Sort: Most XP</option>
                <option value="year">Sort: Year</option>
                <option value="joined">Sort: Newest</option>
              </select>
              <button className="adm-refresh-btn" onClick={loadUsers}>↻ Refresh</button>
            </div>

            {loadingData ? (
              <div className="adm-loading-inline"><div className="adm-spinner" /></div>
            ) : (
              <div className="adm-table-wrap">
                <table className="adm-table">
                  <thead>
                    <tr>
                      <th>User</th>
                      <th>Year</th>
                      <th>XP</th>
                      <th>Questions</th>
                      <th>Accuracy</th>
                      <th>Streak</th>
                      <th>Joined</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredUsers.length === 0 ? (
                      <tr><td colSpan={7} className="adm-empty">No users found</td></tr>
                    ) : filteredUsers.map(u => {
                      const profile  = u.profile || {};
                      const stats    = u.stats   || {};
                      const accuracy = stats.totalAttempted
                        ? Math.round((stats.totalCorrect / stats.totalAttempted) * 100)
                        : 0;
                      return (
                        <tr key={u.uid}>
                          <td>
                            <div className="adm-user-cell">
                              <span className="adm-user-avatar">👤</span>
                              <div>
                                <span className="adm-user-name">{profile.name || profile.username || "—"}</span>
                                <span className="adm-user-email">{profile.email || u.uid.slice(0,8)}</span>
                              </div>
                            </div>
                          </td>
                          <td><span className="adm-year-pill">Y{profile.year || "?"}</span></td>
                          <td><span className="adm-xp-val">⭐ {stats.totalXP || 0}</span></td>
                          <td>{stats.totalAttempted || 0}</td>
                          <td>
                            <span className={`adm-acc ${accuracy >= 70 ? "adm-acc--good" : accuracy >= 50 ? "adm-acc--mid" : "adm-acc--low"}`}>
                              {accuracy}%
                            </span>
                          </td>
                          <td>🔥 {stats.currentStreak || 0}</td>
                          <td className="adm-date">{profile.joinDate || "—"}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* ── QUESTIONS ── */}
        {tab === "questions" && (
          <div className="adm-content">
            <h1 className="adm-page-title">Question Banks</h1>
            <p className="adm-page-sub">{totalQuestions} questions across {QUESTION_BANKS.length} banks</p>

            <div className="adm-bank-cards">
              {QUESTION_BANKS.map(bank => {
                const status = bank.count < 10 ? "critical" : bank.count < 20 ? "low" : "good";
                const pct    = Math.min(Math.round((bank.count / 100) * 100), 100);
                return (
                  <div key={bank.key} className={`adm-bank-card adm-bank-card--${status}`}>
                    <div className="adm-bank-card-top">
                      <span className="adm-bank-card-name">{bank.label}</span>
                      <span className={`adm-bank-pill adm-bank-pill--${status}`}>
                        {status === "good" ? "✅ Good" : status === "low" ? "⚠️ Low" : "🚨 Critical"}
                      </span>
                    </div>
                    <div className="adm-bank-card-count">{bank.count} questions</div>
                    <div className="adm-bank-track">
                      <div className={`adm-bank-fill adm-bank-fill--${status}`} style={{ width: `${pct}%` }} />
                    </div>
                    <div className="adm-bank-years">
                      Years: {bank.year.join(", ")}
                    </div>
                    <button className="adm-add-q-btn" onClick={() => { setNewQ({ ...BLANK_QUESTION, subject: bank.label }); setTab("add-question"); }}>
                      + Add question
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ── ADD QUESTION ── */}
        {tab === "add-question" && (
          <div className="adm-content">
            <h1 className="adm-page-title">Add Question</h1>
            <p className="adm-page-sub">New questions save to Firestore and will be included in future quiz updates</p>

            <div className="adm-qform">

              <div className="adm-form-row">
                <label className="adm-label">Question Type</label>
                <div className="adm-type-btns">
                  {["mcq", "short"].map(t => (
                    <button key={t}
                      className={`adm-type-btn ${newQ.type === t ? "adm-type-btn--active" : ""}`}
                      onClick={() => setNewQ(q => ({ ...q, type: t }))}
                    >
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
                    {QUESTION_BANKS.map(b => <option key={b.key} value={b.label}>{b.label}</option>)}
                  </select>
                </div>
                <div className="adm-form-field">
                  <label className="adm-label">Topic / Category</label>
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
                  <label className="adm-label">Year Level</label>
                  <select className="adm-input" value={newQ.year}
                    onChange={e => setNewQ(q => ({ ...q, year: parseInt(e.target.value) }))}>
                    {[1,2,3,4,5,6].map(y => <option key={y} value={y}>Year {y}</option>)}
                  </select>
                </div>
              </div>

              <div className="adm-form-field">
                <label className="adm-label">Source <span className="adm-label-opt">(optional)</span></label>
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
                  <label className="adm-label">Answer Options</label>
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
                <label className="adm-label">
                  Correct Answer
                  {newQ.type === "mcq" && <span className="adm-label-opt"> — paste the full option text</span>}
                </label>
                <input className="adm-input adm-input--correct"
                  placeholder="Correct answer…"
                  value={newQ.answer}
                  onChange={e => setNewQ(q => ({ ...q, answer: e.target.value }))} />
              </div>

              <div className="adm-form-field">
                <label className="adm-label">Explanation <span className="adm-label-opt">(recommended)</span></label>
                <textarea className="adm-textarea" rows={3}
                  placeholder="Explain why this is the correct answer…"
                  value={newQ.explanation}
                  onChange={e => setNewQ(q => ({ ...q, explanation: e.target.value }))} />
              </div>

              {saveMsg && (
                <div className={`adm-save-msg ${saveMsg.startsWith("✅") ? "adm-save-msg--ok" : saveMsg.startsWith("❌") ? "adm-save-msg--err" : ""}`}>
                  {saveMsg}
                </div>
              )}

              <div className="adm-form-actions">
                <button className="adm-save-btn" onClick={handleSaveQuestion}>
                  💾 Save Question
                </button>
                <button className="adm-clear-btn" onClick={() => { setNewQ({ ...BLANK_QUESTION }); setSaveMsg(""); }}>
                  Clear
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── FEEDBACK ── */}
        {tab === "feedback" && (
          <div className="adm-content">
            <h1 className="adm-page-title">Feedback</h1>
            <p className="adm-page-sub">User-submitted feedback from the app</p>

            <button className="adm-refresh-btn" onClick={loadFeedback}>↻ Refresh</button>

            {loadingData ? (
              <div className="adm-loading-inline"><div className="adm-spinner" /></div>
            ) : feedback.length === 0 ? (
              <div className="adm-empty-state">
                <span>💬</span>
                <p>No feedback yet. Once users submit feedback in the app it will appear here.</p>
                <p className="adm-empty-hint">You can add a feedback button to the Settings page to collect this.</p>
              </div>
            ) : (
              <div className="adm-feedback-list">
                {feedback.map(f => (
                  <div key={f.id} className="adm-feedback-card">
                    <div className="adm-feedback-top">
                      <span className="adm-feedback-email">{f.email || "Anonymous"}</span>
                      <span className="adm-feedback-date">{f.createdAt?.split("T")[0] || "—"}</span>
                    </div>
                    <p className="adm-feedback-text">{f.text || f.message || "—"}</p>
                    {f.type && <span className="adm-feedback-tag">{f.type}</span>}
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