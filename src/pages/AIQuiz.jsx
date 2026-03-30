// src/pages/AIQuiz.jsx
import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./AIQuiz.css";

const SUBJECTS = [
  { label: "Anatomy", icon: "🦴", subtopics: ["Gross Anatomy", "Histology", "Embryology"] },
  { label: "Pathology", icon: "🧫", subtopics: ["Inflammation", "Neoplasia", "Organ Pathology"] },
  { label: "Physiology", icon: "💓", subtopics: ["Cardiovascular", "Respiratory", "Renal"] },
  { label: "Microbiology", icon: "🦠", subtopics: ["Bacteriology", "Virology", "Mycology"] },
  { label: "Pharmacology", icon: "💊", subtopics: ["Antibiotics", "CNS Drugs", "Cardiovascular Drugs"] },
  { label: "Clinical Skills", icon: "🩺", subtopics: ["History Taking", "Examination", "Procedures"] },
  { label: "Biochemistry", icon: "⚗️", subtopics: ["Metabolism", "Enzymes", "Genetics"] },
  { label: "Immunology", icon: "🛡️", subtopics: ["Innate Immunity", "Adaptive Immunity", "Hypersensitivity"] },
];

const DIFFICULTIES = [
  { label: "Easy",   value: "easy",   color: "#4caf50", desc: "Core concepts & definitions" },
  { label: "Medium", value: "medium", color: "#ff9800", desc: "Applied knowledge & reasoning" },
  { label: "Hard",   value: "hard",   color: "#f44336", desc: "Complex & exam-level questions" },
];

const QUESTION_TYPES = [
  { label: "MCQ",          value: "mcq",   icon: "☑️", desc: "4 options, one correct" },
  { label: "Short Answer", value: "short", icon: "✏️", desc: "Type your answer" },
];

const COUNTS = [5, 10, 15, 20];

// ─── Main Page ───────────────────────────────────────────────────────────────

