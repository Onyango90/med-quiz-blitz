import React, { useState, useEffect } from "react";
import { getQuestions } from "../data/questions";
import correctSoundFile from "../sound/correct.mp3";
import wrongSoundFile from "../sound/wrong.mp3";

function StudyMode({ topic }) {
  const questions = getQuestions(topic) || [];
  const [index, setIndex] = useState(0);
  const [userAnswer, setUserAnswer] = useState("");
  const [showAnswer, setShowAnswer] = useState(false);
  const [status, setStatus] = useState(null);
  const [timeLeft, setTimeLeft] = useState(15);

  const question = questions[index];

  /* reset when topic changes */
  useEffect(() => {
    setIndex(0);
    resetState();
  }, [topic]);

  const resetState = () => {
    setUserAnswer("");
    setShowAnswer(false);
    setStatus(null);
    setTimeLeft(15);
  };

  /* SAQ timer */
  useEffect(() => {
    if (!question || question.type !== "short" || showAnswer) return;

    if (timeLeft === 0) {
      evaluateAnswer(userAnswer, true);
      return;
    }

    const t = setTimeout(() => setTimeLeft(t => t - 1), 1000);
    return () => clearTimeout(t);
  }, [timeLeft, question, showAnswer]);

  if (!questions.length)
    return <p style={{ padding: 20 }}>⚠️ No questions found for {topic}</p>;

  if (!question)
    return <p style={{ padding: 20 }}>🎉 You finished all {topic} questions!</p>;

  const correctSound = new Audio(correctSoundFile);
  const wrongSound = new Audio(wrongSoundFile);

  const evaluateAnswer = (answer, timeout = false) => {
    if (showAnswer) return;

    const correct =
      answer.trim().toLowerCase() ===
      question.answer.trim().toLowerCase();

    setShowAnswer(true);

    if (timeout) {
      setStatus("timeout");
      wrongSound.play();
    } else if (correct) {
      setStatus("correct");
      correctSound.play();
    } else {
      setStatus("wrong");
      wrongSound.play();
    }
  };

  const nextQuestion = () => {
    setIndex(i => i + 1);
    resetState();
  };

  /* styles */
  const card = {
    background: "#fff3e6",
    padding: 20,
    borderRadius: 12,
    boxShadow: "0 4px 10px rgba(0,0,0,.1)",
    marginBottom: 15,
  };

  const optionBtn = (opt) => ({
    padding: "12px 18px",
    margin: 6,
    borderRadius: 8,
    cursor: "pointer",
    border: "none",
    fontWeight: "bold",
    background:
      showAnswer && opt === question.answer
        ? "#4CAF50"
        : showAnswer && opt === userAnswer
        ? "#F44336"
        : "#ffdca8",
    color: showAnswer ? "#fff" : "#000",
  });

  return (
    <div style={{ padding: 20 }}>

      {/* Progress */}
      <p>
        Question {index + 1} / {questions.length}
      </p>

      <div style={card}>
        <h3 style={{ color: "#ff7f50" }}>{question.question}</h3>

        {/* MCQ */}
        {question.type === "mcq" && (
          <div>
            {question.options.map((opt, i) => (
              <button
                key={i}
                style={optionBtn(opt)}
                onClick={() => {
                  setUserAnswer(opt);
                  evaluateAnswer(opt);
                }}
              >
                {opt}
              </button>
            ))}
          </div>
        )}

        {/* SAQ */}
        {question.type === "short" && !showAnswer && (
          <>
            <input
              value={userAnswer}
              onChange={(e) => setUserAnswer(e.target.value)}
              placeholder="Type your answer..."
              style={{
                width: "80%",
                padding: 10,
                borderRadius: 8,
                fontSize: 16,
              }}
            />

            {/* Timer bar */}
            <div style={{ width: "80%", height: 10, background: "#ddd", marginTop: 10 }}>
              <div
                style={{
                  height: 10,
                  width: `${(timeLeft / 15) * 100}%`,
                  background: "#ff7f50",
                  transition: "width 1s linear",
                }}
              />
            </div>

            <p>⏱ {timeLeft}s</p>

            <button
              onClick={() => evaluateAnswer(userAnswer)}
              style={{
                marginTop: 10,
                padding: "8px 16px",
                borderRadius: 8,
                background: "#6b5b95",
                color: "#fff",
                border: "none",
                cursor: "pointer",
              }}
            >
              Submit Answer
            </button>
          </>
        )}
      </div>

      {/* Feedback */}
      {showAnswer && (
        <>
          <div
            style={{
              padding: 15,
              borderRadius: 8,
              background:
                status === "correct"
                  ? "#4CAF50"
                  : "#F44336",
              color: "#fff",
              fontWeight: "bold",
            }}
          >
            Correct Answer: {question.answer}
          </div>

          <div style={card}>
            <strong>Explanation</strong>
            <p>{question.explanation}</p>
          </div>

          <button
            onClick={nextQuestion}
            style={{
              padding: "10px 20px",
              borderRadius: 8,
              background: "#ff7f50",
              color: "#fff",
              border: "none",
              cursor: "pointer",
            }}
          >
            Next ➡️
          </button>
        </>
      )}
    </div>
  );
}

export default StudyMode;
