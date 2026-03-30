// src/pages/StudyDashboard.jsx — redesigned
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, ChevronRight, ChevronDown, Sparkles, BookOpen } from "lucide-react";
import "./StudyDashboard.css";

import grossAnatomy      from "../data/questions/gross_anatomy.json";
import histology         from "../data/questions/histology.json";
import embryology        from "../data/questions/embryology.json";
import pathologyQuestions from "../data/questions/pathology.json";
import pharmacologyQuestions, {
  antibiotics, cardiovascular as pharmaCardio, cns, endocrine as pharmaEndocrine,
} from "../data/questions/pharmacology/index.js";

let clickSound;
try { clickSound = new Audio(require("../sound/click.wav")); }
catch { clickSound = null; }

// ── Data ─────────────────────────────────────────────────────────────────────
const TOPICS = [
  {
    name: "Anatomy",
    icon: "🦴",
    description: "Structures of the human body",
    color: "coral",
    path: "/study/anatomy",
    hasSubcategories: true,
    subcategories: [
      { name: "Gross Anatomy", icon: "🦴", description: "Macroscopic structures", path: "/study/gross_anatomy", questions: grossAnatomy,  count: grossAnatomy?.length  || 0 },
      { name: "Histology",     icon: "🔬", description: "Microscopic tissue",     path: "/study/histology",     questions: histology,     count: histology?.length     || 0 },
      { name: "Embryology",    icon: "👶", description: "Development stages",     path: "/study/embryology",    questions: embryology,    count: embryology?.length    || 0 },
    ],
    get count() { return (grossAnatomy?.length || 0) + (histology?.length || 0) + (embryology?.length || 0); },
  },
  {
    name: "Pathology",
    icon: "🧫",
    description: "Disease mechanisms & processes",
    color: "amber",
    path: "/study/pathology",
    hasSubcategories: false,
    count: pathologyQuestions?.length || 0,
  },
  {
    name: "Physiology",
    icon: "💓",
    description: "How the body functions",
    color: "teal",
    path: "/study/physiology",
    hasSubcategories: false,
    count: 5,
  },
  {
    name: "Microbiology",
    icon: "🦠",
    description: "Microbes & infections",
    color: "red",
    path: "/study/microbiology",
    hasSubcategories: false,
    count: 5,
  },
  {
    name: "Pharmacology",
    icon: "💊",
    description: "Drugs & mechanisms of action",
    color: "purple",
    path: "/study/pharmacology",
    hasSubcategories: true,
    subcategories: [
      { name: "All Pharmacology", icon: "💊", description: "All drug topics",        path: "/study/pharmacology",   questions: pharmacologyQuestions, count: pharmacologyQuestions?.length || 0 },
      { name: "Antibiotics",      icon: "🧪", description: "Antibacterial drugs",    path: "/study/antibiotics",    questions: antibiotics,           count: antibiotics?.length || 12 },
      { name: "Cardiovascular",   icon: "❤️",  description: "Heart & BP medications", path: "/study/cardiovascular", questions: pharmaCardio,          count: pharmaCardio?.length || 6 },
      { name: "CNS Drugs",        icon: "🧠", description: "Neuro & psych drugs",    path: "/study/cns",            questions: cns,                   count: cns?.length || 5 },
      { name: "Endocrine",        icon: "⚕️", description: "Hormones & diabetes",    path: "/study/endocrine",      questions: pharmaEndocrine,       count: pharmaEndocrine?.length || 3 },
    ],
    count: pharmacologyQuestions?.length || 0,
  },
  {
    name: "Clinical Skills",
    icon: "🩺",
    description: "Practical bedside skills",
    color: "green",
    path: "/study/clinical-skills",
    hasSubcategories: false,
    count: 0,
  },
];

// ── Component ─────────────────────────────────────────────────────────────────
export default function StudyDashboard() {
  const navigate = useNavigate();
  const [expanded, setExpanded] = useState(null);

  const go = (path, questions = null) => {
    if (clickSound) clickSound.play().catch(() => {});
    if (questions) navigate(path, { state: { questions, originalPath: path } });
    else           navigate(path, { state: { originalPath: path } });
  };

  const toggle = (name) => setExpanded((v) => (v === name ? null : name));

  const totalQuestions = TOPICS.reduce((a, t) => a + (t.count || 0), 0);

  return (
    <div className="sd-page">

      {/* ── Header ── */}
      <header className="sd-header">
        <button className="sd-back" onClick={() => navigate("/home")}>
          <ArrowLeft size={16} /> Back
        </button>
        <div className="sd-header-center">
          <div className="sd-header-icon"><BookOpen size={20} /></div>
          <div>
            <h1 className="sd-title">Study Centre</h1>
            <p className="sd-subtitle">{totalQuestions} questions across {TOPICS.length} subjects</p>
          </div>
        </div>
        <button className="sd-ai-btn" onClick={() => navigate("/ai-quiz")}>
          <Sparkles size={14} /> AI Quiz
        </button>
      </header>

      {/* ── Body ── */}
      <div className="sd-body">

        {/* Intro banner */}
        <div className="sd-banner">
          <span className="sd-banner-icon">💡</span>
          <p>Choose a subject below to start studying. Topics with subcategories can be expanded.</p>
        </div>

        {/* Topic cards */}
        <div className="sd-grid">
          {TOPICS.map((topic) => (
            <div key={topic.name} className="sd-topic-wrap">

              {/* Main card */}
              <div
                className={`sd-card sd-card-${topic.color} ${expanded === topic.name ? "sd-card-expanded" : ""}`}
                onClick={() => topic.hasSubcategories ? toggle(topic.name) : go(topic.path)}
              >
                {/* Left accent stripe */}
                <div className="sd-card-stripe" />

                <div className="sd-card-icon">{topic.icon}</div>

                <div className="sd-card-body">
                  <h2 className="sd-card-name">{topic.name}</h2>
                  <p className="sd-card-desc">{topic.description}</p>
                </div>

                <div className="sd-card-right">
                  <span className="sd-card-count">
                    {topic.count > 0 ? `${topic.count} Qs` : "Coming soon"}
                  </span>
                  {topic.hasSubcategories
                    ? <ChevronDown size={16} className={`sd-chevron ${expanded === topic.name ? "sd-chevron-open" : ""}`} />
                    : <ChevronRight size={16} className="sd-chevron" />
                  }
                </div>
              </div>

              {/* Subcategories drawer */}
              {topic.hasSubcategories && expanded === topic.name && (
                <div className="sd-subs">
                  {topic.subcategories.map((sub) => (
                    <button
                      key={sub.name}
                      className="sd-sub-card"
                      onClick={() => go(sub.path, sub.questions)}
                    >
                      <span className="sd-sub-icon">{sub.icon}</span>
                      <div className="sd-sub-text">
                        <span className="sd-sub-name">{sub.name}</span>
                        <span className="sd-sub-desc">{sub.description}</span>
                      </div>
                      <span className="sd-sub-count">{sub.count > 0 ? `${sub.count} Qs` : "—"}</span>
                      <ChevronRight size={14} className="sd-sub-arrow" />
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* AI prompt card */}
        <div className="sd-ai-card" onClick={() => navigate("/ai-quiz")}>
          <div className="sd-ai-card-left">
            <div className="sd-ai-orb">✨</div>
            <div>
              <h3>Can't find what you need?</h3>
              <p>Use the AI Quiz to generate custom questions on any topic, difficulty, or question type.</p>
            </div>
          </div>
          <button className="sd-ai-card-btn">Generate Quiz <ChevronRight size={14} /></button>
        </div>

      </div>
    </div>
  );
}
