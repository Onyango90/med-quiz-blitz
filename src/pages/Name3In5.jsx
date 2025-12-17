import React, { useState, useEffect } from "react";
import "./Name3In5.css";

const questions = [
  { category: "Causes of Splenomegaly", answers: ["Malaria", "Sickle Cell", "Cirrhosis"] },
  { category: "Cranial Nerves with Motor Function", answers: ["Oculomotor", "Trochlear", "Abducens"] },
  { category: "Common Causes of Fever + Rash", answers: ["Measles", "Typhoid", "Scarlet Fever"] },
  // Add more categories and answers
];

function Name3In5({ goBack }) {
  const [currentQ, setCurrentQ] = useState(0);
  const [userAnswers, setUserAnswers] = useState([]);
  const [input, setInput] = useState("");
  const [timeLeft, setTimeLeft] = useState(5);
  const [showResult, setShowResult] = useState(false);

  useEffect(() => {
    if (timeLeft > 0 && !showResult) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timer);
    } else if (timeLeft === 0) {
      checkResult();
    }
  }, [timeLeft]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (input.trim() !== "") {
      setUserAnswers([...userAnswers, input.trim()]);
      setInput("");
    }
  };

  const checkResult = () => {
    setShowResult(true);
  };

  const nextQuestion = () => {
    setCurrentQ(currentQ + 1);
    setUserAnswers([]);
    setTimeLeft(5);
    setShowResult(false);
  };

  const currentCategory = questions[currentQ];

  return (
    <div className="name3-container">
      <h1>Name 3 in 5 Seconds</h1>
      <button className="back-btn" onClick={goBack}>⬅ Back to Dashboard</button>

      {!showResult ? (
        <div>
          <h2>Category: {currentCategory.category}</h2>
          <p>Time Left: {timeLeft}s</p>
          <form onSubmit={handleSubmit}>
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Type an answer"
            />
            <button type="submit">Add</button>
          </form>
          <div className="answers">
            {userAnswers.map((a, idx) => (
              <span key={idx}>{a}</span>
            ))}
          </div>
        </div>
      ) : (
        <div className="result">
          <h2>Correct Answers: {currentCategory.answers.join(", ")}</h2>
          <h3>Your Answers: {userAnswers.join(", ")}</h3>
          <button onClick={nextQuestion}>
            {currentQ + 1 < questions.length ? "Next Question" : "Finish"}
          </button>
        </div>
      )}
    </div>
  );
}

export default Name3In5;
