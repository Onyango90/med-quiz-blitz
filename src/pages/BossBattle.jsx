// src/pages/BossBattle.jsx
import React, { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useStats } from "../hooks/useStats";
import { auth } from "../firebase";
import { getFirestore, doc, getDoc, updateDoc, increment } from "firebase/firestore";
import { getDailyQuestions } from "../data/dailyChallengeQuestions";

// ── Full question pool (all banks, normalised) ────────────────────────────────
import grossAnatomy      from "../data/questions/gross_anatomy.json";
import histology         from "../data/questions/histology.json";
import embryology        from "../data/questions/embryology.json";
import physiologyL1      from "../data/questions/physiology_level1.json";
import physiologyL2      from "../data/questions/physiology_level2.json";
import pharmacology      from "../data/questions/pharmacology.json";
import pathology         from "../data/questions/pathology.json";
import microbiology      from "../data/questions/microbiology.json";
import haematology       from "../data/questions/haematology.json";
import immunology        from "../data/questions/immunology.json";
import clinicalChemistry from "../data/questions/clinical_chemistry.json";
import antibiotics       from "../data/questions/pharmacology/antibiotics.json";
import antiparasitics    from "../data/questions/pharmacology/antiparasitics.json";
import antifungals       from "../data/questions/pharmacology/antifungals.json";

// Normalise both question formats into a single shape
function norm(q, subject) {
  if (!q) return null;
  if (q.question && q.answer !== undefined)
    return { ...q, type: q.type || (q.options ? "mcq" : "short"), subject: q.subject || subject, xpValue: 3 };
  if (q.text && q.options && typeof q.correctAnswer === "number")
    return { id: q.id, type: "mcq", question: q.text, options: q.options,
             answer: q.options[q.correctAnswer], explanation: q.explanation || "",
             difficulty: q.difficulty || "medium", year: q.year, xpValue: 3,
             subject, category: q.category || subject };
  return null;
}

// Subject pools keyed by name
const ALL_POOLS = {
  "Gross Anatomy":      grossAnatomy.map(q => norm(q, "Gross Anatomy")).filter(Boolean),
  "Histology":          histology.map(q => norm(q, "Histology")).filter(Boolean),
  "Embryology":         embryology.map(q => norm(q, "Embryology")).filter(Boolean),
  "Physiology L1":      physiologyL1.map(q => norm(q, "Physiology")).filter(Boolean),
  "Physiology L2":      physiologyL2.map(q => norm(q, "Physiology")).filter(Boolean),
  "Pharmacology":       [...pharmacology, ...antibiotics, ...antifungals]
                          .map(q => norm(q, "Pharmacology")).filter(Boolean),
  "Pathology":          pathology.map(q => norm(q, "Pathology")).filter(Boolean),
  "Microbiology":       microbiology.map(q => norm(q, "Microbiology")).filter(Boolean),
  "Haematology":        haematology.map(q => norm(q, "Haematology")).filter(Boolean),
  "Immunology":         immunology.map(q => norm(q, "Immunology")).filter(Boolean),
  "Clinical Chemistry": clinicalChemistry.map(q => norm(q, "Clinical Chemistry")).filter(Boolean),
  "Parasitology":       antiparasitics.map(q => norm(q, "Parasitology")).filter(Boolean),
};

// Which subjects each boss draws from — each boss gets its OWN subject focus
const BOSS_SUBJECTS = {
  1:  ["Gross Anatomy", "Histology", "Embryology"],
  2:  ["Parasitology", "Microbiology"],
  3:  ["Microbiology", "Pharmacology"],
  4:  ["Pharmacology"],
  5:  ["Pathology", "Haematology"],
  6:  ["Gross Anatomy", "Histology"],
  7:  ["Haematology", "Clinical Chemistry"],
  8:  ["Immunology", "Pathology"],
  9:  ["Physiology L1", "Physiology L2"],
  10: ["Pharmacology", "Pathology", "Clinical Chemistry", "Immunology"],
};

