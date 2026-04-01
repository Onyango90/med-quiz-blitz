import React, { useState, useEffect } from "react";
import { useParams, useLocation, useNavigate } from "react-router-dom";

// Import anatomy categories
import grossAnatomy from "../data/questions/gross_anatomy.json";
import histology from "../data/questions/histology.json";
import embryology from "../data/questions/embryology.json";

// Import other subjects
import pathologyQuestions from "../data/questions/pathology.json";
import pharmacologyQuestions from "../data/questions/pharmacology/index.js";
import physiologyLevel1 from "../data/questions/physiology_level1.json";
import physiologyLevel2 from "../data/questions/physiology_level2.json";

import correctSoundFile from "../sound/correct.wav";
import wrongSoundFile from "../sound/wrong.wav";

// Function to get questions based on topic
function getQuestions(topic, subtopic, locationState) {
  if (locationState?.questions) {
    return locationState.questions;
  }
  
  // Handle anatomy categories
  switch (topic?.toLowerCase()) {
    case "gross_anatomy":
      return grossAnatomy;
    case "histology":
      return histology;
    case "embryology":
      return embryology;
    case "anatomy":
      return [...(grossAnatomy || []), ...(histology || []), ...(embryology || [])];
    case "pathology":
      return pathologyQuestions;
    case "pharmacology":
      return pharmacologyQuestions;
    case "physiology_level1":
      return physiologyLevel1;
    case "physiology_level2":
      return physiologyLevel2;
    case "physiology":
      return [...(physiologyLevel1 || []), ...(physiologyLevel2 || [])];
    default:
      return [];
  }
}

// Function to split questions into batches
function getBatches(questions, batchSize = 15) {
  const batches = [];
  for (let i = 0; i < questions.length; i += batchSize) {
    batches.push(questions.slice(i, i + batchSize));
  }
  return batches;
}

