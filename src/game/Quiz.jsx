// src/game/Quiz.jsx
import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useStats } from "../hooks/useStats";
import { auth } from "../firebase";
import { getFirestore, doc, getDoc, updateDoc, increment, setDoc } from "firebase/firestore";
import "./Quiz.css";

import correctSoundFile from "../sound/correct.wav";
import wrongSoundFile from "../sound/wrong.wav";

export default function Quiz({ questions, onFinish, mode = "classic" }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [userAnswer, setUserAnswer] = useState("");
  const [timeLeft, setTimeLeft] = useState(0);
  const [score, setScore] = useState(0);
  const [feedback, setFeedback] = useState("");
  const [clickedOption, setClickedOption] = useState(null);
  const [answersList, setAnswersList] = useState([]);
  const [xpPopups, setXpPopups] = useState([]);
  const [sessionStartTime] = useState(Date.now());

  // Check if this is a daily challenge
  const isDailyChallenge = location.state?.isDailyChallenge || false;
  const dailyBonusXP = location.state?.xpBonus || 50;
  const dailyStreak = location.state?.streak || 0;
  const userYear = location.state?.userYear || "";
  const dailyQuestionsCount = location.state?.questionsCount || 6;

  // ✅ Stats tracking hook
  const { startSession, processAnswer, endSession } = useStats();

  const correctSound = useRef(new Audio(correctSoundFile));
  const wrongSound = useRef(new Audio(wrongSoundFile));

  const currentQuestion = questions[currentIndex];

  // ✅ Start session when quiz loads
  useEffect(() => {
    if (questions.length > 0) {
      startSession(mode);
    }
  }, []);

  // Timer for LIST type questions
  useEffect(() => {
    if (!currentQuestion) return;

    if (currentQuestion.type === "LIST") {
      setTimeLeft(currentQuestion.timeLimit || 10);
      const timer = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            handleSubmit();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [currentQuestion]);

  // Show XP popup animation
  const showXPPopup = (xp, isBonus = false) => {
    const id = Date.now();
    setXpPopups((prev) => [...prev, { id, xp, isBonus }]);
    setTimeout(() => {
      setXpPopups((prev) => prev.filter((popup) => popup.id !== id));
    }, 1000);
  };

  if (!currentQuestion && currentIndex < questions.length) {
    return <div className="quiz-loading">Loading question…</div>;
  }

  const handleSubmit = async (option = null) => {
    if (!currentQuestion) return;

    let xpEarned = 0;
    let isCorrect = false;
    const timeSpent = Math.floor((Date.now() - sessionStartTime) / 1000);
    const currentQuestionData = {
      ...currentQuestion,
      subject: currentQuestion.subject || determineSubject(currentQuestion.question)
    };

    // ✅ Determine correct answer and XP based on question type
    if (currentQuestion.type === "mcq") {
      setClickedOption(option);
      if (option === currentQuestion.answer) {
        isCorrect = true;
        xpEarned = currentQuestion.xpValue || 15;
      } else {
        xpEarned = 2;
      }
    } else if (currentQuestion.type === "short") {
      if (userAnswer.trim().toLowerCase() === currentQuestion.answer.toLowerCase()) {
        isCorrect = true;
        xpEarned = currentQuestion.xpValue || 15;
      } else {
        xpEarned = 2;
      }
    } else if (currentQuestion.type === "LIST") {
      const answersGiven = userAnswer.split(",").map((a) => a.trim().toLowerCase());
      const correctCount = currentQuestion.answers.filter((ans) =>
        answersGiven.includes(ans.toLowerCase())
      ).length;
      if (correctCount > 0) isCorrect = true;
      xpEarned = correctCount * 5;
      if (!isCorrect && correctCount === 0) xpEarned = 2;
    }

    // ✅ Play sound feedback
    if (isCorrect) {
      correctSound.current.play();
    } else {
      wrongSound.current.play();
    }

    // ✅ Track answer with stats service
    const statsResult = processAnswer(
      currentQuestionData,
      isCorrect,
      timeSpent,
      mode
    );

    // ✅ Show XP popup with bonus info
    const finalXp = statsResult?.xpEarned || xpEarned;
    if (finalXp > 0) {
      showXPPopup(finalXp, false);
    }

    // ✅ Update local score
    setScore((prev) => prev + finalXp);
    setFeedback(isCorrect ? "✅ Correct!" : "❌ Wrong!");
    setUserAnswer("");
    setTimeLeft(0);

    // ✅ Store answer for review
    const currentAnswer = {
      question: currentQuestion.question,
      selected: option || userAnswer,
      correct: isCorrect,
      xpEarned: finalXp,
      statsResult: statsResult,
      answer: currentQuestion.answer,
      explanation: currentQuestion.explanation
    };

    setAnswersList((prev) => [...prev, currentAnswer]);

    // ✅ Move to next question after delay
    setTimeout(() => {
      setFeedback("");
      setClickedOption(null);
      if (currentIndex + 1 < questions.length) {
        setCurrentIndex((prev) => prev + 1);
      }
    }, 700);
  };

  // ✅ Save daily challenge results to Firestore
  const saveDailyChallengeResults = async (totalXP, bonusXP) => {
    const user = auth.currentUser;
    if (!user) return;

    const db = getFirestore();
    const today = new Date().toISOString().split('T')[0];
    
    const correctCount = answersList.filter(a => a.correct).length;
    const percentage = Math.round((correctCount / questions.length) * 100);
    
    let newStreak = dailyStreak;
    if (percentage >= 60) {
      newStreak = dailyStreak + 1;
    } else {
      newStreak = 0;
    }
    
    const totalXPWithBonus = totalXP + bonusXP;
    
    // Create daily activity object
    const dailyActivityData = {
      date: today,
      xpEarned: totalXPWithBonus,
      questionsAnswered: questions.length,
      correctAnswers: correctCount,
      isDailyChallenge: true,
      bonusXP: bonusXP,
      streak: newStreak
    };
    
    const userDocRef = doc(db, "users", user.uid);
    
    await updateDoc(userDocRef, {
      "stats.totalXP": increment(totalXPWithBonus),
      "stats.streak": newStreak,
      "stats.lastActiveDate": today,
      "stats.dailyChallengesCompleted": increment(1),
      "stats.sessionsCompleted": increment(1),
      [`dailyActivity.${today}`]: dailyActivityData
    });
    
    const challengeRef = doc(db, "users", user.uid, "dailyChallenges", today);
    await setDoc(challengeRef, {
      date: today,
      score: correctCount,
      totalQuestions: questions.length,
      percentage: percentage,
      xpEarned: totalXPWithBonus,
      bonusXP: bonusXP,
      streak: newStreak,
      completedAt: new Date().toISOString(),
      yearOfStudy: userYear
    });
  };

  // ✅ End session when all questions are answered
  useEffect(() => {
    if (answersList.length === questions.length && questions.length > 0) {
      const sessionResult = endSession();
      const totalStatsXP = sessionResult?.totalXP || score;
      const bonusXP = sessionResult?.bonusXP || 0;
      const bonuses = sessionResult?.bonuses || [];
      
      if (isDailyChallenge && auth.currentUser) {
        saveDailyChallengeResults(totalStatsXP, dailyBonusXP);
      } else {
        const today = new Date().toISOString().split("T")[0];
        const dailyData = JSON.parse(localStorage.getItem("dailyChallenge")) || {};
        const hasCorrect = answersList.some(a => a.correct);
        const streak = hasCorrect ? (dailyData[today]?.streak || 0) + 1 : 0;

        dailyData[today] = {
          answered: questions.length,
          total: questions.length,
          xpEarned: totalStatsXP,
          streak: streak,
        };

        localStorage.setItem("dailyChallenge", JSON.stringify(dailyData));
      }

      if (bonusXP > 0 && bonuses.length > 0) {
        localStorage.setItem("quizBonusInfo", JSON.stringify({
          bonusXP,
          bonuses,
          totalXP: totalStatsXP,
          sessionAccuracy: sessionResult?.sessionAccuracy || 0
        }));
      }

      onFinish(score);
      navigate("/end", { 
        state: { 
          results: answersList,
          totalXP: totalStatsXP,
          bonusXP: bonusXP,
          bonuses: bonuses,
          isDailyChallenge: isDailyChallenge,
          dailyBonus: dailyBonusXP
        } 
      });
    }
  }, [answersList, navigate, onFinish, questions.length, score, endSession]);

  // Helper function to determine subject from question text
  const determineSubject = (questionText) => {
    const keywords = {
      Cardiology: ["heart", "cardiac", "artery", "vein", "aorta", "myocardial"],
      Neurology: ["brain", "nerve", "neuron", "cerebral", "stroke", "seizure"],
      Pharmacology: ["drug", "medication", "dose", "prescription", "antibiotic"],
      Respiratory: ["lung", "breath", "airway", "pneumonia", "asthma"],
      Gastroenterology: ["stomach", "liver", "intestine", "colon", "digest"],
      Microbiology: ["bacteria", "virus", "fungus", "infection", "antibiotic"],
      Endocrinology: ["hormone", "thyroid", "insulin", "diabetes", "gland"],
      Nephrology: ["kidney", "renal", "nephron", "urine"],
      Hematology: ["blood", "anemia", "hemoglobin", "platelet"],
      Immunology: ["immune", "antibody", "antigen", "allergy"]
    };
    
    const lowerText = questionText.toLowerCase();
    for (const [subject, keywords] of Object.entries(keywords)) {
      for (const keyword of keywords) {
        if (lowerText.includes(keyword)) {
          return subject;
        }
      }
    }
    return "General Medicine";
  };

  return (
    <div className="quiz-container">
      {/* Daily Challenge Header */}
      {isDailyChallenge && (
        <div className="daily-challenge-badge">
          <span className="badge-icon">⭐</span>
          <span className="badge-text">Daily Challenge</span>
          <span className="badge-streak">🔥 {dailyStreak} Day Streak</span>
        </div>
      )}

      {/* XP Popup Animations */}
      {xpPopups.map((popup) => (
        <div
          key={popup.id}
          className={`xp-popup ${popup.isBonus ? "bonus" : ""}`}
        >
          +{popup.xp} XP {popup.isBonus && "🎉"}
        </div>
      ))}

      <h2>
        Question {currentIndex + 1} / {questions.length}
        {isDailyChallenge && <span className="bonus-tag">+{dailyBonusXP} bonus at end!</span>}
      </h2>

      <p className="quiz-question">{currentQuestion?.question}</p>

      {currentQuestion?.type === "mcq" && (
        <div className="options-container">
          {currentQuestion.options.map((opt, idx) => (
            <button
              key={idx}
              className={`option-btn ${
                clickedOption === opt
                  ? opt === currentQuestion.answer
                    ? "correct"
                    : "wrong"
                  : ""
              }`}
              onClick={() => handleSubmit(opt)}
            >
              {opt}
            </button>
          ))}
        </div>
      )}

      {(currentQuestion?.type === "short" || currentQuestion?.type === "LIST") && (
        <div className="input-container">
          {currentQuestion.type === "LIST" && (
            <p className="timer">Time left: {timeLeft}s</p>
          )}
          <input
            type="text"
            value={userAnswer}
            onChange={(e) => setUserAnswer(e.target.value)}
            placeholder={
              currentQuestion.type === "LIST"
                ? `Type ${currentQuestion.answers.length} items separated by commas`
                : "Type your answer here..."
            }
            onKeyPress={(e) => e.key === "Enter" && handleSubmit()}
          />
          <button className="submit-btn" onClick={() => handleSubmit()}>
            Submit
          </button>
        </div>
      )}

      {feedback && (
        <p
          className={`feedback ${
            feedback.includes("Correct") ? "correct" : "wrong"
          }`}
        >
          {feedback}
        </p>
      )}

      <div className="progress-bar">
        <div
          className="progress-fill"
          style={{ width: `${((currentIndex + 1) / questions.length) * 100}%` }}
        ></div>
      </div>

      <div className="quiz-stats">
        <small>⭐ XP: {score}</small>
        <small>📝 Q{currentIndex + 1}/{questions.length}</small>
        {isDailyChallenge && (
          <small className="streak-indicator">🔥 Streak Bonus: +{dailyBonusXP} XP</small>
        )}
      </div>
    </div>
  );
}