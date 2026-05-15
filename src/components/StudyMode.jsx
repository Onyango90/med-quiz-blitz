import React, { useState, useEffect } from "react";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import { useStats } from "../hooks/useStats";
import FlashcardMode from "./FlashcardMode";
import {
  ChevronRight, BookOpen, Layers, Clock, Star,
  CheckCircle, XCircle, AlertCircle, ArrowRight,
  BarChart2, RotateCcw, Home, Zap, AlignLeft,
  CreditCard, ClipboardList, BookOpenText,
} from "lucide-react";

// Import anatomy categories
import grossAnatomy from "../data/questions/gross_anatomy.json";
import histology from "../data/questions/histology.json";
import embryology from "../data/questions/embryology.json";

// Import pathology subfiles
import pathologyQuestions         from "../data/questions/pathology.json";
import haematologyQuestions       from "../data/questions/haematology.json";
import clinicalChemistryQuestions from "../data/questions/clinical_chemistry.json";
import immunologyQuestions        from "../data/questions/immunology.json";

// Import physiology
import physiologyLevel1 from "../data/questions/physiology_level1.json";
import physiologyLevel2 from "../data/questions/physiology_level2.json";

// Import pharmacology subcategories
import {
  antibiotics, antifungals, antiparasitics,
  cardiovascular as pharmaCardio, cns, disinfectants,
  endocrine as pharmaEndocrine,
} from "../data/questions/pharmacology/index.js";

// Import clinical skills
import clinicalSkillsQuestions from "../data/questions/clinical_skills.json";

import correctSoundFile from "../sound/correct.wav";
import wrongSoundFile   from "../sound/wrong.wav";

// ── Question resolver ──────────────────────────────────────────────────────
function getQuestions(topic, subtopic, locationState) {
  if (locationState?.questions) return locationState.questions;
  switch (topic?.toLowerCase()) {
    case "gross_anatomy":      return grossAnatomy;
    case "histology":          return histology;
    case "embryology":         return embryology;
    case "anatomy":            return [...(grossAnatomy||[]), ...(histology||[]), ...(embryology||[])];
    case "pathology":          return pathologyQuestions;
    case "haematology":        return haematologyQuestions;
    case "clinical_chemistry": return clinicalChemistryQuestions;
    case "immunology":         return immunologyQuestions;
    case "physiology_level1":  return physiologyLevel1;
    case "physiology_level2":  return physiologyLevel2;
    case "physiology":         return [...(physiologyLevel1||[]), ...(physiologyLevel2||[])];
    case "antibiotics":        return antibiotics;
    case "antifungals":        return antifungals;
    case "antiparasitics":     return antiparasitics;
    case "cardiovascular":     return pharmaCardio;
    case "cns":                return cns;
    case "disinfectants":      return disinfectants;
    case "endocrine":          return pharmaEndocrine;
    case "clinical_skills":    return clinicalSkillsQuestions;
    default:                   return [];
  }
}

function getBatches(questions, batchSize = 15) {
  const batches = [];
  for (let i = 0; i < questions.length; i += batchSize)
    batches.push(questions.slice(i, i + batchSize));
  return batches;
}

function formatTopicLabel(str = "") {
  return str.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase());
}

// ── Colour palette — bright light theme ───────────────────────────────────
const C = {
  bg:         "#f5f7f6",
  surface:    "#ffffff",
  card:       "#ffffff",
  border:     "#e4eae8",
  borderHov:  "#c8d5d1",
  text:       "#1a1f1e",
  muted:      "#6b7e79",
  accent:     "#0d7c6e",
  accentDim:  "#0d7c6e18",
  green:      "#059669",
  greenDim:   "#05966912",
  red:        "#dc2626",
  redDim:     "#dc262612",
  amber:      "#b45309",
  amberDim:   "#b4530912",
};

// ── Shared micro-components ────────────────────────────────────────────────
const Badge = ({ children, color = C.accent }) => (
  <span style={{
    display: "inline-flex", alignItems: "center", gap: 5,
    padding: "4px 10px", borderRadius: 99,
    background: `${color}18`, border: `1px solid ${color}40`,
    color, fontSize: 11, fontWeight: 700, letterSpacing: "0.06em",
    textTransform: "uppercase", fontFamily: "'DM Sans', sans-serif",
  }}>
    {children}
  </span>
);

