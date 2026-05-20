// src/pages/BlitzHost.jsx
// BlitzHost Live — AI-powered live quiz hosting for medical educators
import React, { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { getDatabase, ref, set, onValue, off, update } from "firebase/database";
import {
  getFirestore, doc, getDoc, setDoc, collection,
  getDocs, deleteDoc, serverTimestamp, query, orderBy,
} from "firebase/firestore";
import {
  ArrowLeft, Plus, Upload, Settings, Play, Pause,
  SkipForward, StopCircle, Users, Clock, Zap,
  ChevronRight, Eye, EyeOff, Megaphone, Trash2,
  BarChart2, CheckCircle, AlertCircle, Copy, RefreshCw,
  AlignLeft, List, BookMarked, Save, FolderOpen, X,
  Calendar, BookOpen, Download,
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

// ── Key points scoring ────────────────────────────────────────────────────────
// Returns { matched: number, total: number, score: 0-100, matchedPoints: string[] }
export function scoreKeyPoints(studentAnswer, keyPoints = []) {
  if (!keyPoints.length) {
    // No key points defined — fall back to loose string match
    return { matched: 0, total: 0, score: 0, matchedPoints: [] };
  }
  const normalise = (s) => s.toLowerCase().replace(/[^a-z0-9\s]/g, "").trim();
  const normAnswer = normalise(studentAnswer || "");
  const matchedPoints = [];

  keyPoints.forEach(kp => {
    if (!kp.trim()) return;
    // Check if any word/phrase from the key point appears in the student answer
    const normKp = normalise(kp);
    // Split key point into individual words and check all are present
    const words = normKp.split(/\s+/).filter(w => w.length > 2); // skip tiny words
    const allPresent = words.every(w => normAnswer.includes(w));
    if (allPresent || normAnswer.includes(normKp)) {
      matchedPoints.push(kp);
    }
  });

  const matched = matchedPoints.length;
  const total   = keyPoints.filter(k => k.trim()).length;
  const score   = total > 0 ? Math.round((matched / total) * 100) : 0;
  return { matched, total, score, matchedPoints };
}


const TABS = ["setup", "questions", "live", "analytics", "sessions"];
const TAB_LABELS = {
  setup:     "⚙️ Setup",
  questions: "📝 Questions",
  live:      "🔴 Live",
  analytics: "📊 Analytics",
  sessions:  "📁 My Sessions",
};

// ── Question type toggle ──────────────────────────────────────────────────────
function QuestionTypeToggle({ value, onChange }) {
  return (
    <div style={{
      display: "flex", gap: 0, background: "#f5f7f6",
      border: "1.5px solid #e4eae8", borderRadius: 10,
      overflow: "hidden", width: "fit-content",
    }}>
      {[
        { key: "mcq", label: "MCQ", icon: <List size={13} /> },
        { key: "saq", label: "SAQ", icon: <AlignLeft size={13} /> },
      ].map(({ key, label, icon }) => (
        <button
          key={key}
          onClick={() => onChange(key)}
          style={{
            display: "flex", alignItems: "center", gap: 5,
            padding: "6px 14px", border: "none",
            background: value === key ? "#0d7c6e" : "transparent",
            color: value === key ? "#fff" : "#6b7e79",
            fontFamily: "'DM Sans', sans-serif",
            fontSize: 12, fontWeight: 700, cursor: "pointer",
            transition: "all 0.15s",
          }}
        >
          {icon} {label}
        </button>
      ))}
    </div>
  );
}

export default function BlitzHost() {
  const navigate               = useNavigate();
  const { currentUser }        = useAuth();
  const db                     = getDatabase();

  useEffect(() => {
    if (!currentUser) navigate("/signin");
  }, [currentUser, navigate]);

  const [tab, setTab] = useState("setup");

  const [config, setConfig] = useState({
    title:          "Medical Quiz Session",
    quizType:       "MCQ",
    totalQuestions: 20,
    timePerQ:       30,
    totalDuration:  0,
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

  const [questions,   setQuestions]   = useState(() => {
    // ── Restore questions from localStorage on mount ──
    try {
      const saved = localStorage.getItem("blitzhost_draft_questions");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}
    return [];
  });
  const [aiLoading,   setAiLoading]   = useState(false);
  const [aiTopic,     setAiTopic]     = useState("");
  const [aiCount,     setAiCount]     = useState(10);
  // AI generation type — separate from session-level config.quizType
  const [aiGenType,   setAiGenType]   = useState("mcq"); // "mcq" | "saq"
  const [pdfName,     setPdfName]     = useState("");
  const [pdfLoading,  setPdfLoading]  = useState(false);
  const [editIdx,     setEditIdx]     = useState(null);
  const [draftSaved,  setDraftSaved]  = useState(false); // shows "Saved" indicator
  const fileRef                       = useRef();

  const [roomCode,      setRoomCode]      = useState("");
  const [sessionActive, setSessionActive] = useState(false);
  const [sessionStatus, setSessionStatus] = useState("idle");
  const [currentQIdx,   setCurrentQIdx]   = useState(0);
  const [timeLeft,      setTimeLeft]      = useState(0);
  const [participants,  setParticipants]  = useState({});
  const [announcement,  setAnnouncement]  = useState("");
  const [showExplain,   setShowExplain]   = useState(false);
  const [sessionRef,    setSessionRef]    = useState(null);
  const timerRef = useRef(null);

  const [analytics, setAnalytics] = useState(null);

  // ── Question banks (My Question Banks) ────────────────────────────────────
  const [banks,          setBanks]          = useState([]);
  const [banksLoading,   setBanksLoading]   = useState(false);
  const [showBankModal,  setShowBankModal]  = useState(false);
  const [showLoadModal,  setShowLoadModal]  = useState(false);
  const [bankName,       setBankName]       = useState("");
  const [bankSubject,    setBankSubject]    = useState("");
  const [savingBank,     setSavingBank]     = useState(false);

  // ── My Sessions (exam history) ────────────────────────────────────────────
  const [myExams,        setMyExams]        = useState([]);
  const [examsLoading,   setExamsLoading]   = useState(false);
  const [expandedExam,   setExpandedExam]   = useState(null);

  const fsDb = getFirestore();

  // ── Load user's saved question banks on mount ─────────────────────────────
  useEffect(() => {
    if (!currentUser) return;
    const loadBanks = async () => {
      setBanksLoading(true);
      try {
        const col  = collection(fsDb, "users", currentUser.uid, "questionBanks");
        const q    = query(col, orderBy("createdAt", "desc"));
        const snap = await getDocs(q);
        setBanks(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      } catch (e) { console.warn("Could not load question banks:", e); }
      setBanksLoading(false);
    };
    loadBanks();
  }, [currentUser]);

  // ── Load exam history when sessions tab is opened ─────────────────────────
  useEffect(() => {
    if (tab !== "sessions" || !currentUser) return;
    const loadExams = async () => {
      setExamsLoading(true);
      try {
        const col  = collection(fsDb, "users", currentUser.uid, "examHistory");
        const q    = query(col, orderBy("date", "desc"));
        const snap = await getDocs(q);
        setMyExams(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      } catch (e) { console.warn("Could not load exam history:", e); }
      setExamsLoading(false);
    };
    loadExams();
  }, [tab, currentUser]);

  const updateConfig = (k, v) => setConfig(c => ({ ...c, [k]: v }));

  // ── Auto-save questions to localStorage whenever they change ───────────────
  useEffect(() => {
    if (questions.length === 0) return;
    try {
      localStorage.setItem("blitzhost_draft_questions", JSON.stringify(questions));
      setDraftSaved(true);
      const t = setTimeout(() => setDraftSaved(false), 2000);
      return () => clearTimeout(t);
    } catch {}
  }, [questions]);

  // ── Clear draft after a successful session launch ──────────────────────────
  const clearDraft = () => {
    localStorage.removeItem("blitzhost_draft_questions");
  };

  // ── Save current questions as a named bank to Firestore ──────────────────
  const saveBank = async () => {
    if (!bankName.trim() || questions.length === 0 || !currentUser) return;
    setSavingBank(true);
    try {
      const bankId  = `bank_${Date.now()}`;
      const bankDoc = doc(fsDb, "users", currentUser.uid, "questionBanks", bankId);
      const data = {
        title:     bankName.trim(),
        subject:   bankSubject.trim() || "General",
        questions: questions.map(q => ({
          ...q,
          keyPoints:   q.keyPoints   ?? null,
          explanation: q.explanation ?? "",
          topic:       q.topic       ?? "",
          source:      q.source      ?? "",
        })),
        count:     questions.length,
        createdAt: serverTimestamp(),
        lastUsed:  serverTimestamp(),
      };
      await setDoc(bankDoc, data);
      setBanks(prev => [{ id: bankId, ...data, createdAt: new Date() }, ...prev]);
      setShowBankModal(false);
      setBankName("");
      setBankSubject("");
    } catch (e) {
      console.error("Failed to save bank:", e);
      alert("Failed to save. Please try again.");
    }
    setSavingBank(false);
  };

  // ── Load a saved bank into the editor ────────────────────────────────────
  const loadBank = async (bank) => {
    setQuestions(bank.questions || []);
    // Update lastUsed timestamp
    try {
      const bankDoc = doc(fsDb, "users", currentUser.uid, "questionBanks", bank.id);
      await setDoc(bankDoc, { lastUsed: serverTimestamp() }, { merge: true });
    } catch {}
    setShowLoadModal(false);
    setTab("questions");
  };

  // ── Delete exam from history ───────────────────────────────────────────────
  const deleteExam = async (examId) => {
    if (!window.confirm("Remove this session from your history?")) return;
    try {
      await deleteDoc(doc(fsDb, "users", currentUser.uid, "examHistory", examId));
      setMyExams(prev => prev.filter(e => e.id !== examId));
    } catch (e) { console.error("Delete failed:", e); }
  };

  // ── Download exam as text ──────────────────────────────────────────────────
  const downloadExam = (exam) => {
    const lines = [
      `MedBlitz Session Record — ${exam.title}`,
      `Date: ${exam.date?.toDate?.()?.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" }) || "—"}`,
      `Participants: ${exam.participants || 0} | Questions: ${exam.questions?.length || 0}`,
      ``,
      ...(exam.questions || []).map((q, i) => [
        `Q${i + 1}. [${q.type?.toUpperCase()}] ${q.question}`,
        q.type === "mcq" && q.options
          ? (q.options || []).map((o, oi) => `   ${String.fromCharCode(65+oi)}. ${o}${oi === q.correctAnswer ? " ✓" : ""}`).join("\n")
          : `   Model answer: ${q.correctAnswer || "—"}`,
        q.keyPoints?.filter(k=>k?.trim()).length > 0
          ? `   Key points: ${q.keyPoints.filter(k=>k?.trim()).join(", ")}`
          : "",
        q.explanation ? `   Explanation: ${q.explanation}` : "",
        "",
      ].filter(Boolean).join("\n")),
    ].join("\n");
    const blob = new Blob([lines], { type: "text/plain" });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement("a");
    a.href     = url;
    a.download = `${(exam.title||"session").replace(/\s+/g,"_")}_${exam.sessionCode||exam.id}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // ── Delete a saved bank ────────────────────────────────────────────────────
  const deleteBank = async (bankId) => {
    if (!window.confirm("Delete this question bank? This cannot be undone.")) return;
    try {
      await deleteDoc(doc(fsDb, "users", currentUser.uid, "questionBanks", bankId));
      setBanks(prev => prev.filter(b => b.id !== bankId));
    } catch (e) {
      console.error("Failed to delete bank:", e);
    }
  };

  // ── Switch question type (MCQ ↔ SAQ) and reset fields accordingly ──────────
  const switchQuestionType = (idx, newType) => {
    setQuestions(prev => prev.map((q, i) => {
      if (i !== idx) return q;
      if (newType === "saq") {
        // SAQ: remove options, set correctAnswer to string, init keyPoints
        return { ...q, type: "saq", options: [], correctAnswer: "", keyPoints: q.keyPoints || [] };
      } else {
        // MCQ: restore 5 blank options, set correctAnswer to index
        return { ...q, type: "mcq", options: ["", "", "", "", ""], correctAnswer: 0 };
      }
    }));
  };

  // ── AI generation — respects aiGenType ────────────────────────────────────
  const generateFromTopic = async () => {
    if (!aiTopic.trim()) return;
    setAiLoading(true);
    try {
      const isSAQ = aiGenType === "saq";
      const prompt = `Generate exactly ${aiCount} medical ${isSAQ ? "short answer (SAQ)" : "MCQ"} questions about "${aiTopic}" for medical students.
Return ONLY a valid JSON array, no markdown, no code fences. Each item:
${isSAQ
  ? `{ "question": "...", "correctAnswer": "concise model answer here", "explanation": "...", "difficulty": "medium", "topic": "${aiTopic}" }`
  : `{ "question": "...", "options": ["A", "B", "C", "D", "E"], "correctAnswer": 0, "explanation": "...", "difficulty": "medium", "topic": "${aiTopic}" }`
}`;

      const res  = await fetch(`${MICROSERVICE_URL}/api/generateQuestions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt }),
      });
      const data = await res.json();
      const qs   = (data.questions || []).map((q, i) => ({
        id: `ai_${Date.now()}_${i}`,
        type: aiGenType,
        question:      q.question || q.text || "",
        options:       isSAQ ? [] : (q.options || []),
        correctAnswer: isSAQ ? (q.correctAnswer || "") : (q.correctAnswer ?? 0),
        explanation:   q.explanation || "",
        difficulty:    q.difficulty  || "medium",
        topic:         q.topic       || aiTopic,
        source: "AI",
      }));
      setQuestions(prev => [...prev, ...qs]);
    } catch (e) {
      console.error("AI gen error", e);
    }
    setAiLoading(false);
  };

  // ── PDF upload ─────────────────────────────────────────────────────────────
  const handlePdfUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPdfName(file.name);
    setPdfLoading(true);
    try {
      const reader = new FileReader();
      reader.onload = async (ev) => {
        const base64 = ev.target.result.split(",")[1];
        const isSAQ  = aiGenType === "saq";
        const prompt = `You are a medical educator. Generate exactly ${aiCount} high-quality ${isSAQ ? "SAQ" : "MCQ"} questions from the uploaded content (filename: "${file.name}").
Return ONLY a valid JSON array:
${isSAQ
  ? `[{ "question": "...", "correctAnswer": "model answer", "explanation": "...", "difficulty": "medium", "topic": "derived" }]`
  : `[{ "question": "...", "options": ["A","B","C","D","E"], "correctAnswer": 0, "explanation": "...", "difficulty": "medium", "topic": "derived" }]`
}
Base64 snippet: ${base64.substring(0, 500)}`;

        const res  = await fetch(`${MICROSERVICE_URL}/api/generateQuestions`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ prompt }),
        });
        const data = await res.json();
        const qs = (data.questions || []).map((q, i) => ({
          id: `pdf_${Date.now()}_${i}`,
          type: isSAQ ? "saq" : "mcq",
          question:      q.question || q.text || "",
          options:       isSAQ ? [] : (q.options || []),
          correctAnswer: isSAQ ? (q.correctAnswer || "") : (q.correctAnswer ?? 0),
          explanation:   q.explanation || "",
          difficulty:    q.difficulty  || "medium",
          topic:         q.topic       || file.name.replace(".pdf", ""),
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

  // ── Manual add — now respects aiGenType so you can add a blank SAQ ─────────
  const addBlankQuestion = (type = aiGenType) => {
    const isSAQ = type === "saq";
    const blank = {
      id: `manual_${Date.now()}`,
      type,
      question:      "",
      options:       isSAQ ? [] : ["", "", "", "", ""],
      correctAnswer: isSAQ ? "" : 0,
      keyPoints:     isSAQ ? [] : null,
      explanation:   "",
      difficulty:    "medium",
      topic:         "",
      source:        "Manual",
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

    // ── Refresh token FIRST — prevents 401 after long editing sessions ──
    try {
      await currentUser.getIdToken(true);
    } catch (e) {
      alert("Session expired. Please sign in again.");
      return;
    }

    const code = genCode();
    setRoomCode(code);
    const selectedQs = shuffle(questions).slice(0, config.totalQuestions).map(q => ({
      ...q,
      keyPoints:   q.keyPoints   ?? null,
      explanation: q.explanation ?? "",
      topic:       q.topic       ?? "",
      source:      q.source      ?? "",
    }));
    const sRef = ref(db, `blitzhost/${code}`);
    setSessionRef(sRef);

    const sessionData = {
      code,
      hostUid:  currentUser.uid,
      title:    config.title,
      config:   { ...config },
      questions: selectedQs,
      answers:   selectedQs.map(q => ({
        correctAnswer: q.correctAnswer,
        explanation:   q.explanation,
        type:          q.type,
        // Include keyPoints so BlitzJoin can score SAQ answers
        keyPoints:     q.keyPoints ?? null,
      })),
      status:       "waiting",
      currentQIdx:  0,
      timeLeft:     config.timePerQ,
      showExplain:  false,
      participants: {},
      createdAt:    Date.now(),
    };

    await set(sRef, sessionData);

    // Clear the draft now that it's live in Firebase
    clearDraft();

    const partRef = ref(db, `blitzhost/${code}/participants`);
    onValue(partRef, snap => { setParticipants(snap.val() || {}); });

    setSessionStatus("waiting");
    setSessionActive(true);
    setCurrentQIdx(0);
    setTimeLeft(config.timePerQ);
    setTab("live");
  };

  const startQuiz = async () => {
    if (!sessionRef) return;
    await update(sessionRef, { status: "running", currentQIdx: 0, timeLeft: config.timePerQ });
    setSessionStatus("running");
    startTimer();
  };

  const startTimer = () => {
    clearInterval(timerRef.current);
    timerRef.current = setInterval(async () => {
      setTimeLeft(prev => {
        if (prev <= 1) { advanceQuestion(); return config.timePerQ; }
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

  const pauseSession  = async () => { clearInterval(timerRef.current); setSessionStatus("paused"); await update(sessionRef, { status: "paused" }); };
  const resumeSession = async () => { setSessionStatus("running"); await update(sessionRef, { status: "running" }); startTimer(); };
  const skipQuestion  = () => advanceQuestion();

  const extendTimer = async (extra = 15) => {
    const newTime = timeLeft + extra;
    setTimeLeft(newTime);
    await update(sessionRef, { timeLeft: newTime });
  };

  const revealExplanation = async () => {
    setShowExplain(true);
    await update(sessionRef, { showExplain: true });
    if (config.explainDuration > 0) {
      setTimeout(() => { setShowExplain(false); update(sessionRef, { showExplain: false }); }, config.explainDuration * 1000);
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

    // ── Save session record to host's examHistory ─────────────────────────
    try {
      const histDoc = doc(
        fsDb, "users", currentUser.uid, "examHistory", roomCode
      );
      await setDoc(histDoc, {
        sessionCode:  roomCode,
        title:        config.title,
        date:         serverTimestamp(),
        totalQs:      Math.min(questions.length, config.totalQuestions),
        participants: Object.keys(participants).length,
        role:         "host",
        questions:    questions.slice(0, config.totalQuestions).map(q => ({
          question:      q.question,
          type:          q.type,
          correctAnswer: q.correctAnswer,
          explanation:   q.explanation ?? "",
          keyPoints:     q.keyPoints   ?? null,
          options:       q.options     ?? null,
        })),
        participantResults: Object.values(participants).map(p => ({
          name:      p.name || "Anonymous",
          score:     p.score || 0,
          completed: p.completed || false,
        })),
      });
    } catch (e) {
      console.warn("Could not save exam history:", e);
    }

    setTab("analytics");
  };

  const buildAnalytics = () => {
    const parts = Object.values(participants);
    if (parts.length === 0) { setAnalytics(null); return; }
    const sorted = [...parts].sort((a, b) => (b.score || 0) - (a.score || 0));
    const qStats = questions.slice(0, config.totalQuestions).map((q, qi) => {
      const answers = parts.map(p => p.answers?.[qi]);
      const correct = answers.filter(a => a === q.correctAnswer).length;
      return {
        question:   q.question.substring(0, 60) + "…",
        type:       q.type,
        correctPct: parts.length ? Math.round((correct / parts.length) * 100) : 0,
      };
    });
    setAnalytics({
      leaderboard:       sorted,
      qStats,
      totalParticipants: parts.length,
      avgScore:          Math.round(parts.reduce((s, p) => s + (p.score || 0), 0) / parts.length),
      completionRate:    Math.round((parts.filter(p => p.completed).length / parts.length) * 100),
    });
  };

  const copyLink = () => navigator.clipboard.writeText(`${window.location.origin}/join/${roomCode}`);

  useEffect(() => {
    return () => { clearInterval(timerRef.current); if (sessionRef) off(sessionRef); };
  }, [sessionRef]);

  const partList = Object.values(participants);
  const currentQ = questions[currentQIdx];

  // ── MCQ count and SAQ count summary ─────────────────────────────────────────
  const mcqCount = questions.filter(q => q.type === "mcq").length;
  const saqCount = questions.filter(q => q.type === "saq").length;

  return (
    <div className="bh-page">

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

      <div className="bh-tabs">
        {TABS.map(t => (
          <button key={t} className={`bh-tab ${tab === t ? "bh-tab--active" : ""}`} onClick={() => setTab(t)}>
            {TAB_LABELS[t]}
          </button>
        ))}
      </div>

      <div className="bh-body">

        {/* ══ SETUP TAB ════════════════════════════════════════════════════ */}
        {tab === "setup" && (
          <div className="bh-panel">
            <h2 className="bh-section-title">Session Configuration</h2>

            <div className="bh-field">
              <label>Session Title</label>
              <input className="bh-input" value={config.title}
                onChange={e => updateConfig("title", e.target.value)}
                placeholder="e.g. Pharmacology Exam Prep" />
            </div>

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

            <div className="bh-toggles">
              {[
                { key: "backtracking",   label: "Allow backtracking" },
                { key: "examMode",       label: "Exam simulation mode (no feedback during quiz)" },
                { key: "adaptiveDiff",   label: "Adaptive difficulty" },
                { key: "aiRemediation",  label: "AI remediation on wrong answers" },
                { key: "followUpQs",     label: "AI follow-up practice questions" },
                { key: "anonymousBoard", label: "Anonymous leaderboard" },
              ].map(({ key, label }) => (
                <label key={key} className="bh-toggle">
                  <input type="checkbox" checked={config[key]} onChange={e => updateConfig(key, e.target.checked)} />
                  <span className="bh-toggle-track" />
                  <span className="bh-toggle-label">{label}</span>
                </label>
              ))}
            </div>

            <button className="bh-btn-primary" onClick={() => setTab("questions")}>
              Next: Add Questions <ChevronRight size={16} />
            </button>
          </div>
        )}

        {/* ══ QUESTIONS TAB ════════════════════════════════════════════════ */}
        {tab === "questions" && (
          <div className="bh-panel">

            {/* ── My Question Banks toolbar ── */}
            <div style={{ display: "flex", gap: 8, marginBottom: 4 }}>
              <button className="bh-btn-outline" onClick={() => setShowLoadModal(true)} style={{ flex: 1 }}>
                <FolderOpen size={14} /> Load from My Banks
                {banks.length > 0 && (
                  <span style={{ marginLeft: 4, background: "#0d7c6e", color: "#fff", borderRadius: 99, padding: "1px 7px", fontSize: 11, fontWeight: 800 }}>
                    {banks.length}
                  </span>
                )}
              </button>
              {questions.length > 0 && (
                <button className="bh-btn-outline" onClick={() => setShowBankModal(true)} style={{ flex: 1 }}>
                  <Save size={14} /> Save to My Banks
                </button>
              )}
            </div>

            {/* ── Draft restore notice ── */}
            {questions.length > 0 && (
              <div style={{
                display: "flex", alignItems: "center", justifyContent: "space-between",
                padding: "10px 14px", borderRadius: 10, marginBottom: 4,
                background: "#e0f7f4", border: "1.5px solid #0d7c6e",
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <CheckCircle size={14} color="#0d7c6e" />
                  <span style={{ fontSize: 13, fontWeight: 600, color: "#0d7c6e" }}>
                    {draftSaved ? "Draft saved automatically" : `${questions.length} question${questions.length !== 1 ? "s" : ""} — auto-saved. Safe to refresh.`}
                  </span>
                </div>
                <button
                  onClick={() => { setQuestions([]); clearDraft(); }}
                  style={{ fontSize: 11, color: "#dc2626", fontWeight: 700, background: "none", border: "none", cursor: "pointer" }}
                >
                  Clear draft
                </button>
              </div>
            )}

            {/* ── Question type selector for generation ── */}
            <div className="bh-card">
              <p className="bh-card-title" style={{ marginBottom: 8 }}>Question Type for Generation</p>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <QuestionTypeToggle value={aiGenType} onChange={setAiGenType} />
                <span style={{ fontSize: 12, color: "#6b7e79" }}>
                  {aiGenType === "mcq"
                    ? "Multiple choice — 5 options, one correct"
                    : "Short answer — typed response with model answer"}
                </span>
              </div>
            </div>

            {/* AI from topic */}
            <div className="bh-card">
              <p className="bh-card-title"><Zap size={14} /> Generate {aiGenType.toUpperCase()} from Topic</p>
              <div className="bh-row2">
                <input className="bh-input" placeholder="e.g. Beta blockers, Cardiac physiology…"
                  value={aiTopic} onChange={e => setAiTopic(e.target.value)} />
                <input type="number" className="bh-input bh-input--sm" min={1} max={50}
                  value={aiCount} onChange={e => setAiCount(Number(e.target.value))} />
              </div>
              <button className="bh-btn-primary" onClick={generateFromTopic} disabled={aiLoading || !aiTopic.trim()}>
                {aiLoading
                  ? <><RefreshCw size={14} className="bh-spin" /> Generating…</>
                  : <><Zap size={14} /> Generate {aiCount} {aiGenType.toUpperCase()} Questions</>}
              </button>
            </div>

            {/* PDF upload */}
            <div className="bh-card">
              <p className="bh-card-title"><Upload size={14} /> Upload PDF / Notes</p>
              <p style={{ fontSize: 12, color: "#6b7e79", marginBottom: 8 }}>
                Will generate <strong>{aiGenType.toUpperCase()}</strong> questions from your uploaded content.
              </p>
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

            {/* Manual add — two buttons for MCQ and SAQ */}
            <div style={{ display: "flex", gap: 8 }}>
              <button className="bh-btn-outline" onClick={() => addBlankQuestion("mcq")}>
                <List size={14} /> Add MCQ Manually
              </button>
              <button className="bh-btn-outline" onClick={() => addBlankQuestion("saq")}>
                <AlignLeft size={14} /> Add SAQ Manually
              </button>
            </div>

            {/* Question count summary */}
            {questions.length > 0 && (
              <div className="bh-q-header">
                <span>
                  {questions.length} question{questions.length !== 1 ? "s" : ""} —&nbsp;
                  <span style={{ color: "#0d7c6e", fontWeight: 700 }}>{mcqCount} MCQ</span>
                  {saqCount > 0 && <span style={{ color: "#7c3aed", fontWeight: 700 }}> · {saqCount} SAQ</span>}
                </span>
                <button className="bh-btn-ghost" onClick={() => setQuestions([])}>
                  <Trash2 size={13} /> Clear all
                </button>
              </div>
            )}

            {/* Question list */}
            <div className="bh-q-list">
              {questions.map((q, idx) => (
                <div key={q.id} className={`bh-q-item ${editIdx === idx ? "bh-q-item--open" : ""}`}>
                  <div className="bh-q-row" onClick={() => setEditIdx(editIdx === idx ? null : idx)}>
                    <span className="bh-q-num">{idx + 1}</span>
                    {/* Type badge */}
                    <span style={{
                      fontSize: 10, fontWeight: 800, padding: "2px 7px", borderRadius: 99,
                      background: q.type === "saq" ? "#f3f0ff" : "#e0f7f4",
                      color: q.type === "saq" ? "#7c3aed" : "#0d7c6e",
                      border: `1px solid ${q.type === "saq" ? "#ddd6fe" : "#a7f3d0"}`,
                      flexShrink: 0, textTransform: "uppercase",
                    }}>
                      {q.type}
                    </span>
                    <span className="bh-q-text">{q.question || <em>Empty question</em>}</span>
                    <span className={`bh-q-badge bh-diff--${q.difficulty}`}>{q.difficulty}</span>
                    <span className="bh-q-source">{q.source}</span>
                    <button className="bh-q-del" onClick={e => { e.stopPropagation(); removeQuestion(idx); }}>
                      <Trash2 size={13} />
                    </button>
                  </div>

                  {/* Expanded editor */}
                  {editIdx === idx && (
                    <div className="bh-q-edit">

                      {/* ── Type toggle inside editor ── */}
                      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
                        <span style={{ fontSize: 12, fontWeight: 700, color: "#6b7e79" }}>Question type:</span>
                        <QuestionTypeToggle
                          value={q.type}
                          onChange={(newType) => switchQuestionType(idx, newType)}
                        />
                      </div>

                      <textarea className="bh-input bh-textarea"
                        value={q.question}
                        onChange={e => updateQuestion(idx, "question", e.target.value)}
                        placeholder="Question text…" rows={3} />

                      {/* MCQ options */}
                      {q.type === "mcq" && (
                        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                          <p style={{ fontSize: 11, fontWeight: 700, color: "#6b7e79", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                            Options — select the correct answer
                          </p>
                          {(q.options || ["", "", "", ""]).map((opt, oi) => (
                            <div key={oi} className="bh-opt-row">
                              <input
                                type="radio"
                                name={`correct_${idx}`}
                                checked={q.correctAnswer === oi}
                                onChange={() => updateQuestion(idx, "correctAnswer", oi)}
                              />
                              <span style={{
                                width: 22, height: 22, borderRadius: 6,
                                background: q.correctAnswer === oi ? "#0d7c6e" : "#f5f7f6",
                                border: `1.5px solid ${q.correctAnswer === oi ? "#0d7c6e" : "#e4eae8"}`,
                                display: "flex", alignItems: "center", justifyContent: "center",
                                fontSize: 11, fontWeight: 800,
                                color: q.correctAnswer === oi ? "#fff" : "#6b7e79",
                                flexShrink: 0,
                              }}>
                                {String.fromCharCode(65 + oi)}
                              </span>
                              <input className="bh-input bh-input--opt"
                                value={opt}
                                onChange={e => updateOption(idx, oi, e.target.value)}
                                placeholder={`Option ${String.fromCharCode(65 + oi)}`} />
                            </div>
                          ))}
                        </div>
                      )}

                      {/* SAQ — model answer + key points array */}
                      {q.type === "saq" && (
                        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>

                          {/* Model answer */}
                          <div>
                            <p style={{ fontSize: 11, fontWeight: 700, color: "#7c3aed", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 6 }}>
                              Model Answer <span style={{ fontWeight: 500, textTransform: "none", color: "#9aaeaa" }}>(shown to students after time is up)</span>
                            </p>
                            <textarea className="bh-input bh-textarea"
                              value={q.correctAnswer || ""}
                              onChange={e => updateQuestion(idx, "correctAnswer", e.target.value)}
                              placeholder="Write the full model answer here…"
                              rows={3} />
                          </div>

                          {/* Key points array */}
                          <div>
                            <p style={{ fontSize: 11, fontWeight: 700, color: "#7c3aed", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 4 }}>
                              Key Points for Marking
                            </p>
                            <p style={{ fontSize: 11, color: "#6b7e79", marginBottom: 8, lineHeight: 1.5 }}>
                              Add each accepted answer or key concept separately. The student scores 1 point per key point matched in their response. Synonyms and partial phrases are accepted.
                            </p>

                            {/* Existing key points */}
                            {(q.keyPoints || []).map((kp, ki) => (
                              <div key={ki} style={{ display: "flex", gap: 6, marginBottom: 6, alignItems: "center" }}>
                                <span style={{
                                  width: 22, height: 22, borderRadius: 6, flexShrink: 0,
                                  background: "#f3f0ff", border: "1.5px solid #ddd6fe",
                                  display: "flex", alignItems: "center", justifyContent: "center",
                                  fontSize: 10, fontWeight: 800, color: "#7c3aed",
                                }}>
                                  {ki + 1}
                                </span>
                                <input
                                  className="bh-input"
                                  value={kp}
                                  onChange={e => {
                                    const updated = [...(q.keyPoints || [])];
                                    updated[ki] = e.target.value;
                                    updateQuestion(idx, "keyPoints", updated);
                                  }}
                                  placeholder={`Key point ${ki + 1} e.g. "loss of liver dullness"`}
                                  style={{ flex: 1 }}
                                />
                                <button
                                  onClick={() => {
                                    const updated = (q.keyPoints || []).filter((_, i) => i !== ki);
                                    updateQuestion(idx, "keyPoints", updated);
                                  }}
                                  style={{
                                    width: 28, height: 28, borderRadius: 7, flexShrink: 0,
                                    background: "#fee2e2", border: "1.5px solid #fecaca",
                                    color: "#dc2626", cursor: "pointer",
                                    display: "flex", alignItems: "center", justifyContent: "center",
                                  }}
                                >
                                  <Trash2 size={12} />
                                </button>
                              </div>
                            ))}

                            {/* Add key point button */}
                            <button
                              className="bh-btn-outline"
                              style={{ marginTop: 4, fontSize: 12, padding: "7px 14px" }}
                              onClick={() => {
                                const updated = [...(q.keyPoints || []), ""];
                                updateQuestion(idx, "keyPoints", updated);
                              }}
                            >
                              <Plus size={12} /> Add Key Point
                            </button>

                            {/* Scoring summary */}
                            {(q.keyPoints || []).length > 0 && (
                              <div style={{
                                marginTop: 10, padding: "8px 12px",
                                background: "#f3f0ff", border: "1.5px solid #ddd6fe",
                                borderRadius: 10, fontSize: 12, color: "#7c3aed", fontWeight: 600,
                              }}>
                                Scoring: {(q.keyPoints || []).length} key point{(q.keyPoints || []).length !== 1 ? "s" : ""} — student scores 1 mark per point matched
                              </div>
                            )}
                          </div>
                        </div>
                      )}

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
                <div className="bh-room-bar">
                  <div className="bh-room-info">
                    <span className="bh-room-code">{roomCode}</span>
                    <span className={`bh-room-status bh-status--${sessionStatus}`}>{sessionStatus.toUpperCase()}</span>
                  </div>
                  <div className="bh-room-actions">
                    <button className="bh-icon-btn" onClick={copyLink} title="Copy join link"><Copy size={16} /></button>
                  </div>
                </div>

                <div className="bh-join-callout">
                  <span>Students join at:</span>
                  <strong>{window.location.origin}/join/{roomCode}</strong>
                </div>

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

                {(sessionStatus === "running" || sessionStatus === "paused") && currentQ && (
                  <div className="bh-live-content">
                    <div className="bh-live-meta">
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <span className="bh-q-progress">Q {currentQIdx + 1} / {Math.min(questions.length, config.totalQuestions)}</span>
                        {/* Show question type badge in live view */}
                        <span style={{
                          fontSize: 10, fontWeight: 800, padding: "2px 7px", borderRadius: 99,
                          background: currentQ.type === "saq" ? "#f3f0ff" : "#e0f7f4",
                          color: currentQ.type === "saq" ? "#7c3aed" : "#0d7c6e",
                        }}>
                          {currentQ.type?.toUpperCase()}
                        </span>
                      </div>
                      <div className={`bh-timer ${timeLeft <= 5 ? "bh-timer--urgent" : ""}`}>
                        <Clock size={14} /><span>{timeLeft}s</span>
                      </div>
                    </div>

                    <div className="bh-timer-track">
                      <div className="bh-timer-fill" style={{ width: `${(timeLeft / config.timePerQ) * 100}%` }} />
                    </div>

                    <div className="bh-live-q">
                      <p className="bh-live-q-text">{currentQ.question}</p>

                      {/* MCQ options in live view */}
                      {currentQ.type === "mcq" && currentQ.options?.map((opt, oi) => (
                        <div key={oi} className={`bh-live-opt ${oi === currentQ.correctAnswer && showExplain ? "bh-live-opt--correct" : ""}`}>
                          <span className="bh-opt-letter">{String.fromCharCode(65 + oi)}</span>
                          <span>{opt}</span>
                        </div>
                      ))}

                      {/* SAQ model answer — only shown when explanation is revealed */}
                      {currentQ.type === "saq" && showExplain && (
                        <div style={{
                          marginTop: 12, padding: "12px 16px",
                          background: "#e0f7f4", border: "1.5px solid #0d7c6e",
                          borderRadius: 10,
                        }}>
                          <p style={{ fontSize: 11, fontWeight: 800, color: "#0d7c6e", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 4 }}>Model Answer</p>
                          <p style={{ fontSize: 14, color: "#065f46", lineHeight: 1.6 }}>{currentQ.correctAnswer}</p>
                        </div>
                      )}
                    </div>

                    {showExplain && currentQ.explanation && (
                      <div className="bh-explanation">
                        <p className="bh-explanation-title">💡 Explanation</p>
                        <p>{currentQ.explanation}</p>
                      </div>
                    )}

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

                    {partList.length > 0 && (
                      <div className="bh-mini-board">
                        <p className="bh-mini-board-title"><BarChart2 size={13} /> Live Standings</p>
                        {[...partList].sort((a, b) => (b.score || 0) - (a.score || 0)).slice(0, 5).map((p, i) => (
                          <div key={i} className="bh-mini-row">
                            <span className="bh-mini-rank">#{i + 1}</span>
                            <span className="bh-mini-name">{config.anonymousBoard ? `Student ${i + 1}` : (p.name || "Unknown")}</span>
                            <span className="bh-mini-score">{p.score || 0} pts</span>
                          </div>
                        ))}
                      </div>
                    )}

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
                <div className="bh-analytics-summary">
                  {[
                    { label: "Participants", val: analytics.totalParticipants, icon: "👥" },
                    { label: "Avg Score",    val: `${analytics.avgScore} pts`,  icon: "⭐" },
                    { label: "Completion",   val: `${analytics.completionRate}%`, icon: "✅" },
                  ].map(s => (
                    <div key={s.label} className="bh-summary-card">
                      <span className="bh-summary-icon">{s.icon}</span>
                      <span className="bh-summary-val">{s.val}</span>
                      <span className="bh-summary-label">{s.label}</span>
                    </div>
                  ))}
                </div>

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

                <div className="bh-card">
                  <p className="bh-card-title">📊 Question Breakdown</p>
                  {analytics.qStats.map((qs, i) => (
                    <div key={i} className="bh-qs-row">
                      <span className="bh-qs-num">Q{i + 1}</span>
                      <span style={{
                        fontSize: 9, fontWeight: 800, padding: "1px 5px", borderRadius: 99,
                        background: qs.type === "saq" ? "#f3f0ff" : "#e0f7f4",
                        color: qs.type === "saq" ? "#7c3aed" : "#0d7c6e",
                        flexShrink: 0,
                      }}>{qs.type?.toUpperCase()}</span>
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

        {/* ══ MY SESSIONS TAB ══════════════════════════════════════════════ */}
        {tab === "sessions" && (
          <div className="bh-panel">

            {examsLoading && (
              <div className="bh-empty">
                <RefreshCw size={28} className="bh-spin" color="#9aaeaa" />
                <p style={{ fontSize: 13, color: "#6b7e79", marginTop: 8 }}>Loading your sessions…</p>
              </div>
            )}

            {!examsLoading && myExams.length === 0 && (
              <div className="bh-empty">
                <BarChart2 size={40} color="#d0d9d6" />
                <p>No sessions yet.</p>
                <p style={{ fontSize: 12, color: "#9aaeaa", marginTop: 4 }}>
                  Sessions you host will appear here after they end.
                </p>
              </div>
            )}

            {!examsLoading && myExams.map(exam => {
              const isOpen = expandedExam === exam.id;
              const formatDate = (ts) => {
                if (!ts) return "—";
                const d = ts.toDate?.() || new Date(ts);
                return d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
              };

              return (
                <div key={exam.id} style={{
                  background: "#fff", border: `1.5px solid ${isOpen ? "#0d7c6e" : "#e4eae8"}`,
                  borderRadius: 16, overflow: "hidden",
                  boxShadow: isOpen ? "0 4px 20px rgba(0,0,0,0.08)" : "0 1px 4px rgba(0,0,0,0.05)",
                  marginBottom: 10, transition: "all 0.2s",
                }}>

                  {/* Row header */}
                  <div
                    onClick={() => setExpandedExam(isOpen ? null : exam.id)}
                    style={{
                      display: "flex", alignItems: "center", gap: 12,
                      padding: "14px 16px", cursor: "pointer",
                    }}
                  >
                    {/* Teal dot */}
                    <div style={{ width: 10, height: 10, borderRadius: "50%", background: "#0d7c6e", flexShrink: 0 }} />

                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: 14, fontWeight: 700, color: "#1a1f1e", marginBottom: 3 }}>{exam.title}</p>
                      <div style={{ display: "flex", gap: 10, fontSize: 11, color: "#6b7e79", flexWrap: "wrap" }}>
                        <span style={{ display: "flex", alignItems: "center", gap: 3 }}>
                          <Calendar size={10} /> {formatDate(exam.date)}
                        </span>
                        <span style={{ display: "flex", alignItems: "center", gap: 3 }}>
                          <Users size={10} /> {exam.participants || 0} students
                        </span>
                        <span style={{ display: "flex", alignItems: "center", gap: 3 }}>
                          <BookOpen size={10} /> {exam.questions?.length || exam.totalQs || 0} questions
                        </span>
                      </div>
                    </div>

                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span style={{
                        fontSize: 10, fontWeight: 800, padding: "3px 9px", borderRadius: 99,
                        background: "#e0f7f4", color: "#0d7c6e", border: "1px solid #a7f3d0",
                        textTransform: "uppercase", letterSpacing: "0.04em",
                      }}>Host</span>
                      {isOpen
                        ? <ChevronRight size={16} color="#6b7e79" style={{ transform: "rotate(90deg)" }} />
                        : <ChevronRight size={16} color="#6b7e79" />}
                    </div>
                  </div>

                  {/* Expanded content */}
                  {isOpen && (
                    <div style={{ borderTop: "1px solid #e4eae8", padding: "16px 16px 18px" }}>

                      {/* Participant results */}
                      {exam.participantResults?.length > 0 && (
                        <div style={{ marginBottom: 16 }}>
                          <p style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: "#6b7e79", marginBottom: 8 }}>
                            Participant Results
                          </p>
                          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                            {[...exam.participantResults]
                              .sort((a, b) => (b.score || 0) - (a.score || 0))
                              .map((p, i) => (
                                <div key={i} style={{
                                  display: "flex", alignItems: "center", gap: 10,
                                  padding: "8px 12px", background: "#f5f7f6",
                                  border: "1px solid #e4eae8", borderRadius: 10,
                                }}>
                                  <span style={{ fontSize: 11, fontWeight: 800, color: "#9aaeaa", width: 24 }}>#{i + 1}</span>
                                  <span style={{ flex: 1, fontSize: 13, fontWeight: 600, color: "#1a1f1e" }}>{p.name || "Anonymous"}</span>
                                  <span style={{ fontSize: 13, fontWeight: 800, color: "#0d7c6e" }}>{p.score || 0} pts</span>
                                  <div style={{ width: 80, height: 5, background: "#e4eae8", borderRadius: 99, overflow: "hidden" }}>
                                    <div style={{
                                      height: "100%", borderRadius: 99, background: "#0d7c6e",
                                      width: `${exam.participantResults[0]?.score ? ((p.score||0) / exam.participantResults[0].score) * 100 : 0}%`,
                                    }} />
                                  </div>
                                </div>
                              ))}
                          </div>
                        </div>
                      )}

                      {/* Questions list */}
                      {exam.questions?.length > 0 && (
                        <div style={{ marginBottom: 16 }}>
                          <p style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: "#6b7e79", marginBottom: 8 }}>
                            Questions ({exam.questions.length})
                          </p>
                          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                            {exam.questions.map((q, qi) => (
                              <div key={qi} style={{
                                background: "#f5f7f6", border: "1px solid #e4eae8",
                                borderRadius: 12, padding: "12px 14px",
                              }}>
                                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                                  <span style={{ fontSize: 10, fontWeight: 800, color: "#9aaeaa" }}>Q{qi + 1}</span>
                                  <span style={{
                                    fontSize: 9, fontWeight: 800, padding: "2px 7px", borderRadius: 99,
                                    background: q.type === "saq" ? "#f3f0ff" : "#e0f7f4",
                                    color: q.type === "saq" ? "#7c3aed" : "#0d7c6e",
                                  }}>{q.type?.toUpperCase()}</span>
                                </div>
                                <p style={{ fontSize: 13, fontWeight: 600, color: "#1a1f1e", lineHeight: 1.5, marginBottom: q.explanation ? 8 : 0 }}>
                                  {q.question}
                                </p>
                                {q.type === "mcq" && q.options && (
                                  <div style={{ display: "flex", flexDirection: "column", gap: 4, marginTop: 8 }}>
                                    {q.options.map((opt, oi) => (
                                      <div key={oi} style={{
                                        display: "flex", alignItems: "center", gap: 8,
                                        fontSize: 12, padding: "5px 10px", borderRadius: 8,
                                        background: oi === q.correctAnswer ? "#dcfce7" : "#fff",
                                        border: `1px solid ${oi === q.correctAnswer ? "#86efac" : "#e4eae8"}`,
                                        color: oi === q.correctAnswer ? "#15803d" : "#6b7e79",
                                        fontWeight: oi === q.correctAnswer ? 700 : 400,
                                      }}>
                                        <span style={{ fontWeight: 800, fontSize: 10 }}>{String.fromCharCode(65+oi)}</span>
                                        {opt}
                                        {oi === q.correctAnswer && <CheckCircle size={12} style={{ marginLeft: "auto" }} />}
                                      </div>
                                    ))}
                                  </div>
                                )}
                                {q.type === "saq" && q.correctAnswer && (
                                  <div style={{ marginTop: 8, padding: "8px 10px", background: "#e0f7f4", borderRadius: 8, fontSize: 12, color: "#065f46" }}>
                                    <span style={{ fontWeight: 700 }}>Model answer: </span>{q.correctAnswer}
                                  </div>
                                )}
                                {q.keyPoints?.filter(k => k?.trim()).length > 0 && (
                                  <div style={{ marginTop: 6, display: "flex", flexWrap: "wrap", gap: 5 }}>
                                    {q.keyPoints.filter(k => k?.trim()).map((kp, ki) => (
                                      <span key={ki} style={{
                                        fontSize: 10, fontWeight: 600, padding: "2px 8px", borderRadius: 99,
                                        background: "#f3f0ff", color: "#7c3aed", border: "1px solid #ddd6fe",
                                      }}>{kp}</span>
                                    ))}
                                  </div>
                                )}
                                {q.explanation && (
                                  <div style={{ marginTop: 8, padding: "8px 10px", borderLeft: "3px solid #0d7c6e", background: "#fff", borderRadius: "0 8px 8px 0", fontSize: 12, color: "#6b7e79" }}>
                                    <span style={{ fontWeight: 700, color: "#0d7c6e" }}>Explanation: </span>{q.explanation}
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Actions */}
                      <div style={{ display: "flex", gap: 10 }}>
                        <button
                          onClick={() => downloadExam(exam)}
                          style={{
                            display: "flex", alignItems: "center", gap: 7,
                            padding: "9px 16px", borderRadius: 10, border: "none",
                            background: "#0d7c6e", color: "#fff",
                            fontFamily: "'DM Sans', sans-serif", fontSize: 13, fontWeight: 700,
                            cursor: "pointer",
                          }}
                        >
                          <Download size={14} /> Download Paper
                        </button>
                        <button
                          onClick={() => {
                            // Load questions back into editor
                            if (exam.questions?.length > 0) {
                              setQuestions(exam.questions);
                              setTab("questions");
                            }
                          }}
                          className="bh-btn-outline"
                          style={{ fontSize: 13, padding: "9px 16px" }}
                        >
                          <RefreshCw size={13} /> Reuse Questions
                        </button>
                        <button
                          onClick={() => deleteExam(exam.id)}
                          style={{
                            display: "flex", alignItems: "center", gap: 7,
                            padding: "9px 14px", borderRadius: 10,
                            border: "1.5px solid #fecaca", background: "#fee2e2",
                            color: "#dc2626", fontFamily: "'DM Sans', sans-serif",
                            fontSize: 13, fontWeight: 700, cursor: "pointer",
                          }}
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

      </div>

      {/* ══ SAVE BANK MODAL ════════════════════════════════════════════ */}
      {showBankModal && (
        <div style={{
          position: "fixed", inset: 0, zIndex: 999,
          background: "rgba(0,0,0,0.35)", backdropFilter: "blur(4px)",
          display: "flex", alignItems: "center", justifyContent: "center", padding: 20,
        }} onClick={e => { if (e.target === e.currentTarget) setShowBankModal(false); }}>
          <div style={{
            width: "100%", maxWidth: 420, background: "#fff",
            borderRadius: 20, padding: "28px 24px",
            boxShadow: "0 8px 40px rgba(0,0,0,0.15)",
            border: "1.5px solid #e4eae8",
          }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: "#e0f7f4", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <BookMarked size={18} color="#0d7c6e" />
                </div>
                <div>
                  <p style={{ fontSize: 12, color: "#6b7e79", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em" }}>Save to My Banks</p>
                  <p style={{ fontSize: 15, fontWeight: 800, color: "#1a1f1e" }}>{questions.length} questions</p>
                </div>
              </div>
              <button onClick={() => setShowBankModal(false)} style={{ background: "none", border: "none", cursor: "pointer", color: "#6b7e79" }}>
                <X size={20} />
              </button>
            </div>

            <div className="bh-field" style={{ marginBottom: 12 }}>
              <label>Bank name</label>
              <input className="bh-input" value={bankName}
                onChange={e => setBankName(e.target.value)}
                placeholder="e.g. Pharmacology Exam 2025" autoFocus />
            </div>
            <div className="bh-field" style={{ marginBottom: 20 }}>
              <label>Subject / tag</label>
              <input className="bh-input" value={bankSubject}
                onChange={e => setBankSubject(e.target.value)}
                placeholder="e.g. Pharmacology, Anatomy…" />
            </div>

            <div style={{ display: "flex", gap: 10 }}>
              <button className="bh-btn-outline" onClick={() => setShowBankModal(false)} style={{ flex: 1 }}>Cancel</button>
              <button className="bh-btn-primary" onClick={saveBank}
                disabled={savingBank || !bankName.trim()} style={{ flex: 2 }}>
                {savingBank ? <><RefreshCw size={14} className="bh-spin" /> Saving…</> : <><Save size={14} /> Save Bank</>}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ══ LOAD BANK MODAL ════════════════════════════════════════════ */}
      {showLoadModal && (
        <div style={{
          position: "fixed", inset: 0, zIndex: 999,
          background: "rgba(0,0,0,0.35)", backdropFilter: "blur(4px)",
          display: "flex", alignItems: "center", justifyContent: "center", padding: 20,
        }} onClick={e => { if (e.target === e.currentTarget) setShowLoadModal(false); }}>
          <div style={{
            width: "100%", maxWidth: 520, background: "#fff",
            borderRadius: 20, padding: "28px 24px",
            boxShadow: "0 8px 40px rgba(0,0,0,0.15)",
            border: "1.5px solid #e4eae8",
            maxHeight: "80vh", display: "flex", flexDirection: "column",
          }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20, flexShrink: 0 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: "#e0f7f4", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <FolderOpen size={18} color="#0d7c6e" />
                </div>
                <div>
                  <p style={{ fontSize: 12, color: "#6b7e79", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em" }}>My Question Banks</p>
                  <p style={{ fontSize: 15, fontWeight: 800, color: "#1a1f1e" }}>{banks.length} saved bank{banks.length !== 1 ? "s" : ""}</p>
                </div>
              </div>
              <button onClick={() => setShowLoadModal(false)} style={{ background: "none", border: "none", cursor: "pointer", color: "#6b7e79" }}>
                <X size={20} />
              </button>
            </div>

            <div style={{ overflowY: "auto", flex: 1, display: "flex", flexDirection: "column", gap: 10 }}>
              {banksLoading && <p style={{ color: "#6b7e79", textAlign: "center", padding: 20 }}>Loading your banks…</p>}
              {!banksLoading && banks.length === 0 && (
                <div style={{ textAlign: "center", padding: "32px 0", color: "#6b7e79" }}>
                  <BookMarked size={36} color="#e4eae8" style={{ marginBottom: 10 }} />
                  <p style={{ fontSize: 14 }}>No saved banks yet.</p>
                  <p style={{ fontSize: 12, marginTop: 4 }}>Build a question set and save it to reuse later.</p>
                </div>
              )}
              {banks.map(bank => (
                <div key={bank.id} style={{
                  background: "#f5f7f6", border: "1.5px solid #e4eae8",
                  borderRadius: 14, padding: "14px 16px",
                  display: "flex", alignItems: "center", gap: 12,
                }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: 14, fontWeight: 700, color: "#1a1f1e", marginBottom: 2 }}>{bank.title}</p>
                    <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                      <span style={{ fontSize: 11, fontWeight: 600, color: "#0d7c6e", background: "#e0f7f4", padding: "2px 8px", borderRadius: 99 }}>
                        {bank.subject}
                      </span>
                      <span style={{ fontSize: 11, color: "#6b7e79" }}>{bank.count} questions</span>
                      <span style={{ fontSize: 11, color: "#9aaeaa" }}>
                        {bank.createdAt?.toDate?.()?.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) || ""}
                      </span>
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
                    <button
                      onClick={() => loadBank(bank)}
                      style={{
                        padding: "7px 14px", borderRadius: 9, border: "none",
                        background: "#0d7c6e", color: "#fff",
                        fontFamily: "'DM Sans', sans-serif", fontSize: 12, fontWeight: 700,
                        cursor: "pointer",
                      }}
                    >
                      Load
                    </button>
                    <button
                      onClick={() => deleteBank(bank.id)}
                      style={{
                        width: 32, height: 32, borderRadius: 9,
                        border: "1.5px solid #fecaca", background: "#fee2e2",
                        color: "#dc2626", cursor: "pointer",
                        display: "flex", alignItems: "center", justifyContent: "center",
                      }}
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}