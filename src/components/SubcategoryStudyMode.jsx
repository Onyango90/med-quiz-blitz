// src/components/SubcategoryStudyMode.jsx
import React, { useState, useEffect } from "react";
import { useParams, useLocation, useNavigate } from "react-router-dom";

// Import pharmacology subcategories
import pharmacologyQuestions, { antibiotics } from "../data/questions/pharmacology/index.js";

import correctSoundFile from "../sound/correct.wav";
import wrongSoundFile from "../sound/wrong.wav";

// Function to get questions based on subcategory
function getSubcategoryQuestions(topic, subcategory, locationState) {
  // If we have questions passed in state, use those first
  if (locationState?.questions) {
    return locationState.questions;
  }
  
  // Otherwise check based on subcategory
  if (topic === "pharmacology") {
    switch (subcategory) {
      case "antibiotics":
        return antibiotics || [];
      // Add more cases as you add categories
      default:
        return [];
    }
  }
  
  return [];
}

// Function to split questions into batches of 15
function getBatches(questions, batchSize = 15) {
  const batches = [];
  for (let i = 0; i < questions.length; i += batchSize) {
    batches.push(questions.slice(i, i + batchSize));
  }
  return batches;
}

function SubcategoryStudyMode() {
  const { topic, subcategory } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  
  const allQuestions = getSubcategoryQuestions(topic, subcategory, location) || [];
  const batches = getBatches(allQuestions, 15);
  
  const [currentBatchIndex, setCurrentBatchIndex] = useState(0);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState("");
  const [showAnswer, setShowAnswer] = useState(false);
  const [timeLeft, setTimeLeft] = useState(15);
  const [answerStatus, setAnswerStatus] = useState(null);
  const [batchResults, setBatchResults] = useState([]);
  const [showBatchSummary, setShowBatchSummary] = useState(false);

  const currentBatch = batches[currentBatchIndex] || [];
  const currentQuestion = currentBatch[currentIndex];
  const isLastQuestionInBatch = currentIndex === currentBatch.length - 1;

  const correctSound = new Audio(correctSoundFile);
  const wrongSound = new Audio(wrongSoundFile);

  // Format subcategory name for display
  const formatSubcategoryName = (sub) => {
    if (!sub) return "";
    return sub.charAt(0).toUpperCase() + sub.slice(1);
  };

  // Reset state when topic or batch changes
  useEffect(() => {
    setCurrentIndex(0);
    setSelectedAnswer("");
    setShowAnswer(false);
    setTimeLeft(15);
    setAnswerStatus(null);
    setShowBatchSummary(false);
  }, [topic, subcategory, currentBatchIndex]);

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

  if (!topic || !subcategory) return <div style={{ padding: 20 }}>⚠️ Invalid topic.</div>;
  if (!allQuestions.length)
    return <div style={{ padding: 20 }}>⚠️ No questions found for {formatSubcategoryName(subcategory)}.</div>;
  if (currentBatchIndex >= batches.length)
    return <div style={{ padding: 20 }}>🎉 You finished all questions!</div>;
  if (!currentQuestion)
    return <div style={{ padding: 20 }}>Loading...</div>;

  const isMCQ = currentQuestion.type === "mcq";
  const isShort = currentQuestion.type === "short";

  const handleAnswer = (answer) => {
    if (showAnswer) return;
    setSelectedAnswer(answer);
    setShowAnswer(true);
    
    const isCorrect = answer === currentQuestion.answer;
    
    if (isCorrect) {
      setAnswerStatus("correct");
      correctSound.play();
    } else {
      setAnswerStatus("wrong");
      wrongSound.play();
    }

    // Store result
    setBatchResults(prev => [
      ...prev,
      {
        question: currentQuestion.question,
        userAnswer: answer,
        correctAnswer: currentQuestion.answer,
        isCorrect,
        explanation: currentQuestion.explanation
      }
    ]);
  };

  const handleNext = () => {
    if (isLastQuestionInBatch) {
      // Show batch summary
      setShowBatchSummary(true);
    } else {
      // Move to next question in current batch
      setSelectedAnswer("");
      setShowAnswer(false);
      setTimeLeft(15);
      setAnswerStatus(null);
      setCurrentIndex(currentIndex + 1);
    }
  };

  const handleNextBatch = () => {
    // Move to next batch
    setBatchResults([]);
    setShowBatchSummary(false);
    setCurrentBatchIndex(currentBatchIndex + 1);
  };

  const handleReviewBatch = () => {
    // Navigate to review page with batch results
    navigate("/review", { state: { results: batchResults, topic: `${topic} - ${formatSubcategoryName(subcategory)}` } });
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

  // Batch Summary View
  if (showBatchSummary) {
    const correctCount = batchResults.filter(r => r.isCorrect).length;
    const score = Math.round((correctCount / batchResults.length) * 100);
    
    return (
      <div style={{ padding: "20px", maxWidth: "600px", margin: "0 auto" }}>
        <div style={cardStyle}>
          <h2 style={{ color: "#ff7f50", textAlign: "center" }}>
            {formatSubcategoryName(subcategory)} - Batch {currentBatchIndex + 1} Complete!
          </h2>
          
          <div style={{ textAlign: "center", margin: "30px 0" }}>
            <div style={{ fontSize: "48px", fontWeight: "bold", color: score >= 70 ? "#4CAF50" : "#F44336" }}>
              {score}%
            </div>
            <div style={{ fontSize: "18px", marginTop: "10px" }}>
              {correctCount} correct out of {batchResults.length}
            </div>
          </div>

          <div style={{ display: "flex", gap: "15px", justifyContent: "center" }}>
            <button
              onClick={handleReviewBatch}
              style={{
                padding: "12px 24px",
                borderRadius: "8px",
                background: "#6b5b95",
                color: "#fff",
                cursor: "pointer",
                border: "none",
                fontSize: "16px",
              }}
            >
              📋 Review Answers
            </button>
            
            {currentBatchIndex < batches.length - 1 && (
              <button
                onClick={handleNextBatch}
                style={{
                  padding: "12px 24px",
                  borderRadius: "8px",
                  background: "#ff7f50",
                  color: "#fff",
                  cursor: "pointer",
                  border: "none",
                  fontSize: "16px",
                }}
              >
                Next Batch ➡️
              </button>
            )}
            
            {currentBatchIndex === batches.length - 1 && (
              <button
                onClick={() => navigate("/study-dashboard")}
                style={{
                  padding: "12px 24px",
                  borderRadius: "8px",
                  background: "#4CAF50",
                  color: "#fff",
                  cursor: "pointer",
                  border: "none",
                  fontSize: "16px",
                }}
              >
                🏠 Back to Dashboard
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Regular Question View
  return (
    <div style={{ padding: "20px" }}>
      {/* Header */}
      <div style={{ marginBottom: "20px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h3 style={{ color: "#6a4c93", margin: 0 }}>
          {formatSubcategoryName(subcategory)} • {topic}
        </h3>
        <button
          onClick={() => navigate("/study-dashboard")}
          style={{
            padding: "8px 16px",
            borderRadius: "8px",
            background: "#6b5b95",
            color: "#fff",
            cursor: "pointer",
            border: "none",
            fontSize: "14px",
          }}
        >
          ← Back
        </button>
      </div>

      {/* Progress Bar */}
      <div style={{ marginBottom: "20px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "5px" }}>
          <span>Batch {currentBatchIndex + 1} of {batches.length}</span>
          <span>Question {currentIndex + 1} of {currentBatch.length}</span>
        </div>
        <div style={{
          height: "8px",
          width: "100%",
          background: "#ddd",
          borderRadius: "4px",
          overflow: "hidden"
        }}>
          <div style={{
            height: "100%",
            width: `${((currentIndex + 1) / currentBatch.length) * 100}%`,
            background: "#ff7f50",
            transition: "width 0.3s ease"
          }} />
        </div>
      </div>

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
                disabled={showAnswer}
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
          {isLastQuestionInBatch ? "See Batch Results 📊" : "Next ➡️"}
        </button>
      )}
    </div>
  );
}

export default SubcategoryStudyMode;