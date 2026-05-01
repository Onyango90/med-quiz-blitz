// src/pages/WardRound.jsx
import React, { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useStats } from "../hooks/useStats";
import { getFirestore, doc, getDoc, updateDoc, increment } from "firebase/firestore";
import { shuffleCases } from "../data/wardRoundCases";
import "./WardRound.css";

// ── Game phases ────────────────────────────────────────────────────────────────
const PHASE = {
  LOBBY:       "lobby",
  PRESENTATION:"presentation",
  HISTORY:     "history",
  EXAMINATION: "examination",
  INVESTIGATIONS:"investigations",
  DIAGNOSIS:   "diagnosis",
  MANAGEMENT:  "management",
  CONSEQUENCE: "consequence",
  DEBRIEF:     "debrief",
};

const PHASE_ORDER = [
  PHASE.PRESENTATION,
  PHASE.HISTORY,
  PHASE.EXAMINATION,
  PHASE.INVESTIGATIONS,
  PHASE.DIAGNOSIS,
  PHASE.MANAGEMENT,
  PHASE.DEBRIEF,
];

const PHASE_LABELS = {
  presentation:  "Presentation",
  history:       "History",
  examination:   "Examination",
  investigations:"Investigations",
  diagnosis:     "Diagnosis",
  management:    "Management",
  debrief:       "Debrief",
};

const SPECIALTY_COLOR = {
  Medicine:    "#0d9488",
  Surgery:     "#f97316",
  Paediatrics: "#6366f1",
  Obstetrics:  "#ec4899",
};