function StudyMode() {
  const { topic, subtopic } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  
  // Check if this is a retry (no XP should be awarded)
  const isRetry = location.state?.isRetry || false;
  const currentSubtopic = subtopic || location.state?.subtopic;
  const allQuestions = getQuestions(topic, currentSubtopic, location) || [];
  const batches = getBatches(allQuestions, 15);
  
  const [currentBatchIndex, setCurrentBatchIndex] = useState(0);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState("");
  const [showAnswer, setShowAnswer] = useState(false);
  const [timeLeft, setTimeLeft] = useState(45);
  const [answerStatus, setAnswerStatus] = useState(null);
  const [batchResults, setBatchResults] = useState([]);
  const [showBatchSummary, setShowBatchSummary] = useState(false);
  const [xpEarned, setXpEarned] = useState(0);

  const currentBatch = batches[currentBatchIndex] || [];
  const currentQuestion = currentBatch[currentIndex];
  const isLastQuestionInBatch = currentIndex === currentBatch.length - 1;

  const correctSound = new Audio(correctSoundFile);
  const wrongSound = new Audio(wrongSoundFile);

  useEffect(() => {
    setCurrentIndex(0);
    setSelectedAnswer("");
    setShowAnswer(false);
    setTimeLeft(45);
    setAnswerStatus(null);
    setShowBatchSummary(false);
  }, [topic, currentSubtopic, currentBatchIndex]);

  // Timer for questions
  useEffect(() => {
    if (!currentQuestion || showAnswer) return;
    if (timeLeft <= 0) {
      setShowAnswer(true);
      setAnswerStatus("timeout");
      wrongSound.play();
      return;
    }

    const timer = setInterval(() => setTimeLeft((t) => t - 1), 1000);
    return () => clearInterval(timer);
  }, [timeLeft, currentQuestion, showAnswer, wrongSound]);

  if (!topic) return <div style={{ padding: 20 }}>No topic selected.</div>;
  
  if (!allQuestions.length) {
    return (
      <div style={{ padding: 20 }}>
        No questions found for {topic}{currentSubtopic ? ` - ${currentSubtopic}` : ""}.
        <br />
        <button onClick={() => navigate("/study-dashboard")} style={{ marginTop: 20, padding: "10px 20px" }}>
          Back to Dashboard
        </button>
      </div>
    );
  }
  
  if (currentBatchIndex >= batches.length) {
    return <div style={{ padding: 20 }}>You finished all questions!</div>;
  }
  
  if (!currentQuestion) {
    return <div style={{ padding: 20 }}>Loading...</div>;
  }

  // Get question text (supports both formats)
  const questionText = currentQuestion.text || currentQuestion.question;
  
  // Check question type
  const isMCQ = currentQuestion.type === "mcq" || (currentQuestion.options && currentQuestion.options.length > 0);
  const isShort = currentQuestion.type === "short";
  
  // Get correct answer text (supports both formats)
  const getCorrectAnswerText = () => {
    if (currentQuestion.options && typeof currentQuestion.correctAnswer === 'number') {
      return currentQuestion.options[currentQuestion.correctAnswer];
    }
    return currentQuestion.correctAnswer || currentQuestion.answer;
  };

  const handleAnswer = (answer) => {
    if (showAnswer) return;
    setSelectedAnswer(answer);
    setShowAnswer(true);
    
    let isCorrect = false;
    let correctAnswerText = getCorrectAnswerText();
    
    // Handle different answer formats
    if (currentQuestion.options) {
      // MCQ with options
      if (typeof currentQuestion.correctAnswer === 'number') {
        isCorrect = answer === currentQuestion.options[currentQuestion.correctAnswer];
      } else {
        isCorrect = answer === currentQuestion.correctAnswer || answer === currentQuestion.answer;
      }
    } else {
      // Short answer or direct text
      if (typeof answer === 'string' && typeof correctAnswerText === 'string') {
        isCorrect = answer.toLowerCase().trim() === correctAnswerText.toLowerCase().trim();
      } else {
        isCorrect = answer === correctAnswerText;
      }
    }
    
    // Only add XP if NOT a retry
    const xpToAdd = (!isRetry && isCorrect) ? (currentQuestion.xpValue || 0) : 0;
    
    if (isCorrect) {
      setAnswerStatus("correct");
      if (!isRetry) {
        setXpEarned(prev => prev + xpToAdd);
      }
      correctSound.play();
    } else {
      setAnswerStatus("wrong");
      wrongSound.play();
    }

    setBatchResults(prev => [...prev, {
      id: currentQuestion.id,
      question: questionText,
      userAnswer: answer,
      correctAnswer: correctAnswerText,
      isCorrect,
      explanation: currentQuestion.explanation,
      xpEarned: isCorrect ? xpToAdd : 0
    }]);
  };

  const handleNext = () => {
    if (isLastQuestionInBatch) {
      setShowBatchSummary(true);
    } else {
      setSelectedAnswer("");
      setShowAnswer(false);
      setTimeLeft(45);
      setAnswerStatus(null);
      setCurrentIndex(currentIndex + 1);
    }
  };

  const handleNextBatch = () => {
    setBatchResults([]);
    setShowBatchSummary(false);
    setCurrentBatchIndex(currentBatchIndex + 1);
  };

  const handleReviewBatch = () => {
    navigate("/review", { state: { results: batchResults, topic, subtopic: currentSubtopic } });
  };

  const cardStyle = {
    padding: "24px",
    borderRadius: "16px",
    marginBottom: "20px",
    background: "#ffffff",
    boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
    color: "#2c3e50",
  };

  const buttonStyle = (opt) => {
    const correctAnswerText = getCorrectAnswerText();
    
    return {
      background: selectedAnswer === opt
        ? opt === correctAnswerText ? "#4CAF50" : "#dc3545"
        : "#f0f2f5",
      color: selectedAnswer === opt ? "#fff" : "#2c3e50",
      margin: "8px",
      padding: "14px 20px",
      borderRadius: "12px",
      cursor: showAnswer ? "default" : "pointer",
      minWidth: "160px",
      fontWeight: "500",
      fontSize: "1rem",
      border: "none",
      transition: "all 0.2s ease",
      boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
    };
  };

  if (showBatchSummary) {
    const correctCount = batchResults.filter(r => r.isCorrect).length;
    const score = Math.round((correctCount / batchResults.length) * 100);
    const totalXpThisBatch = batchResults.reduce((sum, r) => sum + r.xpEarned, 0);
    
    return (
      <div style={{ padding: "20px", maxWidth: "600px", margin: "0 auto" }}>
        <div style={cardStyle}>
          <h2 style={{ color: "#ff7f50", textAlign: "center", marginBottom: "20px" }}>
            {currentSubtopic || topic} - Batch {currentBatchIndex + 1} Complete!
          </h2>
          {isRetry && (
            <div style={{ 
              textAlign: "center", 
              marginBottom: "20px", 
              padding: "8px", 
              background: "#fff3e0", 
              borderRadius: "8px",
              color: "#ff7f50"
            }}>
              Practice Mode - No XP earned
            </div>
          )}
          <div style={{ textAlign: "center", margin: "30px 0" }}>
            <div style={{ fontSize: "56px", fontWeight: "bold", color: score >= 70 ? "#4CAF50" : "#dc3545" }}>
              {score}%
            </div>
            <div style={{ fontSize: "18px", marginTop: "10px", color: "#2c3e50" }}>
              {correctCount} correct out of {batchResults.length}
            </div>
            {!isRetry && (
              <div style={{ fontSize: "16px", marginTop: "8px", color: "#ff7f50", fontWeight: "500" }}>
                +{totalXpThisBatch} XP earned
              </div>
            )}
          </div>
          <div style={{ display: "flex", gap: "15px", justifyContent: "center", flexWrap: "wrap" }}>
            <button onClick={handleReviewBatch} style={{ padding: "12px 24px", borderRadius: "10px", background: "#6b5b95", color: "#fff", cursor: "pointer", border: "none", fontWeight: "500", display: "inline-flex", alignItems: "center", gap: "8px" }}>
              <span>📋</span> Review Answers
            </button>
            {currentBatchIndex < batches.length - 1 && (
              <button onClick={handleNextBatch} style={{ padding: "12px 24px", borderRadius: "10px", background: "#ff7f50", color: "#fff", cursor: "pointer", border: "none", fontWeight: "500", display: "inline-flex", alignItems: "center", gap: "8px" }}>
                <span>➡️</span> Next Batch
              </button>
            )}
            {currentBatchIndex === batches.length - 1 && (
              <button onClick={() => navigate("/study-dashboard")} style={{ padding: "12px 24px", borderRadius: "10px", background: "#4CAF50", color: "#fff", cursor: "pointer", border: "none", fontWeight: "500", display: "inline-flex", alignItems: "center", gap: "8px" }}>
                <span>📚</span> Back to Dashboard
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: "24px", maxWidth: "900px", margin: "0 auto", background: "#f8f9fa", minHeight: "100vh" }}>
      {/* Header */}
      <div style={{ marginBottom: "24px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px" }}>
          <span style={{ background: "#ff7f50", color: "white", padding: "6px 16px", borderRadius: "25px", fontSize: "14px", fontWeight: "500" }}>
            {currentSubtopic || topic}
          </span>
          <span style={{ color: "#ff7f50", fontWeight: "600", fontSize: "18px" }}>
            <span style={{ marginRight: "4px" }}>⭐</span> XP: {xpEarned}
          </span>
        </div>
        {isRetry && (
          <div style={{ marginTop: "8px", padding: "6px 12px", background: "#fff3e0", borderRadius: "8px", fontSize: "12px", color: "#ff7f50", textAlign: "center" }}>
            Practice Mode - No XP will be earned
          </div>
        )}
        <div style={{ marginTop: "16px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px", fontSize: "14px", color: "#6c757d" }}>
            <span>Batch {currentBatchIndex + 1} of {batches.length}</span>
            <span>Question {currentIndex + 1} of {currentBatch.length}</span>
          </div>
          <div style={{ height: "6px", background: "#e9ecef", borderRadius: "3px", overflow: "hidden" }}>
            <div style={{ height: "100%", width: `${((currentIndex + 1) / currentBatch.length) * 100}%`, background: "#ff7f50", borderRadius: "3px", transition: "width 0.3s ease" }} />
          </div>
        </div>
      </div>

      {/* Question Card */}
      <div style={cardStyle}>
        <div style={{ color: "#ff7f50", fontWeight: "600", marginBottom: "12px", fontSize: "14px" }}>
          <span style={{ marginRight: "4px" }}>📌</span> Question {currentIndex + 1}
        </div>
        <div style={{ fontSize: "1.6rem", fontWeight: "500", lineHeight: "1.4", marginBottom: "24px", color: "#2c3e50" }}>
          {questionText}
        </div>

        {/* MCQ Options */}
        {isMCQ && currentQuestion.options && (
          <div style={{ marginTop: "8px", display: "flex", flexWrap: "wrap", gap: "12px" }}>
            {currentQuestion.options.map((opt, idx) => (
              <button key={idx} onClick={() => handleAnswer(opt)} style={buttonStyle(opt)} disabled={showAnswer}>
                {opt}
              </button>
            ))}
          </div>
        )}

        {/* Short Answer Input */}
        {isShort && !showAnswer && (
          <div style={{ marginTop: "16px" }}>
            <textarea
              rows="4"
              placeholder="Type your answer here..."
              value={selectedAnswer}
              onChange={(e) => setSelectedAnswer(e.target.value)}
              style={{
                padding: "14px",
                width: "100%",
                borderRadius: "12px",
                border: "1px solid #dee2e6",
                fontSize: "16px",
                fontFamily: "inherit",
                resize: "vertical",
                marginBottom: "12px",
                backgroundColor: "#fff",
                color: "#2c3e50",
              }}
            />
            <div style={{ marginTop: "8px" }}>
              <div style={{ height: "6px", width: "100%", background: "#e9ecef", borderRadius: "3px" }}>
                <div
                  style={{
                    height: "6px",
                    width: `${(timeLeft / 45) * 100}%`,
                    background: timeLeft <= 10 ? "#dc3545" : "#ff7f50",
                    borderRadius: "3px",
                    transition: "width 1s linear",
                  }}
                />
              </div>
              <p style={{ fontSize: "12px", marginTop: "6px", color: "#6c757d" }}>
                ⏱️ Time left: {timeLeft}s
              </p>
            </div>
            <button
              onClick={() => {
                if (selectedAnswer.trim()) {
                  handleAnswer(selectedAnswer);
                } else {
                  alert("Please type your answer before submitting.");
                }
              }}
              style={{
                marginTop: "16px",
                padding: "12px 24px",
                borderRadius: "10px",
                background: "#ff7f50",
                color: "#fff",
                cursor: "pointer",
                border: "none",
                fontWeight: "500",
                fontSize: "14px",
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
              }}
            >
              <span>📝</span> Submit Answer
            </button>
          </div>
        )}

        {/* Show Result for Short Answer */}
        {showAnswer && isShort && (
          <div
            style={{
              background: answerStatus === "correct" ? "#e8f5e9" : "#ffebee",
              color: "#2c3e50",
              padding: "16px",
              borderRadius: "12px",
              marginTop: "16px",
              borderLeft: `4px solid ${answerStatus === "correct" ? "#4CAF50" : "#dc3545"}`,
            }}
          >
            <div style={{ marginBottom: "12px" }}>
              <span style={{ fontWeight: "600" }}>Your answer: </span>
              <span style={{ color: answerStatus === "correct" ? "#4CAF50" : "#dc3545" }}>
                {selectedAnswer || "No answer"}
              </span>
            </div>
            <div style={{ marginBottom: "12px" }}>
              <span style={{ fontWeight: "600" }}>Correct answer: </span>
              <span style={{ color: "#4CAF50" }}>
                {getCorrectAnswerText()}
              </span>
            </div>
            <div>
              <span style={{ fontWeight: "600" }}>Result: </span>
              <span style={{ color: answerStatus === "correct" ? "#4CAF50" : "#dc3545" }}>
                {answerStatus === "correct" ? "✓ Correct!" : answerStatus === "timeout" ? "⏰ Time's up!" : "✗ Incorrect"}
              </span>
              {answerStatus === "correct" && !isRetry && currentQuestion.xpValue && (
                <span style={{ marginLeft: "12px", color: "#ff7f50" }}>
                  +{currentQuestion.xpValue} XP
                </span>
              )}
              {answerStatus === "correct" && isRetry && (
                <span style={{ marginLeft: "12px", color: "#6c757d", fontSize: "12px" }}>
                  (Practice mode - no XP)
                </span>
              )}
            </div>
          </div>
        )}

        {/* Show Result for MCQ */}
        {showAnswer && !isShort && (
          <div
            style={{
              background: answerStatus === "correct" ? "#e8f5e9" : "#ffebee",
              color: "#2c3e50",
              padding: "16px",
              borderRadius: "12px",
              marginTop: "16px",
              borderLeft: `4px solid ${answerStatus === "correct" ? "#4CAF50" : "#dc3545"}`,
            }}
          >
            <div style={{ marginBottom: "12px" }}>
              <span style={{ fontWeight: "600" }}>Your answer: </span>
              <span style={{ color: answerStatus === "correct" ? "#4CAF50" : "#dc3545" }}>
                {selectedAnswer || "No answer"}
              </span>
            </div>
            <div style={{ marginBottom: "12px" }}>
              <span style={{ fontWeight: "600" }}>Correct answer: </span>
              <span style={{ color: "#4CAF50" }}>
                {getCorrectAnswerText()}
              </span>
            </div>
            <div>
              <span style={{ fontWeight: "600" }}>Result: </span>
              <span style={{ color: answerStatus === "correct" ? "#4CAF50" : "#dc3545" }}>
                {answerStatus === "correct" ? "✓ Correct!" : "✗ Incorrect"}
              </span>
              {answerStatus === "correct" && !isRetry && currentQuestion.xpValue && (
                <span style={{ marginLeft: "12px", color: "#ff7f50" }}>
                  +{currentQuestion.xpValue} XP
                </span>
              )}
              {answerStatus === "correct" && isRetry && (
                <span style={{ marginLeft: "12px", color: "#6c757d", fontSize: "12px" }}>
                  (Practice mode - no XP)
                </span>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Explanation */}
      {showAnswer && currentQuestion.explanation && (
        <div
          style={{
            background: "#f0f7f0",
            padding: "18px",
            marginTop: "12px",
            borderRadius: "12px",
            color: "#2c3e50",
            boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
            borderLeft: "4px solid #4CAF50",
          }}
        >
          <strong>📖 Explanation:</strong>
          <p style={{ marginTop: "8px", lineHeight: "1.5", color: "#4a5568" }}>{currentQuestion.explanation}</p>
        </div>
      )}

      {/* Next Button */}
      {showAnswer && (
        <button
          onClick={handleNext}
          style={{
            marginTop: "24px",
            padding: "14px 28px",
            borderRadius: "12px",
            background: "#ff7f50",
            color: "#fff",
            cursor: "pointer",
            border: "none",
            fontSize: "16px",
            width: "100%",
            fontWeight: "600",
            transition: "background 0.2s ease",
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "8px",
          }}
          onMouseEnter={(e) => e.currentTarget.style.background = "#e0673a"}
          onMouseLeave={(e) => e.currentTarget.style.background = "#ff7f50"}
        >
          <span>{isLastQuestionInBatch ? "📊" : "➡️"}</span>
          {isLastQuestionInBatch ? "See Batch Results" : "Next Question"}
        </button>
      )}
    </div>
  );
}

export default StudyMode;