const ProgressBar = ({ value, color = C.accent, height = 4 }) => (
  <div style={{ height, background: C.border, borderRadius: 99, overflow: "hidden" }}>
    <div style={{
      height: "100%", width: `${Math.min(value, 100)}%`,
      background: color, borderRadius: 99,
      transition: "width 0.4s cubic-bezier(0.4,0,0.2,1)",
    }} />
  </div>
);

// ── Main component ──────────────────────────────────────────────────────────
function StudyMode() {
  const { topic, subtopic } = useParams();
  const location  = useLocation();
  const navigate  = useNavigate();
  const { startSession, processAnswer, endSession } = useStats();

  const isRetry          = location.state?.isRetry || false;
  const currentSubtopic  = subtopic || location.state?.subtopic;
  const allQuestions     = getQuestions(topic, currentSubtopic, location) || [];
  const batches          = getBatches(allQuestions, 15);
  const initialBatchIndex = location.state?.batchIndex || 0;

  const [currentBatchIndex, setCurrentBatchIndex] = useState(initialBatchIndex);
  const [currentIndex,      setCurrentIndex]      = useState(0);
  const [selectedAnswer,    setSelectedAnswer]    = useState("");
  const [showAnswer,        setShowAnswer]        = useState(false);
  const [timeLeft,          setTimeLeft]          = useState(45);
  const [answerStatus,      setAnswerStatus]      = useState(null); // "correct"|"wrong"|"timeout"
  const [batchResults,      setBatchResults]      = useState([]);
  const [showBatchSummary,  setShowBatchSummary]  = useState(false);
  const [xpEarned,          setXpEarned]          = useState(0);
  const [sessionStarted,    setSessionStarted]    = useState(false);
  const [studyView,         setStudyView]         = useState("quiz");
  const [hovered,           setHovered]           = useState(null);

  const currentBatch    = batches[currentBatchIndex] || [];
  const currentQuestion = currentBatch[currentIndex];
  const isLastInBatch   = currentIndex === currentBatch.length - 1;

  const correctSound = new Audio(correctSoundFile);
  const wrongSound   = new Audio(wrongSoundFile);

  useEffect(() => {
    if (!isRetry && !sessionStarted) { startSession("study"); setSessionStarted(true); }
  }, []);

  useEffect(() => {
    setCurrentIndex(0); setSelectedAnswer(""); setShowAnswer(false);
    setTimeLeft(45); setAnswerStatus(null); setShowBatchSummary(false);
  }, [topic, currentSubtopic, currentBatchIndex]);

  useEffect(() => {
    if (!currentQuestion || showAnswer) return;
    if (timeLeft <= 0) { setShowAnswer(true); setAnswerStatus("timeout"); wrongSound.play(); return; }
    const t = setInterval(() => setTimeLeft(p => p - 1), 1000);
    return () => clearInterval(t);
  }, [timeLeft, currentQuestion, showAnswer]);

  if (!topic) return <EmptyState message="No topic selected." onBack={() => navigate("/study-dashboard")} />;
  if (!allQuestions.length) return <EmptyState message={`No questions found for ${formatTopicLabel(topic)}.`} onBack={() => navigate("/study-dashboard")} />;

  // ── Flashcard view ────────────────────────────────────────────────────
  if (studyView === "flashcards") {
    return (
      <div style={{ background: C.bg, minHeight: "100vh" }}>
        <ModeSwitcher active="flashcards" onSwitch={setStudyView} count={allQuestions.length} />
        <FlashcardMode
          questions={allQuestions}
          subject={formatTopicLabel(currentSubtopic || topic)}
          onExit={() => setStudyView("quiz")}
        />
      </div>
    );
  }

  if (currentBatchIndex >= batches.length)
    return <EmptyState message="You have completed all questions!" onBack={() => navigate("/study-dashboard")} />;
  if (!currentQuestion) return <EmptyState message="Loading..." />;

  const questionText     = currentQuestion.text || currentQuestion.question;
  const isMCQ            = currentQuestion.type === "mcq" || (currentQuestion.options?.length > 0);
  const isShort          = currentQuestion.type === "short";

  const getCorrectAnswerText = () => {
    if (currentQuestion.options && typeof currentQuestion.correctAnswer === "number")
      return currentQuestion.options[currentQuestion.correctAnswer];
    return currentQuestion.correctAnswer || currentQuestion.answer;
  };

  const handleAnswer = (answer) => {
    if (showAnswer) return;
    setSelectedAnswer(answer);
    setShowAnswer(true);
    const correctAnswerText = getCorrectAnswerText();
    let isCorrect = false;
    if (currentQuestion.options) {
      isCorrect = typeof currentQuestion.correctAnswer === "number"
        ? answer === currentQuestion.options[currentQuestion.correctAnswer]
        : answer === currentQuestion.correctAnswer || answer === currentQuestion.answer;
    } else {
      isCorrect = typeof answer === "string" && typeof correctAnswerText === "string"
        ? answer.toLowerCase().trim() === correctAnswerText.toLowerCase().trim()
        : answer === correctAnswerText;
    }
    const xpToAdd = (!isRetry && isCorrect) ? (currentQuestion.xpValue || 10) : 0;
    if (isCorrect) { setAnswerStatus("correct"); if (!isRetry) setXpEarned(p => p + xpToAdd); correctSound.play(); }
    else           { setAnswerStatus("wrong");   wrongSound.play(); }
    if (!isRetry) processAnswer({ ...currentQuestion, subject: currentQuestion.subject || topic }, isCorrect, 0, "study");
    setBatchResults(p => [...p, {
      id: currentQuestion.id, question: questionText,
      userAnswer: answer, correctAnswer: correctAnswerText,
      isCorrect, explanation: currentQuestion.explanation,
      xpEarned: isCorrect ? xpToAdd : 0,
    }]);
  };

  const handleNext = () => {
    if (isLastInBatch) { setShowBatchSummary(true); }
    else {
      setSelectedAnswer(""); setShowAnswer(false);
      setTimeLeft(45); setAnswerStatus(null);
      setCurrentIndex(p => p + 1);
    }
  };

  const handleNextBatch = () => {
    setBatchResults([]); setShowBatchSummary(false);
    setCurrentBatchIndex(p => p + 1);
  };

  const handleReviewBatch = () => {
    navigate("/review", {
      state: {
        results: batchResults, topic, subtopic: currentSubtopic,
        originalPath: location.state?.originalPath || `/study/${topic}`,
        currentBatchIndex, totalBatches: batches.length,
        hasNextBatch: currentBatchIndex < batches.length - 1,
      },
    });
  };

  // ── Batch summary ──────────────────────────────────────────────────────
  if (showBatchSummary) {
    const correct   = batchResults.filter(r => r.isCorrect).length;
    const score     = Math.round((correct / batchResults.length) * 100);
    const totalXp   = batchResults.reduce((s, r) => s + r.xpEarned, 0);
    const isPassing = score >= 70;
    return (
      <div style={{ background: C.bg, minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: 24, fontFamily: "'DM Sans', sans-serif" }}>
        <div style={{ width: "100%", maxWidth: 520 }}>
          {/* Score ring area */}
          <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 24, padding: "40px 32px 32px", textAlign: "center" }}>
            <p style={{ color: C.muted, fontSize: 12, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 24 }}>
              Batch {currentBatchIndex + 1} of {batches.length} — {formatTopicLabel(currentSubtopic || topic)}
            </p>

            {/* Big score */}
            <div style={{
              width: 120, height: 120, borderRadius: "50%", margin: "0 auto 24px",
              background: `conic-gradient(${isPassing ? C.green : C.red} ${score * 3.6}deg, ${C.border} 0deg)`,
              display: "flex", alignItems: "center", justifyContent: "center", position: "relative",
            }}>
              <div style={{ width: 92, height: 92, borderRadius: "50%", background: C.card, display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column" }}>
                <span style={{ fontSize: 26, fontWeight: 800, color: isPassing ? C.green : C.red, fontFamily: "'Syne', sans-serif" }}>{score}%</span>
              </div>
            </div>

            <p style={{ color: C.text, fontSize: 16, fontWeight: 600, marginBottom: 4 }}>
              {correct} correct out of {batchResults.length}
            </p>
            {!isRetry && (
              <p style={{ color: C.amber, fontSize: 14, fontWeight: 600, marginTop: 4 }}>
                +{totalXp} XP earned
              </p>
            )}
            {isRetry && (
              <p style={{ color: C.muted, fontSize: 13, marginTop: 4 }}>Practice mode — no XP awarded</p>
            )}

            {/* Divider */}
            <div style={{ height: 1, background: C.border, margin: "28px 0" }} />

            {/* Actions */}
            <div style={{ display: "flex", gap: 12, flexWrap: "wrap", justifyContent: "center" }}>
              <ActionButton icon={<BarChart2 size={15} />} label="Review Answers" onClick={handleReviewBatch} color={C.accent} />
              {currentBatchIndex < batches.length - 1 && (
                <ActionButton icon={<ArrowRight size={15} />} label="Next Batch" onClick={handleNextBatch} color={C.green} />
              )}
              {currentBatchIndex === batches.length - 1 && (
                <ActionButton icon={<Home size={15} />} label="Back to Dashboard" onClick={() => navigate("/study-dashboard")} color={C.green} />
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── Progress values ────────────────────────────────────────────────────
  const batchPct    = ((currentIndex + 1) / currentBatch.length) * 100;
  const correctText = getCorrectAnswerText();

  // ── Main quiz view ─────────────────────────────────────────────────────
  return (
    <div style={{ background: C.bg, minHeight: "100vh", fontFamily: "'DM Sans', sans-serif", color: C.text }}>

      {/* Mode switcher */}
      <ModeSwitcher active="quiz" onSwitch={setStudyView} count={allQuestions.length} />

      <div style={{ maxWidth: 780, margin: "0 auto", padding: "20px 20px 60px" }}>

        {/* ── Top meta row ── */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, marginBottom: 20, flexWrap: "wrap" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <Badge color={C.accent}>{formatTopicLabel(currentSubtopic || topic)}</Badge>
            {isRetry && <Badge color={C.amber}>Practice</Badge>}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 6, color: C.amber, fontWeight: 700, fontSize: 13 }}>
            <Zap size={14} />
            <span>{xpEarned} XP</span>
          </div>
        </div>

        {/* ── Batch / question progress ── */}
        <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, padding: "14px 18px", marginBottom: 20 }}>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: C.muted, fontWeight: 600, marginBottom: 8 }}>
            <span>Batch {currentBatchIndex + 1} / {batches.length}</span>
            <span>Question {currentIndex + 1} / {currentBatch.length}</span>
          </div>
          <ProgressBar value={batchPct} color={C.accent} height={5} />
        </div>

        {/* ── Question card ── */}
        <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 20, padding: "28px 28px 24px", marginBottom: 16, position: "relative", overflow: "hidden" }}>
          {/* Accent line top */}
          <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 3, background: `linear-gradient(90deg, ${C.accent}, ${C.green})`, borderRadius: "20px 20px 0 0" }} />

          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12, marginBottom: 20 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <ClipboardList size={14} color={C.muted} />
              <span style={{ fontSize: 12, color: C.muted, fontWeight: 600, letterSpacing: "0.04em" }}>
                {isMCQ ? "MULTIPLE CHOICE" : "SHORT ANSWER"}
              </span>
            </div>

            {/* ── Circular countdown timer ── */}
            {!showAnswer && (() => {
              const RADIUS = 20;
              const CIRC   = 2 * Math.PI * RADIUS;
              const pct    = timeLeft / 45;
              const dash   = pct * CIRC;
              const tColor = timeLeft <= 10 ? C.red : timeLeft <= 20 ? C.amber : C.accent;
              return (
                <div style={{ position: "relative", width: 52, height: 52, flexShrink: 0 }}>
                  <svg width="52" height="52" style={{ transform: "rotate(-90deg)" }}>
                    <circle cx="26" cy="26" r={RADIUS} fill="none" stroke={C.border} strokeWidth="3.5" />
                    <circle
                      cx="26" cy="26" r={RADIUS} fill="none"
                      stroke={tColor} strokeWidth="3.5"
                      strokeLinecap="round"
                      strokeDasharray={`${dash} ${CIRC}`}
                      style={{ transition: "stroke-dasharray 1s linear, stroke 0.3s" }}
                    />
                  </svg>
                  <div style={{
                    position: "absolute", inset: 0,
                    display: "flex", flexDirection: "column",
                    alignItems: "center", justifyContent: "center",
                  }}>
                    <span style={{ fontSize: 13, fontWeight: 800, color: tColor, lineHeight: 1, fontFamily: "'Syne', sans-serif" }}>
                      {timeLeft}
                    </span>
                    <span style={{ fontSize: 8, color: C.muted, fontWeight: 600, letterSpacing: "0.04em" }}>SEC</span>
                  </div>
                </div>
              );
            })()}

            {/* When answer is shown, replace timer with a static "Answered" pill */}
            {showAnswer && (
              <span style={{
                fontSize: 11, fontWeight: 700, padding: "4px 10px", borderRadius: 99,
                background: answerStatus === "correct" ? C.greenDim : C.redDim,
                color: answerStatus === "correct" ? C.green : C.red,
                border: `1px solid ${answerStatus === "correct" ? C.green : C.red}40`,
                letterSpacing: "0.05em", textTransform: "uppercase",
              }}>
                {answerStatus === "correct" ? "Correct" : answerStatus === "timeout" ? "Time's up" : "Incorrect"}
              </span>
            )}
          </div>

          <p style={{ fontSize: "clamp(15px, 2.5vw, 18px)", fontWeight: 600, lineHeight: 1.6, color: C.text, marginBottom: 24, fontFamily: "'Syne', sans-serif" }}>
            {questionText}
          </p>

          {/* ── MCQ options ── */}
          {isMCQ && currentQuestion.options && (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: 10, marginTop: showAnswer ? 0 : 4 }}>
              {currentQuestion.options.map((opt, idx) => {
                const isSelected = selectedAnswer === opt;
                const isCorrectOpt = opt === correctText;
                let bg = C.surface, border = C.border, color = C.text;
                if (showAnswer) {
                  if (isCorrectOpt)      { bg = C.greenDim;  border = C.green;  color = C.green; }
                  else if (isSelected)   { bg = C.redDim;    border = C.red;    color = C.red;   }
                } else if (hovered === idx) {
                  border = C.accent; bg = C.accentDim;
                }
                return (
                  <button
                    key={idx}
                    onClick={() => handleAnswer(opt)}
                    onMouseEnter={() => setHovered(idx)}
                    onMouseLeave={() => setHovered(null)}
                    disabled={showAnswer}
                    style={{
                      background: bg, border: `1.5px solid ${border}`, borderRadius: 12,
                      padding: "13px 16px", color, fontSize: 14, fontWeight: 500,
                      fontFamily: "'DM Sans', sans-serif", cursor: showAnswer ? "default" : "pointer",
                      textAlign: "left", transition: "all 0.15s", display: "flex",
                      alignItems: "center", gap: 10,
                    }}
                  >
                    <span style={{ width: 22, height: 22, borderRadius: 6, border: `1.5px solid ${border}`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, fontSize: 11, fontWeight: 800, color }}>
                      {String.fromCharCode(65 + idx)}
                    </span>
                    {opt}
                    {showAnswer && isCorrectOpt && <CheckCircle size={14} style={{ marginLeft: "auto", flexShrink: 0 }} />}
                    {showAnswer && isSelected && !isCorrectOpt && <XCircle size={14} style={{ marginLeft: "auto", flexShrink: 0 }} />}
                  </button>
                );
              })}
            </div>
          )}

          {/* ── Short answer input ── */}
          {isShort && !showAnswer && (
            <div style={{ marginTop: 4 }}>
              <textarea
                rows={4}
                placeholder="Type your answer here..."
                value={selectedAnswer}
                onChange={e => setSelectedAnswer(e.target.value)}
                style={{
                  width: "100%", padding: "14px 16px", borderRadius: 12,
                  border: `1.5px solid ${C.border}`, background: C.surface,
                  color: C.text, fontSize: 15, fontFamily: "'DM Sans', sans-serif",
                  resize: "vertical", outline: "none", marginBottom: 12,
                }}
              />
              <button
                onClick={() => { if (selectedAnswer.trim()) handleAnswer(selectedAnswer); }}
                style={{
                  padding: "11px 22px", borderRadius: 10, border: "none",
                  background: C.accent, color: "#fff", fontFamily: "'DM Sans', sans-serif",
                  fontSize: 14, fontWeight: 700, cursor: "pointer", display: "inline-flex",
                  alignItems: "center", gap: 8,
                }}
              >
                <AlignLeft size={14} /> Submit Answer
              </button>
            </div>
          )}
        </div>

        {/* ── Answer feedback ── */}
        {showAnswer && (
          <div style={{
            background: answerStatus === "correct" ? C.greenDim : answerStatus === "timeout" ? C.amberDim : C.redDim,
            border: `1.5px solid ${answerStatus === "correct" ? C.green : answerStatus === "timeout" ? C.amber : C.red}`,
            borderRadius: 16, padding: "18px 22px", marginBottom: 16,
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
              {answerStatus === "correct"
                ? <CheckCircle size={18} color={C.green} />
                : answerStatus === "timeout"
                ? <AlertCircle size={18} color={C.amber} />
                : <XCircle size={18} color={C.red} />}
              <span style={{ fontWeight: 700, fontSize: 14, color: answerStatus === "correct" ? C.green : answerStatus === "timeout" ? C.amber : C.red }}>
                {answerStatus === "correct" ? "Correct" : answerStatus === "timeout" ? "Time's up" : "Incorrect"}
                {answerStatus === "correct" && !isRetry && currentQuestion.xpValue && (
                  <span style={{ marginLeft: 10, color: C.amber, fontWeight: 600 }}>
                    +{currentQuestion.xpValue} XP
                  </span>
                )}
              </span>
            </div>
            {isShort && (
              <div style={{ fontSize: 13, color: C.muted, display: "flex", flexDirection: "column", gap: 6 }}>
                <span><span style={{ color: C.text, fontWeight: 600 }}>Your answer: </span>{selectedAnswer || "—"}</span>
                <span><span style={{ color: C.text, fontWeight: 600 }}>Correct answer: </span><span style={{ color: C.green }}>{correctText}</span></span>
              </div>
            )}
          </div>
        )}

        {/* ── Explanation ── */}
        {showAnswer && currentQuestion.explanation && (
          <div style={{
            background: C.surface, border: `1.5px solid ${C.border}`,
            borderLeft: `4px solid ${C.accent}`,
            borderRadius: 16, padding: "18px 22px", marginBottom: 20,
          }}>
            <p style={{ fontSize: 12, fontWeight: 700, letterSpacing: "0.06em", color: C.accent, textTransform: "uppercase", marginBottom: 8 }}>
              Explanation
            </p>
            <p style={{ fontSize: 14, lineHeight: 1.7, color: C.muted }}>{currentQuestion.explanation}</p>
          </div>
        )}

        {/* ── Go Deeper button ── */}
        {showAnswer && (
          <button
            onClick={() => navigate("/ai-quiz", {
              state: {
                prefillTopic: currentQuestion.topic || currentQuestion.subject || formatTopicLabel(currentSubtopic || topic),
                prefillSubject: currentQuestion.subject || formatTopicLabel(topic),
                prefillContext: questionText,
              }
            })}
            style={{
              width: "100%", padding: "13px 24px", borderRadius: 14, marginBottom: 12,
              border: `1.5px solid ${C.accent}`,
              background: C.accentDim,
              color: C.accent, fontSize: 14, fontWeight: 700,
              fontFamily: "'DM Sans', sans-serif", cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
              transition: "all 0.18s",
            }}
            onMouseEnter={e => { e.currentTarget.style.background = C.accent; e.currentTarget.style.color = "#fff"; }}
            onMouseLeave={e => { e.currentTarget.style.background = C.accentDim; e.currentTarget.style.color = C.accent; }}
          >
            <BookOpenText size={16} />
            Go Deeper on this topic
          </button>
        )}

        {/* ── Next button ── */}
        {showAnswer && (
          <button
            onClick={handleNext}
            style={{
              width: "100%", padding: "15px 24px", borderRadius: 14, border: "none",
              background: `linear-gradient(135deg, ${C.accent}, #0a5c52)`,
              color: "#fff", fontSize: 15, fontWeight: 700,
              fontFamily: "'DM Sans', sans-serif", cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
              boxShadow: `0 8px 24px ${C.accent}30`,
              transition: "all 0.2s",
            }}
          >
            {isLastInBatch ? <><BarChart2 size={16} /> See Batch Results</> : <><ArrowRight size={16} /> Next Question</>}
          </button>
        )}
      </div>
    </div>
  );
}

