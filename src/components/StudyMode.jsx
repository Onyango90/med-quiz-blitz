// src/components/StudyMode.jsx
import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";

// Import your question JSONs
import anatomyQuestions from "../data/questions/anatomy.json";
import pathologyQuestions from "../data/questions/pathology.json";
// Add more topics here
// import physiologyQuestions from "../data/questions/physiology.json";

import correctSoundFile from "../sound/correct.wav";
import wrongSoundFile from "../sound/wrong.wav";

// Function to get questions based on topic
function getQuestions(topic) {
  if (!topic) return [];
  switch (topic.toLowerCase()) {
    case "anatomy":
      return anatomyQuestions;
    case "pathology":
      return pathologyQuestions;
    // Add more topics here
    default:
      return [];
  }
}

function StudyMode() {
  const { topic } = useParams(); // get topic from URL
  const questions = getQuestions(topic) || [];

  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState("");
  const [showAnswer, setShowAnswer] = useState(false);
  const [timeLeft, setTimeLeft] = useState(15);
  const [answerStatus, setAnswerStatus] = useState(null);

  const currentQuestion = questions[currentIndex];

  const correctSound = new Audio(correctSoundFile);
  const wrongSound = new Audio(wrongSoundFile);

  // Reset state when topic changes
  useEffect(() => {
    setCurrentIndex(0);
    setSelectedAnswer("");
    setShowAnswer(false);
    setTimeLeft(15);
    setAnswerStatus(null);
  }, [topic]);

  // Timer for short answer questions
  useEffect(() => {
    if (!currentQuestion || currentQuestion.type !== "short" || showAnswer) return;
    if (timeLeft <= 0) {
      setShowAnswer(true);
      setAnswerStatus("timeout");
      wrongSound.play();
      return;
    }

    const timer = setInterval(() => setTimeLeft((t) => t - 1), 1000);
    return () => clearInterval(timer);
  }, [timeLeft, currentQuestion, showAnswer, wrongSound]);

  if (!topic) return <div style={{ padding: 20 }}>⚠️ No topic selected.</div>;
  if (!questions.length)
    return <div style={{ padding: 20 }}>⚠️ No questions found for {topic}.</div>;
  if (!currentQuestion)
    return <div style={{ padding: 20 }}>🎉 You finished all {topic} questions!</div>;

  const isMCQ = currentQuestion.type === "mcq";
  const isShort = currentQuestion.type === "short";

  const handleAnswer = (answer) => {
    if (showAnswer) return;
    setSelectedAnswer(answer);
    setShowAnswer(true);
    if (answer === currentQuestion.answer) {
      setAnswerStatus("correct");
      correctSound.play();
    } else {
      setAnswerStatus("wrong");
      wrongSound.play();
    }
  };

  const handleNext = () => {
    setSelectedAnswer("");
    setShowAnswer(false);
    setTimeLeft(15);
    setAnswerStatus(null);
    setCurrentIndex(currentIndex + 1);
  };

  const cardStyle = {
    padding: "20px",
    borderRadius: "12px",
    marginBottom: "15px",
    background: "#fdf6e3",
    boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
  };

  const buttonStyle = (opt) => ({
    background:
      selectedAnswer === opt
        ? opt === currentQuestion.answer
          ? "#4CAF50"
          : "#F44336"
        : "#ffdca8",
    color: selectedAnswer === opt ? "#fff" : "#000",
    margin: "5px",
    padding: "12px 18px",
    borderRadius: "8px",
    cursor: "pointer",
    minWidth: "140px",
    fontWeight: "bold",
    transition: "0.2s",
  });

  return (
    <div style={{ padding: "20px" }}>
      <div style={cardStyle}>
        <h2 style={{ color: "#ff7f50" }}>{currentQuestion.question}</h2>

        {/* MCQ */}
        {isMCQ && (
          <div style={{ marginTop: "15px" }}>
            {currentQuestion.options.map((opt, idx) => (
              <button
                key={idx}
                onClick={() => handleAnswer(opt)}
                style={buttonStyle(opt)}
              >
                {opt}
              </button>
            ))}
          </div>
        )}

        {/* Short Answer */}
        {isShort && !showAnswer && (
          <div style={{ marginTop: "15px" }}>
            <input
              type="text"
              placeholder="Type your answer..."
              value={selectedAnswer}
              onChange={(e) => setSelectedAnswer(e.target.value)}
              style={{
                padding: "10px",
                width: "80%",
                borderRadius: "8px",
                border: "1px solid #888",
                fontSize: "16px",
              }}
            />
            <div
              style={{
                height: "12px",
                width: "80%",
                background: "#ddd",
                marginTop: "10px",
                borderRadius: "6px",
              }}
            >
              <div
                style={{
                  height: "12px",
                  width: `${(timeLeft / 15) * 100}%`,
                  background: "#ff7f50",
                  borderRadius: "6px",
                  transition: "width 1s linear",
                }}
              />
            </div>
            <p>Time left: {timeLeft}s</p>
            <button
              onClick={() => setShowAnswer(true)}
              style={{
                marginTop: "12px",
                padding: "10px 20px",
                borderRadius: "8px",
                background: "#6b5b95",
                color: "#fff",
                cursor: "pointer",
              }}
            >
              Show Answer
            </button>
          </div>
        )}

        {/* Show Short Answer Result */}
        {showAnswer && isShort && (
          <div
            style={{
              background:
                answerStatus === "correct"
                  ? "#4CAF50"
                  : answerStatus === "wrong" || answerStatus === "timeout"
                  ? "#F44336"
                  : "#e8e8e8",
              color: "#fff",
              padding: "15px",
              borderRadius: "8px",
              marginTop: "10px",
              fontWeight: "bold",
            }}
          >
            Correct Answer: {currentQuestion.answer}
          </div>
        )}
      </div>

      {/* Explanation */}
      {showAnswer && (
        <div
          style={{
            background: "#fdf6e3",
            padding: "15px",
            marginTop: "10px",
            borderRadius: "8px",
            color: "#333",
            boxShadow: "0 2px 6px rgba(0,0,0,0.1)",
          }}
        >
          <strong>Explanation:</strong>
          <p>{currentQuestion.explanation}</p>
        </div>
      )}

      {/* Next Button */}
      {showAnswer && (
        <button
          onClick={handleNext}
          style={{
            marginTop: "20px",
            padding: "10px 20px",
            borderRadius: "8px",
            background: "#ff7f50",
            color: "#fff",
            cursor: "pointer",
          }}
        >
          Next ➡️
        </button>
      )}
    </div>
  );
}

export default StudyMode;
