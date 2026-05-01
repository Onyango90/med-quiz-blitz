// src/pages/StudentPDFQuiz.jsx
// Upload your notes → pay 15 KES → get gamified AI questions from YOUR material
// M-Pesa payment is UI-ready; wire in Daraja credentials when ready.

import React, { useState, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import "./StudentPDFQuiz.css";

// ── Constants ─────────────────────────────────────────────────────────────────
const PRICE_KES = 15;
const PAGES_PER_CHUNK = 3;

const GAME_MODES = [
  {
    id: "classic",
    icon: "📝",
    label: "Classic Quiz",
    desc: "MCQs with explanations from your notes",
    color: "#2a9d8f",
    questionCount: 15,
  },
  {
    id: "rapid",
    icon: "⚡",
    label: "Rapid Fire",
    desc: "Speed round — answer fast, earn more XP",
    color: "#f97316",
    questionCount: 20,
  },
  {
    id: "diagnose",
    icon: "🔬",
    label: "Diagnose in 3 Clues",
    desc: "Clinical cases built from your material",
    color: "#6366f1",
    questionCount: 10,
  },
];

// ── PDF page → base64 ────────────────────────────────────────────────────────
async function pdfPageToBase64(pdfDoc, pageNum) {
  const page   = await pdfDoc.getPage(pageNum);
  const scale  = 1.5;
  const vp     = page.getViewport({ scale });
  const canvas = document.createElement("canvas");
  canvas.width  = vp.width;
  canvas.height = vp.height;
  await page.render({ canvasContext: canvas.getContext("2d"), viewport: vp }).promise;
  return canvas.toDataURL("image/jpeg", 0.82).split(",")[1];
}

// ── Claude API call per chunk ────────────────────────────────────────────────
async function generateQuestionsFromChunk(images, mode, subject) {
  const modePrompt = {
    classic: `Generate MCQ questions suitable for a medical student exam. 
For each question output a JSON object with:
- "type": "mcq"
- "question": clear clinical or factual question stem
- "options": array of 4 strings prefixed ["A. ...", "B. ...", "C. ...", "D. ..."]
- "answer": full text of correct option e.g. "A. Amoxicillin"
- "explanation": 1-2 sentence explanation of why the answer is correct
- "difficulty": "easy", "medium", or "hard"`,

    rapid: `Generate short, punchy MCQ questions for a rapid-fire quiz. 
Questions should be answerable in under 10 seconds by a medical student.
For each question output a JSON object with:
- "type": "mcq"
- "question": short, direct question (max 20 words)
- "options": array of 4 strings prefixed ["A. ...", "B. ...", "C. ...", "D. ..."]
- "answer": full text of correct option
- "explanation": one sentence only
- "difficulty": "easy", "medium", or "hard"`,

    diagnose: `Generate clinical case questions in "Diagnose in 3 Clues" format.
For each case output a JSON object with:
- "type": "diagnose"
- "diagnosis": the correct diagnosis
- "clues": array of exactly 3 strings — ordered from hardest to easiest clue (clue 1 = most obscure, clue 3 = most obvious)
- "options": array of 4 diagnosis options (strings, the correct one included)
- "explanation": 2-3 sentence clinical explanation
- "difficulty": "medium" or "hard"
Only generate this format if clinical content is present in the images. If not clinical, fall back to classic MCQ format.`,
  };

  const content = [
    ...images.map((b64) => ({
      type: "image",
      source: { type: "base64", media_type: "image/jpeg", data: b64 },
    })),
    {
      type: "text",
      text: `You are a medical education AI. Extract key concepts from these study material pages and generate exam questions.

Subject context: ${subject || "General Medicine"}
Game mode: ${mode}

${modePrompt[mode]}

Rules:
- Only generate questions from content actually visible in the images
- Do NOT invent facts not present in the material
- Skip images with no educational content (cover pages, blank pages, decorative images)
- Generate as many questions as you can from the content shown (aim for 3-5 per page)
- Respond ONLY with a valid JSON array starting with [ and ending with ]
- No markdown, no preamble, no explanation outside the JSON`,
    },
  ];

  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": process.env.REACT_APP_ANTHROPIC_API_KEY,
      "anthropic-version": "2023-06-01",
      "anthropic-dangerous-direct-browser-access": "true",
    },
    body: JSON.stringify({
      model: "claude-opus-4-6",
      max_tokens: 4000,
      messages: [{ role: "user", content }],
    }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err?.error?.message || `API error ${response.status}`);
  }

  const data  = await response.json();
  const raw   = data.content?.[0]?.text || "[]";
  const clean = raw.replace(/```json|```/g, "").trim();
  try {
    const parsed = JSON.parse(clean);
    return Array.isArray(parsed) ? parsed : [];
  } catch { return []; }
}

