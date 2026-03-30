// src/pages/PastPaperImporter.jsx
// A visual tool for adding past paper questions to any topic.
// Route: /import-questions
// ADMIN ONLY — access controlled by REACT_APP_ADMIN_EMAIL in .env

import React, { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import "./PastPaperImporter.css";

// ── Admin email — only this user can access the importer ─────────────────────
const ADMIN_EMAIL = process.env.REACT_APP_ADMIN_EMAIL || "admin@medblitz.app";

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
      difficulty: q.difficulty,
      year: q.year,
      question: q.question.trim(),
      answer: q.answer.trim(),
      explanation: q.explanation.trim(),
    };
    if (q.type === "mcq") {
      base.options = q.options.map((o) => o.trim());
    }
    return base;
  });
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function PastPaperImporter() {
  const navigate = useNavigate();
  const { currentUser } = useAuth();

  // ── Admin gate ──────────────────────────────────────────────────────────────
  if (!currentUser || currentUser.email !== ADMIN_EMAIL) {
    return (
      <div style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: "system-ui, sans-serif",
        background: "#f4f5f7",
        gap: 16,
      }}>
        <div style={{ fontSize: 48 }}>🔒</div>
        <h2 style={{ color: "#1a2b4c", margin: 0 }}>Access Restricted</h2>
        <p style={{ color: "#6b7280", margin: 0 }}>This page is only available to admins.</p>
        <button
          onClick={() => navigate("/home")}
          style={{
            marginTop: 8,
            padding: "10px 24px",
            background: "#2a9d8f",
            color: "#fff",
            border: "none",
            borderRadius: 10,
            fontWeight: 600,
            cursor: "pointer",
            fontSize: 14,
          }}
        >
          ← Back to Dashboard
        </button>
      </div>
    );
  }

  // ── State ──────────────────────────────────────────────────────────────────
  const [selectedTopic, setSelectedTopic] = useState(TOPICS[0]);
  const [questions, setQuestions] = useState([BLANK_MCQ()]);
  const [exportReady, setExportReady] = useState(false);
  const [exportJSON, setExportJSON] = useState("");
  const [copied, setCopied] = useState(false);
  const fileRef = useRef(null);

  // ── Question operations ────────────────────────────────────────────────────
  const addQuestion = (type) => {
    setQuestions((prev) => [...prev, type === "mcq" ? BLANK_MCQ() : BLANK_SHORT()]);
  };

  const removeQuestion = (id) => {
    setQuestions((prev) => prev.filter((q) => q.id !== id));
  };

  const updateQuestion = (id, field, value) => {
    setQuestions((prev) =>
      prev.map((q) => (q.id === id ? { ...q, [field]: value } : q))
    );
  };

  const updateOption = (id, index, value) => {
    setQuestions((prev) =>
      prev.map((q) => {
        if (q.id !== id) return q;
        const options = [...q.options];
        options[index] = value;
        return { ...q, options };
      })
    );
  };

  // ── Export ─────────────────────────────────────────────────────────────────
  const handleExport = () => {
    const built = buildJSON(questions, selectedTopic);
    const json = JSON.stringify(built, null, 2);
    setExportJSON(json);
    setExportReady(true);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(exportJSON).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const handleDownload = () => {
    const blob = new Blob([exportJSON], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${selectedTopic.idPrefix}_questions.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // ── Import from file ───────────────────────────────────────────────────────
  const handleImportFile = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const parsed = JSON.parse(ev.target.result);
        if (Array.isArray(parsed)) {
          const mapped = parsed.map((q) => ({
            id: crypto.randomUUID(),
            type: q.type || "mcq",
            question: q.question || "",
            options: q.options || ["", "", "", ""],
            answer: q.answer || "",
            explanation: q.explanation || "",
            difficulty: q.difficulty || "medium",
            year: q.year || 1,
          }));
          setQuestions(mapped);
        }
      } catch {
        alert("Invalid JSON file.");
      }
    };
    reader.readAsText(file);
  };

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="ppi-page">
      <header className="ppi-header">
        <button className="ppi-back" onClick={() => navigate("/home")}>← Back</button>
        <div>
          <h1 className="ppi-title">Import Questions</h1>
          <p className="ppi-sub">Admin tool — add past paper questions to the question bank</p>
        </div>
        <div className="ppi-admin-badge">🔑 Admin</div>
      </header>

      <div className="ppi-body">

        {/* Topic selector */}
        <section className="ppi-section">
          <h2 className="ppi-section-title">Target Topic</h2>
          <div className="ppi-topics">
            {TOPICS.map((t) => (
              <button
                key={t.file}
                className={`ppi-topic-btn ${selectedTopic.file === t.file ? "active" : ""}`}
                onClick={() => setSelectedTopic(t)}
              >
                {t.label}
              </button>
            ))}
          </div>
          <p className="ppi-file-path">📁 {selectedTopic.file}</p>
        </section>

        {/* Import from file */}
        <section className="ppi-section">
          <h2 className="ppi-section-title">Load Existing JSON</h2>
          <input
            ref={fileRef}
            type="file"
            accept=".json"
            style={{ display: "none" }}
            onChange={handleImportFile}
          />
          <button className="ppi-outline-btn" onClick={() => fileRef.current.click()}>
            📂 Load JSON file
          </button>
        </section>

        {/* Questions */}
        <section className="ppi-section">
          <div className="ppi-section-header">
            <h2 className="ppi-section-title">Questions ({questions.length})</h2>
            <div className="ppi-add-btns">
              <button className="ppi-add-btn" onClick={() => addQuestion("mcq")}>+ MCQ</button>
              <button className="ppi-add-btn" onClick={() => addQuestion("short")}>+ Short Answer</button>
            </div>
          </div>

          <div className="ppi-questions">
            {questions.map((q, idx) => (
              <div key={q.id} className="ppi-q-card">
                <div className="ppi-q-header">
                  <span className="ppi-q-num">Q{idx + 1} — {q.type.toUpperCase()}</span>
                  <div className="ppi-q-meta">
                    <select
                      value={q.difficulty}
                      onChange={(e) => updateQuestion(q.id, "difficulty", e.target.value)}
                      className="ppi-select"
                    >
                      {DIFFICULTIES.map((d) => <option key={d} value={d}>{d}</option>)}
                    </select>
                    <select
                      value={q.year}
                      onChange={(e) => updateQuestion(q.id, "year", Number(e.target.value))}
                      className="ppi-select"
                    >
                      {YEARS.map((y) => <option key={y} value={y}>Year {y}</option>)}
                    </select>
                    <button className="ppi-remove-btn" onClick={() => removeQuestion(q.id)}>✕</button>
                  </div>
                </div>

                <textarea
                  className="ppi-textarea"
                  placeholder="Question text…"
                  value={q.question}
                  onChange={(e) => updateQuestion(q.id, "question", e.target.value)}
                  rows={2}
                />

                {q.type === "mcq" && (
                  <div className="ppi-options">
                    {q.options.map((opt, oi) => (
                      <div key={oi} className="ppi-option-row">
                        <span className="ppi-opt-label">{["A","B","C","D"][oi]}.</span>
                        <input
                          type="text"
                          className="ppi-input"
                          placeholder={`Option ${["A","B","C","D"][oi]}`}
                          value={opt}
                          onChange={(e) => updateOption(q.id, oi, e.target.value)}
                        />
                      </div>
                    ))}
                  </div>
                )}

                <input
                  type="text"
                  className="ppi-input ppi-answer"
                  placeholder={q.type === "mcq" ? "Correct answer (full option text, e.g. A. Penicillin)" : "Correct answer"}
                  value={q.answer}
                  onChange={(e) => updateQuestion(q.id, "answer", e.target.value)}
                />

                <textarea
                  className="ppi-textarea"
                  placeholder="Explanation (1–2 sentences)…"
                  value={q.explanation}
                  onChange={(e) => updateQuestion(q.id, "explanation", e.target.value)}
                  rows={2}
                />
              </div>
            ))}
          </div>
        </section>

        {/* Export */}
        <section className="ppi-section">
          <button className="ppi-export-btn" onClick={handleExport}>
            ⚡ Generate JSON
          </button>

          {exportReady && (
            <div className="ppi-export-box">
              <div className="ppi-export-actions">
                <button className="ppi-outline-btn" onClick={handleCopy}>
                  {copied ? "✅ Copied!" : "📋 Copy JSON"}
                </button>
                <button className="ppi-outline-btn" onClick={handleDownload}>
                  💾 Download .json
                </button>
              </div>
              <pre className="ppi-json-preview">{exportJSON}</pre>
              <p className="ppi-instructions">
                Paste this JSON into <code>{selectedTopic.file}</code> in your project, then redeploy.
              </p>
            </div>
          )}
        </section>

      </div>
    </div>
  );
}
