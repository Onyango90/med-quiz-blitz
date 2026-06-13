import React, { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import { useStats } from "../hooks/useStats";
import { useAuth } from "../context/AuthContext";
import { useStudyProgress } from "../hooks/useStudyProgress";
import { useSeenQuestions, sortQuestionsByUnseen } from "../hooks/useSeenQuestions";
import FlashcardMode from "./FlashcardMode";
import {
  ChevronRight, BookOpen, Layers, Clock, Star,
  CheckCircle, XCircle, AlertCircle, ArrowRight,
  BarChart2, RotateCcw, Home, Zap, AlignLeft,
  CreditCard, ClipboardList, BookOpenText,
  Lock, PlayCircle, RotateCcw as Restart, Sparkles,
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

// Import bacteriology questions
import bacteriologyQuestions from "../data/questions/bacteriology.json";

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
    case "bacteriology":       return bacteriologyQuestions;
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
  const { currentUser, userData } = useAuth();

  // ── Pro status — check Firestore userData ──
  const isPro    = userData?.subscription?.isPro === true || userData?.isPro === true;
  const uid      = currentUser?.uid || null;
  const topicKey = [topic, subtopic].filter(Boolean).join("__");

  const isRetry          = location.state?.isRetry || false;
  const currentSubtopic  = subtopic || location.state?.subtopic;
  const rawQuestions     = getQuestions(topic, currentSubtopic, location) || [];

  // ── Seen questions tracking ───────────────────────────────────────────────
  const {
    seenIds,
    loading:   seenLoading,
    markSeen,
    resetSeen,
    getProgress,
  } = useSeenQuestions({ uid, topicKey });

  // Sort: unseen first, then seen — memoised so the timer tick never causes a re-sort
  const allQuestions = useMemo(() => {
    if (seenLoading) return rawQuestions;
    return sortQuestionsByUnseen(rawQuestions, seenIds);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [seenLoading, seenIds.length, topic, currentSubtopic]);

  const batches = useMemo(() => getBatches(allQuestions, 15), [allQuestions]);

  // ── Progress hook ──
  const { progress, loadingProg, saveProgress, clearProgress, saveError } =
    useStudyProgress({ uid, isPro, topicKey });

  // ── Resume state ──
  const [resumeDecided,   setResumeDecided]   = useState(!isPro);
  const [showResumePrompt,setShowResumePrompt]= useState(false);

  // ── Determine starting batch/question ──
  const initialBatchIndex    = location.state?.batchIndex || 0;
  const [currentBatchIndex,  setCurrentBatchIndex]  = useState(initialBatchIndex);
  const [currentIndex,       setCurrentIndex]       = useState(0);
  const [selectedAnswer,     setSelectedAnswer]     = useState("");
  const [showAnswer,         setShowAnswer]         = useState(false);
  const [timeLeft,           setTimeLeft]           = useState(45);
  const [answerStatus,       setAnswerStatus]       = useState(null);
  const [batchResults,       setBatchResults]       = useState([]);
  const [showBatchSummary,   setShowBatchSummary]   = useState(false);
  const [xpEarned,           setXpEarned]           = useState(0);
  const [sessionStarted,     setSessionStarted]     = useState(false);
  const [studyView,          setStudyView]          = useState("quiz");
  const [hovered,            setHovered]            = useState(null);
  const [showDeepStudy,      setShowDeepStudy]      = useState(false);
  const [deepStudyQuestion,  setDeepStudyQuestion]  = useState(null);
  const [totalAnswered,      setTotalAnswered]       = useState(0);
  const [totalCorrect,       setTotalCorrect]        = useState(0);
  const [completedBatches,   setCompletedBatches]   = useState([]);

  // ── Show resume prompt once progress loads ──
  useEffect(() => {
    if (!loadingProg && isPro) {
      if (progress && (progress.batchIndex > 0 || progress.questionIndex > 0)) {
        setShowResumePrompt(true);
      } else {
        setResumeDecided(true);
      }
    }
  }, [loadingProg, isPro, progress]);

  // ── Resume: restore saved position ──
  const handleResume = () => {
    if (progress) {
      setCurrentBatchIndex(progress.batchIndex || 0);
      setCurrentIndex(progress.questionIndex || 0);
      setTotalAnswered(progress.totalAnswered || 0);
      setTotalCorrect(progress.totalCorrect || 0);
      setCompletedBatches(progress.completedBatches || []);
    }
    setShowResumePrompt(false);
    setResumeDecided(true);
  };

  // ── Start fresh: clear Firestore progress ──
  const handleStartFresh = async () => {
    await clearProgress();
    setCurrentBatchIndex(0);
    setCurrentIndex(0);
    setTotalAnswered(0);
    setTotalCorrect(0);
    setCompletedBatches([]);
    setShowResumePrompt(false);
    setResumeDecided(true);
  };

  const currentBatch    = batches[currentBatchIndex] || [];
  const currentQuestion = currentBatch[currentIndex];
  const isLastInBatch   = currentIndex === currentBatch.length - 1;

  const correctSound = useRef(null);
  const wrongSound   = useRef(null);

  useEffect(() => {
    try { correctSound.current = new Audio(correctSoundFile); } catch {}
    try { wrongSound.current   = new Audio(wrongSoundFile);   } catch {}
  }, []);

  useEffect(() => {
    if (!isRetry && !sessionStarted) { startSession("study"); setSessionStarted(true); }
  }, []);

  useEffect(() => {
    setCurrentIndex(0); setSelectedAnswer(""); setShowAnswer(false);
    setTimeLeft(45); setAnswerStatus(null); setShowBatchSummary(false);
  }, [topic, currentSubtopic, currentBatchIndex]);

  useEffect(() => {
    if (!currentQuestion || showAnswer) return;
    if (timeLeft <= 0) { setShowAnswer(true); setAnswerStatus("timeout"); wrongSound.current?.play?.().catch(() => {}); return; }
    const t = setInterval(() => setTimeLeft(p => p - 1), 1000);
    return () => clearInterval(t);
  }, [timeLeft, currentQuestion, showAnswer]);

  if (!topic) return <EmptyState message="No topic selected." onBack={() => navigate("/study-dashboard")} />;
  if (!allQuestions.length) return <EmptyState message={`No questions found for ${formatTopicLabel(topic)}.`} onBack={() => navigate("/study-dashboard")} />;

  // ── Wait for both progress AND seen questions to load ──
  if ((isPro && loadingProg) || seenLoading) {
    return (
      <div style={{ minHeight: "100vh", background: C.bg, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 14, fontFamily: "'DM Sans', sans-serif" }}>
        <div style={{ width: 36, height: 36, borderRadius: "50%", border: `3px solid ${C.border}`, borderTopColor: C.accent, animation: "spin 0.75s linear infinite" }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        <p style={{ color: C.muted, fontSize: 14 }}>Loading your progress…</p>
      </div>
    );
  }

  // ── Resume prompt ──
  if (showResumePrompt && progress) {
    const lastDate = progress.lastStudied?.toDate?.()?.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) || "recently";
    const pct = progress.totalAnswered > 0 ? Math.round((progress.totalCorrect / progress.totalAnswered) * 100) : 0;
    return (
      <div style={{ minHeight: "100vh", background: C.bg, display: "flex", alignItems: "center", justifyContent: "center", padding: 24, fontFamily: "'DM Sans', sans-serif" }}>
        <div style={{ width: "100%", maxWidth: 480, background: C.surface, borderRadius: 24, padding: "36px 32px", boxShadow: "0 8px 32px rgba(0,0,0,0.10)", border: `1.5px solid ${C.border}` }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24 }}>
            <div style={{ width: 46, height: 46, borderRadius: 13, background: C.accentDim, color: C.accent, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <PlayCircle size={22} />
            </div>
            <div>
              <p style={{ fontSize: 12, color: C.muted, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em" }}>Welcome back</p>
              <h2 style={{ fontSize: 18, fontWeight: 800, color: C.text, fontFamily: "'Syne', sans-serif", letterSpacing: "-0.01em" }}>
                {formatTopicLabel(currentSubtopic || topic)}
              </h2>
            </div>
          </div>

          <div style={{ background: C.bg, borderRadius: 14, padding: "16px 18px", marginBottom: 24, border: `1px solid ${C.border}` }}>
            <p style={{ fontSize: 12, color: C.muted, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 12 }}>Your last session · {lastDate}</p>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }}>
              {[
                { label: "Batch",     value: `${(progress.batchIndex || 0) + 1} / ${batches.length}` },
                { label: "Answered",  value: progress.totalAnswered || 0 },
                { label: "Accuracy",  value: `${pct}%` },
              ].map(({ label, value }) => (
                <div key={label} style={{ textAlign: "center" }}>
                  <p style={{ fontSize: 20, fontWeight: 800, color: C.accent, fontFamily: "'Syne', sans-serif" }}>{value}</p>
                  <p style={{ fontSize: 11, color: C.muted, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.04em" }}>{label}</p>
                </div>
              ))}
            </div>
            <div style={{ marginTop: 14 }}>
              <ProgressBar value={((progress.batchIndex || 0) / batches.length) * 100} color={C.accent} height={5} />
              <p style={{ fontSize: 11, color: C.muted, marginTop: 5, fontWeight: 500 }}>
                {(progress.completedBatches || []).length} of {batches.length} batches completed
              </p>
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <button onClick={handleResume} style={{
              padding: "14px 20px", borderRadius: 12, border: "none",
              background: `linear-gradient(135deg, ${C.accent}, #0a5c52)`,
              color: "#fff", fontSize: 15, fontWeight: 700,
              fontFamily: "'DM Sans', sans-serif", cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
              boxShadow: `0 4px 16px ${C.accent}35`,
            }}>
              <PlayCircle size={17} /> Resume where I left off
            </button>
            <button onClick={handleStartFresh} style={{
              padding: "13px 20px", borderRadius: 12,
              border: `1.5px solid ${C.border}`, background: C.bg,
              color: C.muted, fontSize: 14, fontWeight: 700,
              fontFamily: "'DM Sans', sans-serif", cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
            }}>
              <RotateCcw size={15} /> Start from the beginning
            </button>
          </div>
        </div>
      </div>
    );
  }

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
    if (isCorrect) { setAnswerStatus("correct"); if (!isRetry) setXpEarned(p => p + xpToAdd); correctSound.current?.play?.().catch(() => {}); }
    else           { setAnswerStatus("wrong");   wrongSound.current?.play?.().catch(() => {}); }
    if (!isRetry) processAnswer({ ...currentQuestion, subject: currentQuestion.subject || topic }, isCorrect, 0, "study");

    const newTotalAnswered = totalAnswered + 1;
    const newTotalCorrect  = totalCorrect + (isCorrect ? 1 : 0);
    setTotalAnswered(newTotalAnswered);
    setTotalCorrect(newTotalCorrect);

    if (isPro && !isRetry) {
      saveProgress({
        batchIndex:       currentBatchIndex,
        questionIndex:    currentIndex,
        completedBatches,
        totalAnswered:    newTotalAnswered,
        totalCorrect:     newTotalCorrect,
      });
    }

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
    const newCompleted = [...new Set([...completedBatches, currentBatchIndex])];
    setCompletedBatches(newCompleted);
    setBatchResults([]); setShowBatchSummary(false);
    const nextBatch = currentBatchIndex + 1;
    setCurrentBatchIndex(nextBatch);
    if (isPro && !isRetry) {
      saveProgress({
        batchIndex: nextBatch, questionIndex: 0,
        completedBatches: newCompleted,
        totalAnswered, totalCorrect,
      });
    }
    const batchQs = batches[currentBatchIndex] || [];
    if (batchQs.length > 0) markSeen(batchQs);
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
          <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 24, padding: "40px 32px 32px", textAlign: "center" }}>
            <p style={{ color: C.muted, fontSize: 12, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 24 }}>
              Batch {currentBatchIndex + 1} of {batches.length} — {formatTopicLabel(currentSubtopic || topic)}
            </p>

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

            <div style={{ height: 1, background: C.border, margin: "28px 0" }} />

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
  <>
    <div style={{ background: C.bg, minHeight: "100vh", fontFamily: "'DM Sans', sans-serif", color: C.text }}>

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
            onClick={() => { setDeepStudyQuestion(currentQuestion); setShowDeepStudy(true); }}
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
            Go Deeper — Read more about this topic
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

    {/* ── Deep Study Panel ── */}
    {showDeepStudy && deepStudyQuestion && (
      <DeepStudyPanel
        question={deepStudyQuestion}
        topic={currentSubtopic || topic}
        onClose={() => setShowDeepStudy(false)}
      />
    )}
  </>
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

// ── Deep Study Panel ───────────────────────────────────────────────────────
function DeepStudyPanel({ question, topic, onClose }) {
  const [content,      setContent]      = useState("");
  const [loading,      setLoading]      = useState(true);
  const [error,        setError]        = useState(null);
  const [flashcards,   setFlashcards]   = useState([]);
  const [fcLoading,    setFcLoading]    = useState(false);
  const [fcIndex,      setFcIndex]      = useState(0);
  const [fcFlipped,    setFcFlipped]    = useState(false);
  const [view,         setView]         = useState("reading");

  const questionText = question.text || question.question;
  const topicLabel   = question.topic || question.subject || formatTopicLabel(topic);

  useEffect(() => {
    const fetch_ = async () => {
      setLoading(true); setError(null);
      try {
        const res = await fetch("https://api.anthropic.com/v1/messages", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            model: "claude-sonnet-4-20250514",
            max_tokens: 1000,
            messages: [{
              role: "user",
              content: `You are a medical education expert. A student just answered this question:

"${questionText}"

The correct answer is: ${question.correctAnswer !== undefined && question.options
  ? (typeof question.correctAnswer === "number" ? question.options[question.correctAnswer] : question.correctAnswer)
  : question.answer || question.correctAnswer}

Write a detailed, well-structured educational summary about the topic: "${topicLabel}". 

Structure your response with these sections using markdown-style headers (##):
## Overview
## Key Concepts
## Clinical Relevance
## Important Points to Remember
## Common Pitfalls

Write in a clear, engaging style suitable for a medical student. Be thorough but concise. Do not use bullet points excessively — write in prose where possible. Include relevant clinical details, mechanisms, and examples.`,
            }],
          }),
        });
        const data = await res.json();
        const text = data.content?.map(b => b.text || "").join("") || "";
        setContent(text);
      } catch (e) {
        setError("Could not load content. Please check your connection.");
      } finally {
        setLoading(false);
      }
    };
    fetch_();
  }, [question.id]);

  const generateFlashcards = async () => {
    if (!content) return;
    setFcLoading(true); setFlashcards([]); setFcIndex(0); setFcFlipped(false);
    try {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 1000,
          messages: [{
            role: "user",
            content: `Based on this medical study content about "${topicLabel}", generate exactly 6 high-quality flashcards.

Content:
${content}

Return ONLY a valid JSON array with no extra text, no markdown, no code fences. Format:
[{"front":"Question or prompt here","back":"Concise answer or explanation here"},...]

Make the fronts clinically-focused questions. Keep backs concise but complete.`,
          }],
        }),
      });
      const data = await res.json();
      const raw  = data.content?.map(b => b.text || "").join("") || "[]";
      const clean = raw.replace(/```json|```/g, "").trim();
      const cards = JSON.parse(clean);
      setFlashcards(cards);
      setView("flashcards");
    } catch {
      setFlashcards([{ front: "Could not generate flashcards.", back: "Please try again." }]);
      setView("flashcards");
    } finally {
      setFcLoading(false);
    }
  };

  const renderContent = (text) => {
    const lines = text.split("\n");
    return lines.map((line, i) => {
      if (line.startsWith("## ")) return (
        <h3 key={i} style={{ fontSize: 14, fontWeight: 800, color: C.accent, letterSpacing: "0.04em", textTransform: "uppercase", margin: "20px 0 8px", fontFamily: "'Syne', sans-serif" }}>
          {line.replace("## ", "")}
        </h3>
      );
      if (line.startsWith("# ")) return (
        <h2 key={i} style={{ fontSize: 17, fontWeight: 800, color: C.text, margin: "0 0 12px", fontFamily: "'Syne', sans-serif" }}>
          {line.replace("# ", "")}
        </h2>
      );
      if (line.startsWith("- ") || line.startsWith("* ")) return (
        <div key={i} style={{ display: "flex", gap: 8, margin: "4px 0", alignItems: "flex-start" }}>
          <span style={{ color: C.accent, fontWeight: 800, marginTop: 2, flexShrink: 0 }}>·</span>
          <p style={{ fontSize: 14, lineHeight: 1.7, color: C.muted, margin: 0 }}>{line.replace(/^[-*] /, "")}</p>
        </div>
      );
      if (line.trim() === "") return <div key={i} style={{ height: 6 }} />;
      return <p key={i} style={{ fontSize: 14, lineHeight: 1.75, color: C.muted, margin: "3px 0" }}>{line}</p>;
    });
  };

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 999,
      background: "rgba(0,0,0,0.45)", backdropFilter: "blur(4px)",
      display: "flex", alignItems: "flex-end", justifyContent: "center",
    }} onClick={e => { if (e.target === e.currentTarget) onClose(); }}>

      <div style={{
        width: "100%", maxWidth: 780,
        maxHeight: "90vh",
        background: "#fff",
        borderRadius: "24px 24px 0 0",
        display: "flex", flexDirection: "column",
        boxShadow: "0 -8px 40px rgba(0,0,0,0.18)",
        animation: "dsSlideUp 0.3s cubic-bezier(0.22,1,0.36,1)",
      }}>
        <style>{`@keyframes dsSlideUp { from { transform: translateY(60px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }`}</style>

        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "18px 24px 14px",
          borderBottom: `1px solid ${C.border}`, flexShrink: 0,
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: C.accentDim, color: C.accent, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <BookOpenText size={18} />
            </div>
            <div>
              <p style={{ fontSize: 11, color: C.muted, fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase" }}>Go Deeper</p>
              <p style={{ fontSize: 14, fontWeight: 700, color: C.text, fontFamily: "'Syne', sans-serif" }}>{topicLabel}</p>
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            {flashcards.length > 0 && (
              <div style={{ display: "flex", background: C.bg, borderRadius: 99, padding: 3, border: `1px solid ${C.border}` }}>
                {[{ key: "reading", label: "Read" }, { key: "flashcards", label: "Flashcards" }].map(({ key, label }) => (
                  <button key={key} onClick={() => setView(key)} style={{
                    padding: "5px 14px", borderRadius: 99, border: "none",
                    background: view === key ? C.accent : "transparent",
                    color: view === key ? "#fff" : C.muted,
                    fontSize: 12, fontWeight: 700, cursor: "pointer", transition: "all 0.15s",
                    fontFamily: "'DM Sans', sans-serif",
                  }}>{label}</button>
                ))}
              </div>
            )}
            <button onClick={onClose} style={{
              width: 32, height: 32, borderRadius: 99,
              border: `1.5px solid ${C.border}`, background: C.bg,
              color: C.muted, cursor: "pointer", fontSize: 18, fontWeight: 700,
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>×</button>
          </div>
        </div>

        <div style={{ padding: "10px 24px 0", flexShrink: 0 }}>
          <div style={{ background: C.bg, border: `1px solid ${C.border}`, borderRadius: 10, padding: "8px 14px" }}>
            <p style={{ fontSize: 11, color: C.muted, fontWeight: 600, marginBottom: 2, letterSpacing: "0.04em" }}>RELATED QUESTION</p>
            <p style={{ fontSize: 13, color: C.text, lineHeight: 1.5, fontStyle: "italic" }}>{questionText}</p>
          </div>
        </div>

        <div style={{ flex: 1, overflowY: "auto", padding: "16px 24px 24px" }}>

          {view === "reading" && (
            <>
              {loading && (
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "40px 0", gap: 12 }}>
                  <div style={{
                    width: 36, height: 36, borderRadius: "50%",
                    border: `3px solid ${C.border}`, borderTopColor: C.accent,
                    animation: "spin 0.75s linear infinite",
                  }} />
                  <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
                  <p style={{ fontSize: 13, color: C.muted }}>Generating detailed content…</p>
                </div>
              )}
              {error && <p style={{ color: C.red, fontSize: 14, textAlign: "center", padding: 24 }}>{error}</p>}
              {!loading && !error && (
                <div style={{ paddingBottom: 8 }}>
                  {renderContent(content)}
                </div>
              )}
            </>
          )}

          {view === "flashcards" && (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 20, padding: "16px 0" }}>
              {fcLoading && (
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12, padding: "32px 0" }}>
                  <div style={{ width: 36, height: 36, borderRadius: "50%", border: `3px solid ${C.border}`, borderTopColor: C.accent, animation: "spin 0.75s linear infinite" }} />
                  <p style={{ fontSize: 13, color: C.muted }}>Generating flashcards…</p>
                </div>
              )}

              {!fcLoading && flashcards.length > 0 && (
                <>
                  <p style={{ fontSize: 12, color: C.muted, fontWeight: 700 }}>
                    {fcIndex + 1} / {flashcards.length}
                  </p>

                  <div
                    onClick={() => setFcFlipped(f => !f)}
                    style={{
                      width: "100%", minHeight: 180,
                      background: fcFlipped ? C.accentDim : C.surface,
                      border: `2px solid ${fcFlipped ? C.accent : C.border}`,
                      borderRadius: 18, padding: "28px 24px",
                      cursor: "pointer", transition: "all 0.25s",
                      display: "flex", flexDirection: "column",
                      alignItems: "center", justifyContent: "center", textAlign: "center", gap: 12,
                      boxShadow: fcFlipped ? `0 4px 20px ${C.accent}25` : "0 2px 8px rgba(0,0,0,0.06)",
                    }}
                  >
                    <span style={{ fontSize: 10, fontWeight: 800, letterSpacing: "0.1em", textTransform: "uppercase", color: fcFlipped ? C.accent : C.muted }}>
                      {fcFlipped ? "ANSWER" : "QUESTION — tap to reveal"}
                    </span>
                    <p style={{ fontSize: 15, fontWeight: fcFlipped ? 500 : 600, lineHeight: 1.6, color: fcFlipped ? C.accent : C.text, fontFamily: fcFlipped ? "'DM Sans', sans-serif" : "'Syne', sans-serif" }}>
                      {fcFlipped ? flashcards[fcIndex].back : flashcards[fcIndex].front}
                    </p>
                  </div>

                  <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                    <button
                      onClick={() => { setFcIndex(i => Math.max(0, i - 1)); setFcFlipped(false); }}
                      disabled={fcIndex === 0}
                      style={{ padding: "9px 20px", borderRadius: 10, border: `1.5px solid ${C.border}`, background: C.bg, color: C.muted, fontFamily: "'DM Sans', sans-serif", fontSize: 13, fontWeight: 700, cursor: fcIndex === 0 ? "default" : "pointer", opacity: fcIndex === 0 ? 0.4 : 1 }}
                    >
                      Previous
                    </button>
                    <button
                      onClick={() => { setFcFlipped(false); }}
                      style={{ padding: "9px 16px", borderRadius: 10, border: `1.5px solid ${C.border}`, background: C.bg, color: C.muted, fontFamily: "'DM Sans', sans-serif", fontSize: 13, fontWeight: 700, cursor: "pointer" }}
                    >
                      Flip
                    </button>
                    <button
                      onClick={() => { setFcIndex(i => Math.min(flashcards.length - 1, i + 1)); setFcFlipped(false); }}
                      disabled={fcIndex === flashcards.length - 1}
                      style={{ padding: "9px 20px", borderRadius: 10, border: `1.5px solid ${C.border}`, background: C.bg, color: C.muted, fontFamily: "'DM Sans', sans-serif", fontSize: 13, fontWeight: 700, cursor: fcIndex === flashcards.length - 1 ? "default" : "pointer", opacity: fcIndex === flashcards.length - 1 ? 0.4 : 1 }}
                    >
                      Next
                    </button>
                  </div>

                  <div style={{ display: "flex", gap: 6 }}>
                    {flashcards.map((_, i) => (
                      <div key={i} onClick={() => { setFcIndex(i); setFcFlipped(false); }} style={{ width: i === fcIndex ? 20 : 7, height: 7, borderRadius: 99, background: i === fcIndex ? C.accent : C.border, cursor: "pointer", transition: "all 0.2s" }} />
                    ))}
                  </div>
                </>
              )}
            </div>
          )}
        </div>

        <div style={{ padding: "12px 24px 24px", borderTop: `1px solid ${C.border}`, display: "flex", gap: 10, flexShrink: 0 }}>
          {view === "reading" && !loading && !error && (
            <button
              onClick={generateFlashcards}
              disabled={fcLoading}
              style={{
                flex: 1, padding: "12px 20px", borderRadius: 12, border: "none",
                background: `linear-gradient(135deg, ${C.accent}, #0a5c52)`,
                color: "#fff", fontSize: 14, fontWeight: 700,
                fontFamily: "'DM Sans', sans-serif", cursor: "pointer",
                display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                boxShadow: `0 4px 16px ${C.accent}35`,
              }}
            >
              <CreditCard size={15} />
              Generate Flashcards from this Content
            </button>
          )}
          {view === "flashcards" && (
            <button onClick={() => setView("reading")} style={{
              flex: 1, padding: "12px 20px", borderRadius: 12,
              border: `1.5px solid ${C.border}`, background: C.bg,
              color: C.muted, fontSize: 14, fontWeight: 700,
              fontFamily: "'DM Sans', sans-serif", cursor: "pointer",
            }}>
              Back to Reading
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default StudyMode;