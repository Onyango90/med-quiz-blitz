// src/pages/ClassicChallenge.jsx — "Name 3 in 10" with voice input
import React, { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useStats } from "../hooks/useStats";
import { getFirestore, doc, getDoc, updateDoc, increment } from "firebase/firestore";
import { getQuestionsForYear, shuffleForSession } from "../data/name3Questions";
import "./ClassicChallenge.css";

// ── Fuzzy answer matcher ───────────────────────────────────────────────────────
// Strips noise words, normalises spelling, does partial matching
function normalise(str) {
  return str
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, "")
    .replace(/\b(the|a|an|of|is|are|and|or|it|its|in|on|at|for|with)\b/g, "")
    .replace(/s\b/g, "")                // strip trailing s (plurals)
    .replace(/\s+/g, " ")
    .trim();
}

function wordsMatch(spoken, answer) {
  const s = normalise(spoken);
  const a = normalise(answer);
  if (!s || !a) return false;
  // Exact normalised match
  if (s === a) return true;
  // Spoken contains the answer keyword
  if (s.includes(a) || a.includes(s)) return true;
  // Word-level overlap: at least one key word matches
  const sWords = s.split(" ").filter(w => w.length > 3);
  const aWords = a.split(" ").filter(w => w.length > 3);
  return sWords.some(sw => aWords.some(aw => sw === aw || sw.startsWith(aw) || aw.startsWith(sw)));
}

// Returns which answer from the bank the spoken text matches, or null
function matchAnswer(spoken, acceptedAnswers, alreadyFound) {
  for (const answer of acceptedAnswers) {
    if (alreadyFound.includes(answer)) continue;
    if (wordsMatch(spoken, answer)) return answer;
  }
  return null;
}

// Extract individual items from a spoken sentence like "insulin, glucagon and somatostatin"
function extractItems(transcript) {
  return transcript
    .split(/,|and\s|plus\s|\s+or\s+/)
    .map(s => s.trim())
    .filter(s => s.length > 1);
}

// ── Game phases ────────────────────────────────────────────────────────────────
const PHASE = {
  LOBBY:    "lobby",
  QUESTION: "question",
  RESULT:   "result",
  GAMEOVER: "gameover",
};

const ROUND_COUNT = 5;   // questions per session
const TIME_LIMIT  = 20;  // seconds per question