export default function AIQuiz() {
  const navigate = useNavigate();
  const [step, setStep] = useState("config"); // config | loading | quiz | done
  const [config, setConfig] = useState({
    subject: null,
    subtopic: "",
    difficulty: "medium",
    type: "mcq",
    count: 10,
  });
  const [questions, setQuestions]   = useState([]);
  const [error, setError]           = useState("");
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers]       = useState([]);
  const [selected, setSelected]     = useState(null);
  const [typed, setTyped]           = useState("");
  const [feedback, setFeedback]     = useState(null);
  const [score, setScore]           = useState(0);
  const [loadingMsg, setLoadingMsg] = useState("");
  const inputRef = useRef(null);

  const loadingMessages = [
    "Consulting the textbooks... 📚",
    "Brewing clinical questions... 🧪",
    "Asking the professor... 🎓",
    "Calibrating difficulty... ⚙️",
    "Almost ready... ✨",
  ];

  useEffect(() => {
    if (step !== "loading") return;
    let i = 0;
    setLoadingMsg(loadingMessages[0]);
    const interval = setInterval(() => {
      i = (i + 1) % loadingMessages.length;
      setLoadingMsg(loadingMessages[i]);
    }, 1800);
    return () => clearInterval(interval);
  }, [step]);

  useEffect(() => {
    if (step === "quiz" && config.type === "short" && inputRef.current) {
      inputRef.current.focus();
    }
  }, [step, currentIndex]);

  // ── Build prompt ─────────────────────────────────────────────────────────
  const buildPrompt = () => {
    const topicStr = config.subtopic
      ? `${config.subject} — specifically ${config.subtopic}`
      : config.subject;

    const typeInstructions =
      config.type === "mcq"
        ? `Each question must be MCQ with exactly 4 options labeled A, B, C, D. The "answer" field must be the FULL text of the correct option (not just the letter).`
        : `Each question must be a short-answer question. The "answer" field must be a concise 1–5 word answer.`;

    const difficultyGuide =
      config.difficulty === "easy"
        ? "Focus on core definitions and basic mechanisms"
        : config.difficulty === "medium"
        ? "Include applied reasoning and clinical correlation"
        : "Include complex pathophysiology, drug interactions, and exam-level reasoning";

    const schema =
      config.type === "mcq"
        ? `{
  "question": "string — the full question text",
  "options": ["A. text", "B. text", "C. text", "D. text"],
  "answer": "string — the full text of the correct option e.g. A. Penicillin",
  "explanation": "string — 1-2 sentence explanation of why the answer is correct",
  "type": "mcq"
}`
        : `{
  "question": "string — the full question text",
  "answer": "string — concise correct answer",
  "explanation": "string — 1-2 sentence explanation",
  "type": "short"
}`;

    return `You are a medical education expert creating exam-style questions for medical students.

Generate exactly ${config.count} ${config.difficulty}-difficulty questions on the topic: ${topicStr}.

${typeInstructions}

Respond ONLY with a valid JSON array, no markdown, no preamble. Each object must follow this exact schema:
${schema}

Rules:
- Questions must be clinically relevant and medically accurate
- ${difficultyGuide}
- Never repeat questions
- Return ONLY the JSON array, starting with [ and ending with ]`;
  };

  // ── Generate questions via DeepSeek API ──────────────────────────────────
  //
  //  .env setup (project root, same folder as package.json):
  //    REACT_APP_DEEPSEEK_API_KEY=sk-xxxxxxxxxxxxxxxxxxxxxxxx
  //
  //  Then restart: npm start
  //
  const generateQuestions = async () => {
    if (!config.subject) {
      setError("Please choose a subject first.");
      return;
    }

    const apiKey = process.env.REACT_APP_DEEPSEEK_API_KEY;
    if (!apiKey) {
      setError(
        "API key not found. Create a .env file in your project root with: REACT_APP_DEEPSEEK_API_KEY=your_key_here  — then restart npm start."
      );
      return;
    }

    setError("");
    setStep("loading");

    try {
      // DeepSeek uses the OpenAI-compatible chat completions endpoint
      const response = await fetch("https://api.deepseek.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${apiKey}`,  // ← DeepSeek uses Bearer token, not x-api-key
        },
        body: JSON.stringify({
          model: "deepseek-chat",               // ← DeepSeek's model name
          max_tokens: 4000,
          temperature: 0.7,
          messages: [
            {
              role: "system",
              content: "You are a medical education expert. Always respond with valid JSON only — no markdown, no explanation outside the JSON array.",
            },
            {
              role: "user",
              content: buildPrompt(),
            },
          ],
        }),
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData?.error?.message || `API error: ${response.status}`);
      }

      const data = await response.json();

      // DeepSeek (OpenAI-compatible) response shape:
      //   data.choices[0].message.content  ← the text
      const raw = data.choices?.[0]?.message?.content || "";
      const clean = raw.replace(/```json|```/g, "").trim();
      const parsed = JSON.parse(clean);

      if (!Array.isArray(parsed) || parsed.length === 0) {
        throw new Error("No questions returned. Please try again.");
      }

      setQuestions(parsed);
      setCurrentIndex(0);
      setAnswers([]);
      setSelected(null);
      setTyped("");
      setFeedback(null);
      setScore(0);
      setStep("quiz");
    } catch (err) {
      console.error("DeepSeek API error:", err);
      setError(`Failed to generate questions: ${err.message}`);
      setStep("config");
    }
  };

  // ── Answer handling ──────────────────────────────────────────────────────
  const handleAnswer = (option) => {
    if (feedback !== null) return;
    const q = questions[currentIndex];
    const isCorrect = option.trim().toLowerCase() === q.answer.trim().toLowerCase();
    setSelected(option);
    setFeedback(isCorrect ? "correct" : "wrong");
    if (isCorrect) setScore((s) => s + 1);
    setAnswers((prev) => [
      ...prev,
      { question: q.question, selected: option, correct: isCorrect, answer: q.answer, explanation: q.explanation },
    ]);
  };

  const handleShortSubmit = () => {
    if (feedback !== null || !typed.trim()) return;
    const q = questions[currentIndex];
    const isCorrect = typed.trim().toLowerCase() === q.answer.trim().toLowerCase();
    setFeedback(isCorrect ? "correct" : "wrong");
    if (isCorrect) setScore((s) => s + 1);
    setAnswers((prev) => [
      ...prev,
      { question: q.question, selected: typed, correct: isCorrect, answer: q.answer, explanation: q.explanation },
    ]);
  };

  const next = () => {
    if (currentIndex + 1 >= questions.length) {
      setStep("done");
    } else {
      setCurrentIndex((i) => i + 1);
      setSelected(null);
      setTyped("");
      setFeedback(null);
    }
  };

  const restart = () => {
    setStep("config");
    setConfig({ subject: null, subtopic: "", difficulty: "medium", type: "mcq", count: 10 });
    setQuestions([]);
    setAnswers([]);
    setScore(0);
  };

  const goToReview = () => {
    navigate("/review", { state: { results: answers } });
  };

  // ── Render ───────────────────────────────────────────────────────────────
  if (step === "loading") return <LoadingScreen message={loadingMsg} />;
  if (step === "quiz")
    return (
      <QuizScreen
        question={questions[currentIndex]}
        index={currentIndex}
        total={questions.length}
        score={score}
        config={config}
        selected={selected}
        typed={typed}
        setTyped={setTyped}
        feedback={feedback}
        inputRef={inputRef}
        onAnswer={handleAnswer}
        onShortSubmit={handleShortSubmit}
        onNext={next}
      />
    );
  if (step === "done")
    return (
      <DoneScreen
        score={score}
        total={questions.length}
        answers={answers}
        config={config}
        onRestart={restart}
        onReview={goToReview}
      />
    );

  // Config screen
  return (
    <div className="aiq-page">
      <div className="aiq-header">
        <button className="aiq-back" onClick={() => navigate(-1)}>← Back</button>
        <div className="aiq-title-block">
          <span className="aiq-badge">✨ AI-Powered</span>
          <h1>Generate a Quiz</h1>
          <p>Let AI craft fresh questions tailored to your study needs</p>
        </div>
      </div>

      <div className="aiq-config">

        <section className="aiq-section">
          <h2>1. Choose a Subject</h2>
          <div className="aiq-subjects">
            {SUBJECTS.map((s) => (
              <button
                key={s.label}
                className={`aiq-subject-btn ${config.subject === s.label ? "active" : ""}`}
                onClick={() => setConfig((c) => ({ ...c, subject: s.label, subtopic: "" }))}
              >
                <span className="subj-icon">{s.icon}</span>
                <span>{s.label}</span>
              </button>
            ))}
          </div>

          {config.subject && (
            <div className="aiq-subtopic-row">
              <label>Narrow it down (optional):</label>
              <div className="aiq-subtopics">
                <button
                  className={`aiq-sub-chip ${config.subtopic === "" ? "active" : ""}`}
                  onClick={() => setConfig((c) => ({ ...c, subtopic: "" }))}
                >
                  All {config.subject}
                </button>
                {SUBJECTS.find((s) => s.label === config.subject)?.subtopics.map((st) => (
                  <button
                    key={st}
                    className={`aiq-sub-chip ${config.subtopic === st ? "active" : ""}`}
                    onClick={() => setConfig((c) => ({ ...c, subtopic: st }))}
                  >
                    {st}
                  </button>
                ))}
              </div>
            </div>
          )}
        </section>

        <section className="aiq-section">
          <h2>2. Difficulty</h2>
          <div className="aiq-difficulty">
            {DIFFICULTIES.map((d) => (
              <button
                key={d.value}
                className={`aiq-diff-btn ${config.difficulty === d.value ? "active" : ""}`}
                style={{ "--diff-color": d.color }}
                onClick={() => setConfig((c) => ({ ...c, difficulty: d.value }))}
              >
                <span className="diff-label">{d.label}</span>
                <span className="diff-desc">{d.desc}</span>
              </button>
            ))}
          </div>
        </section>

        <section className="aiq-section">
          <h2>3. Question Type</h2>
          <div className="aiq-types">
            {QUESTION_TYPES.map((t) => (
              <button
                key={t.value}
                className={`aiq-type-btn ${config.type === t.value ? "active" : ""}`}
                onClick={() => setConfig((c) => ({ ...c, type: t.value }))}
              >
                <span className="type-icon">{t.icon}</span>
                <span className="type-label">{t.label}</span>
                <span className="type-desc">{t.desc}</span>
              </button>
            ))}
          </div>
        </section>

        <section className="aiq-section">
          <h2>4. Number of Questions</h2>
          <div className="aiq-counts">
            {COUNTS.map((n) => (
              <button
                key={n}
                className={`aiq-count-btn ${config.count === n ? "active" : ""}`}
                onClick={() => setConfig((c) => ({ ...c, count: n }))}
              >
                {n}
              </button>
            ))}
          </div>
        </section>

        {error && <p className="aiq-error">⚠️ {error}</p>}

        <button
          className={`aiq-generate-btn ${!config.subject ? "disabled" : ""}`}
          onClick={generateQuestions}
          disabled={!config.subject}
        >
          <span>⚡ Generate {config.count} Questions</span>
        </button>
      </div>
    </div>
  );
}

