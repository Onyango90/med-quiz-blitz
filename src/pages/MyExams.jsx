// src/pages/MyExams.jsx
// Shows exam history for both students (sessions attended) and hosts (sessions run)
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
  getFirestore, collection, getDocs, doc,
  query, orderBy, deleteDoc,
} from "firebase/firestore";
import {
  ArrowLeft, BookOpen, Trophy, Users, Calendar,
  CheckCircle, XCircle, ChevronDown, ChevronUp,
  Trash2, Download, BarChart2, Clock, Zap,
} from "lucide-react";
import "./MyExams.css";

export default function MyExams() {
  const navigate         = useNavigate();
  const { currentUser }  = useAuth();
  const fsDb             = getFirestore();

  const [exams,     setExams]     = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [expanded,  setExpanded]  = useState(null); // expanded exam id
  const [filter,    setFilter]    = useState("all"); // "all" | "student" | "host"

  // ── Load exam history ─────────────────────────────────────────────────────
  useEffect(() => {
    if (!currentUser) { navigate("/signin"); return; }
    const load = async () => {
      setLoading(true);
      try {
        const col  = collection(fsDb, "users", currentUser.uid, "examHistory");
        const q    = query(col, orderBy("date", "desc"));
        const snap = await getDocs(q);
        setExams(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      } catch (e) {
        console.warn("Could not load exam history:", e);
      }
      setLoading(false);
    };
    load();
  }, [currentUser]);

  const deleteExam = async (id) => {
    if (!window.confirm("Remove this exam from your history?")) return;
    try {
      await deleteDoc(doc(fsDb, "users", currentUser.uid, "examHistory", id));
      setExams(prev => prev.filter(e => e.id !== id));
    } catch (e) {
      console.error("Delete failed:", e);
    }
  };

  // ── Download exam as text summary ─────────────────────────────────────────
  const downloadExam = (exam) => {
    const lines = [
      `MedBlitz Exam Record`,
      `===================`,
      `Session: ${exam.title}`,
      `Date: ${exam.date?.toDate?.()?.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" }) || "—"}`,
      `Role: ${exam.role === "host" ? "Host" : "Student"}`,
      exam.role === "student" ? `Score: ${exam.score} pts | Rank: #${exam.rank} of ${exam.totalStudents}` : `Participants: ${exam.participants}`,
      `Total Questions: ${exam.totalQs || exam.questions?.length || "—"}`,
      ``,
      `QUESTIONS & ANSWERS`,
      `-------------------`,
      ...(exam.questions || []).map((q, i) => [
        `Q${i + 1}. ${q.question}`,
        q.type === "mcq" && q.options
          ? (q.options || []).map((o, oi) => `   ${String.fromCharCode(65 + oi)}. ${o}${oi === q.correctAnswer ? " ✓" : ""}`).join("\n")
          : `   Model answer: ${q.correctAnswer || "—"}`,
        q.studentAnswer !== undefined && q.studentAnswer !== null
          ? `   Your answer: ${typeof q.studentAnswer === "number" ? (q.options?.[q.studentAnswer] || q.studentAnswer) : q.studentAnswer}`
          : "",
        q.keyPoints?.length > 0
          ? `   Key points: ${q.keyPoints.join(", ")}`
          : "",
        q.explanation ? `   Explanation: ${q.explanation}` : "",
        "",
      ].filter(Boolean).join("\n")),
    ].join("\n");

    const blob = new Blob([lines], { type: "text/plain" });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement("a");
    a.href     = url;
    a.download = `${exam.title?.replace(/\s+/g, "_") || "exam"}_${exam.sessionCode}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const filtered = exams.filter(e =>
    filter === "all" ? true : e.role === filter
  );

  const formatDate = (ts) => {
    if (!ts) return "—";
    const d = ts.toDate?.() || new Date(ts);
    return d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
  };

  return (
    <div className="me-page">

      {/* ── Header ── */}
      <header className="me-header">
        <button className="me-back" onClick={() => navigate("/home")}>
          <ArrowLeft size={15} />
        </button>
        <div className="me-header-center">
          <div className="me-header-icon"><BookOpen size={18} /></div>
          <div>
            <h1 className="me-title">My Exams</h1>
            <p className="me-subtitle">{exams.length} session{exams.length !== 1 ? "s" : ""} in your history</p>
          </div>
        </div>
      </header>

      {/* ── Filter tabs ── */}
      <div className="me-filters">
        {[
          { key: "all",     label: "All Sessions" },
          { key: "student", label: "As Student" },
          { key: "host",    label: "As Host" },
        ].map(({ key, label }) => (
          <button
            key={key}
            className={`me-filter-btn ${filter === key ? "me-filter-btn--active" : ""}`}
            onClick={() => setFilter(key)}
          >
            {label}
            <span className="me-filter-count">
              {key === "all" ? exams.length : exams.filter(e => e.role === key).length}
            </span>
          </button>
        ))}
      </div>

      <div className="me-body">

        {/* ── Loading ── */}
        {loading && (
          <div className="me-loading">
            <div className="me-spinner" />
            <p>Loading your exam history…</p>
          </div>
        )}

        {/* ── Empty ── */}
        {!loading && filtered.length === 0 && (
          <div className="me-empty">
            <BookOpen size={44} color="#d0d9d6" />
            <p>No exams found</p>
            <span>Sessions you attend or host will appear here</span>
          </div>
        )}

        {/* ── Exam cards ── */}
        {!loading && filtered.map(exam => {
          const isOpen   = expanded === exam.id;
          const isHost   = exam.role === "host";
          const mcqQs    = (exam.questions || []).filter(q => q.type === "mcq");
          const correctMCQ = mcqQs.filter(q => q.correct === true).length;
          const accuracy   = mcqQs.length > 0
            ? Math.round((correctMCQ / mcqQs.length) * 100)
            : null;

          return (
            <div key={exam.id} className={`me-card ${isOpen ? "me-card--open" : ""}`}>

              {/* Card header */}
              <div className="me-card-header" onClick={() => setExpanded(isOpen ? null : exam.id)}>
                <div className="me-card-left">
                  <div className={`me-card-role-dot ${isHost ? "me-role-host" : "me-role-student"}`} />
                  <div>
                    <p className="me-card-title">{exam.title || "Untitled Session"}</p>
                    <div className="me-card-meta">
                      <span><Calendar size={11} /> {formatDate(exam.date)}</span>
                      <span>{isHost ? "Host" : "Student"}</span>
                      <span>{exam.questions?.length || exam.totalQs || 0} questions</span>
                    </div>
                  </div>
                </div>

                <div className="me-card-right">
                  {/* Score / participant count */}
                  {!isHost && exam.score !== undefined && (
                    <div className="me-card-score">
                      <span className="me-score-val">{exam.score}</span>
                      <span className="me-score-label">pts</span>
                    </div>
                  )}
                  {!isHost && exam.rank && (
                    <div className="me-card-rank">
                      <Trophy size={12} />
                      <span>#{exam.rank}</span>
                    </div>
                  )}
                  {isHost && (
                    <div className="me-card-rank">
                      <Users size={12} />
                      <span>{exam.participants || 0}</span>
                    </div>
                  )}
                  {isOpen ? <ChevronUp size={16} color="#6b7e79" /> : <ChevronDown size={16} color="#6b7e79" />}
                </div>
              </div>

              {/* Expanded detail */}
              {isOpen && (
                <div className="me-card-body">

                  {/* Summary strip */}
                  <div className="me-summary-strip">
                    {!isHost && exam.rank && (
                      <div className="me-summary-stat">
                        <Trophy size={14} color="#b45309" />
                        <span>Rank #{exam.rank} of {exam.totalStudents}</span>
                      </div>
                    )}
                    {accuracy !== null && (
                      <div className="me-summary-stat">
                        <BarChart2 size={14} color="#0d7c6e" />
                        <span>{accuracy}% MCQ accuracy</span>
                      </div>
                    )}
                    {exam.questions?.length > 0 && (
                      <div className="me-summary-stat">
                        <BookOpen size={14} color="#6b7e79" />
                        <span>{exam.questions.length} questions</span>
                      </div>
                    )}
                  </div>

                  {/* Host participant results */}
                  {isHost && exam.participantResults?.length > 0 && (
                    <div className="me-section">
                      <p className="me-section-title">Participant Results</p>
                      <div className="me-participants">
                        {[...exam.participantResults]
                          .sort((a, b) => (b.score || 0) - (a.score || 0))
                          .slice(0, 10)
                          .map((p, i) => (
                            <div key={i} className="me-participant-row">
                              <span className="me-p-rank">#{i + 1}</span>
                              <span className="me-p-name">{p.name || "Anonymous"}</span>
                              <span className="me-p-score">{p.score || 0} pts</span>
                              <div className="me-p-bar-wrap">
                                <div className="me-p-bar" style={{
                                  width: `${exam.participantResults[0]?.score
                                    ? ((p.score || 0) / exam.participantResults[0].score) * 100
                                    : 0}%`
                                }} />
                              </div>
                            </div>
                          ))}
                      </div>
                    </div>
                  )}

                  {/* Questions review */}
                  {exam.questions?.length > 0 && (
                    <div className="me-section">
                      <p className="me-section-title">
                        {isHost ? "Questions in this session" : "Your answers"}
                      </p>
                      <div className="me-questions">
                        {exam.questions.map((q, qi) => {
                          const hasStudentAnswer = q.studentAnswer !== null && q.studentAnswer !== undefined;
                          const isMCQ = q.type === "mcq";
                          const correctAnswerText = isMCQ && q.options && typeof q.correctAnswer === "number"
                            ? q.options[q.correctAnswer]
                            : q.correctAnswer;
                          const studentAnswerText = isMCQ && q.options && typeof q.studentAnswer === "number"
                            ? q.options[q.studentAnswer]
                            : q.studentAnswer;
                          const isCorrect = isMCQ ? q.correct === true : null;

                          return (
                            <div key={qi} className={`me-q ${
                              !isHost && hasStudentAnswer
                                ? isCorrect === true  ? "me-q--correct"
                                : isCorrect === false ? "me-q--wrong"
                                : "me-q--saq"
                                : ""
                            }`}>
                              {/* Question number + type badge */}
                              <div className="me-q-top">
                                <span className="me-q-num">Q{qi + 1}</span>
                                <span className={`me-q-type ${q.type === "saq" ? "me-q-type--saq" : ""}`}>
                                  {q.type?.toUpperCase()}
                                </span>
                                {!isHost && hasStudentAnswer && isMCQ && (
                                  isCorrect
                                    ? <CheckCircle size={14} color="#0d7c6e" />
                                    : <XCircle size={14} color="#dc2626" />
                                )}
                              </div>

                              <p className="me-q-text">{q.question}</p>

                              {/* MCQ options */}
                              {isMCQ && q.options && (
                                <div className="me-q-options">
                                  {q.options.map((opt, oi) => (
                                    <div key={oi} className={`me-q-opt
                                      ${oi === q.correctAnswer ? "me-q-opt--correct" : ""}
                                      ${!isHost && q.studentAnswer === oi && oi !== q.correctAnswer ? "me-q-opt--wrong" : ""}
                                    `}>
                                      <span className="me-q-opt-letter">{String.fromCharCode(65 + oi)}</span>
                                      <span>{opt}</span>
                                      {oi === q.correctAnswer && <CheckCircle size={12} color="#0d7c6e" style={{ marginLeft: "auto" }} />}
                                    </div>
                                  ))}
                                </div>
                              )}

                              {/* SAQ answers */}
                              {!isMCQ && (
                                <div className="me-q-saq">
                                  {hasStudentAnswer && (
                                    <div className="me-q-saq-student">
                                      <p className="me-q-saq-label">Your answer</p>
                                      <p className="me-q-saq-text">{studentAnswerText}</p>
                                    </div>
                                  )}
                                  {correctAnswerText && (
                                    <div className="me-q-saq-model">
                                      <p className="me-q-saq-label">Model answer</p>
                                      <p className="me-q-saq-text">{correctAnswerText}</p>
                                    </div>
                                  )}
                                  {q.keyPoints?.filter(k => k?.trim()).length > 0 && (
                                    <div className="me-q-keypoints">
                                      <p className="me-q-saq-label">Key points</p>
                                      <div className="me-q-kp-list">
                                        {q.keyPoints.filter(k => k?.trim()).map((kp, ki) => (
                                          <span key={ki} className="me-q-kp">{kp}</span>
                                        ))}
                                      </div>
                                    </div>
                                  )}
                                </div>
                              )}

                              {/* Explanation */}
                              {q.explanation && (
                                <div className="me-q-explanation">
                                  <p className="me-q-expl-label">Explanation</p>
                                  <p className="me-q-expl-text">{q.explanation}</p>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="me-card-actions">
                    <button className="me-action-btn me-action-download" onClick={() => downloadExam(exam)}>
                      <Download size={14} /> Download Paper
                    </button>
                    <button className="me-action-btn me-action-delete" onClick={() => deleteExam(exam.id)}>
                      <Trash2 size={14} /> Remove
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}