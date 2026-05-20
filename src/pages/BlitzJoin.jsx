// src/pages/BlitzJoin.jsx
// Student-facing join page + live quiz experience for BlitzHost sessions
import React, { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getDatabase, ref, onValue, off, update, get } from "firebase/database";
import {
  getFirestore, doc, setDoc, serverTimestamp,
} from "firebase/firestore";
import { useAuth } from "../context/AuthContext";
import { Clock, CheckCircle, XCircle, Trophy, Zap, Users, Megaphone, AlignLeft } from "lucide-react";
import "./BlitzJoin.css";

// ── Key points scoring (mirrors BlitzHost logic) ───────────────────────────
function scoreKeyPoints(studentAnswer, keyPoints = []) {
  if (!keyPoints || keyPoints.length === 0) {
    // No key points — fall back to loose string match against correctAnswer
    return { matched: 0, total: 0, score: 0, matchedPoints: [] };
  }
  const normalise = (s) =>
    (s || "").toLowerCase().replace(/[^a-z0-9\s]/g, "").trim();
  const normAnswer   = normalise(studentAnswer);
  const matchedPoints = [];

  keyPoints.forEach(kp => {
    if (!kp || !kp.trim()) return;
    const normKp = normalise(kp);
    // All meaningful words of the key point must appear in the student answer
    const words = normKp.split(/\s+/).filter(w => w.length > 2);
    const allPresent = words.length > 0
      ? words.every(w => normAnswer.includes(w))
      : normAnswer.includes(normKp);
    if (allPresent || normAnswer.includes(normKp)) {
      matchedPoints.push(kp);
    }
  });

  const matched = matchedPoints.length;
  const total   = keyPoints.filter(k => k && k.trim()).length;
  const score   = total > 0 ? Math.round((matched / total) * 100) : 0;
  return { matched, total, score, matchedPoints };
}

