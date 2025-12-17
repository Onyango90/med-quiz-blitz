import React, { useState, useEffect } from "react";

const questionBank = [
  {
    question: "Name 3 gram-positive cocci.",
    validAnswers: ["staphylococcus", "streptococcus", "enterococcus"],
  },
  {
    question: "Name 3 causes of microcytic anemia.",
    validAnswers: ["iron deficiency", "thalassemia", "chronic disease"],
  },
  {
    question: "Name 3 STIs caused by bacteria.",
    validAnswers: ["gonorrhea", "chlamydia", "syphilis"],
  }
];

function ThreeInThirty({ goBack }) {
  const [index, setIndex] = useState(0);
  const [timeLeft, setTimeLeft] = useState(30);
  const [answers, setAnswers] = useState(["", "", ""]);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    if (timeLeft === 0) return;

    const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
    return () => clearTimeout(timer);
  }, [timeLeft]);

  const submit = () => {
    setSubmitted(true);
  };

  const next = () => {
    setIndex((i) => (i + 1) % questionBank.length);
    setAnswers(["", "", ""]);
    setSubmitted(false);
    setTimeLeft(30);
  };

  return (
    <div className="game-container">
      <h2 className="game-title">3 in 30 Seconds</h2>
  
      <h3>Time Left: {timeLeft}s</h3>
  
      <div className="question-card">
        {questionBank[index].question}
      </div>
  
      {!submitted ? (
        <>
          {answers.map((a, i) => (
            <input
              key={i}
              className="answer-input"
              placeholder={`Answer ${i + 1}`}
              value={a}
              onChange={(e) => {
                const newA = [...answers];
                newA[i] = e.target.value;
                setAnswers(newA);
              }}
            />
          ))}
          <button className="game-btn" onClick={submit}>Submit</button>
        </>
      ) : (
        <div>
          <h3>Valid Answers:</h3>
          <div className="answer-box">
            {questionBank[index].validAnswers.map((v, i) => (
              <p key={i}>• {v}</p>
            ))}
          </div>
          <button className="game-btn" onClick={next}>Next</button>
        </div>
      )}
  
      <button className="game-btn" onClick={goBack}>⬅ Back</button>
    </div>
  );
  
}

export default ThreeInThirty;