export default function ClassicChallenge() {
  const navigate   = useNavigate();
  const { currentUser } = useAuth();
  const { processAnswer } = useStats();

  // ── Setup state ──
  const [phase,       setPhase]      = useState(PHASE.LOBBY);
  const [userYear,    setUserYear]   = useState(1);
  const [questions,   setQuestions]  = useState([]);
  const [qIndex,      setQIndex]     = useState(0);
  const [loading,     setLoading]    = useState(true);

  // ── Per-question state ──
  const [timeLeft,    setTimeLeft]   = useState(TIME_LIMIT);
  const [found,       setFound]      = useState([]);       // matched answer strings
  const [missed,      setMissed]     = useState([]);       // answers NOT found
  const [transcript,  setTranscript] = useState("");       // live speech text
  const [listening,   setListening]  = useState(false);
  const [voiceEnabled,setVoiceEnabled]= useState(true);   // user toggle
  const [voiceError,  setVoiceError] = useState("");
  const [flashWord,   setFlashWord]  = useState(null);     // pop-up when word matched
  const [typedInput,  setTypedInput] = useState("");       // fallback text input

  // ── Session totals ──
  const [score,       setScore]      = useState(0);        // questions fully answered
  const [totalXP,     setTotalXP]    = useState(0);
  const [roundResults,setRoundResults]= useState([]);

  // ── Refs ──
  const timerRef       = useRef(null);
  const speechRef      = useRef(null);
  const foundRef       = useRef([]);       // live ref so speech callback always sees latest
  const phaseRef       = useRef(PHASE.LOBBY);
  const inputRef       = useRef(null);
  const questionsRef   = useRef([]);       // always-current questions (fixes stale closure)
  const qIndexRef      = useRef(0);        // always-current qIndex
  const timeLeftRef    = useRef(TIME_LIMIT); // always-current timeLeft
  const endQuestionRef = useRef(null);     // always-current endQuestion fn
  const voiceEnabledRef = useRef(true);    // mirrors voiceEnabled for use in callbacks

  // ── Load year ──────────────────────────────────────────────────────────────
  useEffect(() => {
    async function load() {
      let year = 1;
      if (currentUser) {
        try {
          const db   = getFirestore();
          const snap = await getDoc(doc(db, "users", currentUser.uid));
          year = parseInt(snap.data()?.profile?.year || "1") || 1;
        } catch {}
      }
      setUserYear(year);
      const qs = shuffleForSession(getQuestionsForYear(year)).slice(0, ROUND_COUNT);
      const finalQs = qs.length >= ROUND_COUNT ? qs : shuffleForSession(getQuestionsForYear(1)).slice(0, ROUND_COUNT);
      questionsRef.current = finalQs;
      setQuestions(finalQs);
      setLoading(false);
    }
    load();
  }, [currentUser]);

  // ── Voice recognition setup ────────────────────────────────────────────────
  const voiceSupported = typeof window !== "undefined" &&
    ("SpeechRecognition" in window || "webkitSpeechRecognition" in window);

  const startListening = useCallback(() => {
    if (!voiceSupported) return;
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    const rec = new SR();
    rec.continuous      = true;
    rec.interimResults  = true;
    rec.lang            = "en-US";
    rec.maxAlternatives = 3;

    rec.onstart = () => { setListening(true); setVoiceError(""); };
    rec.onerror = (e) => {
      if (e.error === "not-allowed") setVoiceError("Microphone permission denied. Use text input below.");
      else if (e.error !== "no-speech") setVoiceError("Voice error — try typing instead.");
      setListening(false);
    };
    rec.onend = () => {
      setListening(false);
      if (phaseRef.current === PHASE.QUESTION) {
        try { rec.start(); } catch {}
      }
    };

    rec.onresult = (event) => {
      if (phaseRef.current !== PHASE.QUESTION) return;
      // Use refs — never stale
      const q = questionsRef.current[qIndexRef.current];
      if (!q) return;

      const result = event.results[event.results.length - 1];
      const texts  = Array.from({ length: result.length }, (_, i) => result[i].transcript);
      setTranscript(texts[0]);

      for (const text of texts) {
        const items = extractItems(text);
        for (const item of items) {
          const match = matchAnswer(item, q.answers, foundRef.current);
          if (match) {
            const newFound = [...foundRef.current, match];
            foundRef.current = newFound;
            setFound(newFound);
            setFlashWord(match);
            setTimeout(() => setFlashWord(null), 700);
            if (newFound.length >= q.required) {
              endQuestionRef.current?.(newFound, true);
              return;
            }
          }
        }
      }
    };

    speechRef.current = rec;
    try { rec.start(); } catch {}
  }, [voiceSupported]);

  const stopListening = useCallback(() => {
    if (speechRef.current) {
      try { speechRef.current.stop(); } catch {}
      speechRef.current = null;
    }
    setListening(false);
  }, []);

  // ── Timer ──────────────────────────────────────────────────────────────────
  const startTimer = useCallback(() => {
    clearInterval(timerRef.current);
    timeLeftRef.current = TIME_LIMIT;
    setTimeLeft(TIME_LIMIT);
    timerRef.current = setInterval(() => {
      timeLeftRef.current -= 1;
      setTimeLeft(timeLeftRef.current);
      if (timeLeftRef.current <= 0) {
        clearInterval(timerRef.current);
        endQuestionRef.current?.(foundRef.current, false);
      }
    }, 1000);
  }, []);

  // ── End a question ─────────────────────────────────────────────────────────
  const endQuestion = useCallback((finalFound, completed) => {
    if (phaseRef.current !== PHASE.QUESTION) return;
    phaseRef.current = PHASE.RESULT;

    clearInterval(timerRef.current);
    stopListening();

    // Use refs — always current, never stale
    const q        = questionsRef.current[qIndexRef.current];
    const elapsed  = TIME_LIMIT - timeLeftRef.current;
    if (!q) return;

    const xpEarned     = finalFound.length * 10 + (finalFound.length >= q.required ? 5 : 0);
    const wasFullScore = finalFound.length >= q.required;
    const idealAnswers = q.answers.slice(0, q.required);
    const missedAnswers = idealAnswers.filter(
      a => !finalFound.some(f => wordsMatch(f, a) || wordsMatch(a, f))
    );

    setMissed(missedAnswers);
    setTotalXP(prev => prev + xpEarned);
    if (wasFullScore) setScore(prev => prev + 1);

    setRoundResults(prev => [...prev, {
      prompt: q.prompt,
      found: finalFound,
      missed: missedAnswers,
      xp: xpEarned,
      full: wasFullScore,
    }]);

    processAnswer({ subject: q.subject, xpValue: xpEarned }, wasFullScore, elapsed, "name3");
    setPhase(PHASE.RESULT);
  }, [stopListening, processAnswer]);

  // Keep endQuestionRef always pointing to the latest version
  useEffect(() => { endQuestionRef.current = endQuestion; }, [endQuestion]);

  // ── Keep qIndexRef in sync ─────────────────────────────────────────────────
  useEffect(() => { qIndexRef.current = qIndex; }, [qIndex]);

  // ── Keep voiceEnabledRef in sync ───────────────────────────────────────────
  useEffect(() => { voiceEnabledRef.current = voiceEnabled; }, [voiceEnabled]);

  // ── Voice toggle (user-facing button) ──────────────────────────────────────
  const toggleVoice = useCallback(() => {
    if (!voiceSupported) return;
    const turning_on = !voiceEnabledRef.current;
    voiceEnabledRef.current = turning_on;
    setVoiceEnabled(turning_on);
    setVoiceError("");
    if (turning_on) {
      if (phase === PHASE.QUESTION) startListening();
    } else {
      stopListening();
    }
  }, [voiceSupported, phase, startListening, stopListening]);

  // ── Advance to next question ───────────────────────────────────────────────
  const nextQuestion = useCallback(() => {
    const next = qIndexRef.current + 1;
    if (next >= questionsRef.current.length) {
      if (currentUser) {
        try {
          // XP saved via processAnswer already — just mark session
          const db = getFirestore();
          updateDoc(doc(db, "users", currentUser.uid), { "stats.totalGames": increment(1) });
        } catch {}
      }
      phaseRef.current = PHASE.GAMEOVER;
      setPhase(PHASE.GAMEOVER);
      return;
    }
    setQIndex(next);
    setFound([]);
    setMissed([]);
    setTranscript("");
    setTypedInput("");
    setFlashWord(null);
    foundRef.current  = [];
    phaseRef.current  = PHASE.QUESTION;
    setPhase(PHASE.QUESTION);
  }, [currentUser]);

  // ── Start game ─────────────────────────────────────────────────────────────
  const startGame = useCallback(() => {
    setQIndex(0);
    setFound([]); setMissed([]); setTranscript(""); setTypedInput("");
    setScore(0); setTotalXP(0); setRoundResults([]);
    setFlashWord(null);
    foundRef.current = [];
    phaseRef.current = PHASE.QUESTION;
    setPhase(PHASE.QUESTION);
  }, []);

  // ── When phase becomes QUESTION: start timer + voice ──────────────────────
  useEffect(() => {
    if (phase === PHASE.QUESTION) {
      startTimer();
      if (voiceSupported && voiceEnabledRef.current) startListening();
      inputRef.current?.focus();
    }
    return () => {
      clearInterval(timerRef.current);
      stopListening();
    };
  }, [phase, qIndex]);

  // ── Typed input submit ─────────────────────────────────────────────────────
  const handleTypedSubmit = useCallback((e) => {
    e?.preventDefault();
    if (!typedInput.trim() || phase !== PHASE.QUESTION) return;
    const q = questionsRef.current[qIndexRef.current];
    if (!q) return;

    const items = extractItems(typedInput);
    let newFound = [...foundRef.current];
    let matched = false;

    for (const item of items) {
      const match = matchAnswer(item, q.answers, newFound);
      if (match) {
        newFound = [...newFound, match];
        setFlashWord(match);
        setTimeout(() => setFlashWord(null), 700);
        matched = true;
      }
    }

    if (matched) {
      foundRef.current = newFound;
      setFound(newFound);
      if (newFound.length >= q.required) {
        endQuestionRef.current?.(newFound, true);
      }
    }
    setTypedInput("");
  }, [typedInput, phase]);

  // ── Render ─────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="n3-loading">
        <div className="n3-spinner" />
        <p>Loading questions…</p>
      </div>
    );
  }

  const question = questions[qIndex];
  const timerPct = (timeLeft / TIME_LIMIT) * 100;
  const timerColor = timeLeft > 6 ? "#0d9488" : timeLeft > 3 ? "#d97706" : "#ef4444";

  // ── LOBBY ──────────────────────────────────────────────────────────────────
  if (phase === PHASE.LOBBY) {
    return (
      <div className="n3-page">
        <div className="n3-inner">
          <button className="n3-back-btn" onClick={() => navigate("/games-dashboard")}>← Back</button>

          <div className="n3-lobby-hero">
            <div className="n3-orb n3-orb-1" />
            <div className="n3-orb n3-orb-2" />
            <div className="n3-lobby-inner">
              <span className="n3-lobby-icon">⚡</span>
              <h1 className="n3-lobby-title">Name 3 in 20</h1>
              <p className="n3-lobby-sub">You have 20 seconds to name 3 correct answers. Speak them out loud — or type them. Go fast, think faster.</p>
              <div className="n3-lobby-stats">
                <div className="n3-ls"><span className="n3-ls-val">{ROUND_COUNT}</span><span className="n3-ls-lbl">Questions</span></div>
                <div className="n3-ls"><span className="n3-ls-val">20s</span><span className="n3-ls-lbl">Per round</span></div>
                <div className="n3-ls"><span className="n3-ls-val">35</span><span className="n3-ls-lbl">Max XP</span></div>
              </div>
            </div>
          </div>

          <div className="n3-rules-card">
            <p className="n3-rules-title">How it works</p>
            <div className="n3-rule"><span>🎙️</span><span>Speak your answers — the mic picks them up in real-time</span></div>
            <div className="n3-rule"><span>⌨️</span><span>Or type answers separated by commas</span></div>
            <div className="n3-rule"><span>✅</span><span>Each correct answer = +10 XP</span></div>
            <div className="n3-rule"><span>🏆</span><span>Name all 3 before time's up = +5 bonus XP</span></div>
            <div className="n3-rule"><span>⏱️</span><span>20 seconds — then it moves on whether you're ready or not</span></div>
          </div>

          {voiceSupported ? (
            <div className="n3-voice-badge n3-voice-badge--on">
              🎙️ Voice input supported — allow mic when prompted
            </div>
          ) : (
            <div className="n3-voice-badge n3-voice-badge--off">
              ⌨️ Voice not supported in this browser — text input available
            </div>
          )}

          <button className="n3-start-btn" onClick={startGame}>
            ⚡ Start Game
          </button>
        </div>
      </div>
    );
  }

  // ── GAMEOVER ───────────────────────────────────────────────────────────────
  if (phase === PHASE.GAMEOVER) {
    const perfect = score === questions.length;
    return (
      <div className="n3-page">
        <div className="n3-inner">
          <div className="n3-over-card">
            <span className="n3-over-icon">{perfect ? "🏆" : score >= 3 ? "⭐" : "💪"}</span>
            <h2 className="n3-over-title">{perfect ? "Perfect round!" : `${score} / ${questions.length} complete`}</h2>
            <p className="n3-over-sub">You earned <strong>{totalXP} XP</strong> this session</p>

            <div className="n3-over-stats">
              <div className="n3-os"><span className="n3-os-val">{score}</span><span className="n3-os-lbl">Full scores</span></div>
              <div className="n3-os"><span className="n3-os-val">{totalXP}</span><span className="n3-os-lbl">XP earned</span></div>
              <div className="n3-os"><span className="n3-os-val">{questions.length - score}</span><span className="n3-os-lbl">Incomplete</span></div>
            </div>

            <div className="n3-round-recap">
              {roundResults.map((r, i) => (
                <div key={i} className={`n3-recap-row ${r.full ? "n3-recap--full" : "n3-recap--partial"}`}>
                  <div className="n3-recap-left">
                    <span className="n3-recap-icon">{r.full ? "✅" : "⚠️"}</span>
                    <span className="n3-recap-prompt">{r.prompt}</span>
                  </div>
                  <span className="n3-recap-xp">+{r.xp} XP</span>
                </div>
              ))}
            </div>

            <div className="n3-over-btns">
              <button className="n3-retry-btn" onClick={startGame}>Play Again</button>
              <button className="n3-home-btn" onClick={() => navigate("/games-dashboard")}>Back to Games</button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── RESULT (between questions) ─────────────────────────────────────────────
  if (phase === PHASE.RESULT) {
    const r = roundResults[roundResults.length - 1];
    return (
      <div className="n3-page">
        <div className="n3-inner">
          <div className="n3-result-card">
            <span className="n3-result-icon">{r?.full ? "🎯" : "⏱️"}</span>
            <h2 className="n3-result-title">{r?.full ? "Got all 3!" : `${r?.found?.length || 0} of 3 named`}</h2>
            <p className="n3-result-xp">+{r?.xp || 0} XP{r?.full ? " (includes +5 bonus!)" : ""}</p>

            <div className="n3-result-answers">
              <p className="n3-result-answers-label">Answers</p>
              {question?.answers.slice(0, question.required).map((a, i) => {
                const wasFound = r?.found?.some(f => wordsMatch(f, a) || wordsMatch(a, f));
                return (
                  <div key={i} className={`n3-answer-row ${wasFound ? "n3-answer--found" : "n3-answer--missed"}`}>
                    <span>{wasFound ? "✅" : "❌"}</span>
                    <span className="n3-answer-text">{a}</span>
                  </div>
                );
              })}
            </div>

            <button
              className="n3-next-btn"
              onClick={nextQuestion}
            >
              {qIndex + 1 >= questions.length ? "See Results" : "Next Question →"}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── QUESTION ───────────────────────────────────────────────────────────────
  return (
    <div className="n3-page">
      <div className="n3-inner">

        {/* Top bar */}
        <div className="n3-topbar">
          <button className="n3-topbar-x" onClick={() => { stopListening(); navigate("/games-dashboard"); }}>✕</button>
          <div className="n3-progress-dots">
            {questions.map((_, i) => (
              <span key={i} className={`n3-dot ${i < qIndex ? "n3-dot--done" : i === qIndex ? "n3-dot--active" : ""}`} />
            ))}
          </div>
          <span className="n3-topbar-xp">⭐ {totalXP} XP</span>
        </div>

        {/* Timer ring */}
        <div className="n3-timer-wrap">
          <svg className="n3-timer-ring" viewBox="0 0 80 80">
            <circle cx="40" cy="40" r="34" fill="none" stroke="#e8eaed" strokeWidth="6" />
            <circle
              cx="40" cy="40" r="34"
              fill="none"
              stroke={timerColor}
              strokeWidth="6"
              strokeLinecap="round"
              strokeDasharray={`${2 * Math.PI * 34}`}
              strokeDashoffset={`${2 * Math.PI * 34 * (1 - timerPct / 100)}`}
              transform="rotate(-90 40 40)"
              style={{ transition: "stroke-dashoffset 0.95s linear, stroke 0.3s" }}
            />
          </svg>
          <span className="n3-timer-num" style={{ color: timerColor }}>{timeLeft}</span>
        </div>

        {/* Question */}
        <div className="n3-question-card">
          <div className="n3-q-meta">
            <span className="n3-q-subject">{question?.subject}</span>
            <span className="n3-q-num">{qIndex + 1} / {questions.length}</span>
          </div>
          <p className="n3-question-text">{question?.prompt}</p>

          {/* Answer slots */}
          <div className="n3-slots">
            {[0, 1, 2].map(i => (
              <div key={i} className={`n3-slot ${found[i] ? "n3-slot--filled" : ""}`}>
                {found[i] ? (
                  <><span className="n3-slot-check">✓</span><span className="n3-slot-word">{found[i]}</span></>
                ) : (
                  <span className="n3-slot-empty">{i + 1}</span>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Flash word popup */}
        {flashWord && (
          <div className="n3-flash">✓ {flashWord}</div>
        )}

        {/* Voice section */}
        <div className="n3-voice-section">
          {voiceSupported ? (
            <div className={`n3-mic-card ${listening ? "n3-mic--active" : voiceEnabled ? "n3-mic--waiting" : "n3-mic--off"}`}>
              <div className="n3-mic-left">
                <div className="n3-mic-icon">
                  {listening ? "🎙️" : voiceEnabled ? "🎙️" : "🔇"}
                  {listening && <span className="n3-mic-pulse" />}
                </div>
                <div className="n3-mic-info">
                  <span className="n3-mic-status">
                    {listening ? "Listening…" : voiceEnabled ? "Mic ready" : "Mic off"}
                  </span>
                  {listening && transcript
                    ? <span className="n3-mic-transcript">"{transcript}"</span>
                    : !voiceEnabled
                    ? <span className="n3-mic-transcript">Tap to enable voice</span>
                    : <span className="n3-mic-transcript">Say your answers out loud</span>
                  }
                </div>
              </div>
              <button
                className={`n3-mic-toggle ${voiceEnabled ? "n3-mic-toggle--on" : "n3-mic-toggle--off"}`}
                onClick={toggleVoice}
                type="button"
              >
                {voiceEnabled ? "Turn Off" : "Turn On"}
              </button>
            </div>
          ) : (
            <div className="n3-mic-card n3-mic--off">
              <div className="n3-mic-icon">🔇</div>
              <div className="n3-mic-info">
                <span className="n3-mic-status">Voice not supported</span>
                <span className="n3-mic-transcript">Use Chrome or Edge for voice input</span>
              </div>
            </div>
          )}

          {voiceError && <p className="n3-voice-error">{voiceError}</p>}

          {/* Text input — always available */}
          <form onSubmit={handleTypedSubmit} className="n3-type-form">
            <input
              ref={inputRef}
              className="n3-type-input"
              value={typedInput}
              onChange={e => setTypedInput(e.target.value)}
              placeholder="Type an answer and press Enter…"
            />
            <button type="submit" className="n3-type-btn" disabled={!typedInput.trim()}>→</button>
          </form>
        </div>

      </div>
    </div>
  );
}