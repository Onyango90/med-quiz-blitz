// src/pages/PastPaperImporter.jsx
// A visual tool for adding past paper questions to any topic.
// Route: /import-questions
// Add to App.js: import PastPaperImporter from "./pages/PastPaperImporter";
//                <Route path="/import-questions" element={<PastPaperImporter />} />
// Add to HomeDashboard sidebar: navigate("/import-questions")

import React, { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import "./PastPaperImporter.css";

// ── All topics & their file targets ──────────────────────────────────────────
const TOPICS = [
  { label: "Gross Anatomy",        file: "src/data/questions/gross_anatomy.json",              subject: "Anatomy",       idPrefix: "gross" },
  { label: "Histology",            file: "src/data/questions/histology.json",                  subject: "Anatomy",       idPrefix: "histo" },
  { label: "Embryology",           file: "src/data/questions/embryology.json",                 subject: "Anatomy",       idPrefix: "embryo" },
  { label: "Pathology",            file: "src/data/questions/pathology.json",                  subject: "Pathology",     idPrefix: "path" },
  { label: "Physiology",           file: "src/data/questions/physiology.json",                 subject: "Physiology",    idPrefix: "physio" },
  { label: "Microbiology",         file: "src/data/questions/microbiology.json",               subject: "Microbiology",  idPrefix: "micro" },
  { label: "Clinical Skills",      file: "src/data/questions/clinicalSkills.json",             subject: "Clinical",      idPrefix: "clin" },
  { label: "Pharmacology – All",   file: "src/data/questions/pharmacology.json",               subject: "Pharmacology",  idPrefix: "pharm" },
  { label: "Antibiotics",          file: "src/data/questions/pharmacology/antibiotics.json",   subject: "Pharmacology",  idPrefix: "pharm_ab" },
  { label: "Cardiovascular Drugs", file: "src/data/questions/pharmacology/cardiovascular.json",subject: "Pharmacology",  idPrefix: "pharm_cv" },
  { label: "CNS Drugs",            file: "src/data/questions/pharmacology/cns.json",           subject: "Pharmacology",  idPrefix: "pharm_cns" },
  { label: "Endocrine Drugs",      file: "src/data/questions/pharmacology/endocrine.json",     subject: "Pharmacology",  idPrefix: "pharm_endo" },
  { label: "Antifungals",          file: "src/data/questions/pharmacology/antifungals.json",   subject: "Pharmacology",  idPrefix: "pharm_af" },
  { label: "Antiparasitics",       file: "src/data/questions/pharmacology/antiparasitics.json",subject: "Pharmacology",  idPrefix: "pharm_ap" },
];

const DIFFICULTIES = ["easy", "medium", "hard"];
const YEARS = [1, 2, 3, 4, 5, 6];

const BLANK_MCQ = () => ({
  id: crypto.randomUUID(),
  type: "mcq",
  question: "",
  options: ["", "", "", ""],
  answer: "",
  explanation: "",
  difficulty: "medium",
  year: 1,
});

const BLANK_SHORT = () => ({
  id: crypto.randomUUID(),
  type: "short",
  question: "",
  answer: "",
  explanation: "",
  difficulty: "medium",
  year: 1,
});

// ── Helpers ───────────────────────────────────────────────────────────────────
function buildJSON(questions, topic) {
  return questions.map((q, i) => {
    const base = {
      id: `${topic.idPrefix}_${String(Date.now() + i).slice(-6)}`,
      type: q.type,
      subject: topic.subject,
      category: topic.label,
      difficulty: q.difficulty,
      year: q.year,
      question: q.question.trim(),
      explanation: q.explanation.trim(),
    };
    if (q.type === "mcq") {
      return { ...base, options: q.options.map((o) => o.trim()), answer: q.answer.trim() };
    }
    return { ...base, answer: q.answer.trim() };
  });
}

function validate(q) {
  const errs = [];
  if (!q.question.trim()) errs.push("Question text is required");
  if (!q.answer.trim()) errs.push("Answer is required");
  if (q.type === "mcq") {
    if (q.options.some((o) => !o.trim())) errs.push("All 4 options must be filled in");
    if (!q.options.includes(q.answer)) errs.push("Answer must match one of the options exactly");
  }
  return errs;
}

// ═════════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═════════════════════════════════════════════════════════════════════════════
export default function PastPaperImporter() {
  const navigate = useNavigate();
  const [topic, setTopic] = useState(TOPICS[0]);
  const [questions, setQuestions] = useState([BLANK_MCQ()]);
  const [activeIdx, setActiveIdx] = useState(0);
  const [errors, setErrors] = useState({});
  const [outputJSON, setOutputJSON] = useState("");
  const [copied, setCopied] = useState(false);
  const [showOutput, setShowOutput] = useState(false);
  const outputRef = useRef(null);

  const active = questions[activeIdx];

  // ── Question list actions ─────────────────────────────────────────────────
  const addQuestion = (type) => {
    const q = type === "mcq" ? BLANK_MCQ() : BLANK_SHORT();
    setQuestions((prev) => [...prev, q]);
    setActiveIdx(questions.length);
    setShowOutput(false);
  };

  const removeQuestion = (idx) => {
    if (questions.length === 1) return;
    const next = questions.filter((_, i) => i !== idx);
    setQuestions(next);
    setActiveIdx(Math.min(activeIdx, next.length - 1));
    setShowOutput(false);
  };

  const duplicateQuestion = (idx) => {
    const copy = { ...questions[idx], id: crypto.randomUUID() };
    const next = [...questions];
    next.splice(idx + 1, 0, copy);
    setQuestions(next);
    setActiveIdx(idx + 1);
  };

  // ── Field updates ─────────────────────────────────────────────────────────
  const update = (field, value) => {
    setQuestions((prev) =>
      prev.map((q, i) => (i === activeIdx ? { ...q, [field]: value } : q))
    );
    setErrors((e) => ({ ...e, [activeIdx]: undefined }));
    setShowOutput(false);
  };

  const updateOption = (optIdx, value) => {
    const opts = [...active.options];
    opts[optIdx] = value;
    update("options", opts);
  };

  // ── Generate JSON ─────────────────────────────────────────────────────────
  const generate = () => {
    const newErrors = {};
    let hasError = false;
    questions.forEach((q, i) => {
      const errs = validate(q);
      if (errs.length) { newErrors[i] = errs; hasError = true; }
    });
    setErrors(newErrors);
    if (hasError) {
      // Jump to first error
      const firstErr = parseInt(Object.keys(newErrors)[0]);
      setActiveIdx(firstErr);
      return;
    }
    const json = buildJSON(questions, topic);
    setOutputJSON(JSON.stringify(json, null, 2));
    setShowOutput(true);
    setTimeout(() => outputRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(outputJSON).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const downloadJSON = () => {
    const blob = new Blob([outputJSON], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${topic.idPrefix}_questions_${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // ── Quick add from text ───────────────────────────────────────────────────
  const [bulkText, setBulkText] = useState("");
  const [showBulk, setShowBulk] = useState(false);

  const parseBulkText = () => {
    // Tries to parse a simple plain-text question format:
    // Q: Question text
    // A. option  B. option  C. option  D. option
    // Answer: A
    // Explanation: ...
    const blocks = bulkText.trim().split(/\n{2,}/);
    const parsed = [];

    blocks.forEach((block) => {
      const lines = block.trim().split("\n").map((l) => l.trim()).filter(Boolean);
      if (lines.length < 2) return;

      const qLine = lines.find((l) => /^Q[:.)]/i.test(l));
      const ansLine = lines.find((l) => /^(ans|answer|correct)[:.)]/i.test(l));
      const expLine = lines.find((l) => /^(exp|explanation)[:.)]/i.test(l));
      const optLines = lines.filter((l) => /^[A-Da-d][.)]/i.test(l));

      if (!qLine) return;

      const question = qLine.replace(/^Q[:.)]\s*/i, "").trim();
      const explanation = expLine ? expLine.replace(/^(exp|explanation)[:.)]\s*/i, "").trim() : "";

      if (optLines.length >= 2) {
        // MCQ
        const options = optLines.map((o) => o.replace(/^[A-Da-d][.)]\s*/i, "").trim());
        let answer = "";
        if (ansLine) {
          const letter = ansLine.replace(/^(ans|answer|correct)[:.)]\s*/i, "").trim().toUpperCase()[0];
          const idx = "ABCD".indexOf(letter);
          answer = idx >= 0 ? options[idx] : options[0];
        } else {
          answer = options[0];
        }
        // Pad to 4 options if fewer
        while (options.length < 4) options.push("");
        parsed.push({ id: crypto.randomUUID(), type: "mcq", question, options: options.slice(0, 4), answer, explanation, difficulty: "medium", year: 1 });
      } else {
        // Short answer
        const answer = ansLine ? ansLine.replace(/^(ans|answer|correct)[:.)]\s*/i, "").trim() : "";
        parsed.push({ id: crypto.randomUUID(), type: "short", question, answer, explanation, difficulty: "medium", year: 1 });
      }
    });

    if (parsed.length > 0) {
      setQuestions((prev) => [...prev, ...parsed]);
      setActiveIdx(questions.length);
      setBulkText("");
      setShowBulk(false);
    }
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // RENDER
  // ═══════════════════════════════════════════════════════════════════════════
  return (
    <div className="ppi-page">

      {/* ── Top bar ── */}
      <div className="ppi-topbar">
        <button className="ppi-back" onClick={() => navigate(-1)}>← Back</button>
        <div className="ppi-topbar-center">
          <span className="ppi-topbar-badge">📄 Past Paper Importer</span>
          <p>Build questions visually, export ready-to-paste JSON</p>
        </div>
        <button className="ppi-generate-btn" onClick={generate}>
          Generate JSON →
        </button>
      </div>

      <div className="ppi-body">

        {/* ── Left: config + question list ── */}
        <aside className="ppi-sidebar">

          {/* Topic selector */}
          <div className="ppi-panel">
            <label className="ppi-label">Target File</label>
            <select
              className="ppi-select"
              value={topic.label}
              onChange={(e) => setTopic(TOPICS.find((t) => t.label === e.target.value))}
            >
              {TOPICS.map((t) => (
                <option key={t.label} value={t.label}>{t.label}</option>
              ))}
            </select>
            <p className="ppi-file-path">📁 {topic.file}</p>
          </div>

          {/* Question list */}
          <div className="ppi-panel ppi-qlist-panel">
            <div className="ppi-qlist-header">
              <label className="ppi-label">Questions ({questions.length})</label>
            </div>
            <div className="ppi-qlist">
              {questions.map((q, i) => (
                <div
                  key={q.id}
                  className={`ppi-qitem ${i === activeIdx ? "active" : ""} ${errors[i] ? "error" : ""}`}
                  onClick={() => setActiveIdx(i)}
                >
                  <span className="ppi-qitem-num">{i + 1}</span>
                  <span className="ppi-qitem-type">{q.type.toUpperCase()}</span>
                  <span className="ppi-qitem-preview">
                    {q.question.trim() ? q.question.slice(0, 36) + (q.question.length > 36 ? "…" : "") : "Empty question"}
                  </span>
                  {errors[i] && <span className="ppi-qitem-err">⚠</span>}
                  <div className="ppi-qitem-actions">
                    <button title="Duplicate" onClick={(e) => { e.stopPropagation(); duplicateQuestion(i); }}>⧉</button>
                    <button title="Remove" onClick={(e) => { e.stopPropagation(); removeQuestion(i); }}>✕</button>
                  </div>
                </div>
              ))}
            </div>

            <div className="ppi-add-btns">
              <button className="ppi-add-btn" onClick={() => addQuestion("mcq")}>+ MCQ</button>
              <button className="ppi-add-btn" onClick={() => addQuestion("short")}>+ Short Answer</button>
            </div>

            {/* Bulk paste toggle */}
            <button className="ppi-bulk-toggle" onClick={() => setShowBulk((v) => !v)}>
              {showBulk ? "▲ Hide" : "▼ Paste from text"}
            </button>
            {showBulk && (
              <div className="ppi-bulk">
                <p className="ppi-bulk-hint">
                  Paste questions in this format (blank line between each):
                  <br /><code>Q: What is the kneecap?</code>
                  <br /><code>A. Patella  B. Tibia  C. Femur  D. Fibula</code>
                  <br /><code>Answer: A</code>
                  <br /><code>Explanation: The patella protects the knee joint.</code>
                </p>
                <textarea
                  className="ppi-bulk-textarea"
                  value={bulkText}
                  onChange={(e) => setBulkText(e.target.value)}
                  placeholder="Paste your questions here…"
                  rows={8}
                />
                <button className="ppi-parse-btn" onClick={parseBulkText}>Parse & Add</button>
              </div>
            )}
          </div>
        </aside>

        {/* ── Right: editor ── */}
        <main className="ppi-editor">
          {active && (
            <div className="ppi-form">
              <div className="ppi-form-header">
                <span className="ppi-form-qnum">Question {activeIdx + 1}</span>
                <div className="ppi-type-toggle">
                  <button
                    className={active.type === "mcq" ? "active" : ""}
                    onClick={() => update("type", "mcq")}
                  >MCQ</button>
                  <button
                    className={active.type === "short" ? "active" : ""}
                    onClick={() => update("type", "short")}
                  >Short Answer</button>
                </div>
              </div>

              {errors[activeIdx] && (
                <div className="ppi-err-banner">
                  {errors[activeIdx].map((e, i) => <div key={i}>⚠ {e}</div>)}
                </div>
              )}

              {/* Question text */}
              <div className="ppi-field">
                <label>Question *</label>
                <textarea
                  className="ppi-textarea"
                  value={active.question}
                  onChange={(e) => update("question", e.target.value)}
                  placeholder="Type the question exactly as it appears in the past paper…"
                  rows={3}
                />
              </div>

              {/* MCQ options */}
              {active.type === "mcq" && (
                <div className="ppi-field">
                  <label>Options * <span className="ppi-hint">(click ✓ to mark the correct answer)</span></label>
                  <div className="ppi-options">
                    {["A", "B", "C", "D"].map((letter, i) => (
                      <div key={i} className={`ppi-option-row ${active.answer === active.options[i] && active.options[i] ? "correct" : ""}`}>
                        <span className="ppi-opt-letter">{letter}</span>
                        <input
                          className="ppi-option-input"
                          value={active.options[i]}
                          onChange={(e) => updateOption(i, e.target.value)}
                          placeholder={`Option ${letter}`}
                        />
                        <button
                          className={`ppi-correct-btn ${active.answer === active.options[i] && active.options[i] ? "active" : ""}`}
                          title="Mark as correct"
                          onClick={() => update("answer", active.options[i])}
                          disabled={!active.options[i]}
                        >✓</button>
                      </div>
                    ))}
                  </div>
                  {active.answer && (
                    <p className="ppi-answer-preview">✅ Correct answer: <strong>{active.answer}</strong></p>
                  )}
                </div>
              )}

              {/* Short answer */}
              {active.type === "short" && (
                <div className="ppi-field">
                  <label>Answer *</label>
                  <input
                    className="ppi-input"
                    value={active.answer}
                    onChange={(e) => update("answer", e.target.value)}
                    placeholder="The correct answer (keep it concise)"
                  />
                </div>
              )}

              {/* Explanation */}
              <div className="ppi-field">
                <label>Explanation</label>
                <textarea
                  className="ppi-textarea"
                  value={active.explanation}
                  onChange={(e) => update("explanation", e.target.value)}
                  placeholder="Why is this the correct answer? (shown after answering)"
                  rows={2}
                />
              </div>

              {/* Meta row */}
              <div className="ppi-meta-row">
                <div className="ppi-field ppi-meta-field">
                  <label>Difficulty</label>
                  <select className="ppi-select" value={active.difficulty} onChange={(e) => update("difficulty", e.target.value)}>
                    {DIFFICULTIES.map((d) => <option key={d}>{d}</option>)}
                  </select>
                </div>
                <div className="ppi-field ppi-meta-field">
                  <label>Year of Study</label>
                  <select className="ppi-select" value={active.year} onChange={(e) => update("year", parseInt(e.target.value))}>
                    {YEARS.map((y) => <option key={y} value={y}>Year {y}</option>)}
                  </select>
                </div>
              </div>

              {/* Navigation */}
              <div className="ppi-nav-row">
                <button
                  className="ppi-nav-btn"
                  disabled={activeIdx === 0}
                  onClick={() => setActiveIdx((i) => i - 1)}
                >← Previous</button>
                <span className="ppi-nav-counter">{activeIdx + 1} / {questions.length}</span>
                <button
                  className="ppi-nav-btn"
                  disabled={activeIdx === questions.length - 1}
                  onClick={() => setActiveIdx((i) => i + 1)}
                >Next →</button>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* ── JSON Output ── */}
      {showOutput && (
        <div className="ppi-output" ref={outputRef}>
          <div className="ppi-output-header">
            <div>
              <h2>✅ Ready to paste!</h2>
              <p>Copy this JSON and add it to <code>{topic.file}</code></p>
            </div>
            <div className="ppi-output-actions">
              <button className="ppi-copy-btn" onClick={copyToClipboard}>
                {copied ? "✅ Copied!" : "📋 Copy JSON"}
              </button>
              <button className="ppi-download-btn" onClick={downloadJSON}>
                ⬇ Download .json
              </button>
            </div>
          </div>

          <div className="ppi-instructions">
            <strong>How to add to your app:</strong>
            <ol>
              <li>Open <code>{topic.file}</code> in your editor</li>
              <li>The file contains a JSON array <code>[ ... ]</code></li>
              <li>Add a comma after the last <code>{"}"}</code> in the array</li>
              <li>Paste the new questions before the closing <code>]</code></li>
              <li>Save the file — questions appear immediately in the app!</li>
            </ol>
          </div>

          <pre className="ppi-code">{outputJSON}</pre>

          <div className="ppi-output-footer">
            <button className="ppi-add-more-btn" onClick={() => { setShowOutput(false); setQuestions([BLANK_MCQ()]); setActiveIdx(0); }}>
              + Add More Questions
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