// ═════════════════════════════════════════════════════════════════════════════
// QUIZ ENGINE — renders questions after generation
// ═════════════════════════════════════════════════════════════════════════════
function QuizEngine({ questions, mode, onFinish }) {
  const [idx,         setIdx]         = useState(0);
  const [selected,    setSelected]    = useState(null);
  const [cluesShown,  setCluesShown]  = useState(1);
  const [phase,       setPhase]       = useState("question"); // question | result
  const [typedAns,    setTypedAns]    = useState("");
  const [showOptions, setShowOptions] = useState(false);
  const [score,       setScore]       = useState(0);
  const [correct,     setCorrect]     = useState(0);
  const [history,     setHistory]     = useState([]);
  const [cardKey,     setCardKey]     = useState(0);
  const [xpPops,      setXpPops]      = useState([]);
  const inputRef = useRef(null);

  const q       = questions[idx];
  const isLast  = idx >= questions.length - 1;
  const isDiag  = q?.type === "diagnose";
  const XP_MAP  = { 1: 15, 2: 8, 3: 3 };

  const popXP = (xp) => {
    const id = Date.now() + Math.random();
    setXpPops((p) => [...p, { id, xp }]);
    setTimeout(() => setXpPops((p) => p.filter((x) => x.id !== id)), 1300);
  };

  const normalise = (s) => (s || "").toLowerCase().replace(/[^a-z0-9]/g, "").trim();

  const resolve = (answer, clues = 1) => {
    const correct_ans = isDiag ? q.diagnosis : q.answer;
    const isCorrect   = normalise(answer) === normalise(correct_ans) ||
                        normalise(answer).includes(normalise(correct_ans)) ||
                        normalise(correct_ans).includes(normalise(answer));
    const xp = isCorrect ? (isDiag ? (XP_MAP[clues] || 3) : 10) : 0;

    setSelected(answer);
    setPhase("result");
    if (xp > 0) { setScore((s) => s + xp); popXP(xp); }
    if (isCorrect) setCorrect((c) => c + 1);
    setHistory((h) => [...h, { question: q.question || q.diagnosis, correct: isCorrect, xp }]);
  };

  const next = () => {
    if (isLast) { onFinish({ score, correct, total: questions.length, history }); return; }
    setCardKey((k) => k + 1);
    setIdx((i) => i + 1);
    setSelected(null); setPhase("question");
    setTypedAns(""); setShowOptions(false); setCluesShown(1);
  };

  const isCorrectAnswer = phase === "result" &&
    (normalise(selected) === normalise(isDiag ? q.diagnosis : q.answer) ||
     normalise(selected).includes(normalise(isDiag ? q.diagnosis : q.answer)));

  if (!q) return null;

  return (
    <div className={`spq-quiz ${phase === "result" ? (isCorrectAnswer ? "spq-flash-ok" : "spq-flash-fail") : ""}`}>

      {/* XP pops */}
      {xpPops.map((p) => (
        <div key={p.id} className="spq-xp-pop">+{p.xp} XP</div>
      ))}

      {/* Top bar */}
      <div className="spq-quiz-bar">
        <div className="spq-qb-left">
          <span className="spq-qb-mode">{GAME_MODES.find((m) => m.id === mode)?.icon} {GAME_MODES.find((m) => m.id === mode)?.label}</span>
        </div>
        <div className="spq-qb-counter">{idx + 1} / {questions.length}</div>
        <div className="spq-qb-right">
          <span className="spq-qb-xp">⭐ {score}</span>
        </div>
      </div>

      {/* Progress */}
      <div className="spq-quiz-progress">
        <div className="spq-quiz-prog-fill" style={{ width: `${(idx / questions.length) * 100}%` }} />
      </div>

      {/* Card */}
      <div className="spq-quiz-main">
        <div key={cardKey} className="spq-q-card">

          {/* Diagnose mode */}
          {isDiag ? (
            <>
              <div className="spq-q-label"><span className="spq-q-dot" />Clinical Case</div>
              <div className="spq-xp-strip">
                {[1,2,3].map((n) => (
                  <div key={n} className={`spq-xp-node ${n === cluesShown ? "active" : ""} ${n < cluesShown ? "used" : ""}`}>
                    <span>{n} clue{n>1?"s":""}</span>
                    <span>+{XP_MAP[n]}</span>
                  </div>
                ))}
              </div>
              <div className="spq-clues">
                {[0,1,2].map((i) => (
                  <div key={i} className={`spq-clue ${i < cluesShown ? "spq-clue-on" : "spq-clue-off"} ${i === cluesShown - 1 ? "spq-clue-latest" : ""}`}>
                    <div className="spq-clue-num">Clue {i+1}</div>
                    {i < cluesShown
                      ? <p>{q.clues[i]}</p>
                      : <div className="spq-clue-lock">🔒 Locked</div>}
                  </div>
                ))}
              </div>

              {phase === "question" && !showOptions && (
                <div className="spq-diag-actions">
                  {cluesShown < 3 && (
                    <button className="spq-reveal-btn" onClick={() => setCluesShown((n) => n + 1)}>
                      Reveal Clue {cluesShown + 1}
                    </button>
                  )}
                  <div className="spq-type-row">
                    <input
                      ref={inputRef}
                      type="text"
                      className="spq-type-input"
                      value={typedAns}
                      onChange={(e) => setTypedAns(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && resolve(typedAns, cluesShown)}
                      placeholder="Type your diagnosis…"
                    />
                    <button className="spq-submit-btn" onClick={() => resolve(typedAns, cluesShown)}>→</button>
                  </div>
                  <button className="spq-hint-link" onClick={() => setShowOptions(true)}>Show options instead</button>
                </div>
              )}

              {phase === "question" && showOptions && (
                <div className="spq-options">
                  {(q.options || []).map((opt, i) => (
                    <button key={i} className="spq-option" onClick={() => resolve(opt, cluesShown)}>
                      <span className="spq-opt-letter">{["A","B","C","D"][i]}</span>
                      <span>{opt}</span>
                    </button>
                  ))}
                </div>
              )}
            </>
          ) : (
            <>
              {/* Classic / Rapid MCQ */}
              <div className="spq-q-label"><span className="spq-q-dot" />Question {idx + 1}</div>
              <p className="spq-question">{q.question}</p>
              <div className="spq-options">
                {(q.options || []).map((opt, i) => {
                  let cls = "spq-option";
                  if (phase === "result") {
                    if (normalise(opt) === normalise(q.answer)) cls += " spq-opt-correct";
                    else if (opt === selected) cls += " spq-opt-wrong";
                    else cls += " spq-opt-dim";
                  }
                  return (
                    <button key={i} className={cls} onClick={() => phase === "question" && resolve(opt)} disabled={phase === "result"}>
                      <span className="spq-opt-letter">{["A","B","C","D"][i]}</span>
                      <span>{opt}</span>
                      {phase === "result" && normalise(opt) === normalise(q.answer) && <span className="spq-opt-check">✓</span>}
                      {phase === "result" && opt === selected && normalise(opt) !== normalise(q.answer) && <span className="spq-opt-check">✗</span>}
                    </button>
                  );
                })}
              </div>
            </>
          )}

          {/* Result feedback */}
          {phase === "result" && (
            <div className={`spq-feedback ${isCorrectAnswer ? "spq-fb-ok" : "spq-fb-fail"}`}>
              <div className="spq-fb-icon">{isCorrectAnswer ? "✓" : "✗"}</div>
              <div>
                <p className="spq-fb-head">
                  {isCorrectAnswer ? "Correct!" : `Answer: ${isDiag ? q.diagnosis : q.answer}`}
                </p>
                <p className="spq-fb-exp">{q.explanation}</p>
              </div>
            </div>
          )}
        </div>

        {phase === "result" && (
          <button className="spq-next-btn" onClick={next}>
            {isLast ? "See Results" : "Next"} <span>→</span>
          </button>
        )}

        {/* Dots */}
        <div className="spq-dots">
          {questions.map((_, i) => {
            const h = history[i];
            return <span key={i} className={`spq-dot ${i === idx ? "spq-dot-cur" : ""} ${h ? (h.correct ? "spq-dot-ok" : "spq-dot-fail") : ""}`} />;
          })}
        </div>
      </div>
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
// RESULTS SCREEN
// ═════════════════════════════════════════════════════════════════════════════
function ResultsScreen({ results, onReplay, onHome }) {
  const pct   = Math.round((results.correct / results.total) * 100);
  const emoji = pct >= 80 ? "🏆" : pct >= 60 ? "💪" : "📖";
  const msg   = pct >= 80 ? "Outstanding! Your notes paid off." : pct >= 60 ? "Good effort — revise the weak spots." : "Keep studying — upload again to retry!";

  return (
    <div className="spq-results">
      <div className="spq-res-card">
        <div className="spq-res-topline" />
        <div className="spq-res-emoji">{emoji}</div>
        <h2 className="spq-res-title">Quiz Complete!</h2>
        <p className="spq-res-msg">{msg}</p>

        <div className="spq-ring-wrap">
          <svg className="spq-ring" viewBox="0 0 120 120">
            <circle cx="60" cy="60" r="50" className="spq-ring-bg" />
            <circle cx="60" cy="60" r="50" className="spq-ring-fill"
              strokeDasharray={`${pct * 3.14} 314`}
              stroke={pct >= 80 ? "#10b981" : pct >= 60 ? "#ffbe0b" : "#ef4444"}
              transform="rotate(-90 60 60)" />
          </svg>
          <div className="spq-ring-center">
            <span className="spq-ring-pct">{pct}%</span>
            <span className="spq-ring-sub">Score</span>
          </div>
        </div>

        <div className="spq-res-stats">
          {[
            { val: `${results.correct}/${results.total}`, lbl: "Correct",  color: "#10b981" },
            { val: `+${results.score}`,                   lbl: "XP Earned", color: "#ffbe0b" },
          ].map((s) => (
            <div key={s.lbl} className="spq-res-stat">
              <span className="spq-rs-val" style={{ color: s.color }}>{s.val}</span>
              <span className="spq-rs-lbl">{s.lbl}</span>
            </div>
          ))}
        </div>

        <div className="spq-res-actions">
          <button className="spq-btn-ghost"    onClick={onHome}>🏠 Home</button>
          <button className="spq-btn-primary"  onClick={onReplay}>Upload New PDF</button>
        </div>
      </div>
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═════════════════════════════════════════════════════════════════════════════
export default function StudentPDFQuiz() {
  const navigate  = useNavigate();
  const { currentUser } = useAuth();

  // ── Flow stages ────────────────────────────────────────────────────────────
  // upload → payment → generating → quiz → results
  const [stage,        setStage]        = useState("upload");

  // Upload state
  const [pdfFile,      setPdfFile]      = useState(null);
  const [subject,      setSubject]      = useState("");
  const [selectedMode, setSelectedMode] = useState("classic");
  const pdfRef = useRef(null);

  // Payment state (M-Pesa ready)
  const [phone,        setPhone]        = useState("");
  const [payStatus,    setPayStatus]    = useState("idle"); // idle | pending | confirmed | error
  const [payError,     setPayError]     = useState("");

  // Generation state
  const [genLog,       setGenLog]       = useState([]);
  const [genProgress,  setGenProgress]  = useState({ current: 0, total: 0 });
  const [questions,    setQuestions]    = useState([]);
  const [genError,     setGenError]     = useState("");

  // Results
  const [results,      setResults]      = useState(null);

  const log = useCallback((msg) => setGenLog((p) => [...p, msg]), []);

  // ── File handling ──────────────────────────────────────────────────────────
  const handleFile = (file) => {
    if (file?.type === "application/pdf") setPdfFile(file);
  };

  // ── Payment simulation (replace with real Daraja when ready) ──────────────
  const handlePayment = async () => {
    if (!phone.trim()) { setPayError("Please enter your M-Pesa number"); return; }
    if (!/^(07|01|2547|2541)\d+/.test(phone.replace(/\s/g, ""))) {
      setPayError("Enter a valid Safaricom number e.g. 0712 345 678");
      return;
    }
    setPayError("");
    setPayStatus("pending");

    // ── TODO: Replace this simulation with real Daraja STK push ──────────────
    // const res = await fetch("/api/mpesa/stk-push", {
    //   method: "POST",
    //   body: JSON.stringify({ phone, amount: PRICE_KES, userId: currentUser?.uid }),
    // });
    // Then poll /api/mpesa/confirm?checkoutId=... until confirmed
    // ─────────────────────────────────────────────────────────────────────────

    // Simulation: auto-confirm after 2.5 seconds
    setTimeout(() => {
      setPayStatus("confirmed");
      setTimeout(() => startGeneration(), 800);
    }, 2500);
  };

  // ── Generation ─────────────────────────────────────────────────────────────
  const startGeneration = async () => {
    setStage("generating");
    setGenLog([]);
    setGenError("");
    setQuestions([]);

    try {
      if (!window.pdfjsLib) throw new Error("PDF.js not loaded. Add the CDN script to public/index.html.");
      window.pdfjsLib.GlobalWorkerOptions.workerSrc =
        "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";

      log(`📄 Loading "${pdfFile.name}"…`);
      const ab     = await pdfFile.arrayBuffer();
      const pdfDoc = await window.pdfjsLib.getDocument({ data: ab }).promise;
      const total  = pdfDoc.numPages;
      log(`✅ ${total} pages found`);
      setGenProgress({ current: 0, total });

      const all = [];
      for (let p = 1; p <= total; p += PAGES_PER_CHUNK) {
        const end  = Math.min(p + PAGES_PER_CHUNK - 1, total);
        log(`📖 Reading pages ${p}–${end}…`);

        const images = [];
        for (let pg = p; pg <= end; pg++) {
          images.push(await pdfPageToBase64(pdfDoc, pg));
        }

        log(`🤖 Generating ${selectedMode} questions…`);
        try {
          const extracted = await generateQuestionsFromChunk(images, selectedMode, subject);
          if (extracted.length > 0) {
            all.push(...extracted);
            log(`✅ Got ${extracted.length} questions — total: ${all.length}`);
          } else {
            log(`⚪ No questions from pages ${p}–${end}`);
          }
        } catch (e) {
          log(`⚠️ Chunk error: ${e.message}`);
        }

        setGenProgress({ current: end, total });
        await new Promise((r) => setTimeout(r, 250));
      }

      if (all.length === 0) throw new Error("No questions could be generated from this PDF. Try a different file.");

      const mode = GAME_MODES.find((m) => m.id === selectedMode);
      const trimmed = all.slice(0, mode?.questionCount || 15);
      log(`🎉 Ready! ${trimmed.length} questions generated.`);
      setQuestions(trimmed);

      setTimeout(() => setStage("quiz"), 1000);
    } catch (err) {
      setGenError(err.message);
      log(`❌ ${err.message}`);
    }
  };

  // ─────────────────────────────────────────────────────────────────────────
  // STAGE: UPLOAD
  // ─────────────────────────────────────────────────────────────────────────
  if (stage === "upload") {
    return (
      <div className="spq-root">
        <div className="spq-bg" aria-hidden="true">
          <div className="spq-orb spq-orb-1" /><div className="spq-orb spq-orb-2" />
        </div>

        <header className="spq-header">
          <button className="spq-back" onClick={() => navigate("/home")}>←</button>
          <div className="spq-header-title">
            <h1>Study PDF Quiz</h1>
            <p>Upload your notes, get gamified questions</p>
          </div>
          <div className="spq-price-tag">🇰🇪 KES {PRICE_KES}</div>
        </header>

        <div className="spq-upload-body">

          {/* Drop zone */}
          <div
            className={`spq-dropzone ${pdfFile ? "spq-dz-filled" : ""}`}
            onClick={() => pdfRef.current.click()}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => { e.preventDefault(); handleFile(e.dataTransfer.files[0]); }}
          >
            <input ref={pdfRef} type="file" accept=".pdf" style={{ display:"none" }} onChange={(e) => handleFile(e.target.files[0])} />
            {pdfFile ? (
              <>
                <div className="spq-dz-icon">📄</div>
                <div className="spq-dz-name">{pdfFile.name}</div>
                <div className="spq-dz-size">{(pdfFile.size/1024/1024).toFixed(1)} MB · tap to change</div>
              </>
            ) : (
              <>
                <div className="spq-dz-icon">📤</div>
                <div className="spq-dz-title">Drop your PDF here</div>
                <div className="spq-dz-sub">Lecture notes · Textbook chapters · Past papers</div>
              </>
            )}
          </div>

          {/* Subject hint */}
          <div className="spq-field">
            <label className="spq-field-label">Subject / Topic <span>(optional but helps)</span></label>
            <input
              type="text"
              className="spq-field-input"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="e.g. Pharmacology, Cardiology, Anatomy…"
            />
          </div>

          {/* Game mode picker */}
          <div className="spq-modes">
            <p className="spq-modes-label">Choose your game mode</p>
            {GAME_MODES.map((m) => (
              <div
                key={m.id}
                className={`spq-mode-card ${selectedMode === m.id ? "spq-mode-active" : ""}`}
                style={{ "--mc": m.color }}
                onClick={() => setSelectedMode(m.id)}
              >
                <span className="spq-mc-icon">{m.icon}</span>
                <div className="spq-mc-text">
                  <span className="spq-mc-label">{m.label}</span>
                  <span className="spq-mc-desc">{m.desc}</span>
                </div>
                <span className="spq-mc-count">{m.questionCount} Qs</span>
                {selectedMode === m.id && <span className="spq-mc-check">✓</span>}
              </div>
            ))}
          </div>

          {/* What you get */}
          <div className="spq-value-strip">
            {["AI reads your exact notes", "Questions from YOUR material", "Full explanations included", "Replay anytime"].map((f) => (
              <div key={f} className="spq-vs-item"><span>✓</span><span>{f}</span></div>
            ))}
          </div>

          <button
            className="spq-proceed-btn"
            disabled={!pdfFile}
            onClick={() => setStage("payment")}
          >
            Continue to Payment →
          </button>
        </div>
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────────────────────
  // STAGE: PAYMENT
  // ─────────────────────────────────────────────────────────────────────────
  if (stage === "payment") {
    return (
      <div className="spq-root spq-pay-root">
        <div className="spq-bg" aria-hidden="true">
          <div className="spq-orb spq-orb-1" /><div className="spq-orb spq-orb-2" />
        </div>

        <header className="spq-header">
          <button className="spq-back" onClick={() => setStage("upload")}>←</button>
          <div className="spq-header-title"><h1>Payment</h1><p>M-Pesa · Secure · Instant</p></div>
        </header>

        <div className="spq-pay-body">

          {/* Order summary */}
          <div className="spq-order-card">
            <div className="spq-order-topline" />
            <div className="spq-order-row">
              <span className="spq-order-label">PDF</span>
              <span className="spq-order-val">{pdfFile?.name}</span>
            </div>
            <div className="spq-order-row">
              <span className="spq-order-label">Game Mode</span>
              <span className="spq-order-val">{GAME_MODES.find((m) => m.id === selectedMode)?.icon} {GAME_MODES.find((m) => m.id === selectedMode)?.label}</span>
            </div>
            <div className="spq-order-divider" />
            <div className="spq-order-total">
              <span>Total</span>
              <span className="spq-order-price">KES {PRICE_KES}</span>
            </div>
          </div>

          {/* M-Pesa input */}
          {payStatus === "idle" && (
            <>
              <div className="spq-mpesa-card">
                <div className="spq-mpesa-logo">
                  <span className="spq-mpesa-m">M</span>
                  <span className="spq-mpesa-pesa">-PESA</span>
                </div>
                <p className="spq-mpesa-hint">Enter your Safaricom number to receive an STK push</p>
                <div className="spq-phone-row">
                  <span className="spq-phone-flag">🇰🇪</span>
                  <input
                    type="tel"
                    className="spq-phone-input"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="0712 345 678"
                    maxLength={12}
                  />
                </div>
                {payError && <p className="spq-pay-error">{payError}</p>}
              </div>
              <button className="spq-pay-btn" onClick={handlePayment}>
                Pay KES {PRICE_KES} with M-Pesa
              </button>
            </>
          )}

          {/* Pending */}
          {payStatus === "pending" && (
            <div className="spq-pay-pending">
              <div className="spq-pay-spinner" />
              <p className="spq-pay-pending-title">Check your phone</p>
              <p className="spq-pay-pending-sub">A payment request of <strong>KES {PRICE_KES}</strong> has been sent to <strong>{phone}</strong>. Enter your M-Pesa PIN to confirm.</p>
            </div>
          )}

          {/* Confirmed */}
          {payStatus === "confirmed" && (
            <div className="spq-pay-confirmed">
              <div className="spq-pay-confirm-icon">✓</div>
              <p className="spq-pay-confirm-title">Payment confirmed!</p>
              <p className="spq-pay-confirm-sub">Generating your questions…</p>
            </div>
          )}

          <p className="spq-pay-secure">🔒 Secured by Safaricom M-Pesa · No card needed</p>
        </div>
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────────────────────
  // STAGE: GENERATING
  // ─────────────────────────────────────────────────────────────────────────
  if (stage === "generating") {
    const pct = genProgress.total > 0
      ? Math.round((genProgress.current / genProgress.total) * 100)
      : 0;

    return (
      <div className="spq-root spq-gen-root">
        <div className="spq-bg" aria-hidden="true">
          <div className="spq-orb spq-orb-1" /><div className="spq-orb spq-orb-2" />
        </div>

        <div className="spq-gen-body">
          <div className="spq-gen-icon">🤖</div>
          <h2 className="spq-gen-title">Reading your notes…</h2>
          <p className="spq-gen-sub">Claude is generating personalised questions from your PDF</p>

          <div className="spq-gen-track">
            <div className="spq-gen-fill" style={{ width: `${pct}%` }}>
              <div className="spq-gen-shimmer" />
            </div>
          </div>
          <div className="spq-gen-pct">{pct}% · {genProgress.current}/{genProgress.total} pages</div>

          <div className="spq-gen-log">
            {genLog.map((l, i) => (
              <div key={i} className={`spq-gen-line ${i === genLog.length - 1 ? "spq-gen-line-latest" : ""}`}>{l}</div>
            ))}
          </div>

          {genError && (
            <div className="spq-gen-error">
              <p>{genError}</p>
              <button className="spq-btn-ghost" onClick={() => setStage("upload")}>← Try Again</button>
            </div>
          )}
        </div>
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────────────────────
  // STAGE: QUIZ
  // ─────────────────────────────────────────────────────────────────────────
  if (stage === "quiz") {
    return (
      <QuizEngine
        questions={questions}
        mode={selectedMode}
        onFinish={(res) => { setResults(res); setStage("results"); }}
      />
    );
  }

  // ─────────────────────────────────────────────────────────────────────────
  // STAGE: RESULTS
  // ─────────────────────────────────────────────────────────────────────────
  if (stage === "results") {
    return (
      <ResultsScreen
        results={results}
        onReplay={() => {
          setPdfFile(null); setPhone(""); setPayStatus("idle");
          setGenLog([]); setQuestions([]); setResults(null);
          setStage("upload");
        }}
        onHome={() => navigate("/home")}
      />
    );
  }

  return null;
} 