// src/pages/ReviewPage.jsx
import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import "./ReviewPage.css"; // ensure this exists

const ReviewPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const results = location.state?.results || [];

  const [totalXP, setTotalXP] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);

  useEffect(() => {
    let xp = 0;
    let correct = 0;
    results.forEach((res) => {
      xp += res.xpEarned || 0;
      if (res.correct) correct += 1;
    });
    setTotalXP(xp);
    setCorrectCount(correct);
  }, [results]);

  if (!results.length) {
    return (
      <div className="review-page-empty" style={{ textAlign: "center", padding: "2rem" }}>
        <h2>No quiz data to review!</h2>
        <button
          onClick={() => navigate("/home")}
          style={{
            padding: "12px 25px",
            borderRadius: "10px",
            border: "none",
            backgroundColor: "#2ecc71",
            color: "#fff",
            cursor: "pointer",
            fontWeight: 600,
            marginTop: "1rem",
          }}
        >
          🏠 Back to Home
        </button>
      </div>
    );
  }

  return (
    <div className="review-page" style={{ textAlign: "center", padding: "2rem" }}>
      <h1>📖 Quiz Review</h1>

      {/* Summary */}
      <section className="review-summary" style={{ margin: "1.5rem 0" }}>
        <p>
          ✅ Correct Answers: {correctCount} / {results.length}
        </p>
        <p>🌟 Total XP Earned: {totalXP}</p>
      </section>

      {/* Questions Review */}
      <section className="questions-review">
        {results.map((res, idx) => (
          <div
            key={idx}
            className={`question-card ${res.correct ? "correct" : "wrong"}`}
            style={{
              borderRadius: "12px",
              padding: "1.2rem",
              margin: "1.2rem auto",
              maxWidth: "720px",
              textAlign: "left",
              backgroundColor: "#f9fafb",
              border: `2px solid ${res.correct ? "#2ecc71" : "#e74c3c"}`,
              boxShadow: "0 6px 12px rgba(0,0,0,0.08)",
            }}
          >
            <p style={{ fontSize: "1.1rem", fontWeight: 600 }}>
              Q{idx + 1}: {res.question}
            </p>

            <p style={{ marginTop: "0.6rem" }}>
              <strong>Your Answer:</strong>{" "}
              {res.selected && res.selected !== "" ? res.selected : "No answer"}
            </p>

            <p style={{ marginTop: "0.4rem" }}>
              <strong>Correct:</strong> {res.correct ? "✅ Yes" : "❌ No"} | XP:{" "}
              {res.xpEarned}
            </p>

            {/* ✅ Correct Answer */}
            <p style={{ marginTop: "0.6rem", color: "#155724", fontWeight: 600 }}>
              <strong>Correct Answer:</strong>{" "}
              {res.correctAnswer || "—"}
            </p>

            {/* ✅ Explanation (only if present) */}
            {res.explanation && (
              <div
                style={{
                  marginTop: "0.6rem",
                  background: "#eef2f6",
                  padding: "0.8rem",
                  borderRadius: "8px",
                  fontSize: "0.95rem",
                  lineHeight: "1.5",
                }}
              >
                <strong>Explanation:</strong> {res.explanation}
              </div>
            )}
          </div>
        ))}
      </section>

      {/* Navigation */}
      <section className="review-cta" style={{ marginTop: "2rem" }}>
        <button
          onClick={() => navigate("/home")}
          style={{
            padding: "12px 25px",
            borderRadius: "10px",
            border: "none",
            backgroundColor: "#2ecc71",
            color: "#fff",
            cursor: "pointer",
            fontWeight: 600,
          }}
        >
          🏠 Back to Home
        </button>
      </section>
    </div>
  );
};

export default ReviewPage;