export default function WardRound() {
  const navigate  = useNavigate();
  const { currentUser } = useAuth();
  const { processAnswer } = useStats();

  // ── Core state ──
  const [phase,          setPhase]          = useState(PHASE.LOBBY);
  const [cases,          setCases]          = useState([]);
  const [caseIndex,      setCaseIndex]      = useState(0);
  const [loading,        setLoading]        = useState(true);

  // ── Per-phase state ──
  const [selectedHistory,  setSelectedHistory]  = useState([]);  // chosen history sections
  const [selectedExam,     setSelectedExam]      = useState([]);  // chosen exam sections
  const [selectedInvests,  setSelectedInvests]   = useState([]);  // ordered investigations
  const [diagnosisChoice,  setDiagnosisChoice]   = useState(null);
  const [diagnosisFeedback,setDiagnosisFeedback] = useState(null); // "correct"|"wrong"
  const [mgIndex,          setMgIndex]           = useState(0);    // which management step
  const [mgChoice,         setMgChoice]          = useState(null);
  const [mgFeedback,       setMgFeedback]        = useState(null); // option chosen
  const [consequence,      setConsequence]       = useState(null); // text of bad outcome
  const [patientStatus,    setPatientStatus]     = useState("Stable"); // Stable|Deteriorating|Critical

  // ── Scoring ──
  const [totalXP,        setTotalXP]        = useState(0);
  const [xpBreakdown,    setXpBreakdown]    = useState([]);
  const [wrongDecisions, setWrongDecisions] = useState([]);

  const answerLocked = useRef(false);

  // ── Load cases ─────────────────────────────────────────────────────────────
  useEffect(() => {
    const shuffled = shuffleCases();
    setCases(shuffled);
    setLoading(false);
  }, []);

  const activeCase = cases[caseIndex];
  const specialtyColor = activeCase ? (SPECIALTY_COLOR[activeCase.specialty] || "#0d9488") : "#0d9488";

  // ── Reset for new phase/case ───────────────────────────────────────────────
  const resetPhaseState = useCallback(() => {
    setSelectedHistory([]);
    setSelectedExam([]);
    setSelectedInvests([]);
    setDiagnosisChoice(null);
    setDiagnosisFeedback(null);
    setMgIndex(0);
    setMgChoice(null);
    setMgFeedback(null);
    setConsequence(null);
    setPatientStatus("Stable");
    answerLocked.current = false;
  }, []);

  // ── Start game ─────────────────────────────────────────────────────────────
  const startGame = useCallback(() => {
    setCaseIndex(0);
    setTotalXP(0);
    setXpBreakdown([]);
    setWrongDecisions([]);
    resetPhaseState();
    setPhase(PHASE.PRESENTATION);
  }, [resetPhaseState]);

  // ── XP helper ─────────────────────────────────────────────────────────────
  const addXP = useCallback((amount, label) => {
    setTotalXP(prev => prev + amount);
    setXpBreakdown(prev => [...prev, { label, xp: amount }]);
  }, []);

  // ── History selection (pick up to 3 of 5) ─────────────────────────────────
  const toggleHistory = useCallback((id) => {
    setSelectedHistory(prev => {
      if (prev.includes(id)) return prev.filter(x => x !== id);
      if (prev.length >= 3) return prev; // max 3
      return [...prev, id];
    });
  }, []);

  const confirmHistory = useCallback(() => {
    selectedHistory.forEach(() => addXP(5, "History question"));
    setPhase(PHASE.EXAMINATION);
  }, [selectedHistory, addXP]);

  // ── Exam selection (pick up to 2 of 4) ────────────────────────────────────
  const toggleExam = useCallback((id) => {
    setSelectedExam(prev => {
      if (prev.includes(id)) return prev.filter(x => x !== id);
      if (prev.length >= 2) return prev;
      return [...prev, id];
    });
  }, []);

  const confirmExam = useCallback(() => {
    selectedExam.forEach(() => addXP(5, "Examination"));
    setPhase(PHASE.INVESTIGATIONS);
  }, [selectedExam, addXP]);

  // ── Investigations (pick up to 3, key ones give XP) ───────────────────────
  const toggleInvest = useCallback((id) => {
    setSelectedInvests(prev => {
      if (prev.includes(id)) return prev.filter(x => x !== id);
      if (prev.length >= 3) return prev;
      return [...prev, id];
    });
  }, []);

  const confirmInvests = useCallback(() => {
    const cas = cases[caseIndex];
    selectedInvests.forEach(id => {
      const inv = cas.investigations.find(i => i.id === id);
      if (inv?.keyInvestigation) addXP(10, `Key investigation: ${inv.label}`);
      else addXP(3, `Investigation: ${inv?.label}`);
    });
    setPhase(PHASE.DIAGNOSIS);
  }, [selectedInvests, cases, caseIndex, addXP]);

  // ── Diagnosis ──────────────────────────────────────────────────────────────
  const handleDiagnosis = useCallback((choice) => {
    if (answerLocked.current) return;
    answerLocked.current = true;
    const cas = cases[caseIndex];
    setDiagnosisChoice(choice);

    if (choice === cas.diagnosis.correct) {
      setDiagnosisFeedback("correct");
      addXP(20, "Correct diagnosis");
      processAnswer({ subject: cas.specialty }, true, 0, "ward_round");
    } else {
      setDiagnosisFeedback("wrong");
      setPatientStatus("Deteriorating");
      setConsequence(`❌ Incorrect. The diagnosis is ${cas.diagnosis.correct}. ${cas.diagnosis.explanation}`);
      setWrongDecisions(prev => [...prev, `Misdiagnosis: chose "${choice}"`]);
      processAnswer({ subject: cas.specialty }, false, 0, "ward_round");
      // Still advance after showing consequence — learning continues
    }
  }, [cases, caseIndex, addXP, processAnswer]);

  const advanceFromDiagnosis = useCallback(() => {
    setConsequence(null);
    answerLocked.current = false;
    setMgIndex(0);
    setMgChoice(null);
    setMgFeedback(null);
    setPhase(PHASE.MANAGEMENT);
  }, []);

  // ── Management ─────────────────────────────────────────────────────────────
  const handleManagement = useCallback((option) => {
    if (answerLocked.current) return;
    answerLocked.current = true;
    const cas = cases[caseIndex];
    const step = cas.management[mgIndex];

    setMgChoice(option.text);
    setMgFeedback(option.correct ? "correct" : "wrong");

    if (option.correct) {
      addXP(step.xp, step.step);
      processAnswer({ subject: cas.specialty }, true, 0, "ward_round");
    } else {
      setConsequence(option.consequence);
      setPatientStatus(prev =>
        prev === "Stable" ? "Deteriorating" :
        prev === "Deteriorating" ? "Critical" : "Critical"
      );
      setWrongDecisions(prev => [...prev, `${step.step}: "${option.text}"`]);
      processAnswer({ subject: cas.specialty }, false, 0, "ward_round");
    }
  }, [cases, caseIndex, mgIndex, addXP, processAnswer]);

  const advanceManagement = useCallback(() => {
    const cas = cases[caseIndex];
    setConsequence(null);
    setMgChoice(null);
    setMgFeedback(null);
    answerLocked.current = false;

    if (mgIndex + 1 >= cas.management.length) {
      // Save XP to Firestore
      if (currentUser) {
        try {
          const db = getFirestore();
          updateDoc(doc(db, "users", currentUser.uid), {
            "stats.totalXP":    increment(totalXP),
            "stats.totalGames": increment(1),
          });
        } catch {}
      }
      setPhase(PHASE.DEBRIEF);
    } else {
      setMgIndex(prev => prev + 1);
    }
  }, [cases, caseIndex, mgIndex, currentUser, totalXP]);

  // ── Loading ────────────────────────────────────────────────────────────────
  if (loading || !activeCase) {
    return (
      <div className="wr-loading">
        <div className="wr-spinner" />
        <p>Preparing ward round…</p>
      </div>
    );
  }

  const cas = activeCase;
  const historyItems   = cas.history;
  const examItems      = cas.examination;
  const investItems    = cas.investigations;
  const managementStep = cas.management[mgIndex];

  // ── LOBBY ──────────────────────────────────────────────────────────────────
  if (phase === PHASE.LOBBY) {
    return (
      <div className="wr-page">
        <div className="wr-inner">
          <button className="wr-back-btn" onClick={() => navigate("/games-dashboard")}>← Back</button>

          <div className="wr-lobby-hero" style={{ "--sc": specialtyColor }}>
            <div className="wr-orb wr-orb-1" />
            <div className="wr-orb wr-orb-2" />
            <div className="wr-lobby-inner">
              <span className="wr-lobby-icon">🏥</span>
              <h1 className="wr-lobby-title">Ward Round</h1>
              <p className="wr-lobby-sub">
                A real patient is waiting. Take the history, examine them,
                order the right investigations, reach the diagnosis — and
                make the management decisions that could save their life.
              </p>
              <div className="wr-lobby-stats">
                <div className="wr-ls"><span className="wr-ls-val">{cases.length}</span><span className="wr-ls-lbl">Cases</span></div>
                <div className="wr-ls"><span className="wr-ls-val">7</span><span className="wr-ls-lbl">Steps</span></div>
                <div className="wr-ls"><span className="wr-ls-val">~15m</span><span className="wr-ls-lbl">Per case</span></div>
              </div>
            </div>
          </div>

          <div className="wr-rules-card">
            <p className="wr-rules-title">How it works</p>
            <div className="wr-rule"><span>🗣️</span><span>Take history — choose which questions to ask (3 of 5)</span></div>
            <div className="wr-rule"><span>🩺</span><span>Examine the patient — choose which systems (2 of 4)</span></div>
            <div className="wr-rule"><span>🔬</span><span>Order investigations — choose wisely (3 of available)</span></div>
            <div className="wr-rule"><span>🎯</span><span>Diagnose — wrong answer has consequences</span></div>
            <div className="wr-rule"><span>💊</span><span>Manage — each wrong decision makes the patient worse</span></div>
            <div className="wr-rule"><span>📚</span><span>Debrief — learn from every case regardless of outcome</span></div>
          </div>

          <div className="wr-case-preview">
            <p className="wr-preview-label">Today's patient</p>
            <div className="wr-preview-patient" style={{ "--sc": specialtyColor }}>
              <span className="wr-preview-avatar">{cas.patient.avatar}</span>
              <div className="wr-preview-info">
                <span className="wr-preview-name">{cas.patient.name}, {cas.patient.age}</span>
                <span className="wr-preview-complaint">{cas.patient.presenting}</span>
              </div>
              <span className="wr-preview-tag" style={{ background: `${specialtyColor}22`, color: specialtyColor }}>
                {cas.specialty}
              </span>
            </div>
          </div>

          <button className="wr-start-btn" onClick={startGame} style={{ "--sc": specialtyColor }}>
            🏥 Begin Ward Round
          </button>
        </div>
      </div>
    );
  }

  // ── PRESENTATION ──────────────────────────────────────────────────────────
  if (phase === PHASE.PRESENTATION) {
    return (
      <div className="wr-page">
        <div className="wr-inner">
          <PhaseHeader phase={phase} cas={cas} totalXP={totalXP} patientStatus={patientStatus} color={specialtyColor} navigate={navigate} />

          <div className="wr-patient-card" style={{ "--sc": specialtyColor }}>
            <div className="wr-patient-header">
              <span className="wr-patient-avatar">{cas.patient.avatar}</span>
              <div>
                <h2 className="wr-patient-name">{cas.patient.name}</h2>
                <p className="wr-patient-meta">{cas.patient.age} years • {cas.patient.gender} • {cas.patient.ward}</p>
              </div>
              <span className="wr-specialty-tag" style={{ background: `${specialtyColor}22`, color: specialtyColor }}>
                {cas.specialty}
              </span>
            </div>
            <div className="wr-presenting">
              <p className="wr-section-label">Presenting complaint</p>
              <p className="wr-presenting-text">"{cas.patient.presenting}"</p>
            </div>
            <div className="wr-vitals">
              <p className="wr-section-label">Observations</p>
              <div className="wr-vitals-grid">
                {Object.entries(cas.patient.vitals).map(([k, v]) => (
                  <div key={k} className="wr-vital">
                    <span className="wr-vital-label">{k}</span>
                    <span className="wr-vital-val">{v}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <button className="wr-next-btn" style={{ "--sc": specialtyColor }} onClick={() => setPhase(PHASE.HISTORY)}>
            Take History →
          </button>
        </div>
      </div>
    );
  }

  // ── HISTORY ────────────────────────────────────────────────────────────────
  if (phase === PHASE.HISTORY) {
    return (
      <div className="wr-page">
        <div className="wr-inner">
          <PhaseHeader phase={phase} cas={cas} totalXP={totalXP} patientStatus={patientStatus} color={specialtyColor} navigate={navigate} />

          <div className="wr-instruction-card">
            <p className="wr-instruction">
              <strong>Choose 3 history sections</strong> to explore.
              Prioritise what matters most — you can't ask everything.
            </p>
            <p className="wr-instruction-sub">+5 XP per section chosen</p>
          </div>

          <div className="wr-option-list">
            {historyItems.map(h => {
              const isSelected = selectedHistory.includes(h.id);
              const isRevealed = isSelected;
              return (
                <div key={h.id}
                  className={`wr-history-item ${isSelected ? "wr-history-item--selected" : ""} ${selectedHistory.length >= 3 && !isSelected ? "wr-history-item--disabled" : ""}`}
                  style={{ "--sc": specialtyColor }}
                  onClick={() => toggleHistory(h.id)}
                >
                  <div className="wr-history-top">
                    <span className="wr-history-icon">{h.icon}</span>
                    <span className="wr-history-label">{h.label}</span>
                    <span className={`wr-history-check ${isSelected ? "wr-history-check--on" : ""}`}>
                      {isSelected ? "✓" : "+"}
                    </span>
                  </div>
                  {isRevealed && (
                    <p className="wr-history-content">{h.content}</p>
                  )}
                </div>
              );
            })}
          </div>

          <button
            className="wr-next-btn"
            style={{ "--sc": specialtyColor }}
            onClick={confirmHistory}
            disabled={selectedHistory.length === 0}
          >
            Continue to Examination → ({selectedHistory.length}/3 selected)
          </button>
        </div>
      </div>
    );
  }

  // ── EXAMINATION ────────────────────────────────────────────────────────────
  if (phase === PHASE.EXAMINATION) {
    return (
      <div className="wr-page">
        <div className="wr-inner">
          <PhaseHeader phase={phase} cas={cas} totalXP={totalXP} patientStatus={patientStatus} color={specialtyColor} navigate={navigate} />

          <div className="wr-instruction-card">
            <p className="wr-instruction">
              <strong>Choose 2 systems to examine.</strong> Focus on what the history suggests.
            </p>
            <p className="wr-instruction-sub">+5 XP per system examined</p>
          </div>

          <div className="wr-option-list">
            {examItems.map(e => {
              const isSelected = selectedExam.includes(e.id);
              return (
                <div key={e.id}
                  className={`wr-history-item ${isSelected ? "wr-history-item--selected" : ""} ${selectedExam.length >= 2 && !isSelected ? "wr-history-item--disabled" : ""}`}
                  style={{ "--sc": specialtyColor }}
                  onClick={() => toggleExam(e.id)}
                >
                  <div className="wr-history-top">
                    <span className="wr-history-icon">{e.icon}</span>
                    <span className="wr-history-label">{e.label}</span>
                    <span className={`wr-history-check ${isSelected ? "wr-history-check--on" : ""}`}>
                      {isSelected ? "✓" : "+"}
                    </span>
                  </div>
                  {isSelected && <p className="wr-history-content">{e.content}</p>}
                </div>
              );
            })}
          </div>

          <button
            className="wr-next-btn"
            style={{ "--sc": specialtyColor }}
            onClick={confirmExam}
            disabled={selectedExam.length === 0}
          >
            Order Investigations → ({selectedExam.length}/2 selected)
          </button>
        </div>
      </div>
    );
  }

  // ── INVESTIGATIONS ─────────────────────────────────────────────────────────
  if (phase === PHASE.INVESTIGATIONS) {
    return (
      <div className="wr-page">
        <div className="wr-inner">
          <PhaseHeader phase={phase} cas={cas} totalXP={totalXP} patientStatus={patientStatus} color={specialtyColor} navigate={navigate} />

          <div className="wr-instruction-card">
            <p className="wr-instruction">
              <strong>Order up to 3 investigations.</strong> Key investigations earn +10 XP. Others earn +3 XP.
            </p>
            <p className="wr-instruction-sub">Good clinicians don't order everything — they order the right things.</p>
          </div>

          <div className="wr-option-list">
            {investItems.map(inv => {
              const isSelected = selectedInvests.includes(inv.id);
              return (
                <div key={inv.id}
                  className={`wr-history-item ${isSelected ? "wr-history-item--selected" : ""} ${selectedInvests.length >= 3 && !isSelected ? "wr-history-item--disabled" : ""}`}
                  style={{ "--sc": specialtyColor }}
                  onClick={() => toggleInvest(inv.id)}
                >
                  <div className="wr-history-top">
                    <span className="wr-history-icon">{inv.icon}</span>
                    <span className="wr-history-label">{inv.label}</span>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      {inv.keyInvestigation && <span className="wr-key-badge">Key</span>}
                      <span className={`wr-history-check ${isSelected ? "wr-history-check--on" : ""}`}>
                        {isSelected ? "✓" : "+"}
                      </span>
                    </div>
                  </div>
                  {isSelected && <p className="wr-history-content">{inv.result}</p>}
                </div>
              );
            })}
          </div>

          <button
            className="wr-next-btn"
            style={{ "--sc": specialtyColor }}
            onClick={confirmInvests}
            disabled={selectedInvests.length === 0}
          >
            Make Your Diagnosis → ({selectedInvests.length}/3 selected)
          </button>
        </div>
      </div>
    );
  }

  // ── DIAGNOSIS ──────────────────────────────────────────────────────────────
  if (phase === PHASE.DIAGNOSIS) {
    return (
      <div className="wr-page">
        <div className="wr-inner">
          <PhaseHeader phase={phase} cas={cas} totalXP={totalXP} patientStatus={patientStatus} color={specialtyColor} navigate={navigate} />

          <div className="wr-instruction-card">
            <p className="wr-instruction"><strong>What is your diagnosis?</strong></p>
            <p className="wr-instruction-sub">Correct diagnosis = +20 XP. Wrong answer = patient deteriorates.</p>
          </div>

          {/* Mini summary card */}
          <div className="wr-summary-card">
            <p className="wr-section-label">Case summary</p>
            <p className="wr-summary-text">{cas.patient.name}, {cas.patient.age}. {cas.patient.presenting}.</p>
            <div className="wr-summary-chips">
              {selectedHistory.map(id => {
                const h = historyItems.find(x => x.id === id);
                return <span key={id} className="wr-chip">{h?.icon} {h?.label}</span>;
              })}
              {selectedExam.map(id => {
                const e = examItems.find(x => x.id === id);
                return <span key={id} className="wr-chip">{e?.icon} {e?.label}</span>;
              })}
              {selectedInvests.map(id => {
                const i = investItems.find(x => x.id === id);
                return <span key={id} className="wr-chip wr-chip--key">{i?.icon} {i?.label}</span>;
              })}
            </div>
          </div>

          <div className="wr-diagnosis-options">
            {cas.diagnosis.options.map((opt, i) => {
              let cls = "wr-diag-option";
              if (diagnosisChoice) {
                if (opt === cas.diagnosis.correct) cls += " wr-diag-option--correct";
                else if (opt === diagnosisChoice)  cls += " wr-diag-option--wrong";
                else cls += " wr-diag-option--dim";
              }
              return (
                <button key={i} className={cls} style={{ "--sc": specialtyColor }}
                  onClick={() => handleDiagnosis(opt)}
                  disabled={!!diagnosisChoice}
                >
                  <span className="wr-diag-letter">{String.fromCharCode(65 + i)}</span>
                  <span className="wr-diag-text">{opt}</span>
                </button>
              );
            })}
          </div>

          {diagnosisFeedback === "correct" && (
            <div className="wr-feedback-card wr-feedback--correct">
              <p className="wr-feedback-title">✅ Correct diagnosis!</p>
              <p className="wr-feedback-body">{cas.diagnosis.explanation}</p>
              <button className="wr-next-btn" style={{ "--sc": specialtyColor }} onClick={advanceFromDiagnosis}>
                Begin Management →
              </button>
            </div>
          )}

          {diagnosisFeedback === "wrong" && (
            <div className="wr-feedback-card wr-feedback--wrong">
              <p className="wr-feedback-title">⚠️ Incorrect — patient deteriorating</p>
              <p className="wr-feedback-body">{consequence}</p>
              <button className="wr-next-btn" style={{ "--sc": specialtyColor }} onClick={advanceFromDiagnosis}>
                Continue to Management →
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  // ── MANAGEMENT ─────────────────────────────────────────────────────────────
  if (phase === PHASE.MANAGEMENT) {
    const step = managementStep;
    return (
      <div className="wr-page">
        <div className="wr-inner">
          <PhaseHeader phase={phase} cas={cas} totalXP={totalXP} patientStatus={patientStatus} color={specialtyColor} navigate={navigate} />

          <div className="wr-mg-progress">
            {cas.management.map((_, i) => (
              <div key={i} className={`wr-mg-dot ${i < mgIndex ? "wr-mg-dot--done" : i === mgIndex ? "wr-mg-dot--active" : ""}`} />
            ))}
          </div>

          <div className="wr-mg-card" style={{ "--sc": specialtyColor }}>
            <p className="wr-mg-step-label">Decision {mgIndex + 1} of {cas.management.length}</p>
            <h3 className="wr-mg-step-title">{step.step}</h3>
            <p className="wr-mg-xp">Correct answer: +{step.xp} XP</p>
          </div>

          <div className="wr-option-list">
            {step.options.map((opt, i) => {
              let cls = "wr-mg-option";
              if (mgChoice) {
                if (opt.correct) cls += " wr-mg-option--correct";
                else if (opt.text === mgChoice) cls += " wr-mg-option--wrong";
                else cls += " wr-mg-option--dim";
              }
              return (
                <button key={i} className={cls} style={{ "--sc": specialtyColor }}
                  onClick={() => handleManagement(opt)}
                  disabled={!!mgChoice}
                >
                  <span className="wr-mg-letter">{String.fromCharCode(65 + i)}</span>
                  <span className="wr-mg-text">{opt.text}</span>
                </button>
              );
            })}
          </div>

          {mgFeedback === "correct" && (
            <div className="wr-feedback-card wr-feedback--correct">
              <p className="wr-feedback-title">✅ Good decision! +{step.xp} XP</p>
              <p className="wr-feedback-body">{step.explanation}</p>
              <button className="wr-next-btn" style={{ "--sc": specialtyColor }} onClick={advanceManagement}>
                {mgIndex + 1 >= cas.management.length ? "Case Complete →" : "Next Decision →"}
              </button>
            </div>
          )}

          {mgFeedback === "wrong" && (
            <div className="wr-feedback-card wr-feedback--wrong">
              <p className="wr-feedback-title">⚠️ Consequence</p>
              <p className="wr-feedback-body">{consequence}</p>
              <p className="wr-feedback-learn">{step.explanation}</p>
              <button className="wr-next-btn" style={{ "--sc": specialtyColor }} onClick={advanceManagement}>
                {mgIndex + 1 >= cas.management.length ? "Case Complete →" : "Next Decision →"}
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  // ── DEBRIEF ────────────────────────────────────────────────────────────────
  if (phase === PHASE.DEBRIEF) {
    const perfect = wrongDecisions.length === 0;
    return (
      <div className="wr-page">
        <div className="wr-inner">
          <div className="wr-debrief-hero" style={{ "--sc": specialtyColor }}>
            <div className="wr-orb wr-orb-1" /><div className="wr-orb wr-orb-2" />
            <div className="wr-debrief-inner">
              <span className="wr-debrief-icon">{perfect ? "🏆" : patientStatus === "Critical" ? "😟" : "⭐"}</span>
              <h2 className="wr-debrief-title">
                {perfect ? "Perfect round!" : patientStatus === "Critical" ? "Patient critical" : "Case complete"}
              </h2>
              <p className="wr-debrief-patient">{cas.patient.name} — {cas.debrief.diagnosis}</p>
              <div className="wr-debrief-stats">
                <div className="wr-ds"><span className="wr-ds-val">{totalXP}</span><span className="wr-ds-lbl">XP earned</span></div>
                <div className="wr-ds"><span className="wr-ds-val">{wrongDecisions.length}</span><span className="wr-ds-lbl">Wrong calls</span></div>
                <div className="wr-ds"><span className="wr-ds-val">{patientStatus}</span><span className="wr-ds-lbl">Patient</span></div>
              </div>
            </div>
          </div>

          {wrongDecisions.length > 0 && (
            <div className="wr-wrong-card">
              <p className="wr-rules-title">Where it went wrong</p>
              {wrongDecisions.map((d, i) => (
                <div key={i} className="wr-wrong-row">
                  <span>⚠️</span><span>{d}</span>
                </div>
              ))}
            </div>
          )}

          <div className="wr-learning-card">
            <p className="wr-rules-title">Key learning points</p>
            {cas.debrief.keyLearning.map((point, i) => (
              <div key={i} className="wr-learn-row">
                <span className="wr-learn-num">{i + 1}</span>
                <span>{point}</span>
              </div>
            ))}
          </div>

          <div className="wr-xp-breakdown">
            <p className="wr-rules-title">XP breakdown</p>
            {xpBreakdown.map((x, i) => (
              <div key={i} className="wr-xp-row">
                <span>{x.label}</span>
                <span className="wr-xp-val">+{x.xp}</span>
              </div>
            ))}
            <div className="wr-xp-total">
              <span>Total</span>
              <span>+{totalXP} XP</span>
            </div>
          </div>

          <div className="wr-debrief-btns">
            <button className="wr-retry-btn" style={{ "--sc": specialtyColor }}
              onClick={() => { resetPhaseState(); setTotalXP(0); setXpBreakdown([]); setWrongDecisions([]); setPhase(PHASE.PRESENTATION); }}>
              Same Case Again
            </button>
            <button className="wr-next-case-btn" style={{ "--sc": specialtyColor }}
              onClick={() => {
                const next = (caseIndex + 1) % cases.length;
                setCaseIndex(next);
                resetPhaseState();
                setTotalXP(0); setXpBreakdown([]); setWrongDecisions([]);
                setPhase(PHASE.PRESENTATION);
              }}>
              Next Patient →
            </button>
          </div>

          <button className="wr-home-btn" onClick={() => navigate("/games-dashboard")}>Back to Games</button>
        </div>
      </div>
    );
  }

  return null;
}

// ── Shared phase header component ──────────────────────────────────────────────
function PhaseHeader({ phase, cas, totalXP, patientStatus, color, navigate }) {
  const steps = ["presentation","history","examination","investigations","diagnosis","management"];
  const idx = steps.indexOf(phase);
  const statusColor = patientStatus === "Stable" ? "#0d9488" : patientStatus === "Deteriorating" ? "#d97706" : "#ef4444";

  return (
    <div className="wr-phase-header">
      <button className="wr-topbar-x" onClick={() => navigate("/games-dashboard")}>✕</button>

      {/* Phase progress */}
      <div className="wr-phase-steps">
        {steps.map((s, i) => (
          <div key={s} className={`wr-phase-step ${i < idx ? "wr-phase-step--done" : i === idx ? "wr-phase-step--active" : ""}`}
            style={{ "--sc": color }}>
            <div className="wr-phase-dot" />
          </div>
        ))}
      </div>

      <div className="wr-phase-right">
        <span className="wr-phase-xp">⭐ {totalXP}</span>
        <span className="wr-status-pill" style={{ background: `${statusColor}22`, color: statusColor }}>
          {patientStatus}
        </span>
      </div>
    </div>
  );
}