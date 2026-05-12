// src/pages/BlitzHost.jsx
// BlitzHost Live — AI-powered live quiz hosting for medical educators
import React, { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { getDatabase, ref, set, onValue, off, update, push, remove } from "firebase/database";
import { getFirestore, doc, getDoc } from "firebase/firestore";
import {
  ArrowLeft, Plus, Upload, Settings, Play, Pause,
  SkipForward, StopCircle, Users, Clock, Zap,
  ChevronRight, Eye, EyeOff, Megaphone, Trash2,
  BarChart2, CheckCircle, AlertCircle, Copy, RefreshCw,
} from "lucide-react";
import "./BlitzHost.css";

// ── Constants ─────────────────────────────────────────────────────────────────
const MICROSERVICE_URL = process.env.REACT_APP_MICROSERVICE_URL || "https://medblitz-microservice.up.railway.app";

const QUIZ_TYPES   = ["MCQ", "SAQ", "Hybrid"];
const DIFFICULTIES = ["Easy", "Medium", "Hard", "Mixed"];
const EXPLAIN_WHEN = ["After each question", "End of quiz", "Manual reveal"];

function genCode() {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// ── Tabs ──────────────────────────────────────────────────────────────────────
const TABS = ["setup", "questions", "live", "analytics"];
const TAB_LABELS = {
  setup:     "⚙️ Setup",
  questions: "📝 Questions",
  live:      "🔴 Live",
  analytics: "📊 Analytics",
};

export default function BlitzHost() {
  const navigate               = useNavigate();
  const { currentUser }        = useAuth();
  const db                     = getDatabase();

  // ── Auth guard — any signed-in user can host ───────────────────────────────
  useEffect(() => {
    if (!currentUser) navigate("/signin");
  }, [currentUser, navigate]);

  // ── Tab state ──────────────────────────────────────────────────────────────
  const [tab, setTab] = useState("setup");

  // ── Session config ─────────────────────────────────────────────────────────
  const [config, setConfig] = useState({
    title:          "Medical Quiz Session",
    quizType:       "MCQ",
    totalQuestions: 20,
    timePerQ:       30,
    totalDuration:  0,         // 0 = derived from timePerQ
    difficulty:     "Mixed",
    backtracking:   false,
    examMode:       false,
    adaptiveDiff:   false,
    explainWhen:    "After each question",
    explainDuration: 15,
    aiRemediation:  true,
    followUpQs:     true,
    anonymousBoard: true,
  });

  // ── Questions state ────────────────────────────────────────────────────────
  const [questions, setQuestions]   = useState([]);
  const [aiLoading, setAiLoading]   = useState(false);
  const [aiTopic,   setAiTopic]     = useState("");
  const [aiCount,   setAiCount]     = useState(10);
  const [pdfText,   setPdfText]     = useState("");
  const [pdfName,   setPdfName]     = useState("");
  const [pdfLoading, setPdfLoading] = useState(false);
  const [editIdx,   setEditIdx]     = useState(null);
  const fileRef                     = useRef();

  // ── Session live state ─────────────────────────────────────────────────────
  const [roomCode,      setRoomCode]      = useState("");
  const [sessionActive, setSessionActive] = useState(false);
  const [sessionStatus, setSessionStatus] = useState("idle"); // idle | waiting | running | paused | ended
  const [currentQIdx,   setCurrentQIdx]   = useState(0);
  const [timeLeft,      setTimeLeft]      = useState(0);
  const [participants,  setParticipants]  = useState({});
  const [announcement,  setAnnouncement]  = useState("");
  const [showExplain,   setShowExplain]   = useState(false);
  const [sessionRef,    setSessionRef]    = useState(null);
  const timerRef = useRef(null);

  // ── Analytics state ────────────────────────────────────────────────────────
  const [analytics, setAnalytics] = useState(null);

  // ── Config helpers ─────────────────────────────────────────────────────────
  const updateConfig = (k, v) => setConfig(c => ({ ...c, [k]: v }));

  // ── AI question generation from topic ─────────────────────────────────────
  const generateFromTopic = async () => {
    if (!aiTopic.trim()) return;
    setAiLoading(true);
    try {
      const prompt = `Generate exactly ${aiCount} medical ${config.quizType === "SAQ" ? "short answer" : "MCQ"} questions about "${aiTopic}" for medical students.
Return ONLY a JSON array. Each item:
{
  "question": "...",
  "options": ["A", "B", "C", "D"],
  "correctAnswer": 0,
  "explanation": "...",
  "difficulty": "medium",
  "topic": "${aiTopic}"
}
For SAQ omit options and set correctAnswer to a string answer.`;

      const res  = await fetch(`${MICROSERVICE_URL}/api/generateQuestions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt }),
      });
      const data = await res.json();
      const qs   = (data.questions || []).map((q, i) => ({
        id: `ai_${Date.now()}_${i}`,
        type: config.quizType === "SAQ" ? "saq" : "mcq",
        question: q.question || q.text || "",
        options:  q.options  || [],
        correctAnswer: q.correctAnswer ?? 0,
        explanation:   q.explanation   || "",
        difficulty:    q.difficulty    || "medium",
        topic:         q.topic         || aiTopic,
        source: "AI",
      }));
      setQuestions(prev => [...prev, ...qs]);
    } catch (e) {
      console.error("AI gen error", e);
    }
    setAiLoading(false);
  };

  // ── PDF upload → extract text → AI generates questions ──────────────────
  const handlePdfUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPdfName(file.name);
    setPdfLoading(true);

    try {
      // Read file as base64 and send to microservice
      const reader = new FileReader();
      reader.onload = async (ev) => {
        const base64 = ev.target.result.split(",")[1];
        const prompt = `You are a medical educator. A student uploaded a PDF called "${file.name}".
The encoded content is below (base64, first 3000 chars truncated for prompt size).
Generate exactly ${aiCount} high-quality MCQ questions from this material.
Return ONLY a JSON array:
[{
  "question": "...",
  "options": ["A","B","C","D"],
  "correctAnswer": 0,
  "explanation": "...",
  "difficulty": "medium",
  "topic": "derived from content"
}]
Content hint (filename): ${file.name}
Base64 snippet: ${base64.substring(0, 500)}`;

        const res  = await fetch(`${MICROSERVICE_URL}/api/generateQuestions`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ prompt }),
        });
        const data = await res.json();
        const qs = (data.questions || []).map((q, i) => ({
          id: `pdf_${Date.now()}_${i}`,
          type: "mcq",
          question: q.question || q.text || "",
          options:  q.options  || [],
          correctAnswer: q.correctAnswer ?? 0,
          explanation:   q.explanation   || "",
          difficulty:    q.difficulty    || "medium",
          topic:         q.topic         || file.name.replace(".pdf", ""),
          source: `PDF: ${file.name}`,
        }));
        setQuestions(prev => [...prev, ...qs]);
        setPdfLoading(false);
      };
      reader.readAsDataURL(file);
    } catch (e) {
      console.error("PDF error", e);
      setPdfLoading(false);
    }
  };

  // ── Manual question add ────────────────────────────────────────────────────
  const addBlankQuestion = () => {
    const blank = {
      id: `manual_${Date.now()}`,
      type: "mcq",
      question: "",
      options: ["", "", "", ""],
      correctAnswer: 0,
      explanation: "",
      difficulty: "medium",
      topic: "",
      source: "Manual",
    };
    setQuestions(prev => [...prev, blank]);
    setEditIdx(questions.length);
  };

  const updateQuestion = (idx, field, val) => {
    setQuestions(prev => prev.map((q, i) => i === idx ? { ...q, [field]: val } : q));
  };

  const updateOption = (qIdx, oIdx, val) => {
    setQuestions(prev => prev.map((q, i) => {
      if (i !== qIdx) return q;
      const opts = [...q.options];
      opts[oIdx] = val;
      return { ...q, options: opts };
    }));
  };

  const removeQuestion = (idx) => {
    setQuestions(prev => prev.filter((_, i) => i !== idx));
    if (editIdx === idx) setEditIdx(null);
  };

  // ── Create / Start session ─────────────────────────────────────────────────
  const createSession = async () => {
    if (questions.length === 0) {
      alert("Add at least one question before starting.");
      return;
    }
    const code = genCode();
    setRoomCode(code);

    const selectedQs = shuffle(questions).slice(0, config.totalQuestions);
    const sRef = ref(db, `blitzhost/${code}`);
    setSessionRef(sRef);

    const sessionData = {
      code,
      hostUid: currentUser.uid,
      title: config.title,
      config: { ...config },
      questions: selectedQs.map(q => ({
        ...q,
        // hide answers from RTDB node participants read — stored separately
      })),
      answers: selectedQs.map(q => ({
        correctAnswer: q.correctAnswer,
        explanation:   q.explanation,
      })),
      status:       "waiting",
      currentQIdx:  0,
      timeLeft:     config.timePerQ,
      showExplain:  false,
      participants: {},
      createdAt:    Date.now(),
    };

    await set(sRef, sessionData);

    // Listen for participant joins
    const partRef = ref(db, `blitzhost/${code}/participants`);
    onValue(partRef, snap => {
      setParticipants(snap.val() || {});
    });

    setSessionStatus("waiting");
    setSessionActive(true);
    setCurrentQIdx(0);
    setTimeLeft(config.timePerQ);
    setTab("live");
  };

  // ── Start quiz (host presses Play after waiting) ───────────────────────────
  const startQuiz = async () => {
    if (!sessionRef) return;
    await update(sessionRef, { status: "running", currentQIdx: 0, timeLeft: config.timePerQ });
    setSessionStatus("running");
    startTimer();
  };

  // ── Timer ──────────────────────────────────────────────────────────────────
  const startTimer = () => {
    clearInterval(timerRef.current);
    timerRef.current = setInterval(async () => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          advanceQuestion();
          return config.timePerQ;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const advanceQuestion = useCallback(async () => {
    if (!sessionRef) return;
    setCurrentQIdx(prev => {
      const next = prev + 1;
      if (next >= Math.min(questions.length, config.totalQuestions)) {
        endSession();
        return prev;
      }
      update(sessionRef, { currentQIdx: next, timeLeft: config.timePerQ, showExplain: false });
      setTimeLeft(config.timePerQ);
      setShowExplain(false);
      return next;
    });
  }, [sessionRef, questions.length, config.totalQuestions, config.timePerQ]);

  // ── Host controls ──────────────────────────────────────────────────────────
  const pauseSession = async () => {
    clearInterval(timerRef.current);
    setSessionStatus("paused");
    await update(sessionRef, { status: "paused" });
  };

  const resumeSession = async () => {
    setSessionStatus("running");
    await update(sessionRef, { status: "running" });
    startTimer();
  };

  const skipQuestion = () => advanceQuestion();

  const extendTimer = async (extra = 15) => {
    const newTime = timeLeft + extra;
    setTimeLeft(newTime);
    await update(sessionRef, { timeLeft: newTime });
  };

  const revealExplanation = async () => {
    setShowExplain(true);
    await update(sessionRef, { showExplain: true });
    if (config.explainDuration > 0) {
      setTimeout(() => {
        setShowExplain(false);
        update(sessionRef, { showExplain: false });
      }, config.explainDuration * 1000);
    }
  };

  const sendAnnouncement = async () => {
    if (!announcement.trim() || !sessionRef) return;
    await update(sessionRef, { announcement: announcement.trim(), announcedAt: Date.now() });
    setAnnouncement("");
  };

  const endSession = async () => {
    clearInterval(timerRef.current);
    setSessionStatus("ended");
    if (sessionRef) await update(sessionRef, { status: "ended" });
    buildAnalytics();
    setTab("analytics");
  };

  // ── Analytics ──────────────────────────────────────────────────────────────
  const buildAnalytics = () => {
    const parts  = Object.values(participants);
    if (parts.length === 0) { setAnalytics(null); return; }

    const sorted = [...parts].sort((a, b) => (b.score || 0) - (a.score || 0));

    // Per-question analysis
    const qStats = questions.slice(0, config.totalQuestions).map((q, qi) => {
      const answers = parts.map(p => p.answers?.[qi]);
      const correct = answers.filter(a => a === q.correctAnswer).length;
      const avgTime = answers.reduce((s, a, i) => s + (parts[i]?.times?.[qi] || 0), 0) / (answers.length || 1);
      return {
        question:   q.question.substring(0, 60) + "…",
        correctPct: parts.length ? Math.round((correct / parts.length) * 100) : 0,
        avgTime:    Math.round(avgTime),
      };
    });

    setAnalytics({
      leaderboard: sorted,
      qStats,
      totalParticipants: parts.length,
      avgScore: Math.round(parts.reduce((s, p) => s + (p.score || 0), 0) / parts.length),
      completionRate: Math.round((parts.filter(p => p.completed).length / parts.length) * 100),
    });
  };

  // ── Copy room link ─────────────────────────────────────────────────────────
  const copyLink = () => {
    const link = `${window.location.origin}/join/${roomCode}`;
    navigator.clipboard.writeText(link);
  };

  // ── Cleanup on unmount ─────────────────────────────────────────────────────
  useEffect(() => {
    return () => {
      clearInterval(timerRef.current);
      if (sessionRef) off(sessionRef);
    };
  }, [sessionRef]);

  const activeQs  = questions.slice(0, config.totalQuestions);
  const partList  = Object.values(participants);
  const currentQ  = questions[currentQIdx];

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div className="bh-page">

      {/* Top bar */}
      <header className="bh-topbar">
        <button className="bh-back" onClick={() => navigate("/home")}>
          <ArrowLeft size={16} />
        </button>
        <div className="bh-topbar-brand">
          <span className="bh-topbar-icon">⚡</span>
          <span>BlitzHost Live</span>
        </div>
        {sessionActive && (
          <div className="bh-room-badge">
            <span>{roomCode}</span>
            <button onClick={copyLink}><Copy size={12} /></button>
          </div>
        )}
      </header>

      {/* Tab bar */}
      <div className="bh-tabs">
        {TABS.map(t => (
          <button
            key={t}
            className={`bh-tab ${tab === t ? "bh-tab--active" : ""}`}
            onClick={() => setTab(t)}
          >
            {TAB_LABELS[t]}
          </button>
        ))}
      </div>

      <div className="bh-body">

        {/* ══ SETUP TAB ════════════════════════════════════════════════════ */}
        {tab === "setup" && (
          <div className="bh-panel">
            <h2 className="bh-section-title">Session Configuration</h2>

            {/* Title */}
            <div className="bh-field">
              <label>Session Title</label>
              <input
                className="bh-input"
                value={config.title}
                onChange={e => updateConfig("title", e.target.value)}
                placeholder="e.g. Pharmacology Exam Prep"
              />
            </div>

            {/* Quiz type + difficulty */}
            <div className="bh-row2">
              <div className="bh-field">
                <label>Quiz Type</label>
                <select className="bh-select" value={config.quizType} onChange={e => updateConfig("quizType", e.target.value)}>
                  {QUIZ_TYPES.map(t => <option key={t}>{t}</option>)}
                </select>
              </div>
              <div className="bh-field">
                <label>Difficulty</label>
                <select className="bh-select" value={config.difficulty} onChange={e => updateConfig("difficulty", e.target.value)}>
                  {DIFFICULTIES.map(d => <option key={d}>{d}</option>)}
                </select>
              </div>
            </div>

            {/* Questions + time */}
            <div className="bh-row2">
              <div className="bh-field">
                <label>Number of Questions</label>
                <input type="number" className="bh-input" min={1} max={100}
                  value={config.totalQuestions}
                  onChange={e => updateConfig("totalQuestions", Number(e.target.value))} />
              </div>
              <div className="bh-field">
                <label>Seconds per Question</label>
                <input type="number" className="bh-input" min={5} max={300}
                  value={config.timePerQ}
                  onChange={e => updateConfig("timePerQ", Number(e.target.value))} />
              </div>
            </div>

            {/* Explanation controls */}
            <div className="bh-field">
              <label>Show Explanations</label>
              <select className="bh-select" value={config.explainWhen} onChange={e => updateConfig("explainWhen", e.target.value)}>
                {EXPLAIN_WHEN.map(e => <option key={e}>{e}</option>)}
              </select>
            </div>

            {config.explainWhen !== "Manual reveal" && (
              <div className="bh-field">
                <label>Explanation Duration (seconds, 0 = until next Q)</label>
                <input type="number" className="bh-input" min={0} max={120}
                  value={config.explainDuration}
                  onChange={e => updateConfig("explainDuration", Number(e.target.value))} />
              </div>
            )}

            {/* Toggles */}
            <div className="bh-toggles">
              {[
                { key: "backtracking",  label: "Allow backtracking" },
                { key: "examMode",      label: "Exam simulation mode (no feedback during quiz)" },
                { key: "adaptiveDiff",  label: "Adaptive difficulty" },
                { key: "aiRemediation", label: "AI remediation on wrong answers" },
                { key: "followUpQs",    label: "AI follow-up practice questions" },
                { key: "anonymousBoard",label: "Anonymous leaderboard (students see rank, not names)" },
              ].map(({ key, label }) => (
                <label key={key} className="bh-toggle">
                  <input type="checkbox" checked={config[key]}
                    onChange={e => updateConfig(key, e.target.checked)} />
                  <span className="bh-toggle-track" />
                  <span className="bh-toggle-label">{label}</span>
                </label>
              ))}
            </div>

            <button
              className="bh-btn-primary"
              onClick={() => setTab("questions")}
            >
              Next: Add Questions <ChevronRight size={16} />
            </button>
          </div>
        )}

        {/* ══ QUESTIONS TAB ════════════════════════════════════════════════ */}
        {tab === "questions" && (
          <div className="bh-panel">

            {/* AI from topic */}
            <div className="bh-card">
              <p className="bh-card-title"><Zap size={14} /> Generate from Topic</p>
              <div className="bh-row2">
                <input className="bh-input" placeholder="e.g. Beta blockers, Cardiac physiology…"
                  value={aiTopic} onChange={e => setAiTopic(e.target.value)} />
                <input type="number" className="bh-input bh-input--sm" min={1} max={50}
                  value={aiCount} onChange={e => setAiCount(Number(e.target.value))} />
              </div>
              <button className="bh-btn-primary" onClick={generateFromTopic} disabled={aiLoading || !aiTopic.trim()}>
                {aiLoading ? <><RefreshCw size={14} className="bh-spin" /> Generating…</> : <><Zap size={14} /> Generate {aiCount} Questions</>}
              </button>
            </div>

            {/* PDF upload */}
            <div className="bh-card">
              <p className="bh-card-title"><Upload size={14} /> Upload PDF / Notes</p>
              <div className="bh-upload-zone" onClick={() => fileRef.current.click()}>
                {pdfLoading
                  ? <><RefreshCw size={18} className="bh-spin" /><span>Generating questions from your notes…</span></>
                  : pdfName
                  ? <><CheckCircle size={18} color="#0D7B65" /><span>{pdfName}</span></>
                  : <><Upload size={18} /><span>Click to upload PDF, slides or notes</span></>}
              </div>
              <input ref={fileRef} type="file" accept=".pdf,.ppt,.pptx,.docx,.txt"
                style={{ display: "none" }} onChange={handlePdfUpload} />
            </div>

            {/* Manual add */}
            <button className="bh-btn-outline" onClick={addBlankQuestion}>
              <Plus size={14} /> Add Question Manually
            </button>

            {/* Question list */}
            <div className="bh-q-header">
              <span>{questions.length} question{questions.length !== 1 ? "s" : ""} ready</span>
              {questions.length > 0 && (
                <button className="bh-btn-ghost" onClick={() => setQuestions([])}>
                  <Trash2 size={13} /> Clear all
                </button>
              )}
            </div>

            <div className="bh-q-list">
              {questions.map((q, idx) => (
                <div key={q.id} className={`bh-q-item ${editIdx === idx ? "bh-q-item--open" : ""}`}>
                  <div className="bh-q-row" onClick={() => setEditIdx(editIdx === idx ? null : idx)}>
                    <span className="bh-q-num">{idx + 1}</span>
                    <span className="bh-q-text">{q.question || <em>Empty question</em>}</span>
                    <span className={`bh-q-badge bh-diff--${q.difficulty}`}>{q.difficulty}</span>
                    <span className="bh-q-source">{q.source}</span>
                    <button className="bh-q-del" onClick={e => { e.stopPropagation(); removeQuestion(idx); }}>
                      <Trash2 size={13} />
                    </button>
                  </div>

                  {editIdx === idx && (
                    <div className="bh-q-edit">
                      <textarea className="bh-input bh-textarea"
                        value={q.question}
                        onChange={e => updateQuestion(idx, "question", e.target.value)}
                        placeholder="Question text…" rows={3} />

                      {q.type === "mcq" && q.options.map((opt, oi) => (
                        <div key={oi} className="bh-opt-row">
                          <input
                            type="radio"
                            name={`correct_${idx}`}
                            checked={q.correctAnswer === oi}
                            onChange={() => updateQuestion(idx, "correctAnswer", oi)}
                          />
                          <input className="bh-input bh-input--opt"
                            value={opt}
                            onChange={e => updateOption(idx, oi, e.target.value)}
                            placeholder={`Option ${String.fromCharCode(65 + oi)}`} />
                        </div>
                      ))}

                      <textarea className="bh-input bh-textarea"
                        value={q.explanation}
                        onChange={e => updateQuestion(idx, "explanation", e.target.value)}
                        placeholder="Explanation (shown after answer)…" rows={2} />

                      <select className="bh-select" value={q.difficulty}
                        onChange={e => updateQuestion(idx, "difficulty", e.target.value)}>
                        <option>easy</option><option>medium</option><option>hard</option>
                      </select>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {questions.length > 0 && (
              <button className="bh-btn-primary bh-btn-launch" onClick={createSession}>
                <Play size={16} /> Launch Session
              </button>
            )}
          </div>
        )}

        {/* ══ LIVE TAB ═════════════════════════════════════════════════════ */}
        {tab === "live" && (
          <div className="bh-panel">

            {!sessionActive ? (
              <div className="bh-empty">
                <p>No active session. Go to Questions tab and launch a session.</p>
                <button className="bh-btn-primary" onClick={() => setTab("questions")}>Go to Questions</button>
              </div>
            ) : (
              <>
                {/* Room info bar */}
                <div className="bh-room-bar">
                  <div className="bh-room-info">
                    <span className="bh-room-code">{roomCode}</span>
                    <span className="bh-room-status bh-status--{sessionStatus}">{sessionStatus.toUpperCase()}</span>
                  </div>
                  <div className="bh-room-actions">
                    <button className="bh-icon-btn" onClick={copyLink} title="Copy join link"><Copy size={16} /></button>
                  </div>
                </div>

                {/* Join link callout */}
                <div className="bh-join-callout">
                  <span>Students join at:</span>
                  <strong>{window.location.origin}/join/{roomCode}</strong>
                </div>

                {/* Participants */}
                <div className="bh-part-bar">
                  <Users size={14} />
                  <span>{partList.length} participant{partList.length !== 1 ? "s" : ""} connected</span>
                  <div className="bh-part-avatars">
                    {partList.slice(0, 8).map((p, i) => (
                      <div key={i} className="bh-avatar" title={config.anonymousBoard ? "Anonymous" : p.name}>
                        {(p.name?.[0] || "?").toUpperCase()}
                      </div>
                    ))}
                    {partList.length > 8 && <span className="bh-more">+{partList.length - 8}</span>}
                  </div>
                </div>

                {/* Waiting state */}
                {sessionStatus === "waiting" && (
                  <div className="bh-waiting">
                    <div className="bh-waiting-icon">⏳</div>
                    <p>Waiting for participants to join…</p>
                    <p className="bh-waiting-sub">{partList.length} joined so far</p>
                    <button className="bh-btn-primary bh-btn-start" onClick={startQuiz} disabled={partList.length === 0}>
                      <Play size={16} /> Start Quiz ({questions.slice(0, config.totalQuestions).length} questions)
                    </button>
                  </div>
                )}

                {/* Running / Paused state */}
                {(sessionStatus === "running" || sessionStatus === "paused") && currentQ && (
                  <div className="bh-live-content">
                    {/* Progress + timer */}
                    <div className="bh-live-meta">
                      <span className="bh-q-progress">Q {currentQIdx + 1} / {Math.min(questions.length, config.totalQuestions)}</span>
                      <div className={`bh-timer ${timeLeft <= 5 ? "bh-timer--urgent" : ""}`}>
                        <Clock size={14} />
                        <span>{timeLeft}s</span>
                      </div>
                    </div>

                    {/* Timer bar */}
                    <div className="bh-timer-track">
                      <div className="bh-timer-fill"
                        style={{ width: `${(timeLeft / config.timePerQ) * 100}%` }} />
                    </div>

                    {/* Current question */}
                    <div className="bh-live-q">
                      <p className="bh-live-q-text">{currentQ.question}</p>
                      {currentQ.options?.map((opt, oi) => (
                        <div key={oi} className={`bh-live-opt ${oi === currentQ.correctAnswer && showExplain ? "bh-live-opt--correct" : ""}`}>
                          <span className="bh-opt-letter">{String.fromCharCode(65 + oi)}</span>
                          <span>{opt}</span>
                        </div>
                      ))}
                    </div>

                    {/* Explanation */}
                    {showExplain && currentQ.explanation && (
                      <div className="bh-explanation">
                        <p className="bh-explanation-title">💡 Explanation</p>
                        <p>{currentQ.explanation}</p>
                      </div>
                    )}

                    {/* Host controls */}
                    <div className="bh-controls">
                      {sessionStatus === "running"
                        ? <button className="bh-ctrl-btn" onClick={pauseSession}><Pause size={16} /> Pause</button>
                        : <button className="bh-ctrl-btn bh-ctrl-btn--green" onClick={resumeSession}><Play size={16} /> Resume</button>}
                      <button className="bh-ctrl-btn" onClick={skipQuestion}><SkipForward size={16} /> Skip</button>
                      <button className="bh-ctrl-btn" onClick={() => extendTimer(15)}><Clock size={16} /> +15s</button>
                      {config.explainWhen === "Manual reveal" && (
                        <button className="bh-ctrl-btn bh-ctrl-btn--teal" onClick={revealExplanation}>
                          <Eye size={16} /> Reveal
                        </button>
                      )}
                      <button className="bh-ctrl-btn bh-ctrl-btn--red" onClick={endSession}>
                        <StopCircle size={16} /> End
                      </button>
                    </div>

                    {/* Live mini leaderboard */}
                    {partList.length > 0 && (
                      <div className="bh-mini-board">
                        <p className="bh-mini-board-title"><BarChart2 size={13} /> Live Standings</p>
                        {[...partList]
                          .sort((a, b) => (b.score || 0) - (a.score || 0))
                          .slice(0, 5)
                          .map((p, i) => (
                            <div key={i} className="bh-mini-row">
                              <span className="bh-mini-rank">#{i + 1}</span>
                              <span className="bh-mini-name">
                                {config.anonymousBoard ? `Student ${i + 1}` : (p.name || "Unknown")}
                              </span>
                              <span className="bh-mini-score">{p.score || 0} pts</span>
                            </div>
                          ))}
                      </div>
                    )}

                    {/* Announcement */}
                    <div className="bh-announce">
                      <input className="bh-input" placeholder="Send announcement to all participants…"
                        value={announcement} onChange={e => setAnnouncement(e.target.value)}
                        onKeyDown={e => e.key === "Enter" && sendAnnouncement()} />
                      <button className="bh-ctrl-btn bh-ctrl-btn--teal" onClick={sendAnnouncement}>
                        <Megaphone size={15} />
                      </button>
                    </div>
                  </div>
                )}

                {/* Ended */}
                {sessionStatus === "ended" && (
                  <div className="bh-ended">
                    <CheckCircle size={40} color="#0D7B65" />
                    <p>Session complete!</p>
                    <button className="bh-btn-primary" onClick={() => setTab("analytics")}>
                      <BarChart2 size={16} /> View Analytics
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* ══ ANALYTICS TAB ════════════════════════════════════════════════ */}
        {tab === "analytics" && (
          <div className="bh-panel">
            {!analytics ? (
              <div className="bh-empty">
                <BarChart2 size={40} color="#cbd5e1" />
                <p>Analytics will appear here after a session ends.</p>
              </div>
            ) : (
              <>
                {/* Summary cards */}
                <div className="bh-analytics-summary">
                  {[
                    { label: "Participants", val: analytics.totalParticipants, icon: "👥" },
                    { label: "Avg Score",    val: `${analytics.avgScore} pts`, icon: "⭐" },
                    { label: "Completion",   val: `${analytics.completionRate}%`, icon: "✅" },
                  ].map(s => (
                    <div key={s.label} className="bh-summary-card">
                      <span className="bh-summary-icon">{s.icon}</span>
                      <span className="bh-summary-val">{s.val}</span>
                      <span className="bh-summary-label">{s.label}</span>
                    </div>
                  ))}
                </div>

                {/* Full leaderboard */}
                <div className="bh-card">
                  <p className="bh-card-title">🏆 Final Leaderboard</p>
                  {analytics.leaderboard.map((p, i) => (
                    <div key={i} className="bh-lb-row">
                      <span className="bh-lb-rank">#{i + 1}</span>
                      <span className="bh-lb-name">{p.name || `Student ${i + 1}`}</span>
                      <span className="bh-lb-score">{p.score || 0} pts</span>
                      <div className="bh-lb-bar-wrap">
                        <div className="bh-lb-bar"
                          style={{ width: `${analytics.leaderboard[0]?.score ? (p.score / analytics.leaderboard[0].score) * 100 : 0}%` }} />
                      </div>
                    </div>
                  ))}
                </div>

                {/* Per-question breakdown */}
                <div className="bh-card">
                  <p className="bh-card-title">📊 Question Breakdown</p>
                  {analytics.qStats.map((qs, i) => (
                    <div key={i} className="bh-qs-row">
                      <span className="bh-qs-num">Q{i + 1}</span>
                      <span className="bh-qs-text">{qs.question}</span>
                      <div className="bh-qs-bar-wrap">
                        <div className={`bh-qs-bar ${qs.correctPct < 40 ? "bh-qs-bar--hard" : qs.correctPct > 70 ? "bh-qs-bar--easy" : ""}`}
                          style={{ width: `${qs.correctPct}%` }} />
                      </div>
                      <span className="bh-qs-pct">{qs.correctPct}%</span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        )}

      </div>
    </div>
  );
}