// src/game/quizEngine.js

// Temporary in-memory user stats (replace with DB/localStorage later)
let userStats = {
    xp: 0,
    streak: 0,
    totalQuestions: 0,
    correctAnswers: 0,
  };
  
  // Function to start the quiz
  export function startQuiz(questions) {
    if (!questions || questions.length === 0) {
      alert("No questions available!");
      return;
    }
  
    let currentIndex = 0;
  
    const nextQuestion = () => {
      if (currentIndex >= questions.length) {
        finishQuiz();
        return;
      }
  
      const q = questions[currentIndex];
      let userAnswer = null;
  
      // MCQ
      if (q.type === "mcq") {
        userAnswer = prompt(`${q.question}\nOptions: ${q.options.join(", ")}`);
        if (userAnswer?.trim().toLowerCase() === q.answer.toLowerCase()) {
          addXP(10);
          userStats.correctAnswers++;
        }
      }
  
      // SAQ
      else if (q.type === "short" || q.type === "saq") {
        userAnswer = prompt(q.question);
        if (userAnswer?.trim().toLowerCase() === q.answer.toLowerCase()) {
          addXP(15);
          userStats.correctAnswers++;
        }
      }
  
      // LIST (Name 3 in 10 sec)
      else if (q.type === "LIST") {
        userAnswer = prompt(`${q.question}\nType ${q.answers.length} items separated by commas (time: ${q.timeLimit}s)`);
        if (userAnswer) {
          const answersGiven = userAnswer.split(",").map(a => a.trim().toLowerCase());
          const correctCount = q.answers.filter(ans => answersGiven.includes(ans.toLowerCase())).length;
  
          // Partial credit: each correct answer gives 5 XP
          const xpEarned = correctCount * 5;
          addXP(xpEarned);
  
          if (correctCount === q.answers.length) userStats.correctAnswers++;
        }
      }
  
      userStats.totalQuestions++;
      currentIndex++;
      nextQuestion();
    };
  
    const addXP = (xp) => {
      userStats.xp += xp;
    };
  
    const finishQuiz = () => {
      alert(
        `Quiz Finished!\nCorrect Answers: ${userStats.correctAnswers}/${userStats.totalQuestions}\nXP Earned: ${userStats.xp}\nCurrent Streak: ${userStats.streak}`
      );
      // TODO: save stats to localStorage or backend
      console.log("Final Stats:", userStats);
    };
  
    // Start the first question
    nextQuestion();
  }
  