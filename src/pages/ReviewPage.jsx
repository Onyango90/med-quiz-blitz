import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import "./ReviewPage.css";

const ReviewPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const results = location.state?.results || [];
  const { topic, subtopic } = location.state || {};

  const [totalXP, setTotalXP] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);

  useEffect(() => {
    let xp = 0;
    let correct = 0;
    results.forEach((res) => {
      xp += res.xpEarned || 0;
      if (res.isCorrect) correct += 1;
    });
    setTotalXP(xp);
    setCorrectCount(correct);
  }, [results]);

  if (!results.length) {
    return (
      <div className="review-page-empty" style={{ textAlign: "center", padding: "2rem" }}>
        <h2>No quiz data to review!</h2>
        <button
          onClick={() => navigate("/study-dashboard")}
          style={{
            padding: "12px 25px",
            borderRadius: "10px",
            border: "none",
            backgroundColor: "#ff7f50",
            color: "#fff",
            cursor: "pointer",
            fontWeight: 600,
            marginTop: "1rem",
          }}
        >
          Back to Study Dashboard
        </button>
      </div>
    );
  }

  // Get all the original questions for retry (without XP)
  const originalQuestions = results.map(r => ({
    text: r.question,
    options: r.options,
    correctAnswer: r.correctAnswer,
    answer: r.correctAnswer,
    explanation: r.explanation,
    xpValue: 0,
    id: r.id
  }));

  const handleRetryBatch = () => {
    let path = "";
    
    // Map the subtopic name to the correct URL format
    const subtopicMap = {
      "Gross Anatomy": "gross_anatomy",
      "Histology": "histology", 
      "Embryology": "embryology",
      "Antibiotics": "antibiotics",
      "Cardiovascular": "cardiovascular",
      "CNS Drugs": "cns",
      "Endocrine": "endocrine",
      "All Pharmacology": "pharmacology"
    };
    
    // If we have a specific path from the original navigation
    if (location.state?.originalPath) {
      path = location.state.originalPath;
    }
    // If we have a subtopic
    else if (subtopic) {
      const mappedSubtopic = subtopicMap[subtopic] || subtopic.toLowerCase().replace(/ /g, "_");
      path = `/study/${mappedSubtopic}`;
    } 
    // If we have a main topic
    else if (topic) {
      path = `/study/${topic}`;
    } 
    // Fallback
    else {
      path = "/study-dashboard";
    }
    
    console.log("Retry path:", path);
    
    navigate(path, { 
      state: { 
        questions: originalQuestions,
        noXP: true,
        isRetry: true,
        subtopic: subtopic,
        topic: topic,
        originalPath: path
      } 
    });
  };

  const handleNextBatch = () => {
    navigate("/study-dashboard");
  };

  return (
    <div className="review-page" style={{ textAlign: "center", padding: "2rem" }}>
      <h1 style={{ color: "#ff7f50", marginBottom: "1rem" }}>
        <span style={{ marginRight: "8px" }}>📖</span> Quiz Review
      </h1>

      {/* Summary */}
      <section className="review-summary" style={{ margin: "1.5rem 0" }}>
        <div style={{ 
          display: "inline-block", 
          background: "#f0f0f0", 
          padding: "1rem 2rem", 
          borderRadius: "12px",
          textAlign: "center"
        }}>
          <p style={{ fontSize: "1.2rem", margin: "0.5rem 0" }}>
            <span style={{ marginRight: "8px" }}>✓</span>
            Correct Answers: <strong>{correctCount}</strong> / {results.length}
          </p>
          <p style={{ fontSize: "1.2rem", margin: "0.5rem 0" }}>
            <span style={{ marginRight: "8px" }}>🎯</span>
            Score: <strong>{Math.round((correctCount / results.length) * 100)}%</strong>
          </p>
          <p style={{ fontSize: "1.2rem", margin: "0.5rem 0", color: "#ff7f50" }}>
            <span style={{ marginRight: "8px" }}>⭐</span>
            XP Earned: <strong>{totalXP}</strong>
          </p>
        </div>
      </section>

      {/* Questions Review */}
      <section className="questions-review">
        {results.map((res, idx) => (
          <div
            key={idx}
            className={`question-card ${res.isCorrect ? "correct" : "wrong"}`}
            style={{
              borderRadius: "12px",
              padding: "1.2rem",
              margin: "1.2rem auto",
              maxWidth: "720px",
              textAlign: "left",
              backgroundColor: "#f9fafb",
              borderLeft: `6px solid ${res.isCorrect ? "#4CAF50" : "#dc3545"}`,
              boxShadow: "0 6px 12px rgba(0,0,0,0.08)",
            }}
          >
            <p style={{ fontSize: "1.1rem", fontWeight: 600, marginBottom: "0.8rem", color: "#2c3e50" }}>
              Q{idx + 1}: {res.question}
            </p>

            <div style={{ marginBottom: "0.6rem" }}>
              <span style={{ fontWeight: "600" }}>Your Answer: </span>
              <span style={{ color: res.isCorrect ? "#4CAF50" : "#dc3545", fontWeight: 500 }}>
                {res.userAnswer && res.userAnswer !== "" ? res.userAnswer : "No answer"}
              </span>
            </div>

            <div style={{ marginBottom: "0.6rem" }}>
              <span style={{ fontWeight: "600" }}>Correct Answer: </span>
              <span style={{ color: "#4CAF50", fontWeight: 500 }}>
                {res.correctAnswer || "—"}
              </span>
            </div>

            <div style={{ marginBottom: "0.6rem" }}>
              <span style={{ fontWeight: "600" }}>Result: </span>
              <span style={{ color: res.isCorrect ? "#4CAF50" : "#dc3545", fontWeight: 600 }}>
                {res.isCorrect ? "Correct" : "Incorrect"}
              </span>
              <span style={{ marginLeft: "1rem", color: "#ff7f50" }}>
                +{res.xpEarned || 0} XP
              </span>
            </div>

            {res.explanation && (
              <div
                style={{
                  marginTop: "0.8rem",
                  background: "#eef2f6",
                  padding: "0.8rem",
                  borderRadius: "8px",
                  fontSize: "0.95rem",
                  lineHeight: "1.5",
                  color: "#2c3e50"
                }}
              >
                <strong>📖 Explanation:</strong> {res.explanation}
              </div>
            )}
          </div>
        ))}
      </section>

      {/* Navigation */}
      <section className="review-cta" style={{ marginTop: "2rem", display: "flex", gap: "1rem", justifyContent: "center", flexWrap: "wrap" }}>
        <button
          onClick={() => navigate("/study-dashboard")}
          style={{
            padding: "12px 25px",
            borderRadius: "10px",
            border: "none",
            backgroundColor: "#6b5b95",
            color: "#fff",
            cursor: "pointer",
            fontWeight: 600,
            display: "inline-flex",
            alignItems: "center",
            gap: "8px",
          }}
        >
          <span>📚</span> Study Dashboard
        </button>
        
        <button
          onClick={handleRetryBatch}
          style={{
            padding: "12px 25px",
            borderRadius: "10px",
            border: "none",
            backgroundColor: "#ff7f50",
            color: "#fff",
            cursor: "pointer",
            fontWeight: 600,
            display: "inline-flex",
            alignItems: "center",
            gap: "8px",
          }}
        >
          <span>🔄</span> Retry This Batch (No XP)
        </button>
        
        <button
          onClick={handleNextBatch}
          style={{
            padding: "12px 25px",
            borderRadius: "10px",
            border: "none",
            backgroundColor: "#4CAF50",
            color: "#fff",
            cursor: "pointer",
            fontWeight: 600,
            display: "inline-flex",
            alignItems: "center",
            gap: "8px",
          }}
        >
          <span>➡️</span> Next Batch
        </button>
      </section>
    </div>
  );
};

export default ReviewPage;