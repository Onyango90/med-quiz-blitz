// src/game/QuizWrapper.jsx
import React from "react";
import { useLocation, useNavigate } from "react-router-dom";
import Quiz from "./Quiz";

export default function QuizWrapper() {
  const location = useLocation();
  const navigate = useNavigate();
  const questions = location.state?.questions || [];

  const handleFinish = (score) => {
    console.log("Quiz finished. Score:", score);
    navigate("/home");
  };

  if (questions.length === 0) return <p>No questions available!</p>;

  return <Quiz questions={questions} onFinish={handleFinish} />;
}
