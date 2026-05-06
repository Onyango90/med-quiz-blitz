// src/pages/ClinicalBlackBox.jsx
import React, { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useStats } from "../hooks/useStats";
import { getFirestore, doc, updateDoc, increment } from "firebase/firestore";
import { shuffleCases } from "../data/blackBoxCases";
import "./ClinicalBlackBox.css";

const STARTING_TOKENS = 100;
const PHASE = { LOBBY: "lobby", CASE: "case", DIAGNOSIS: "diagnosis", DEBRIEF: "debrief" };

function calcXP(tokensSpent, isCorrect, totalPanels) {
  if (!isCorrect) return 0;
  const remaining = STARTING_TOKENS - tokensSpent;
  if (tokensSpent <= 10)  return 100; // legendary
  if (tokensSpent <= 25)  return 80;
  if (tokensSpent <= 50)  return 60;
  if (tokensSpent <= 75)  return 40;
  return 20;
}

function getBadge(unlockCount, isCorrect, idealPanelCount) {
  if (!isCorrect) return null;
  if (unlockCount <= 2)                return { label: "Sherlock",  icon: "🔍", color: "#d97706" };
  if (unlockCount <= idealPanelCount)  return { label: "Efficient", icon: "⚡", color: "#6366f1" };
  return                                      { label: "Thorough",  icon: "📚", color: "#0d9488" };
}