// ── Sub-components ─────────────────────────────────────────────────────────

function ModeSwitcher({ active, onSwitch, count }) {
  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 8, padding: "10px 20px",
      background: "#ffffff", borderBottom: "1px solid #e4eae8",
      boxShadow: "0 1px 4px rgba(0,0,0,0.05)",
    }}>
      {[
        { key: "quiz",       label: "Quiz Mode",   icon: <ClipboardList size={13} /> },
        { key: "flashcards", label: "Flashcards",  icon: <CreditCard size={13} /> },
      ].map(({ key, label, icon }) => (
        <button
          key={key}
          onClick={() => onSwitch(key)}
          style={{
            display: "flex", alignItems: "center", gap: 6,
            padding: "7px 16px", borderRadius: 99,
            border: `1.5px solid ${active === key ? "#0d7c6e" : "#e4eae8"}`,
            background: active === key ? "#0d7c6e" : "#f5f7f6",
            color: active === key ? "#fff" : "#6b7e79",
            fontFamily: "'DM Sans', sans-serif", fontSize: 13, fontWeight: 700,
            cursor: "pointer", transition: "all 0.15s",
          }}
        >
          {icon} {label}
        </button>
      ))}
      <span style={{ marginLeft: "auto", fontSize: 11, color: "#6b7e79", fontWeight: 600 }}>
        {count} questions
      </span>
    </div>
  );
}

