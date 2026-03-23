// src/game/Quiz.jsx
import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useStats } from "../hooks/useStats";
import "./Quiz.css";

import correctSoundFile from "../sound/correct.wav";
import wrongSoundFile from "../sound/wrong.wav";

export default function Quiz({ questions, onFinish, mode = "classic" }) {
  const navigate = useNavigate();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [userAnswer, setUserAnswer] = useState("");
  const [timeLeft, setTimeLeft] = useState(0);
  const [score, setScore] = useState(0);
  const [feedback, setFeedback] = useState("");
  const [clickedOption, setClickedOption] = useState(null);
  const [answersList, setAnswersList] = useState([]);
  const [xpPopups, setXpPopups] = useState([]);
  const [sessionStartTime] = useState(Date.now());

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

  const handleSubmit = (option = null) => {
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
        xpEarned = 10;
      } else {
        xpEarned = 2; // Participation XP for wrong answers
      }
    } else if (currentQuestion.type === "short") {
      if (userAnswer.trim().toLowerCase() === currentQuestion.answer.toLowerCase()) {
        isCorrect = true;
        xpEarned = 15;
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
    if (statsResult?.xpEarned > 0) {
      showXPPopup(statsResult.xpEarned, false);
    }

    // ✅ Update local score
    setScore((prev) => prev + xpEarned);
    setFeedback(isCorrect ? "✅ Correct!" : "❌ Wrong!");
    setUserAnswer("");
    setTimeLeft(0);

    // ✅ Store answer for review
    const currentAnswer = {
      question: currentQuestion.question,
      selected: option || userAnswer,
      correct: isCorrect,
      xpEarned: xpEarned,
      statsResult: statsResult
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

  // ✅ End session when all questions are answered
  useEffect(() => {
    if (answersList.length === questions.length && questions.length > 0) {
      // End session and get bonus XP
      const sessionResult = endSession();
      
      // Calculate total XP from stats (includes bonuses)
      const totalStatsXP = sessionResult?.totalXP || score;
      const bonusXP = sessionResult?.bonusXP || 0;
      const bonuses = sessionResult?.bonuses || [];
      
      // ✅ Update Daily Challenge progress in localStorage
      const today = new Date().toISOString().split("T")[0];
      const dailyData = JSON.parse(localStorage.getItem("dailyChallenge")) || {};

      // Calculate streak (if at least 1 question correct)
      const hasCorrect = answersList.some(a => a.correct);
      const streak = hasCorrect ? (dailyData[today]?.streak || 0) + 1 : 0;

      dailyData[today] = {
        answered: questions.length,
        total: questions.length,
        xpEarned: totalStatsXP,
        streak: streak,
      };

      localStorage.setItem("dailyChallenge", JSON.stringify(dailyData));

      // ✅ Show bonus summary before navigating
      if (bonusXP > 0 && bonuses.length > 0) {
        // Store bonus info to show on end page
        localStorage.setItem("quizBonusInfo", JSON.stringify({
          bonusXP,
          bonuses,
          totalXP: totalStatsXP,
          sessionAccuracy: sessionResult?.sessionAccuracy || 0
        }));
      }

      // Navigate to end page with results
      onFinish(score);
      navigate("/end", { 
        state: { 
          results: answersList,
          totalXP: totalStatsXP,
          bonusXP: bonusXP,
          bonuses: bonuses
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
      </div>
    </div>
  );
}