export default function ClinicalBlackBox() {
  const navigate          = useNavigate();
  const { currentUser }   = useAuth();
  const { processAnswer } = useStats();

  const [phase,         setPhase]         = useState(PHASE.LOBBY);
  const [cases,         setCases]         = useState([]);
  const [caseIndex,     setCaseIndex]     = useState(0);
  const [tokens,        setTokens]        = useState(STARTING_TOKENS);
  const [unlocked,      setUnlocked]      = useState(new Set());
  const [unlocking,     setUnlocking]     = useState(null); // panel id being unlocked
  const [diagChoice,    setDiagChoice]    = useState(null);
  const [diagFeedback,  setDiagFeedback]  = useState(null);
  const [sessionXP,     setSessionXP]     = useState(0);
  const [badge,         setBadge]         = useState(null);
  const [casesPlayed,   setCasesPlayed]   = useState([]);
  const [tokenWarning,  setTokenWarning]  = useState(false);
  const [revealAnim,    setRevealAnim]    = useState(null); // panel id

  const tokensSpentRef = useRef(0);

  useEffect(() => {
    setCases(shuffleCases());
  }, []);

  const activeCase = cases[caseIndex];
  const tokensSpent = STARTING_TOKENS - tokens;

  // ── Unlock a panel ────────────────────────────────────────────────────────
  const unlockPanel = useCallback((panel) => {
    if (unlocked.has(panel.id)) return;
    if (tokens < panel.cost) { setTokenWarning(true); setTimeout(() => setTokenWarning(false), 1500); return; }

    setUnlocking(panel.id);
    setTimeout(() => {
      setUnlocked(prev => new Set([...prev, panel.id]));
      setTokens(prev => prev - panel.cost);
      setUnlocking(null);
      setRevealAnim(panel.id);
      setTimeout(() => setRevealAnim(null), 600);
    }, 400);
  }, [unlocked, tokens]);

  // ── Submit diagnosis ──────────────────────────────────────────────────────
  const handleDiagnosis = useCallback((choice) => {
    if (diagChoice) return;
    const cas = cases[caseIndex];
    const isCorrect = choice === cas.correctDiagnosis;
    const spent = STARTING_TOKENS - tokens;
    const xp = calcXP(spent, isCorrect, cas.panels.length);
    const b   = getBadge(unlocked.size, isCorrect, cas.idealPanels.length);

    setDiagChoice(choice);
    setDiagFeedback(isCorrect ? "correct" : "wrong");
    setBadge(b);

    if (isCorrect) {
      setSessionXP(prev => prev + xp);
      processAnswer({ subject: cas.specialty }, true, 0, "black_box");
    } else {
      processAnswer({ subject: cas.specialty }, false, 0, "black_box");
    }

    setCasesPlayed(prev => [...prev, {
      title: cas.title,
      isCorrect,
      tokensSpent: spent,
      xp,
      badge: b,
      unlockCount: unlocked.size,
    }]);

    // Save XP
    if (isCorrect && currentUser) {
      try {
        const db = getFirestore();
        updateDoc(doc(db, "users", currentUser.uid), {
          "stats.totalXP":    increment(xp),
          "stats.totalGames": increment(1),
        });
      } catch {}
    }

    setTimeout(() => setPhase(PHASE.DEBRIEF), 800);
  }, [diagChoice, cases, caseIndex, tokens, unlocked, currentUser, processAnswer]);

  // ── Next case ─────────────────────────────────────────────────────────────
  const nextCase = useCallback(() => {
    const next = caseIndex + 1;
    if (next >= cases.length) {
      setCaseIndex(0);
      setCases(shuffleCases());
    } else {
      setCaseIndex(next);
    }
    setTokens(STARTING_TOKENS);
    setUnlocked(new Set());
    setDiagChoice(null);
    setDiagFeedback(null);
    setBadge(null);
    setPhase(PHASE.CASE);
  }, [caseIndex, cases]);

  if (!cases.length) return <div className="cbb-loading"><div className="cbb-spinner"/><p>Opening the Black Box…</p></div>;

  const cas = activeCase;
  const tokenPct = (tokens / STARTING_TOKENS) * 100;
  const tokenColor = tokenPct > 60 ? "#0d9488" : tokenPct > 30 ? "#d97706" : "#ef4444";

  // ── LOBBY ─────────────────────────────────────────────────────────────────
  if (phase === PHASE.LOBBY) {
    return (
      <div className="cbb-page">
        <div className="cbb-inner">
          <button className="cbb-back" onClick={() => navigate("/games-dashboard")}>← Back</button>

          <div className="cbb-lobby-hero">
            <div className="cbb-orb cbb-orb-1"/><div className="cbb-orb cbb-orb-2"/>
            <div className="cbb-lobby-content">
              <div className="cbb-redacted-title">
                <span className="cbb-title-word">CLINICAL</span>
                <span className="cbb-title-redacted">████████</span>
              </div>
              <p className="cbb-lobby-sub">
                You are handed an incomplete case. Fragments only. The rest is classified.
                Spend tokens to unlock information — but the less you need, the smarter you are.
              </p>
              <div className="cbb-lobby-stats">
                <div className="cbb-ls"><span className="cbb-ls-val">100</span><span className="cbb-ls-lbl">Tokens</span></div>
                <div className="cbb-ls"><span className="cbb-ls-val">6</span><span className="cbb-ls-lbl">Cases</span></div>
                <div className="cbb-ls"><span className="cbb-ls-val">100</span><span className="cbb-ls-lbl">Max XP</span></div>
              </div>
            </div>
          </div>

          {/* Token cost guide */}
          <div className="cbb-token-guide">
            <p className="cbb-guide-title">🪙 Token costs</p>
            <div className="cbb-token-rows">
              {[
                { label: "Patient info / Vitals", cost: "5",  color: "#0d9488" },
                { label: "History / Collateral",  cost: "10", color: "#6366f1" },
                { label: "Blood results / ECG",   cost: "15", color: "#d97706" },
                { label: "Imaging / Specialist",  cost: "20", color: "#ef4444" },
              ].map(t => (
                <div key={t.label} className="cbb-token-row">
                  <span className="cbb-token-label">{t.label}</span>
                  <span className="cbb-token-cost" style={{ color: t.color }}>{t.cost} tokens</span>
                </div>
              ))}
            </div>
          </div>

          {/* XP multiplier */}
          <div className="cbb-mult-guide">
            <p className="cbb-guide-title">⭐ XP multiplier</p>
            <div className="cbb-mult-rows">
              {[
                { spent: "≤10 tokens",  xp: "100 XP", label: "Legendary", color: "#d97706" },
                { spent: "≤25 tokens",  xp: "80 XP",  label: "Expert",    color: "#6366f1" },
                { spent: "≤50 tokens",  xp: "60 XP",  label: "Good",      color: "#0d9488" },
                { spent: "≤75 tokens",  xp: "40 XP",  label: "Thorough",  color: "#6b7280" },
                { spent: ">75 tokens",  xp: "20 XP",  label: "Basic",     color: "#9ca3af" },
              ].map(m => (
                <div key={m.spent} className="cbb-mult-row">
                  <span className="cbb-mult-spent">{m.spent}</span>
                  <span className="cbb-mult-label" style={{ color: m.color }}>{m.label}</span>
                  <span className="cbb-mult-xp">{m.xp}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="cbb-rules-card">
            <p className="cbb-rules-title">Rules</p>
            <div className="cbb-rule"><span>🔒</span><span>Each case starts with ONE clue — the rest is redacted</span></div>
            <div className="cbb-rule"><span>🪙</span><span>Spend tokens to unlock panels — choose carefully</span></div>
            <div className="cbb-rule"><span>⚠️</span><span>Some panels are red herrings — designed to mislead</span></div>
            <div className="cbb-rule"><span>🎯</span><span>Commit to a diagnosis when you're ready</span></div>
            <div className="cbb-rule"><span>🔍</span><span>Diagnose with fewer unlocks = legendary XP</span></div>
          </div>

          <button className="cbb-start-btn" onClick={() => setPhase(PHASE.CASE)}>
            ⬛ Open the Black Box
          </button>
        </div>
      </div>
    );
  }

  // ── CASE ──────────────────────────────────────────────────────────────────
  if (phase === PHASE.CASE) {
    return (
      <div className="cbb-page">
        <div className="cbb-inner">

          {/* Top bar */}
          <div className="cbb-topbar">
            <button className="cbb-topbar-x" onClick={() => navigate("/games-dashboard")}>✕</button>
            <div className="cbb-token-bar-wrap">
              <div className="cbb-token-track">
                <div className="cbb-token-fill" style={{ width: `${tokenPct}%`, background: tokenColor }} />
              </div>
              <span className="cbb-token-count" style={{ color: tokenColor }}>🪙 {tokens}</span>
            </div>
            <span className="cbb-case-num">{caseIndex + 1}/{cases.length}</span>
          </div>

          {tokenWarning && (
            <div className="cbb-warning">⚠️ Not enough tokens!</div>
          )}

          {/* Case header */}
          <div className="cbb-case-header">
            <div className="cbb-case-specialty">{cas.specialty}</div>
            <h2 className="cbb-case-title">{cas.title}</h2>
            <div className="cbb-unlocked-count">{unlocked.size} of {cas.panels.length} panels unlocked</div>
          </div>

          {/* First clue — always visible */}
          <div className="cbb-first-clue">
            <span className="cbb-clue-icon">{cas.firstClue.icon}</span>
            <div>
              <span className="cbb-clue-label">{cas.firstClue.label}</span>
              <span className="cbb-clue-value">{cas.firstClue.value}</span>
            </div>
            <span className="cbb-clue-free">FREE</span>
          </div>

          {/* Panels grid */}
          <div className="cbb-panels">
            {cas.panels.map(panel => {
              const isUnlocked  = unlocked.has(panel.id);
              const isUnlocking = unlocking === panel.id;
              const isRevealing = revealAnim === panel.id;
              const canAfford   = tokens >= panel.cost;

              return (
                <div
                  key={panel.id}
                  className={`cbb-panel ${isUnlocked ? "cbb-panel--open" : "cbb-panel--locked"} ${isUnlocking ? "cbb-panel--unlocking" : ""} ${isRevealing ? "cbb-panel--reveal" : ""} ${!canAfford && !isUnlocked ? "cbb-panel--broke" : ""}`}
                  onClick={() => !isUnlocked && unlockPanel(panel)}
                >
                  {isUnlocked ? (
                    <div className="cbb-panel-content">
                      <div className="cbb-panel-top">
                        <span className="cbb-panel-icon">{panel.icon}</span>
                        <span className="cbb-panel-label">{panel.label}</span>
                      </div>
                      <p className="cbb-panel-value">{panel.value}</p>
                    </div>
                  ) : (
                    <div className="cbb-panel-locked">
                      {isUnlocking ? (
                        <div className="cbb-unlock-spinner"/>
                      ) : (
                        <>
                          <span className="cbb-panel-icon-locked">{panel.icon}</span>
                          <div className="cbb-redacted-bars">
                            <div className="cbb-bar cbb-bar-1"/>
                            <div className="cbb-bar cbb-bar-2"/>
                            <div className="cbb-bar cbb-bar-3"/>
                          </div>
                          <div className="cbb-lock-footer">
                            <span className="cbb-panel-name-locked">{panel.label}</span>
                            <span className={`cbb-panel-cost ${!canAfford ? "cbb-cost--broke" : ""}`}>
                              🪙 {panel.cost}
                            </span>
                          </div>
                        </>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Diagnose button */}
          <button
            className="cbb-diagnose-btn"
            onClick={() => setPhase(PHASE.DIAGNOSIS)}
          >
            🎯 Commit to Diagnosis
            <span className="cbb-diagnose-hint">
              {tokensSpent} tokens spent · {calcXP(tokensSpent, true, cas.panels.length)} XP if correct
            </span>
          </button>

        </div>
      </div>
    );
  }

  // ── DIAGNOSIS ─────────────────────────────────────────────────────────────
  if (phase === PHASE.DIAGNOSIS) {
    return (
      <div className="cbb-page">
        <div className="cbb-inner">

          <div className="cbb-topbar">
            <button className="cbb-topbar-x" onClick={() => setPhase(PHASE.CASE)}>← Back</button>
            <span className="cbb-token-count" style={{ color: tokenColor }}>🪙 {tokens} left</span>
            <span className="cbb-case-num">{caseIndex + 1}/{cases.length}</span>
          </div>

          <div className="cbb-diag-header">
            <h2 className="cbb-diag-title">Your diagnosis</h2>
            <p className="cbb-diag-sub">
              {unlocked.size} panel{unlocked.size !== 1 ? "s" : ""} unlocked · {tokensSpent} tokens spent
            </p>
            <div className="cbb-xp-preview">
              If correct: <strong>{calcXP(tokensSpent, true, cas.panels.length)} XP</strong>
            </div>
          </div>

          {/* Summary of what was unlocked */}
          {unlocked.size > 0 && (
            <div className="cbb-unlocked-summary">
              <p className="cbb-summary-label">What you unlocked</p>
              <div className="cbb-summary-chips">
                {cas.panels.filter(p => unlocked.has(p.id)).map(p => (
                  <span key={p.id} className="cbb-chip">{p.icon} {p.label}</span>
                ))}
              </div>
            </div>
          )}

          <div className="cbb-diag-options">
            {cas.diagnoses.map((d, i) => {
              let cls = "cbb-diag-opt";
              if (diagChoice) {
                if (d === cas.correctDiagnosis)  cls += " cbb-diag-opt--correct";
                else if (d === diagChoice)        cls += " cbb-diag-opt--wrong";
                else                             cls += " cbb-diag-opt--dim";
              }
              return (
                <button key={i} className={cls}
                  onClick={() => handleDiagnosis(d)}
                  disabled={!!diagChoice}
                >
                  <span className="cbb-diag-letter">{String.fromCharCode(65 + i)}</span>
                  <span className="cbb-diag-text">{d}</span>
                </button>
              );
            })}
          </div>

          {diagFeedback && (
            <div className={`cbb-diag-feedback cbb-diag-feedback--${diagFeedback}`}>
              {diagFeedback === "correct"
                ? `✅ Correct! +${calcXP(tokensSpent, true)} XP${badge ? ` · ${badge.icon} ${badge.label}` : ""}`
                : `❌ Incorrect. The answer is ${cas.correctDiagnosis}`
              }
            </div>
          )}

        </div>
      </div>
    );
  }

  // ── DEBRIEF ───────────────────────────────────────────────────────────────
  if (phase === PHASE.DEBRIEF) {
    const isCorrect  = diagChoice === cas.correctDiagnosis;
    const xpEarned   = calcXP(tokensSpent, isCorrect);
    const keyPanels  = cas.panels.filter(p => p.key);
    const missedKey  = keyPanels.filter(p => !unlocked.has(p.id));
    const redHerring = cas.panels.filter(p => p.value.includes("RED HERRING") && unlocked.has(p.id));

    return (
      <div className="cbb-page">
        <div className="cbb-inner">

          {/* Result hero */}
          <div className={`cbb-debrief-hero ${isCorrect ? "cbb-hero--correct" : "cbb-hero--wrong"}`}>
            <div className="cbb-orb cbb-orb-1"/><div className="cbb-orb cbb-orb-2"/>
            <div className="cbb-debrief-inner">
              <span className="cbb-debrief-icon">{isCorrect ? (badge?.icon || "✅") : "❌"}</span>
              <h2 className="cbb-debrief-title">
                {isCorrect ? (badge ? `${badge.label}!` : "Correct!") : "Incorrect"}
              </h2>
              <p className="cbb-debrief-diagnosis">{cas.correctDiagnosis}</p>
              <div className="cbb-debrief-stats">
                <div className="cbb-ds"><span className="cbb-ds-val">{xpEarned}</span><span className="cbb-ds-lbl">XP</span></div>
                <div className="cbb-ds"><span className="cbb-ds-val">{unlocked.size}</span><span className="cbb-ds-lbl">Unlocked</span></div>
                <div className="cbb-ds"><span className="cbb-ds-val">{tokensSpent}</span><span className="cbb-ds-lbl">Tokens</span></div>
                <div className="cbb-ds"><span className="cbb-ds-val">{redHerring.length}</span><span className="cbb-ds-lbl">Traps hit</span></div>
              </div>
            </div>
          </div>

          {/* Red herring callout */}
          {redHerring.length > 0 && (
            <div className="cbb-redhering-card">
              <p className="cbb-rh-title">🪤 Red herring{redHerring.length > 1 ? "s" : ""} you unlocked</p>
              {redHerring.map(p => (
                <div key={p.id} className="cbb-rh-row">
                  <span>{p.icon}</span><span>{p.label}</span>
                  <span className="cbb-rh-badge">Trap</span>
                </div>
              ))}
            </div>
          )}

          {/* Key panels you missed */}
          {missedKey.length > 0 && (
            <div className="cbb-missed-card">
              <p className="cbb-missed-title">🔑 Key panels you didn't unlock</p>
              {missedKey.map(p => (
                <div key={p.id} className="cbb-missed-row">
                  <span>{p.icon} {p.label}</span>
                  <span className="cbb-missed-val">{p.value}</span>
                </div>
              ))}
            </div>
          )}

          {/* Explanation */}
          <div className="cbb-explanation-card">
            <p className="cbb-exp-title">💡 What was going on</p>
            <p className="cbb-exp-text">{cas.explanation}</p>
          </div>

          {/* Key learning */}
          <div className="cbb-learning-card">
            <p className="cbb-learn-title">📚 Key learning</p>
            {cas.keyLearning.map((point, i) => (
              <div key={i} className="cbb-learn-row">
                <span className="cbb-learn-num">{i + 1}</span>
                <span>{point}</span>
              </div>
            ))}
          </div>

          <div className="cbb-debrief-btns">
            <button className="cbb-retry-btn" onClick={() => {
              setTokens(STARTING_TOKENS);
              setUnlocked(new Set());
              setDiagChoice(null);
              setDiagFeedback(null);
              setBadge(null);
              setPhase(PHASE.CASE);
            }}>
              Try Again
            </button>
            <button className="cbb-next-btn" onClick={nextCase}>
              Next Case →
            </button>
          </div>
          <button className="cbb-home-btn" onClick={() => navigate("/games-dashboard")}>
            Back to Games
          </button>

        </div>
      </div>
    );
  }

  return null;
}