function ActionButton({ icon, label, onClick, color }) {
  const [hov, setHov] = useState(false);
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        display: "inline-flex", alignItems: "center", gap: 8,
        padding: "11px 20px", borderRadius: 12,
        border: `1.5px solid ${color}`,
        background: hov ? color : `${color}18`,
        color: hov ? "#fff" : color,
        fontFamily: "'DM Sans', sans-serif", fontSize: 14, fontWeight: 700,
        cursor: "pointer", transition: "all 0.15s",
      }}
    >
      {icon} {label}
    </button>
  );
}

function EmptyState({ message, onBack }) {
  return (
    <div style={{
      minHeight: "100vh", background: "#f5f7f6",
      display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
      gap: 16, fontFamily: "'DM Sans', sans-serif", color: "#6b7e79", padding: 24, textAlign: "center",
    }}>
      <BookOpen size={40} color="#d0d9d6" />
      <p style={{ fontSize: 16, color: "#1a1f1e" }}>{message}</p>
      {onBack && (
        <button
          onClick={onBack}
          style={{
            marginTop: 8, padding: "10px 22px", borderRadius: 10,
            border: "1.5px solid #0d7c6e", background: "transparent",
            color: "#0d7c6e", fontFamily: "'DM Sans', sans-serif",
            fontSize: 14, fontWeight: 700, cursor: "pointer",
          }}
        >
          Back to Dashboard
        </button>
      )}
    </div>
  );
}

export default StudyMode;