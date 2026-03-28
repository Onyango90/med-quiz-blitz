// src/pages/DailyQuiz.jsx
import React, { useState, useEffect, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { auth } from "../firebase";
import { getDatabase, ref, get, set, update } from "firebase/database";
import correctSoundFile from "../sound/correct.wav";
import wrongSoundFile from "../sound/wrong.wav";
import "./DailyQuiz.css";

function DailyQuiz() {
  const location = useLocation();
  const navigate = useNavigate();
  const { questions, isDailyChallenge, xpBonus, streak, topic, userYear, questionsCount } = location.state || {};
  
  const [index, setIndex] = useState(0);
  const [userAnswer, setUserAnswer] = useState("");
  const [showResult, setShowResult] = useState(false);
  const [status, setStatus] = useState(null);
  const [timeLeft, setTimeLeft] = useState(30);
  const [score, setScore] = useState(0);
  const [quizCompleted, setQuizCompleted] = useState(false);
  const [totalXPEarned, setTotalXPEarned] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [answersList, setAnswersList] = useState([]);
  const [xpPopups, setXpPopups] = useState([]);
  const [showReview, setShowReview] = useState(false);

  const question = questions?.[index];
  const isLast = index === (questions?.length || 0) - 1;

  const correctSound = useRef(new Audio(correctSoundFile));
  const wrongSound = useRef(new Audio(wrongSoundFile));

  const showXPPopup = (xp, isCorrect) => {
    const id = Date.now();
    setXpPopups(prev => [...prev, { id, xp, isCorrect }]);
    setTimeout(() => {
      setXpPopups(prev => prev.filter(popup => popup.id !== id));
    }, 1000);
  };

  useEffect(() => {
    setUserAnswer("");
    setShowResult(false);
    setStatus(null);
    setTimeLeft(30);
  }, [index]);

  useEffect(() => {
    if (!question || showResult || quizCompleted) return;
    if (timeLeft === 0) {
      evaluateAnswer(userAnswer, true);
      return;
    }
    const t = setTimeout(() => setTimeLeft(t => t - 1), 1000);
    return () => clearTimeout(t);
  }, [timeLeft, question, showResult]);

  if (!questions || !questions.length) {
    return (
      <div className="daily-quiz-empty">
        <h2>No questions available</h2>
        <button onClick={() => navigate("/games-dashboard")}>Back to Games</button>
      </div>
    );
  }

  const evaluateAnswer = (answer, timeout = false) => {
    if (showResult) return;

    const isCorrect = timeout ? false : 
      answer?.trim().toLowerCase() === question.answer?.trim().toLowerCase();

    setShowResult(true);

    if (timeout) {
      setStatus("timeout");
      wrongSound.current.play();
      showXPPopup(0, false);
    } else if (isCorrect) {
      setStatus("correct");
      const xpToAdd = question.xpValue || 3;
      setTotalXPEarned(prev => prev + xpToAdd);
      setCorrectCount(prev => prev + 1);
      setScore(s => s + 1);
      correctSound.current.play();
      showXPPopup(xpToAdd, true);
    } else {
      setStatus("wrong");
      wrongSound.current.play();
      showXPPopup(0, false);
    }

    // Store answer WITHOUT the options array
    setAnswersList(prev => [...prev, {
      question: question.question,
      userAnswer: answer || "No answer",
      correctAnswer: question.answer,
      isCorrect: isCorrect && !timeout,
      explanation: question.explanation || "",
      xpEarned: (isCorrect && !timeout) ? (question.xpValue || 3) : 0
    }]);
  };

  const saveResults = async () => {
    const user = auth.currentUser;
    if (!user) return;

    const db = getDatabase();
    const today = new Date().toISOString().split('T')[0];
    const percentage = Math.round((correctCount / questions.length) * 100);
    
    let newStreak = streak || 0;
    if (percentage >= 60) {
      newStreak = (streak || 0) + 1;
    } else {
      newStreak = 0;
    }
    
    const bonusToAdd = (percentage >= 60) ? (xpBonus || 0) : 0;
    const finalXPEarned = totalXPEarned + bonusToAdd;
    
    // Clean answers data - remove any undefined or options fields
    const cleanAnswers = answersList.map(answer => ({
      question: answer.question || "",
      userAnswer: answer.userAnswer || "No answer",
      correctAnswer: answer.correctAnswer || "",
      isCorrect: answer.isCorrect || false,
      explanation: answer.explanation || "",
      xpEarned: answer.xpEarned || 0
    }));
    
    // Save daily challenge progress
    const challengeRef = ref(db, `users/${user.uid}/dailyChallenges/${today}`);
    await set(challengeRef, {
      date: today,
      score: correctCount,
      totalQuestions: questions.length,
      percentage: percentage,
      xpEarned: finalXPEarned,
      bonusXP: bonusToAdd,
      streak: newStreak,
      completedAt: new Date().toISOString(),
      yearOfStudy: userYear,
      answers: cleanAnswers
    });
    
    // Update user stats
    const userRef = ref(db, `users/${user.uid}/stats`);
    const snapshot = await get(userRef);
    const currentStats = snapshot.exists() ? snapshot.val() : {};
    
    const newTotalXP = (currentStats.totalXP || 0) + finalXPEarned;
    const newTotalAttempted = (currentStats.totalAttempted || 0) + questions.length;
    const newTotalCorrect = (currentStats.totalCorrect || 0) + correctCount;
    const newAccuracy = Math.round((newTotalCorrect / newTotalAttempted) * 100);
    
    await update(userRef, {
      totalXP: newTotalXP,
      totalAttempted: newTotalAttempted,
      totalCorrect: newTotalCorrect,
      accuracy: newAccuracy,
      streak: newStreak,
      lastActiveDate: today,
      dailyChallengesCompleted: (currentStats.dailyChallengesCompleted || 0) + 1,
      sessionsCompleted: (currentStats.sessionsCompleted || 0) + 1
    });
  };

  const handleNext = () => {
    if (isLast) {
      setQuizCompleted(true);
      saveResults();
    } else {
      setIndex(i => i + 1);
    }
  };

  if (quizCompleted) {
    const percentage = Math.round((correctCount / questions.length) * 100);
    const totalXP = totalXPEarned + (percentage >= 60 ? (xpBonus || 0) : 0);
    
    if (showReview) {
      return (
        <div className="review-screen">
          <div className="review-header">
            <h1>📋 Answer Review</h1>
            <button className="back-btn" onClick={() => setShowReview(false)}>Back to Summary</button>
          </div>
          <div className="review-list">
            {answersList.map((ans, idx) => (
              <div key={idx} className={`review-card ${ans.isCorrect ? "review-correct" : "review-wrong"}`}>
                <div className="review-question">Q{idx + 1}: {ans.question}</div>
                <div className="review-answer">
                  <span className="review-label">Your answer:</span>
                  <span className={ans.isCorrect ? "correct-text" : "wrong-text"}>{ans.userAnswer}</span>
                </div>
                <div className="review-correct-answer">
                  <span className="review-label">Correct answer:</span>
                  <span className="correct-text">{ans.correctAnswer}</span>
                </div>
                {ans.explanation && (
                  <div className="review-explanation">
                    <span className="review-label">Explanation:</span>
                    <p>{ans.explanation}</p>
                  </div>
                )}
                <div className="review-xp">
                  {ans.isCorrect ? `+${ans.xpEarned} XP` : "0 XP"}
                </div>
              </div>
            ))}
          </div>
          <div className="review-actions">
            <button onClick={() => navigate("/games-dashboard")}>🎮 Back to Games</button>
            <button onClick={() => navigate("/home")}>🏠 Home</button>
          </div>
        </div>
      );
    }
    
    return (
      <div className="quiz-completion-screen">
        <div className="completion-card">
          <div className="completion-icon">🏆</div>
          <h1>Challenge Complete!</h1>
          
          <div className="completion-stats">
            <div className="stat-card">
              <div className="stat-number">{correctCount}/{questions.length}</div>
              <div className="stat-label">Correct</div>
            </div>
            <div className="stat-card">
              <div className="stat-number">{percentage}%</div>
              <div className="stat-label">Score</div>
            </div>
            <div className="stat-card highlight">
              <div className="stat-number">+{totalXP}</div>
              <div className="stat-label">Total XP</div>
            </div>
          </div>
          
          <div className="streak-result">
            {percentage >= 60 ? (
              <div className="streak-success">🔥 {streak + 1} Day Streak! Keep it up!</div>
            ) : (
              <div className="streak-fail">📚 Keep studying to build your streak!</div>
            )}
          </div>
          
          <div className="completion-buttons">
            <button className="btn-review" onClick={() => setShowReview(true)}>📋 Review Answers</button>
            <button className="btn-primary" onClick={() => navigate("/games-dashboard")}>🎮 More Games</button>
            <button className="btn-secondary" onClick={() => navigate("/home")}>🏠 Home</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="daily-quiz-container">
      {xpPopups.map((popup) => (
        <div key={popup.id} className={`xp-popup ${popup.isCorrect ? "correct" : "wrong"}`}>
          {popup.isCorrect ? `+${popup.xp} XP` : "✗"}
        </div>
      ))}

      <div className="quiz-header">
        <div className="quiz-title">
          <span className="icon">⭐</span>
          Daily Challenge
        </div>
        <div className="quiz-streak">🔥 {streak || 0} Day Streak</div>
      </div>

      <div className="quiz-progress">
        <div className="progress-info">
          <span>Question {index + 1} of {questions.length}</span>
          <span>Score: {score}</span>
        </div>
        <div className="progress-bar">
          <div className="progress-fill" style={{ width: `${((index + 1) / questions.length) * 100}%` }} />
        </div>
        <div className="xp-total">⭐ XP: {totalXPEarned}</div>
      </div>

      <div className="question-card">
        <div className="question-text">{question.question}</div>

        {question.options && (
          <div className="options-grid">
            {question.options.map((opt, idx) => (
              <button
                key={idx}
                className={`option-btn ${showResult ? (opt === question.answer ? "correct-answer" : opt === userAnswer ? "wrong-answer" : "") : ""}`}
                onClick={() => evaluateAnswer(opt)}
                disabled={showResult}
              >
                {opt}
              </button>
            ))}
          </div>
        )}

        {!question.options && !showResult && (
          <div className="short-answer-area">
            <textarea
              rows="3"
              placeholder="Type your answer here..."
              value={userAnswer}
              onChange={(e) => setUserAnswer(e.target.value)}
            />
            <div className="timer-bar">
              <div className="timer-fill" style={{ width: `${(timeLeft / 30) * 100}%` }} />
              <span className="timer-text">⏱️ {timeLeft}s</span>
            </div>
            <button className="submit-btn" onClick={() => evaluateAnswer(userAnswer)}>Submit Answer</button>
          </div>
        )}

        {showResult && (
          <div className={`result-badge ${status}`}>
            {status === "correct" && "✓ Correct!"}
            {status === "wrong" && "✗ Incorrect"}
            {status === "timeout" && "⏰ Time's up!"}
          </div>
        )}
      </div>

      {showResult && (
        <button className="next-btn" onClick={handleNext}>
          {isLast ? "Finish Challenge" : "Next Question"}
          <span className="arrow">→</span>
        </button>
      )}
    </div>
  );
}

export default DailyQuiz;