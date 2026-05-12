// src/pages/BlitzJoin.jsx
// Student-facing join page + live quiz experience for BlitzHost sessions
import React, { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { getDatabase, ref, onValue, off, update, get } from "firebase/database";
import { getFirestore, doc, getDoc } from "firebase/firestore";
import { Clock, CheckCircle, XCircle, Trophy, Zap, Users, Megaphone } from "lucide-react";
import "./BlitzJoin.css";

export default function BlitzJoin() {
  const { code: urlCode } = useParams();
  const navigate           = useNavigate();
  const { currentUser }    = useAuth();
  const db                 = getDatabase();

  // ── Join flow state ────────────────────────────────────────────────────────
  const [phase,     setPhase]     = useState("entry");  // entry | waiting | quiz | result
  const [roomCode,  setRoomCode]  = useState(urlCode || "");
  const [nickname,  setNickname]  = useState("");
  const [joinError, setJoinError] = useState("");
  const [joining,   setJoining]   = useState(false);

  // ── Session state ──────────────────────────────────────────────────────────
  const [session,      setSession]      = useState(null);
  const [currentQIdx,  setCurrentQIdx]  = useState(0);
  const [timeLeft,     setTimeLeft]     = useState(30);
  const [selected,     setSelected]     = useState(null);  // index of chosen option
  const [answered,     setAnswered]     = useState(false);
  const [showExplain,  setShowExplain]  = useState(false);
  const [announcement, setAnnouncement] = useState("");
  const [myScore,      setMyScore]      = useState(0);
  const [myRank,       setMyRank]       = useState(null);
  const [answers,      setAnswers]      = useState([]);    // per-question answer log
  const [times,        setTimes]        = useState([]);    // per-question time taken
  const [qStartTime,   setQStartTime]   = useState(Date.now());

  const sessionRef    = useRef(null);
  const participantId = useRef(currentUser?.uid || `guest_${Date.now()}`);

  // ── Resolve nickname from profile ─────────────────────────────────────────
  useEffect(() => {
    if (!currentUser) return;
    const resolve = async () => {
      try {
        const snap = await getDoc(doc(getFirestore(), "users", currentUser.uid));
        const name = snap.exists() ? snap.data()?.profile?.name : null;
        setNickname(name || currentUser.displayName || currentUser.email?.split("@")[0] || "");
      } catch { /* ignore */ }
    };
    resolve();
  }, [currentUser]);

  // ── Auto-join if URL has code ──────────────────────────────────────────────
  useEffect(() => {
    if (urlCode && nickname) joinSession();
  }, [urlCode, nickname]); // eslint-disable-line

  // ── Join session ──────────────────────────────────────────────────────────
  const joinSession = async () => {
    const code = roomCode.trim().toUpperCase();
    if (!code) { setJoinError("Please enter a room code."); return; }
    if (!nickname.trim()) { setJoinError("Please enter your name."); return; }
    setJoining(true);
    setJoinError("");

    try {
      const sRef  = ref(db, `blitzhost/${code}`);
      const snap  = await get(sRef);

      if (!snap.exists()) {
        setJoinError("Room not found. Check the code and try again.");
        setJoining(false);
        return;
      }

      const data = snap.val();
      if (data.status === "ended") {
        setJoinError("This session has already ended.");
        setJoining(false);
        return;
      }

      // Register participant
      const partRef = ref(db, `blitzhost/${code}/participants/${participantId.current}`);
      await update(partRef, {
        name:      nickname.trim(),
        uid:       participantId.current,
        score:     0,
        answers:   {},
        times:     {},
        joined:    Date.now(),
        completed: false,
      });

      sessionRef.current = sRef;
      setSession(data);
      setCurrentQIdx(data.currentQIdx || 0);
      setTimeLeft(data.timeLeft || data.config?.timePerQ || 30);
      setPhase("waiting");

      // Subscribe to session changes
      onValue(sRef, (s) => {
        const d = s.val();
        if (!d) return;
        setSession(d);

        if (d.status === "ended") {
          finishSession(d);
          return;
        }

        // Question advanced by host
        if (d.currentQIdx !== undefined) {
          setCurrentQIdx(prev => {
            if (d.currentQIdx !== prev) {
              setAnswered(false);
              setSelected(null);
              setShowExplain(false);
              setQStartTime(Date.now());
            }
            return d.currentQIdx;
          });
        }

        if (d.timeLeft !== undefined) setTimeLeft(d.timeLeft);
        if (d.showExplain !== undefined) setShowExplain(d.showExplain);
        if (d.announcement) setAnnouncement(d.announcement);
        if (d.status === "running" && phase === "waiting") setPhase("quiz");
        if (d.status === "running") setPhase("quiz");
      });

    } catch (e) {
      console.error("Join error", e);
      setJoinError("Something went wrong. Please try again.");
    }
    setJoining(false);
  };

  // ── Answer a question ──────────────────────────────────────────────────────
  const submitAnswer = async (optionIdx) => {
    if (answered || !session) return;
    setSelected(optionIdx);
    setAnswered(true);

    const code      = roomCode.trim().toUpperCase() || urlCode;
    const timeTaken = Math.round((Date.now() - qStartTime) / 1000);
    const correct   = session.answers?.[currentQIdx]?.correctAnswer;
    const isCorrect = optionIdx === correct;

    // Score: faster = more points (max 100, min 20)
    const timeBonus = Math.max(0, session.config?.timePerQ - timeTaken);
    const pts       = isCorrect ? Math.round(20 + (timeBonus / (session.config?.timePerQ || 30)) * 80) : 0;

    const newScore = myScore + pts;
    setMyScore(newScore);

    const newAnswers = [...answers, optionIdx];
    const newTimes   = [...times, timeTaken];
    setAnswers(newAnswers);
    setTimes(newTimes);

    // Update participant record in RTDB
    const partRef = ref(db, `blitzhost/${code}/participants/${participantId.current}`);
    await update(partRef, {
      score:                   newScore,
      [`answers/${currentQIdx}`]: optionIdx,
      [`times/${currentQIdx}`]:   timeTaken,
    });

    // Auto-show explanation if configured
    if (session.config?.explainWhen === "After each question") {
      setShowExplain(true);
    }
  };

  // ── Finish session ─────────────────────────────────────────────────────────
  const finishSession = async (d = session) => {
    clearInterval(timerRef.current);
    const code  = roomCode.trim().toUpperCase() || urlCode;
    const parts = Object.values(d?.participants || {});
    const sorted = [...parts].sort((a, b) => (b.score || 0) - (a.score || 0));
    const rank   = sorted.findIndex(p => p.uid === participantId.current) + 1;
    setMyRank(rank);

    // Mark completed
    const partRef = ref(db, `blitzhost/${code}/participants/${participantId.current}`);
    await update(partRef, { completed: true });

    setPhase("result");
  };

  // ── Timer countdown (driven by RTDB timeLeft, local interpolation) ─────────
  const timerRef = useRef(null);
  useEffect(() => {
    if (phase !== "quiz" || session?.status === "paused") {
      clearInterval(timerRef.current);
      return;
    }
    timerRef.current = setInterval(() => {
      setTimeLeft(prev => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(timerRef.current);
  }, [phase, session?.status, currentQIdx]);

  // ── Cleanup ────────────────────────────────────────────────────────────────
  useEffect(() => {
    return () => {
      clearInterval(timerRef.current);
      if (sessionRef.current) off(sessionRef.current);
    };
  }, []);

  const currentQ     = session?.questions?.[currentQIdx];
  const correctIdx   = session?.answers?.[currentQIdx]?.correctAnswer;
  const explanation  = session?.answers?.[currentQIdx]?.explanation;
  const totalQs      = session ? Math.min(session.questions?.length || 0, session.config?.totalQuestions || 20) : 0;
  const pct          = totalQs ? Math.round((currentQIdx / totalQs) * 100) : 0;

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div className="bj-page">

      {/* ── ENTRY PHASE ──────────────────────────────────────────────── */}
      {phase === "entry" && (
        <div className="bj-entry">
          <div className="bj-entry-logo">
            <span>⚡</span>
          </div>
          <h1 className="bj-entry-title">Join BlitzHost</h1>
          <p className="bj-entry-sub">Enter the room code your host shared with you</p>

          <div className="bj-entry-form">
            <input
              className="bj-input bj-input--code"
              value={roomCode}
              onChange={e => setRoomCode(e.target.value.toUpperCase())}
              placeholder="ROOM CODE"
              maxLength={6}
            />
            <input
              className="bj-input"
              value={nickname}
              onChange={e => setNickname(e.target.value)}
              placeholder="Your name"
              maxLength={30}
            />
            {joinError && (
              <div className="bj-error"><XCircle size={14} />{joinError}</div>
            )}
            <button className="bj-btn-primary" onClick={joinSession} disabled={joining}>
              {joining ? "Joining…" : "Join Session ⚡"}
            </button>
          </div>
        </div>
      )}

      {/* ── WAITING PHASE ────────────────────────────────────────────── */}
      {phase === "waiting" && (
        <div className="bj-waiting">
          <div className="bj-waiting-pulse">⏳</div>
          <h2>You're in!</h2>
          <p className="bj-waiting-name">{nickname}</p>
          <p className="bj-waiting-sub">Waiting for the host to start the quiz…</p>
          <div className="bj-session-info">
            <span>📚 {session?.title}</span>
            <span><Users size={13} /> {Object.keys(session?.participants || {}).length} joined</span>
            <span>❓ {Math.min(session?.questions?.length || 0, session?.config?.totalQuestions || 0)} questions</span>
          </div>
        </div>
      )}

      {/* ── QUIZ PHASE ───────────────────────────────────────────────── */}
      {phase === "quiz" && currentQ && (
        <div className="bj-quiz">

          {/* Announcement banner */}
          {announcement && (
            <div className="bj-announce-banner">
              <Megaphone size={14} /> {announcement}
            </div>
          )}

          {/* Paused banner */}
          {session?.status === "paused" && (
            <div className="bj-paused-banner">⏸ Host paused the session</div>
          )}

          {/* Header */}
          <div className="bj-quiz-header">
            <span className="bj-q-label">Q {currentQIdx + 1} / {totalQs}</span>
            <div className={`bj-timer ${timeLeft <= 5 ? "bj-timer--urgent" : ""}`}>
              <Clock size={13} />
              <span>{timeLeft}s</span>
            </div>
            <span className="bj-score"><Zap size={13} />{myScore} pts</span>
          </div>

          {/* Progress bar */}
          <div className="bj-progress-track">
            <div className="bj-progress-fill" style={{ width: `${pct}%` }} />
          </div>

          {/* Timer bar */}
          <div className="bj-timer-track">
            <div className={`bj-timer-fill ${timeLeft <= 5 ? "bj-timer-fill--urgent" : ""}`}
              style={{ width: `${(timeLeft / (session?.config?.timePerQ || 30)) * 100}%` }} />
          </div>

          {/* Question */}
          <div className="bj-question-card">
            <p className="bj-q-text">{currentQ.question}</p>
          </div>

          {/* Options */}
          {currentQ.type !== "saq" && currentQ.options?.map((opt, oi) => {
            let cls = "bj-option";
            if (answered) {
              if (oi === correctIdx)     cls += " bj-option--correct";
              else if (oi === selected)  cls += " bj-option--wrong";
              else                       cls += " bj-option--dim";
            } else if (selected === oi) {
              cls += " bj-option--selected";
            }
            return (
              <button key={oi} className={cls}
                onClick={() => submitAnswer(oi)}
                disabled={answered || session?.status === "paused"}>
                <span className="bj-opt-letter">{String.fromCharCode(65 + oi)}</span>
                <span className="bj-opt-text">{opt}</span>
                {answered && oi === correctIdx && <CheckCircle size={16} className="bj-correct-icon" />}
                {answered && oi === selected && oi !== correctIdx && <XCircle size={16} className="bj-wrong-icon" />}
              </button>
            );
          })}

          {/* SAQ input */}
          {currentQ.type === "saq" && (
            <div className="bj-saq">
              <textarea className="bj-input bj-textarea" rows={4}
                placeholder="Type your answer here…"
                disabled={answered} />
              {!answered && (
                <button className="bj-btn-primary" onClick={() => { setAnswered(true); setShowExplain(true); }}>
                  Submit Answer
                </button>
              )}
            </div>
          )}

          {/* Explanation */}
          {showExplain && explanation && (
            <div className={`bj-explanation ${answered && selected === correctIdx ? "bj-explanation--correct" : "bj-explanation--wrong"}`}>
              <p className="bj-expl-title">
                {answered && selected === correctIdx ? "✅ Correct!" : "❌ Not quite"}
              </p>
              <p className="bj-expl-text">{explanation}</p>
            </div>
          )}

          {/* Waiting for next */}
          {answered && !showExplain && (
            <div className="bj-answered-note">
              {selected === correctIdx
                ? <><CheckCircle size={16} color="#0D7B65" /> Correct! +{myScore > 0 ? "" : "0"} pts — waiting for next question</>
                : <><XCircle size={16} color="#dc2626" /> Moving on… waiting for next question</>}
            </div>
          )}
        </div>
      )}

      {/* ── RESULT PHASE ─────────────────────────────────────────────── */}
      {phase === "result" && (
        <div className="bj-result">
          <div className="bj-result-trophy">
            {myRank === 1 ? "🏆" : myRank === 2 ? "🥈" : myRank === 3 ? "🥉" : "🎓"}
          </div>

          <h2 className="bj-result-title">Session Complete!</h2>
          <p className="bj-result-name">{nickname}</p>

          <div className="bj-result-stats">
            <div className="bj-result-stat">
              <span className="bj-result-val">{myScore}</span>
              <span className="bj-result-label">Points</span>
            </div>
            <div className="bj-result-stat">
              <span className="bj-result-val">#{myRank || "—"}</span>
              <span className="bj-result-label">Rank</span>
            </div>
            <div className="bj-result-stat">
              <span className="bj-result-val">
                {answers.filter((a, i) => a === session?.answers?.[i]?.correctAnswer).length}/{totalQs}
              </span>
              <span className="bj-result-label">Correct</span>
            </div>
          </div>

          <p className="bj-result-msg">
            {myRank === 1 ? "🎉 You topped the leaderboard!" :
             myRank <= 3  ? "Great performance — top 3! 🔥" :
             myScore > 50 ? "Good effort! Keep studying 💪" :
             "Keep practising — you've got this! 📚"}
          </p>

          <button className="bj-btn-primary" onClick={() => navigate("/home")}>
            Back to MedBlitz
          </button>
        </div>
      )}

    </div>
  );
}