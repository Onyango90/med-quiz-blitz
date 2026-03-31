// src/game/Quiz.jsx — redesigned
import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useStats } from "../hooks/useStats";
import { auth } from "../firebase";
import { getFirestore, doc, updateDoc, increment, setDoc } from "firebase/firestore";
import "./Quiz.css";

import correctSoundFile from "../sound/correct.wav";
import wrongSoundFile from "../sound/wrong.wav";

const OPTION_LABELS = ["A", "B", "C", "D"];

export default function Quiz({ questions, onFinish, mode = "classic" }) {
  const navigate = useNavigate();
  const location = useLocation();

  const [currentIndex, setCurrentIndex]       = useState(0);
  const [userAnswer, setUserAnswer]           = useState("");
  const [timeLeft, setTimeLeft]               = useState(0);
  const [score, setScore]                     = useState(0);
  const [feedback, setFeedback]               = useState("");
  const [clickedOption, setClickedOption]     = useState(null);
  const [answersList, setAnswersList]         = useState([]);
  const [xpPopups, setXpPopups]               = useState([]);
  const [sessionStartTime]                    = useState(Date.now());
  const [isAnimatingOut, setIsAnimatingOut]   = useState(false);
  const [cardKey, setCardKey]                 = useState(0);
  const inputRef = useRef(null);

  const isDailyChallenge = location.state?.isDailyChallenge || false;
  const dailyBonusXP     = location.state?.xpBonus || 50;
  const dailyStreak      = location.state?.streak || 0;
  const userYear         = location.state?.userYear || "";
  const topic            = location.state?.topic || "";

  const { startSession, processAnswer, endSession } = useStats();
  const correctSound = useRef(new Audio(correctSoundFile));
  const wrongSound   = useRef(new Audio(wrongSoundFile));

  const currentQuestion = questions[currentIndex];
  const progress = (currentIndex / questions.length) * 100;

  useEffect(() => { if (questions.length > 0) startSession(mode); }, []);

  useEffect(() => {
    if (currentQuestion?.type === "short" && inputRef.current) inputRef.current.focus();
  }, [currentIndex, currentQuestion?.type]);

  useEffect(() => {
    if (!currentQuestion || currentQuestion.type !== "LIST") return;
    setTimeLeft(currentQuestion.timeLimit || 10);
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) { clearInterval(timer); handleSubmit(); return 0; }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [currentQuestion]);

  const showXPPopup = (xp, isBonus = false) => {
    const id = Date.now() + Math.random();
    setXpPopups((prev) => [...prev, { id, xp, isBonus }]);
    setTimeout(() => setXpPopups((prev) => prev.filter((p) => p.id !== id)), 1200);
  };

  if (!currentQuestion && currentIndex < questions.length) {
    return (
      <div className="qz-loading">
        <div className="qz-loading-ring" />
        <p>Loading question…</p>
      </div>
    );
  }

  const handleSubmit = async (option = null) => {
    if (!currentQuestion || feedback) return;
    let xpEarned = 0, isCorrect = false;
    const timeSpent = Math.floor((Date.now() - sessionStartTime) / 1000);
    const qData = { ...currentQuestion, subject: currentQuestion.subject || determineSubject(currentQuestion.question) };

    if (currentQuestion.type === "mcq") {
      setClickedOption(option);
      isCorrect = option === currentQuestion.answer;
      xpEarned  = isCorrect ? (currentQuestion.xpValue || 15) : 2;
    } else if (currentQuestion.type === "short") {
      isCorrect = userAnswer.trim().toLowerCase() === currentQuestion.answer.toLowerCase();
      xpEarned  = isCorrect ? (currentQuestion.xpValue || 15) : 2;
    } else if (currentQuestion.type === "LIST") {
      const given   = userAnswer.split(",").map((a) => a.trim().toLowerCase());
      const correct = currentQuestion.answers.filter((a) => given.includes(a.toLowerCase())).length;
      isCorrect = correct > 0;
      xpEarned  = correct > 0 ? correct * 5 : 2;
    }

    if (isCorrect) correctSound.current.play().catch(() => {});
    else           wrongSound.current.play().catch(() => {});

    const statsResult = processAnswer(qData, isCorrect, timeSpent, mode);
    const finalXp = statsResult?.xpEarned || xpEarned;
    if (finalXp > 0) showXPPopup(finalXp, false);

    setScore((prev) => prev + finalXp);
    setFeedback(isCorrect ? "correct" : "wrong");
    setUserAnswer("");
    setTimeLeft(0);
    setAnswersList((prev) => [...prev, {
      question: currentQuestion.question, selected: option || userAnswer,
      correct: isCorrect, xpEarned: finalXp, statsResult,
      answer: currentQuestion.answer, explanation: currentQuestion.explanation,
    }]);

    setTimeout(() => {
      setIsAnimatingOut(true);
      setTimeout(() => {
        setFeedback(""); setClickedOption(null);
        setIsAnimatingOut(false); setCardKey((k) => k + 1);
        if (currentIndex + 1 < questions.length) setCurrentIndex((prev) => prev + 1);
      }, 300);
    }, 900);
  };

  useEffect(() => {
    if (answersList.length !== questions.length || questions.length === 0) return;
    const sessionResult = endSession();
    const totalStatsXP  = sessionResult?.totalXP || score;
    const bonusXP       = sessionResult?.bonusXP || 0;
    const bonuses       = sessionResult?.bonuses || [];

    if (isDailyChallenge && auth.currentUser) {
      saveDailyChallengeResults(totalStatsXP, dailyBonusXP, answersList);
    } else {
      const today = new Date().toISOString().split("T")[0];
      const dailyData = JSON.parse(localStorage.getItem("dailyChallenge")) || {};
      dailyData[today] = {
        answered: questions.length, total: questions.length, xpEarned: totalStatsXP,
        streak: answersList.some((a) => a.correct) ? (dailyData[today]?.streak || 0) + 1 : 0,
      };
      localStorage.setItem("dailyChallenge", JSON.stringify(dailyData));
    }
    if (bonusXP > 0 && bonuses.length > 0) {
      localStorage.setItem("quizBonusInfo", JSON.stringify({ bonusXP, bonuses, totalXP: totalStatsXP, sessionAccuracy: sessionResult?.sessionAccuracy || 0 }));
    }
    onFinish(score);
    navigate("/end", { state: { results: answersList, totalXP: totalStatsXP, bonusXP, bonuses, isDailyChallenge, dailyBonus: dailyBonusXP } });
  }, [answersList]);

  const saveDailyChallengeResults = async (totalXP, bonusXP, answers) => {
    const user = auth.currentUser;
    if (!user) return;
    const db = getFirestore();
    const today = new Date().toISOString().split("T")[0];
    const correctCount = answers.filter((a) => a.correct).length;
    const percentage   = Math.round((correctCount / questions.length) * 100);
    const newStreak    = percentage >= 60 ? dailyStreak + 1 : 0;
    const totalXPWithBonus = totalXP + bonusXP;
    await updateDoc(doc(db, "users", user.uid), {
      "stats.totalXP": increment(totalXPWithBonus), "stats.streak": newStreak,
      "stats.lastActiveDate": today, "stats.dailyChallengesCompleted": increment(1),
      "stats.sessionsCompleted": increment(1),
      [`dailyActivity.${today}`]: { date: today, xpEarned: totalXPWithBonus, questionsAnswered: questions.length, correctAnswers: correctCount, isDailyChallenge: true, bonusXP, streak: newStreak },
    });
    await setDoc(doc(db, "users", user.uid, "dailyChallenges", today), {
      date: today, score: correctCount, totalQuestions: questions.length, percentage,
      xpEarned: totalXPWithBonus, bonusXP, streak: newStreak,
      completedAt: new Date().toISOString(), yearOfStudy: userYear,
    });
  };

  const determineSubject = (text) => {
    const map = {
      Cardiology: ["heart","cardiac","artery","aorta","myocardial"],
      Neurology: ["brain","nerve","neuron","cerebral","stroke"],
      Pharmacology: ["drug","medication","dose","antibiotic"],
      Respiratory: ["lung","breath","airway","pneumonia","asthma"],
      Microbiology: ["bacteria","virus","fungus","infection"],
    };
    const lower = text.toLowerCase();
    for (const [subj, keys] of Object.entries(map)) {
      if (keys.some((k) => lower.includes(k))) return subj;
    }
    return "General Medicine";
  };

  const getOptionState = (opt) => {
    if (!feedback) return "idle";
    if (opt === currentQuestion.answer) return "correct";
    if (opt === clickedOption && opt !== currentQuestion.answer) return "wrong";
    return "dim";
  };

  const timerPct = currentQuestion?.type === "LIST"
    ? (timeLeft / (currentQuestion.timeLimit || 10)) * 100 : 100;

  return (
    <div className={`qz-root ${feedback ? `qz-root--${feedback}` : ""}`}>
      <div className="qz-bg" aria-hidden="true">
        <div className="qz-orb qz-orb-1" /><div className="qz-orb qz-orb-2" /><div className="qz-orb qz-orb-3" />
      </div>

      {xpPopups.map((p) => (
        <div key={p.id} className={`qz-xp-pop ${p.isBonus ? "qz-xp-pop--bonus" : ""}`}>
          +{p.xp} XP {p.isBonus && "🎉"}
        </div>
      ))}

      <header className="qz-topbar">
        <div className="qz-topbar-left">
          {isDailyChallenge && (
            <div className="qz-daily-pill">
              <span>⚡</span><span>Daily</span>
              {dailyStreak > 0 && <span className="qz-daily-streak">🔥 {dailyStreak}</span>}
            </div>
          )}
          {topic && <span className="qz-topic-label">{topic}</span>}
        </div>
        <div className="qz-counter">
          <span className="qz-counter-current">{currentIndex + 1}</span>
          <span className="qz-counter-sep">/</span>
          <span className="qz-counter-total">{questions.length}</span>
        </div>
        <div className="qz-topbar-right">
          <div className="qz-xp-pill"><span className="qz-xp-icon">⭐</span><span>{score}</span></div>
        </div>
      </header>

      <div className="qz-progress-track" role="progressbar" aria-valuenow={progress} aria-valuemax={100}>
        <div className="qz-progress-fill" style={{ width: `${progress}%` }}>
          <div className="qz-progress-shimmer" />
        </div>
        <div className="qz-progress-head" style={{ left: `calc(${progress}% - 6px)` }} />
      </div>

      <main className="qz-main">
        <div key={cardKey} className={`qz-card ${isAnimatingOut ? "qz-card--out" : "qz-card--in"}`}>
          <div className="qz-q-label">
            <span className="qz-q-dot" />
            Question {currentIndex + 1}
            {isDailyChallenge && <span className="qz-bonus-tag">+{dailyBonusXP} XP bonus</span>}
          </div>

          <p className="qz-question">{currentQuestion?.question}</p>

          {currentQuestion?.type === "LIST" && (
            <div className="qz-timer-wrap">
              <svg className="qz-timer-ring" viewBox="0 0 44 44">
                <circle cx="22" cy="22" r="18" className="qz-timer-bg" />
                <circle cx="22" cy="22" r="18" className="qz-timer-arc"
                  strokeDasharray={`${timerPct * 1.131} 113.1`} transform="rotate(-90 22 22)"
                  style={{ stroke: timeLeft <= 3 ? "#ef4444" : "#2a9d8f" }} />
              </svg>
              <span className="qz-timer-num" style={{ color: timeLeft <= 3 ? "#ef4444" : "inherit" }}>{timeLeft}</span>
            </div>
          )}

          {currentQuestion?.type === "mcq" && (
            <div className="qz-options">
              {currentQuestion.options.map((opt, i) => {
                const state = getOptionState(opt);
                return (
                  <button key={i} className={`qz-option qz-option--${state}`}
                    onClick={() => !feedback && handleSubmit(opt)} disabled={!!feedback}>
                    <span className="qz-option-letter">{OPTION_LABELS[i]}</span>
                    <span className="qz-option-text">{opt}</span>
                    {state === "correct" && <span className="qz-option-check">✓</span>}
                    {state === "wrong"   && <span className="qz-option-check">✗</span>}
                  </button>
                );
              })}
            </div>
          )}

          {(currentQuestion?.type === "short" || currentQuestion?.type === "LIST") && (
            <div className="qz-input-area">
              {currentQuestion.type === "LIST" && (
                <p className="qz-list-hint">List {currentQuestion.answers?.length} items, separated by commas</p>
              )}
              <div className="qz-input-row">
                <input ref={inputRef} type="text"
                  className={`qz-input ${feedback ? `qz-input--${feedback}` : ""}`}
                  value={userAnswer} onChange={(e) => !feedback && setUserAnswer(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && !feedback && handleSubmit()}
                  placeholder={currentQuestion.type === "LIST" ? "Type items separated by commas…" : "Type your answer and press Enter…"}
                  disabled={!!feedback} />
                {!feedback && <button className="qz-submit-btn" onClick={() => handleSubmit()}>Submit</button>}
              </div>
            </div>
          )}

          {feedback && (
            <div className={`qz-feedback qz-feedback--${feedback}`}>
              <div className="qz-feedback-icon">{feedback === "correct" ? "✓" : "✗"}</div>
              <div className="qz-feedback-body">
                <p className="qz-feedback-headline">
                  {feedback === "correct" ? "Correct!" : `Answer: ${currentQuestion.answer}`}
                </p>
                {currentQuestion.explanation && (
                  <p className="qz-feedback-exp">{currentQuestion.explanation}</p>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="qz-dots" aria-hidden="true">
          {questions.map((_, i) => {
            const answered  = answersList[i];
            const isCurrent = i === currentIndex;
            return (
              <span key={i} className={`qz-dot ${isCurrent ? "qz-dot--current" : ""} ${answered ? (answered.correct ? "qz-dot--ok" : "qz-dot--fail") : ""}`} />
            );
          })}
        </div>
      </main>
    </div>
  );
}