// ─── Loading Screen ───────────────────────────────────────────────────────────
function LoadingScreen({ message }) {
  return (
    <div className="aiq-loading">
      <div className="aiq-loading-orb">
        <div className="orb-ring r1" />
        <div className="orb-ring r2" />
        <div className="orb-ring r3" />
        <span className="orb-icon">🧠</span>
      </div>
      <p className="aiq-loading-msg">{message}</p>
      <p className="aiq-loading-sub">Generating your personalised quiz…</p>
    </div>
  );
}

// ─── Quiz Screen ──────────────────────────────────────────────────────────────
function QuizScreen({ question, index, total, score, config, selected, typed, setTyped, feedback, inputRef, onAnswer, onShortSubmit, onNext }) {
  const progress = ((index + 1) / total) * 100;
  return (
    <div className="aiq-quiz">
      <div className="aiq-quiz-topbar">
        <span className="aiq-quiz-counter">Q {index + 1} / {total}</span>
        <div className="aiq-quiz-progress-track">
          <div className="aiq-quiz-progress-fill" style={{ width: `${progress}%` }} />
        </div>
        <span className="aiq-quiz-score">⭐ {score * 15} XP</span>
      </div>

      <div className="aiq-quiz-badge">
        ✨ AI Generated · {config.subject}{config.subtopic ? ` › ${config.subtopic}` : ""} · {config.difficulty}
      </div>

      <div className="aiq-quiz-card">
        <p className="aiq-quiz-q">{question.question}</p>

        {config.type === "mcq" && (
          <div className="aiq-quiz-options">
            {question.options?.map((opt, i) => {
              let cls = "aiq-opt";
              if (feedback !== null) {
                if (opt === question.answer)  cls += " correct";
                else if (opt === selected)    cls += " wrong";
                else                          cls += " dimmed";
              }
              return (
                <button key={i} className={cls} onClick={() => onAnswer(opt)} disabled={feedback !== null}>
                  {opt}
                </button>
              );
            })}
          </div>
        )}

        {config.type === "short" && (
          <div className="aiq-short">
            <input
              ref={inputRef}
              type="text"
              className={`aiq-short-input ${feedback === "correct" ? "correct" : feedback === "wrong" ? "wrong" : ""}`}
              value={typed}
              onChange={(e) => setTyped(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && onShortSubmit()}
              placeholder="Type your answer and press Enter…"
              disabled={feedback !== null}
            />
            {feedback === null && (
              <button className="aiq-short-submit" onClick={onShortSubmit}>Submit</button>
            )}
          </div>
        )}

        {feedback && (
          <div className={`aiq-feedback ${feedback}`}>
            <span className="feedback-icon">{feedback === "correct" ? "✅" : "❌"}</span>
            <div>
              <strong>
                {feedback === "correct" ? "Correct!" : `Wrong — the answer is: ${question.answer}`}
              </strong>
              <p className="feedback-explanation">{question.explanation}</p>
            </div>
          </div>
        )}
      </div>

      {feedback !== null && (
        <button className="aiq-next-btn" onClick={onNext}>
          {index + 1 >= total ? "See Results →" : "Next Question →"}
        </button>
      )}
    </div>
  );
}

// ─── Done Screen ──────────────────────────────────────────────────────────────
function DoneScreen({ score, total, answers, config, onRestart, onReview }) {
  const pct   = Math.round((score / total) * 100);
  const emoji = pct >= 80 ? "🏆" : pct >= 60 ? "💪" : "📖";
  const msg   = pct >= 80 ? "Excellent work!" : pct >= 60 ? "Good effort — keep going!" : "More practice needed — you've got this!";

  return (
    <div className="aiq-done">
      <div className="aiq-done-card">
        <span className="done-emoji">{emoji}</span>
        <h2>Quiz Complete!</h2>
        <p className="done-msg">{msg}</p>

        <div className="done-score-ring">
          <svg viewBox="0 0 120 120">
            <circle cx="60" cy="60" r="50" fill="none" stroke="#e0e0e0" strokeWidth="10" />
            <circle
              cx="60" cy="60" r="50" fill="none"
              stroke={pct >= 80 ? "#4caf50" : pct >= 60 ? "#ff9800" : "#f44336"}
              strokeWidth="10"
              strokeDasharray={`${pct * 3.14} 314`}
              strokeLinecap="round"
              transform="rotate(-90 60 60)"
            />
            <text x="60" y="65" textAnchor="middle" fontSize="22" fontWeight="bold" fill="#222">{pct}%</text>
          </svg>
        </div>

        <div className="done-stats">
          <div className="done-stat"><span>{score}</span><small>Correct</small></div>
          <div className="done-stat"><span>{total - score}</span><small>Wrong</small></div>
          <div className="done-stat"><span>{score * 15}</span><small>XP Earned</small></div>
        </div>

        <div className="done-meta">
          {config.subject} · {config.subtopic || "All topics"} · {config.difficulty} · {config.type.toUpperCase()}
        </div>

        <div className="done-breakdown">
          {answers.map((a, i) => (
            <div key={i} className={`done-item ${a.correct ? "correct" : "wrong"}`}>
              <span className="done-item-icon">{a.correct ? "✅" : "❌"}</span>
              <div>
                <p className="done-item-q">{a.question}</p>
                {!a.correct && <p className="done-item-ans">Answer: {a.answer}</p>}
              </div>
            </div>
          ))}
        </div>

        <div className="done-actions">
          <button className="aiq-generate-btn" onClick={onRestart}>🔄 New Quiz</button>
          <button className="aiq-outline-btn"   onClick={onReview}>📋 Full Review</button>
        </div>
      </div>
    </div>
  );
}