// Fast seedable random — different per boss + run
function seededRng(seed) {
  let s = seed;
  return () => { s = (s * 1664525 + 1013904223) & 0xffffffff; return Math.abs(s) / 0x80000000; };
}

function shuffleWithRng(arr, rng) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// Build a fresh question set for a specific boss, never repeating IDs from usedIds
function buildBossPool(bossNum, count, usedIds, runSeed) {
  const subjects = BOSS_SUBJECTS[bossNum] || BOSS_SUBJECTS[10];
  const rng = seededRng(runSeed + bossNum * 997);

  // Gather all questions for this boss's subjects
  let candidates = subjects.flatMap(s => ALL_POOLS[s] || []);
  candidates = shuffleWithRng(candidates, rng);

  // First pass: prefer unseen questions
  const fresh = candidates.filter(q => !usedIds.has(q.id));
  const seen  = candidates.filter(q =>  usedIds.has(q.id));

  // Fill from fresh first, then seen if necessary
  const picked = [...fresh, ...seen].slice(0, count);
  picked.forEach(q => usedIds.add(q.id));
  return picked;
}
import "./BossBattle.css";

// ── Boss roster ───────────────────────────────────────────────────────────────
const BOSSES = [
  { id: 1,  name: "Dr. Pathogen",        title: "Lord of Infections",    emoji: "🦠", hp: 3,  difficulty: "easy",   xpReward: 20,  color: "#0d9488" },
  { id: 2,  name: "The Parasite King",   title: "Ruler of Parasitology", emoji: "🪱", hp: 4,  difficulty: "easy",   xpReward: 25,  color: "#d97706" },
  { id: 3,  name: "Baron von Bacteria",  title: "Commander of Colonies", emoji: "⚗️", hp: 4,  difficulty: "medium", xpReward: 30,  color: "#6366f1" },
  { id: 4,  name: "The Pharmacist",      title: "Master of Poisons",     emoji: "💊", hp: 5,  difficulty: "medium", xpReward: 35,  color: "#ef4444" },
  { id: 5,  name: "Señor Pathology",     title: "Architect of Disease",  emoji: "🧬", hp: 5,  difficulty: "medium", xpReward: 40,  color: "#8b5cf6" },
  { id: 6,  name: "The Anatomist",       title: "Guardian of Structure", emoji: "💀", hp: 6,  difficulty: "hard",   xpReward: 50,  color: "#f97316" },
  { id: 7,  name: "Dr. Hemoglobin",      title: "Tyrant of Blood",       emoji: "🩸", hp: 6,  difficulty: "hard",   xpReward: 55,  color: "#dc2626" },
  { id: 8,  name: "The Immunarch",       title: "Emperor of Immunity",   emoji: "🛡️", hp: 7,  difficulty: "hard",   xpReward: 60,  color: "#7c3aed" },
  { id: 9,  name: "Grand Physio",        title: "Sage of Systems",       emoji: "⚡", hp: 7,  difficulty: "hard",   xpReward: 70,  color: "#0891b2" },
  { id: 10, name: "The Final Examiner",  title: "Overlord of Medicine",  emoji: "👨‍⚕️", hp: 8, difficulty: "expert", xpReward: 100, color: "#111827" },
];

const QUESTION_COUNTS = { easy: 3, medium: 4, hard: 5, expert: 6 };
const DIFF_LABEL      = { easy: "Easy", medium: "Medium", hard: "Hard", expert: "Expert" };

// How many questions per boss level
function questionsForBoss(boss) {
  return QUESTION_COUNTS[boss.difficulty] || 4;
}

// ── Phases ────────────────────────────────────────────────────────────────────
const PHASE = { LOBBY: "lobby", BATTLE: "battle", BOSS_DEAD: "boss_dead", GAME_OVER: "game_over", VICTORY: "victory" };