export default function BlitzJoin() {
  const { code: urlCode } = useParams();
  const navigate           = useNavigate();
  const db                 = getDatabase();
  const fsDb               = getFirestore();
  const { currentUser }    = useAuth();

  // ── Join flow ──────────────────────────────────────────────────────────────
  const [phase,     setPhase]     = useState("entry");
  const [roomCode,  setRoomCode]  = useState(urlCode || "");
  const [nickname,  setNickname]  = useState("");
  const [joinError, setJoinError] = useState("");
  const [joining,   setJoining]   = useState(false);

  // ── Session ────────────────────────────────────────────────────────────────
  const [session,      setSession]      = useState(null);
  const [currentQIdx,  setCurrentQIdx]  = useState(0);
  const [timeLeft,     setTimeLeft]     = useState(30);
  const [selected,     setSelected]     = useState(null);   // MCQ: option index
  const [saqText,      setSaqText]      = useState("");     // SAQ: typed answer
  const [answered,     setAnswered]     = useState(false);
  const [saqResult,    setSaqResult]    = useState(null);   // { matched, total, score, matchedPoints }
  const [showExplain,  setShowExplain]  = useState(false);
  const [announcement, setAnnouncement] = useState("");
  const [myScore,      setMyScore]      = useState(0);
  const [myRank,       setMyRank]       = useState(null);
  const [answers,      setAnswers]      = useState([]);
  const [times,        setTimes]        = useState([]);
  const [qStartTime,   setQStartTime]   = useState(Date.now());

  const sessionRef = useRef(null);
  const timerRef   = useRef(null);

  const participantId = useRef(
    sessionStorage.getItem("blitz_guest_id") || (() => {
      const id = `guest_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      sessionStorage.setItem("blitz_guest_id", id);
      return id;
    })()
  );

  useEffect(() => {
    if (urlCode) setRoomCode(urlCode.toUpperCase());
  }, [urlCode]);

  // ── Join ───────────────────────────────────────────────────────────────────
  const joinSession = async () => {
    const code = roomCode.trim().toUpperCase();
    if (!code)          { setJoinError("Please enter a room code."); return; }
    if (!nickname.trim()){ setJoinError("Please enter your name."); return; }
    setJoining(true); setJoinError("");

    try {
      const sRef = ref(db, `blitzhost/${code}`);
      const snap = await get(sRef);

      if (!snap.exists()) {
        setJoinError("Room not found. Check the code and try again.");
        setJoining(false); return;
      }
      const data = snap.val();
      if (data.status === "ended") {
        setJoinError("This session has already ended.");
        setJoining(false); return;
      }

      const partRef = ref(db, `blitzhost/${code}/participants/${participantId.current}`);
      await update(partRef, {
        name: nickname.trim(), uid: participantId.current,
        score: 0, answers: {}, times: {}, joined: Date.now(), completed: false,
      });

      sessionRef.current = sRef;
      setSession(data);
      setCurrentQIdx(data.currentQIdx || 0);
      setTimeLeft(data.timeLeft || data.config?.timePerQ || 30);
      setPhase("waiting");

      onValue(sRef, (s) => {
        const d = s.val();
        if (!d) return;
        setSession(d);

        if (d.status === "ended") { finishSession(d); return; }

        if (d.currentQIdx !== undefined) {
          setCurrentQIdx(prev => {
            if (d.currentQIdx !== prev) {
              setAnswered(false);
              setSelected(null);
              setSaqText("");
              setSaqResult(null);
              setShowExplain(false);
              setQStartTime(Date.now());
            }
            return d.currentQIdx;
          });
        }

        if (d.timeLeft    !== undefined) setTimeLeft(d.timeLeft);
        if (d.showExplain !== undefined) setShowExplain(d.showExplain);
        if (d.announcement)              setAnnouncement(d.announcement);
        if (d.status === "running")      setPhase("quiz");
      });

    } catch (e) {
      console.error("Join error", e);
      setJoinError("Something went wrong. Please try again.");
    }
    setJoining(false);
  };

  // ── Submit MCQ answer ──────────────────────────────────────────────────────
  const submitMCQ = async (optionIdx) => {
    if (answered || !session) return;
    setSelected(optionIdx);
    setAnswered(true);

    const code      = roomCode.trim().toUpperCase() || urlCode;
    const timeTaken = Math.round((Date.now() - qStartTime) / 1000);
    const correct   = session.answers?.[currentQIdx]?.correctAnswer;
    const isCorrect = optionIdx === correct;
    const timeBonus = Math.max(0, (session.config?.timePerQ || 30) - timeTaken);
    const pts       = isCorrect ? Math.round(20 + (timeBonus / (session.config?.timePerQ || 30)) * 80) : 0;

    const newScore   = myScore + pts;
    const newAnswers = [...answers, optionIdx];
    const newTimes   = [...times, timeTaken];
    setMyScore(newScore);
    setAnswers(newAnswers);
    setTimes(newTimes);

    const partRef = ref(db, `blitzhost/${code}/participants/${participantId.current}`);
    await update(partRef, {
      score:                      newScore,
      [`answers/${currentQIdx}`]: optionIdx,
      [`times/${currentQIdx}`]:   timeTaken,
    });

    if (session.config?.explainWhen === "After each question") setShowExplain(true);
  };

  // ── Submit SAQ answer ──────────────────────────────────────────────────────
  const submitSAQ = async () => {
    if (answered || !session || !saqText.trim()) return;
    setAnswered(true);

    const code      = roomCode.trim().toUpperCase() || urlCode;
    const timeTaken = Math.round((Date.now() - qStartTime) / 1000);

    // ── Key points scoring ──
    const q         = session.questions?.[currentQIdx];
    const keyPoints = session.answers?.[currentQIdx]?.keyPoints
                   || q?.keyPoints
                   || [];
    const modelAnswer = session.answers?.[currentQIdx]?.correctAnswer || q?.correctAnswer || "";

    let result;
    if (keyPoints && keyPoints.filter(k => k && k.trim()).length > 0) {
      // Score against key points array
      result = scoreKeyPoints(saqText, keyPoints);
    } else {
      // No key points — do a loose match against the model answer
      const normalise = s => (s || "").toLowerCase().replace(/[^a-z0-9\s]/g, "").trim();
      const normStudent = normalise(saqText);
      const normModel   = normalise(modelAnswer);
      const words       = normModel.split(/\s+/).filter(w => w.length > 2);
      const matched     = words.filter(w => normStudent.includes(w)).length;
      const score       = words.length > 0 ? Math.round((matched / words.length) * 100) : 0;
      result = { matched, total: words.length, score, matchedPoints: [] };
    }

    setSaqResult(result);

    // Award points based on score percentage
    const timePenalty = Math.max(0, (session.config?.timePerQ || 30) - timeTaken);
    const basePoints  = Math.round((result.score / 100) * 100); // up to 100 pts
    const timeBonus   = Math.round((timePenalty / (session.config?.timePerQ || 30)) * 20);
    const pts         = result.score >= 60 ? basePoints + timeBonus : Math.round(basePoints * 0.5);

    const newScore   = myScore + pts;
    const newAnswers = [...answers, saqText];
    const newTimes   = [...times, timeTaken];
    setMyScore(newScore);
    setAnswers(newAnswers);
    setTimes(newTimes);

    const partRef = ref(db, `blitzhost/${code}/participants/${participantId.current}`);
    await update(partRef, {
      score:                      newScore,
      [`answers/${currentQIdx}`]: saqText,
      [`times/${currentQIdx}`]:   timeTaken,
    });

    if (session.config?.explainWhen === "After each question") setShowExplain(true);
  };

  // ── Finish ─────────────────────────────────────────────────────────────────
  const finishSession = async (d = session) => {
    clearInterval(timerRef.current);
    const code   = roomCode.trim().toUpperCase() || urlCode;
    const parts  = Object.values(d?.participants || {});
    const sorted = [...parts].sort((a, b) => (b.score || 0) - (a.score || 0));
    const rank   = sorted.findIndex(p => p.uid === participantId.current) + 1;
    setMyRank(rank);

    // Mark completed in RTDB
    const partRef = ref(db, `blitzhost/${code}/participants/${participantId.current}`);
    await update(partRef, { completed: true });

    // ── Save exam history to Firestore (for signed-in students) ──────────
    if (currentUser) {
      try {
        const histDoc = doc(fsDb, "users", currentUser.uid, "examHistory", code);
        await setDoc(histDoc, {
          sessionCode:  code,
          title:        d?.title || "BlitzHost Session",
          date:         serverTimestamp(),
          role:         "student",
          score:        myScore,
          rank:         rank,
          totalStudents: parts.length,
          totalQs:      totalQs,
          questions:    (d?.questions || []).map((q, qi) => ({
            question:      q.question,
            type:          q.type,
            options:       q.options   ?? null,
            correctAnswer: d?.answers?.[qi]?.correctAnswer ?? null,
            keyPoints:     d?.answers?.[qi]?.keyPoints     ?? null,
            explanation:   d?.answers?.[qi]?.explanation   ?? "",
            studentAnswer: answers[qi] ?? null,
            correct:       q.type === "mcq"
              ? answers[qi] === d?.answers?.[qi]?.correctAnswer
              : null, // SAQ correctness shown via key points
          })),
        });
      } catch (e) {
        console.warn("Could not save exam history:", e);
      }
    }

    setPhase("result");
  };

  // ── Timer ──────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (phase !== "quiz" || session?.status === "paused") {
      clearInterval(timerRef.current); return;
    }
    timerRef.current = setInterval(() => {
      setTimeLeft(prev => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(timerRef.current);
  }, [phase, session?.status, currentQIdx]);

  useEffect(() => {
    return () => { clearInterval(timerRef.current); if (sessionRef.current) off(sessionRef.current); };
  }, []);

  const currentQ    = session?.questions?.[currentQIdx];
  const correctIdx  = session?.answers?.[currentQIdx]?.correctAnswer;
  const explanation = session?.answers?.[currentQIdx]?.explanation;
  const modelAnswer = session?.answers?.[currentQIdx]?.correctAnswer;
  const keyPoints   = session?.answers?.[currentQIdx]?.keyPoints || currentQ?.keyPoints || [];
  const totalQs     = session ? Math.min(session.questions?.length || 0, session.config?.totalQuestions || 20) : 0;
  const pct         = totalQs ? Math.round((currentQIdx / totalQs) * 100) : 0;
  const timePerQ    = session?.config?.timePerQ || 30;

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div className="bj-page">

      {/* ── ENTRY ── */}
      {phase === "entry" && (
        <div className="bj-entry">
          <div className="bj-entry-logo">⚡</div>
          <h1 className="bj-entry-title">Join BlitzHost</h1>
          <p className="bj-entry-sub">Enter the room code your host shared with you</p>
          <div className="bj-entry-form">
            <input className="bj-input bj-input--code"
              value={roomCode}
              onChange={e => setRoomCode(e.target.value.toUpperCase())}
              placeholder="ROOM CODE" maxLength={6} />
            <input className="bj-input"
              value={nickname}
              onChange={e => setNickname(e.target.value)}
              placeholder="Your name" maxLength={30} />
            {joinError && <div className="bj-error"><XCircle size={14} />{joinError}</div>}
            <button className="bj-btn-primary" onClick={joinSession} disabled={joining}>
              {joining ? "Joining…" : "Join Session ⚡"}
            </button>
          </div>
        </div>
      )}

      {/* ── WAITING ── */}
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

      {/* ── QUIZ ── */}
      {phase === "quiz" && currentQ && (
        <div className="bj-quiz">

          {announcement && (
            <div className="bj-announce-banner"><Megaphone size={14} /> {announcement}</div>
          )}
          {session?.status === "paused" && (
            <div className="bj-paused-banner">⏸ Host paused the session</div>
          )}

          {/* Header */}
          <div className="bj-quiz-header">
            <span className="bj-q-label">Q {currentQIdx + 1} / {totalQs}</span>
            <div className={`bj-timer ${timeLeft <= 5 ? "bj-timer--urgent" : ""}`}>
              <Clock size={13} /><span>{timeLeft}s</span>
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
              style={{ width: `${(timeLeft / timePerQ) * 100}%` }} />
          </div>

          {/* Question type badge */}
          {currentQ.type === "saq" && (
            <div className="bj-q-type-badge">
              <AlignLeft size={11} /> Short Answer Question
            </div>
          )}

          {/* Question */}
          <div className="bj-question-card">
            <p className="bj-q-text">{currentQ.question}</p>
          </div>

          {/* ── MCQ options ── */}
          {currentQ.type !== "saq" && currentQ.options?.map((opt, oi) => {
            let cls = "bj-option";
            if (answered) {
              if (oi === correctIdx)    cls += " bj-option--correct";
              else if (oi === selected) cls += " bj-option--wrong";
              else                      cls += " bj-option--dim";
            } else if (selected === oi) {
              cls += " bj-option--selected";
            }
            return (
              <button key={oi} className={cls}
                onClick={() => submitMCQ(oi)}
                disabled={answered || session?.status === "paused"}>
                <span className="bj-opt-letter">{String.fromCharCode(65 + oi)}</span>
                <span className="bj-opt-text">{opt}</span>
                {answered && oi === correctIdx && <CheckCircle size={16} className="bj-correct-icon" />}
                {answered && oi === selected && oi !== correctIdx && <XCircle size={16} className="bj-wrong-icon" />}
              </button>
            );
          })}

          {/* ── SAQ input + result ── */}
          {currentQ.type === "saq" && (
            <div className="bj-saq">
              <textarea
                className="bj-input bj-textarea"
                rows={4}
                placeholder="Type your answer here…"
                value={saqText}
                onChange={e => setSaqText(e.target.value)}
                disabled={answered}
              />

              {!answered && (
                <button
                  className="bj-btn-primary"
                  onClick={submitSAQ}
                  disabled={!saqText.trim()}
                >
                  Submit Answer
                </button>
              )}

              {/* SAQ result panel */}
              {answered && saqResult && (
                <div className={`bj-saq-result ${saqResult.score >= 60 ? "bj-saq-result--pass" : "bj-saq-result--fail"}`}>
                  {/* Score ring */}
                  <div className="bj-saq-score-row">
                    <div className="bj-saq-score-ring" style={{
                      background: `conic-gradient(${saqResult.score >= 60 ? "#0d7c6e" : "#dc2626"} ${saqResult.score * 3.6}deg, #e4eae8 0deg)`,
                    }}>
                      <div className="bj-saq-score-inner">
                        <span style={{ fontSize: 18, fontWeight: 800, color: saqResult.score >= 60 ? "#0d7c6e" : "#dc2626" }}>
                          {saqResult.score}%
                        </span>
                      </div>
                    </div>
                    <div className="bj-saq-score-info">
                      <p style={{ fontWeight: 700, fontSize: 15, color: "#1a1f1e" }}>
                        {saqResult.score >= 80 ? "Excellent!" : saqResult.score >= 60 ? "Good answer" : saqResult.score >= 30 ? "Partial credit" : "Needs improvement"}
                      </p>
                      {saqResult.total > 0 && (
                        <p style={{ fontSize: 13, color: "#6b7e79" }}>
                          {saqResult.matched} of {saqResult.total} key point{saqResult.total !== 1 ? "s" : ""} matched
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Matched key points */}
                  {saqResult.total > 0 && (
                    <div className="bj-saq-keypoints">
                      {keyPoints.filter(k => k && k.trim()).map((kp, ki) => {
                        const matched = saqResult.matchedPoints.includes(kp);
                        return (
                          <div key={ki} className={`bj-saq-kp ${matched ? "bj-saq-kp--matched" : "bj-saq-kp--missed"}`}>
                            {matched ? <CheckCircle size={12} /> : <XCircle size={12} />}
                            <span>{kp}</span>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Model answer */}
                  {modelAnswer && (
                    <div className="bj-saq-model">
                      <p className="bj-saq-model-label">Model Answer</p>
                      <p className="bj-saq-model-text">{modelAnswer}</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Explanation */}
          {showExplain && explanation && (
            <div className={`bj-explanation ${
              currentQ.type === "saq"
                ? saqResult?.score >= 60 ? "bj-explanation--correct" : "bj-explanation--wrong"
                : answered && selected === correctIdx ? "bj-explanation--correct" : "bj-explanation--wrong"
            }`}>
              <p className="bj-expl-title">💡 Explanation</p>
              <p className="bj-expl-text">{explanation}</p>
            </div>
          )}

          {/* Waiting for next (MCQ only) */}
          {answered && !showExplain && currentQ.type !== "saq" && (
            <div className="bj-answered-note">
              {selected === correctIdx
                ? <><CheckCircle size={16} color="#0d7c6e" /> Correct! Waiting for next question</>
                : <><XCircle size={16} color="#dc2626" /> Waiting for next question…</>}
            </div>
          )}
        </div>
      )}

      {/* ── RESULT ── */}
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
                {answers.filter((a, i) => {
                  const q = session?.questions?.[i];
                  if (q?.type === "saq") return false; // SAQ scored separately
                  return a === session?.answers?.[i]?.correctAnswer;
                }).length}/{totalQs}
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
          <button className="bj-btn-primary" onClick={() => navigate("/")}>
            Back to MedBlitz
          </button>
          {currentUser && (
            <button
              className="bj-btn-primary"
              style={{ background: "#fff", color: "#0d7c6e", border: "1.5px solid #0d7c6e", marginTop: 0 }}
              onClick={() => navigate("/my-exams")}
            >
              📋 Review My Answers
            </button>
          )}
        </div>
      )}

    </div>
  );
}