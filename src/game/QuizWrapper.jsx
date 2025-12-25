// src/game/QuizWrapper.jsx
import React from "react";
import { useLocation } from "react-router-dom";
import Quiz from "./Quiz";

export default function QuizWrapper() {
  const location = useLocation();
  const questions = location.state?.questions || [];

  const handleFinish = (score, answersList) => {
    // navigation to /end is now handled inside Quiz.jsx
    // handleFinish can be used for any additional side effects if needed
    console.log("Quiz finished with score:", score);
  };

  if (questions.length === 0) return <p>No questions available!</p>;

  return <Quiz questions={questions} onFinish={handleFinish} />;
}