export default function BossBattle() {
  const navigate   = useNavigate();
  const { currentUser } = useAuth();
  const { processAnswer } = useStats();

  // Game state
  const [phase,        setPhase]        = useState(PHASE.LOBBY);
  const [userYear,     setUserYear]     = useState(1);
  const [runSeed,      setRunSeed]      = useState(0);
  const [usedIds,      setUsedIds]      = useState(new Set());
  const [loading,      setLoading]      = useState(true);

  // Battle state
  const [bossIndex,    setBossIndex]    = useState(0);
  const [lives,        setLives]        = useState(3);
  const [totalXP,      setTotalXP]      = useState(0);
  const [bossQuestions,setBossQuestions]= useState([]);
  const [qIndex,       setQIndex]       = useState(0);
  const [selected,     setSelected]     = useState(null);
  const [feedback,     setFeedback]     = useState(null); // "correct" | "wrong"
  const [bossHPLeft,   setBossHPLeft]   = useState(0);
  const [shake,        setShake]        = useState(false);
  const [bossFlash,    setBossFlash]    = useState(false);
  const [comboCount,   setComboCount]   = useState(0);
  const [xpPopup,      setXpPopup]      = useState(null);
  const [bossDeadXP,   setBossDeadXP]   = useState(0);
  const [finalStats,   setFinalStats]   = useState(null);
  const [defeatedBosses, setDefeatedBosses] = useState([]);

  const answerLocked = useRef(false);

  // ── Load year + questions ──────────────────────────────────────────────────
  useEffect(() => {
    async function load() {
      setLoading(true);
      let year = 1;
      if (currentUser) {
        try {
          const db   = getFirestore();
          const snap = await getDoc(doc(db, "users", currentUser.uid));
          year = parseInt(snap.data()?.profile?.year || "1") || 1;
        } catch {}
      }
      setUserYear(year);
      setLoading(false);
    }
    load();
  }, [currentUser]);

  // ── Start game ─────────────────────────────────────────────────────────────
  const startGame = useCallback(() => {
    const seed    = Date.now();
    const freshIds = new Set();
    const boss    = BOSSES[0];
    const qCount  = questionsForBoss(boss);
    const qs      = buildBossPool(1, qCount, freshIds, seed);
    setRunSeed(seed);
    setUsedIds(freshIds);
    setBossIndex(0);
    setLives(3);
    setTotalXP(0);
    setDefeatedBosses([]);
    setBossQuestions(qs);
    setQIndex(0);
    setBossHPLeft(boss.hp);
    setSelected(null);
    setFeedback(null);
    setComboCount(0);
    answerLocked.current = false;
    setPhase(PHASE.BATTLE);
  }, []);

  // ── Answer handling ────────────────────────────────────────────────────────
  const handleAnswer = useCallback((option) => {
    if (answerLocked.current || feedback) return;
    answerLocked.current = true;

    const question = bossQuestions[qIndex];
    if (!question) return;

    const isCorrect = option === question.answer;
    setSelected(option);
    setFeedback(isCorrect ? "correct" : "wrong");

    const boss    = BOSSES[bossIndex];
    let xpEarned  = isCorrect ? (question.xpValue || 3) : 0;
    const newCombo = isCorrect ? comboCount + 1 : 0;
    setComboCount(newCombo);

    // Combo bonus: 3+ in a row = +2 XP each
    if (isCorrect && newCombo >= 3) xpEarned += 2;

    if (isCorrect) {
      setBossFlash(true);
      setTimeout(() => setBossFlash(false), 400);
      const newHP = bossHPLeft - 1;
      setBossHPLeft(newHP);
      setTotalXP(prev => prev + xpEarned);
      setXpPopup({ xp: xpEarned, combo: newCombo >= 3 });
      setTimeout(() => setXpPopup(null), 1000);

      processAnswer({ ...question, subject: question.subject || "General" }, true, 0, "boss_battle");

      setTimeout(() => {
        setSelected(null);
        setFeedback(null);
        answerLocked.current = false;

        if (newHP <= 0) {
          // Boss defeated
          setBossDeadXP(boss.xpReward);
          setTotalXP(prev => prev + boss.xpReward);
          setDefeatedBosses(prev => [...prev, boss]);

          if (bossIndex + 1 >= BOSSES.length) {
            setFinalStats({ bossesDefeated: BOSSES.length, livesLeft: lives, xp: totalXP + xpEarned + boss.xpReward });
            setPhase(PHASE.VICTORY);
          } else {
            setPhase(PHASE.BOSS_DEAD);
          }
        } else {
          // Next question
          const nextQ = qIndex + 1;
          if (nextQ >= bossQuestions.length) {
            // Ran out of questions but boss still alive — get fresh ones for same boss
            const qCount = questionsForBoss(boss);
            const newIds = new Set(usedIds);
            const fresh  = buildBossPool(bossIndex + 1, qCount, newIds, runSeed + nextQ);
            setUsedIds(newIds);
            setBossQuestions(fresh);
            setQIndex(0);
          } else {
            setQIndex(nextQ);
          }
        }
      }, 900);

    } else {
      // Wrong answer — lose a life
      setShake(true);
      setTimeout(() => setShake(false), 500);
      processAnswer({ ...question, subject: question.subject || "General" }, false, 0, "boss_battle");
      const newLives = lives - 1;
      setLives(newLives);

      setTimeout(() => {
        setSelected(null);
        setFeedback(null);
        answerLocked.current = false;

        if (newLives <= 0) {
          setFinalStats({ bossesDefeated: defeatedBosses.length, livesLeft: 0, xp: totalXP });
          setPhase(PHASE.GAME_OVER);
        } else {
          // Move to next question (don't count this as a boss hit)
          const nextQ = qIndex + 1;
          if (nextQ >= bossQuestions.length) {
            const qCount = questionsForBoss(boss);
            const newIds = new Set(usedIds);
            const fresh  = buildBossPool(bossIndex + 1, qCount, newIds, runSeed + nextQ + 500);
            setUsedIds(newIds);
            setBossQuestions(fresh);
            setQIndex(0);
          } else {
            setQIndex(nextQ);
          }
        }
      }, 900);
    }
  }, [feedback, bossQuestions, qIndex, bossIndex, bossHPLeft, lives, comboCount, usedIds, runSeed, totalXP, defeatedBosses, processAnswer]);

  // ── Next boss ──────────────────────────────────────────────────────────────
  const nextBoss = useCallback(() => {
    const nextIdx  = bossIndex + 1;
    const boss     = BOSSES[nextIdx];
    const qCount   = questionsForBoss(boss);
    const newIds   = new Set(usedIds);
    const qs       = buildBossPool(nextIdx + 1, qCount, newIds, runSeed);
    setUsedIds(newIds);
    setBossIndex(nextIdx);
    setBossQuestions(qs);
    setQIndex(0);
    setBossHPLeft(boss.hp);
    setSelected(null);
    setFeedback(null);
    setComboCount(0);
    answerLocked.current = false;
    setPhase(PHASE.BATTLE);
  }, [bossIndex, usedIds, runSeed]);

  // ── Save XP on game over / victory ────────────────────────────────────────
  useEffect(() => {
    if ((phase === PHASE.GAME_OVER || phase === PHASE.VICTORY) && currentUser && totalXP > 0) {
      try {
        const db = getFirestore();
        updateDoc(doc(db, "users", currentUser.uid), {
          "stats.totalXP":    increment(totalXP),
          "stats.totalGames": increment(1),
        });
      } catch {}
    }
  }, [phase]);

  // ── Render helpers ─────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="bb-loading">
        <div className="bb-spinner" />
        <p>Summoning bosses…</p>
      </div>
    );
  }

  const boss    = BOSSES[bossIndex] || BOSSES[0];
  const question = bossQuestions[qIndex];
  const hpPct   = Math.max(0, (bossHPLeft / boss.hp) * 100);
  const diffLabel = DIFF_LABEL[boss.difficulty] || "Medium";

  // ── LOBBY ──────────────────────────────────────────────────────────────────
  if (phase === PHASE.LOBBY) {
    return (
      <div className="bb-page">
        <div className="bb-inner">
          <button className="bb-back-btn" onClick={() => navigate("/games-dashboard")}>← Back</button>

          <div className="bb-lobby-hero">
            <div className="bb-lobby-orb bb-orb-1" />
            <div className="bb-lobby-orb bb-orb-2" />
            <div className="bb-lobby-inner">
              <span className="bb-lobby-icon">⚔️</span>
              <h1 className="bb-lobby-title">Boss Battle</h1>
              <p className="bb-lobby-sub">Defeat medical villains with your knowledge. One wrong answer costs a life — lose all 3 and it's over.</p>
              <div className="bb-lobby-stats">
                <div className="bb-ls"><span className="bb-ls-val">{BOSSES.length}</span><span className="bb-ls-lbl">Bosses</span></div>
                <div className="bb-ls"><span className="bb-ls-val">3</span><span className="bb-ls-lbl">Lives</span></div>
                <div className="bb-ls"><span className="bb-ls-val">∞</span><span className="bb-ls-lbl">Endless</span></div>
              </div>
            </div>
          </div>

          <div className="bb-boss-preview">
            <p className="bb-preview-label">Boss roster</p>
            <div className="bb-boss-scroll">
              {BOSSES.map((b, i) => (
                <div key={b.id} className="bb-boss-chip" style={{ "--boss-color": b.color }}>
                  <span className="bb-chip-emoji">{b.emoji}</span>
                  <span className="bb-chip-name">{b.name}</span>
                  <span className={`bb-chip-diff bb-diff-${b.difficulty}`}>{DIFF_LABEL[b.difficulty]}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="bb-rules-card">
            <p className="bb-rules-title">How it works</p>
            <div className="bb-rule"><span className="bb-rule-icon">✅</span><span>Correct answer = damage the boss (–1 HP)</span></div>
            <div className="bb-rule"><span className="bb-rule-icon">❌</span><span>Wrong answer = lose a life</span></div>
            <div className="bb-rule"><span className="bb-rule-icon">🔥</span><span>3 correct in a row = combo bonus +2 XP each</span></div>
            <div className="bb-rule"><span className="bb-rule-icon">💀</span><span>Drain all boss HP = boss defeated + XP reward</span></div>
            <div className="bb-rule"><span className="bb-rule-icon">☠️</span><span>Lose all 3 lives = game over</span></div>
          </div>

          <button className="bb-start-btn" onClick={startGame}>
            ⚔️ Start Battle
          </button>
        </div>
      </div>
    );
  }

  // ── BOSS DEAD ──────────────────────────────────────────────────────────────
  if (phase === PHASE.BOSS_DEAD) {
    const defeated = BOSSES[bossIndex];
    const next     = BOSSES[bossIndex + 1];
    return (
      <div className="bb-page">
        <div className="bb-inner bb-inner--center">
          <div className="bb-dead-card">
            <span className="bb-dead-icon">{defeated.emoji}</span>
            <h2 className="bb-dead-title">{defeated.name} defeated!</h2>
            <p className="bb-dead-sub">+{bossDeadXP} XP reward</p>
            <div className="bb-dead-xp">Total XP: {totalXP}</div>
            <div className="bb-dead-lives">
              {[1,2,3].map(l => (
                <span key={l} className={`bb-heart ${l <= lives ? "bb-heart--full" : "bb-heart--lost"}`}>❤️</span>
              ))}
            </div>
            {next && (
              <div className="bb-next-preview">
                <p className="bb-next-label">Next boss</p>
                <div className="bb-next-boss" style={{ "--boss-color": next.color }}>
                  <span>{next.emoji}</span>
                  <div>
                    <span className="bb-next-name">{next.name}</span>
                    <span className="bb-next-title">{next.title}</span>
                  </div>
                  <span className={`bb-chip-diff bb-diff-${next.difficulty}`}>{DIFF_LABEL[next.difficulty]}</span>
                </div>
              </div>
            )}
            <button className="bb-continue-btn" onClick={nextBoss}>
              Continue ⚔️
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── GAME OVER ──────────────────────────────────────────────────────────────
  if (phase === PHASE.GAME_OVER) {
    return (
      <div className="bb-page">
        <div className="bb-inner bb-inner--center">
          <div className="bb-over-card">
            <span className="bb-over-icon">💀</span>
            <h2 className="bb-over-title">Game Over</h2>
            <p className="bb-over-sub">You ran out of lives on <strong>{boss.name}</strong></p>
            <div className="bb-over-stats">
              <div className="bb-os"><span className="bb-os-val">{finalStats?.bossesDefeated || 0}</span><span className="bb-os-lbl">Bosses defeated</span></div>
              <div className="bb-os"><span className="bb-os-val">{finalStats?.xp || 0}</span><span className="bb-os-lbl">XP earned</span></div>
              <div className="bb-os"><span className="bb-os-val">{BOSSES.length - (finalStats?.bossesDefeated || 0)}</span><span className="bb-os-lbl">Bosses remaining</span></div>
            </div>
            {defeatedBosses.length > 0 && (
              <div className="bb-defeated-list">
                <p className="bb-defeated-label">Defeated</p>
                <div className="bb-defeated-chips">
                  {defeatedBosses.map(b => (
                    <span key={b.id} className="bb-defeated-chip">{b.emoji} {b.name}</span>
                  ))}
                </div>
              </div>
            )}
            <div className="bb-over-btns">
              <button className="bb-retry-btn" onClick={startGame}>Try Again</button>
              <button className="bb-home-btn"  onClick={() => navigate("/games-dashboard")}>Back to Games</button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── VICTORY ────────────────────────────────────────────────────────────────
  if (phase === PHASE.VICTORY) {
    return (
      <div className="bb-page">
        <div className="bb-inner bb-inner--center">
          <div className="bb-victory-card">
            <span className="bb-victory-icon">🏆</span>
            <h2 className="bb-victory-title">All bosses defeated!</h2>
            <p className="bb-victory-sub">You are the ultimate MedBlitz champion</p>
            <div className="bb-over-stats">
              <div className="bb-os"><span className="bb-os-val">{BOSSES.length}</span><span className="bb-os-lbl">Bosses slain</span></div>
              <div className="bb-os"><span className="bb-os-val">{finalStats?.livesLeft}</span><span className="bb-os-lbl">Lives remaining</span></div>
              <div className="bb-os"><span className="bb-os-val">{finalStats?.xp}</span><span className="bb-os-lbl">Total XP</span></div>
            </div>
            <div className="bb-over-btns">
              <button className="bb-retry-btn" onClick={startGame}>Play Again</button>
              <button className="bb-home-btn"  onClick={() => navigate("/games-dashboard")}>Back to Games</button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── BATTLE ─────────────────────────────────────────────────────────────────
  if (!question) return null;

  return (
    <div className="bb-page">
      <div className="bb-inner">

        {/* Top bar */}
        <div className="bb-topbar">
          <button className="bb-topbar-back" onClick={() => navigate("/games-dashboard")}>✕</button>
          <div className="bb-topbar-lives">
            {[1,2,3].map(l => (
              <span key={l} className={`bb-heart ${l <= lives ? "bb-heart--full" : "bb-heart--lost"}`}>❤️</span>
            ))}
          </div>
          <div className="bb-topbar-xp">⭐ {totalXP} XP</div>
        </div>

        {/* Boss section */}
        <div className={`bb-boss-section ${bossFlash ? "bb-boss--hit" : ""} ${shake ? "bb-boss--shake" : ""}`}
             style={{ "--boss-color": boss.color }}>
          <div className="bb-boss-header">
            <div>
              <p className="bb-boss-num">Boss {bossIndex + 1} of {BOSSES.length}</p>
              <h2 className="bb-boss-name">{boss.name}</h2>
              <p className="bb-boss-title">{boss.title}</p>
            </div>
            <span className={`bb-diff-badge bb-diff-${boss.difficulty}`}>{diffLabel}</span>
          </div>

          <div className="bb-boss-avatar">{boss.emoji}</div>

          {/* HP bar */}
          <div className="bb-hp-wrap">
            <div className="bb-hp-labels">
              <span>HP</span>
              <span>{bossHPLeft} / {boss.hp}</span>
            </div>
            <div className="bb-hp-track">
              <div className="bb-hp-fill" style={{ width: `${hpPct}%`, "--boss-color": boss.color }} />
            </div>
            <div className="bb-hp-skulls">
              {Array.from({ length: boss.hp }).map((_, i) => (
                <span key={i} className={`bb-skull ${i < (boss.hp - bossHPLeft) ? "bb-skull--dead" : ""}`}>💀</span>
              ))}
            </div>
          </div>

          {/* Boss streak */}
          {bossIndex > 0 && (
            <div className="bb-boss-streak">
              {defeatedBosses.map(b => (
                <span key={b.id} className="bb-streak-icon" title={b.name}>{b.emoji}</span>
              ))}
            </div>
          )}
        </div>

        {/* Combo banner */}
        {comboCount >= 3 && (
          <div className="bb-combo-banner">
            🔥 Combo x{comboCount} — +2 XP bonus!
          </div>
        )}

        {/* XP popup */}
        {xpPopup && (
          <div className={`bb-xp-popup ${xpPopup.combo ? "bb-xp-popup--combo" : ""}`}>
            +{xpPopup.xp} XP{xpPopup.combo ? " 🔥" : ""}
          </div>
        )}

        {/* Question */}
        <div className={`bb-question-card ${feedback ? `bb-question--${feedback}` : ""}`}>
          <div className="bb-q-meta">
            <span className="bb-q-subject">{question.subject || "General"}</span>
            <span className="bb-q-num">{qIndex + 1} / {bossQuestions.length}</span>
          </div>
          <p className="bb-question-text">{question.question}</p>

          {question.type === "mcq" && question.options ? (
            <div className="bb-options">
              {question.options.map((opt, i) => {
                let cls = "bb-option";
                if (selected) {
                  if (opt === question.answer)       cls += " bb-option--correct";
                  else if (opt === selected)         cls += " bb-option--wrong";
                }
                return (
                  <button key={i} className={cls} onClick={() => handleAnswer(opt)} disabled={!!feedback}>
                    <span className="bb-opt-label">{String.fromCharCode(65 + i)}</span>
                    <span className="bb-opt-text">{opt}</span>
                  </button>
                );
              })}
            </div>
          ) : (
            <ShortAnswerInput
              question={question}
              feedback={feedback}
              onSubmit={handleAnswer}
            />
          )}

          {feedback && (
            <div className={`bb-explanation ${feedback === "correct" ? "bb-explanation--correct" : "bb-explanation--wrong"}`}>
              {feedback === "correct" ? "✅ Correct!" : `❌ Answer: ${question.answer}`}
              {question.explanation && <p className="bb-exp-text">{question.explanation}</p>}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}

// ── Short answer sub-component ─────────────────────────────────────────────
function ShortAnswerInput({ question, feedback, onSubmit }) {
  const [val, setVal] = useState("");
  const ref = useRef(null);
  useEffect(() => { ref.current?.focus(); }, []);

  const submit = () => {
    if (!val.trim() || feedback) return;
    onSubmit(val.trim());
  };

  return (
    <div className="bb-short-wrap">
      <input
        ref={ref}
        className={`bb-short-input ${feedback ? `bb-short-input--${feedback}` : ""}`}
        value={val}
        onChange={e => setVal(e.target.value)}
        onKeyDown={e => e.key === "Enter" && submit()}
        placeholder="Type your answer…"
        disabled={!!feedback}
      />
      <button className="bb-short-submit" onClick={submit} disabled={!!feedback || !val.trim()}>
        Attack ⚔️
      </button>
    </div>
  );
}