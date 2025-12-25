// src/game/Quiz.jsx
import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import "./Quiz.css";

import correctSoundFile from "../sound/correct.wav";
import wrongSoundFile from "../sound/wrong.wav";

export default function Quiz({ questions, onFinish }) {
  const navigate = useNavigate();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [userAnswer, setUserAnswer] = useState("");
  const [timeLeft, setTimeLeft] = useState(0);
  const [score, setScore] = useState(0);
  const [feedback, setFeedback] = useState("");
  const [clickedOption, setClickedOption] = useState(null);
  const [answersList, setAnswersList] = useState([]);

  const correctSound = useRef(new Audio(correctSoundFile));
  const wrongSound = useRef(new Audio(wrongSoundFile));

  const currentQuestion = questions[currentIndex];

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

  // Prevent blank screen
  if (!currentQuestion && currentIndex < questions.length) {
    return <div className="quiz-loading">Loading question…</div>;
  }

  const handleSubmit = (option = null) => {
    if (!currentQuestion) return;

    let xpEarned = 0;
    let isCorrect = false;

    if (currentQuestion.type === "mcq") {
      setClickedOption(option);
      if (option === currentQuestion.answer) isCorrect = true;
      if (isCorrect) xpEarned = 10;
    } else if (currentQuestion.type === "short") {
      if (userAnswer.trim().toLowerCase() === currentQuestion.answer.toLowerCase())
        isCorrect = true;
      if (isCorrect) xpEarned = 15;
    } else if (currentQuestion.type === "LIST") {
      const answersGiven = userAnswer.split(",").map((a) => a.trim().toLowerCase());
      const correctCount = currentQuestion.answers.filter((ans) =>
        answersGiven.includes(ans.toLowerCase())
      ).length;
      if (correctCount > 0) isCorrect = true;
      xpEarned = correctCount * 5;
    }

    if (isCorrect) correctSound.current.play();
    else wrongSound.current.play();

    setScore((prev) => prev + xpEarned);
    setFeedback(isCorrect ? "✅ Correct!" : "❌ Wrong!");
    setUserAnswer("");
    setTimeLeft(0);

    const currentAnswer = {
      question: currentQuestion.question,
      selected: option || userAnswer,
      correct: isCorrect,
      xpEarned: xpEarned,
    };

    // Only update answersList here, no navigation
    setAnswersList((prev) => [...prev, currentAnswer]);

    setTimeout(() => {
      setFeedback("");
      setClickedOption(null);
      if (currentIndex + 1 < questions.length) {
        setCurrentIndex((prev) => prev + 1);
      }
    }, 700);
  };

  // ✅ Navigate to end page only when all questions are answered
  useEffect(() => {
    if (answersList.length === questions.length) {
      onFinish(score);
      navigate("/end", { state: { results: answersList } });
    }
  }, [answersList, navigate, onFinish, questions.length, score]);

  return (
    <div className="quiz-container">
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
                : ""
            }
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

      <small>
        XP: {score} | Question {currentIndex + 1} / {questions.length}
      </small>
    </div>
  );
}
