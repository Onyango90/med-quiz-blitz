// src/pages/StudyDashboard.jsx — bright professional redesign
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft, ChevronRight, ChevronDown, BrainCircuit,
  BookOpen, Bone, Microscope, Baby, FlaskConical,
  Droplets, TestTube, Shield, HeartPulse, Wind,
  Pill, Syringe, Heart, Brain, Activity,
  Stethoscope, Sparkles, Layers, ClipboardList,
} from "lucide-react";
import "./StudyDashboard.css";

import grossAnatomy               from "../data/questions/gross_anatomy.json";
import histology                  from "../data/questions/histology.json";
import embryology                 from "../data/questions/embryology.json";
import pathologyQuestions         from "../data/questions/pathology.json";
import haematologyQuestions       from "../data/questions/haematology.json";
import clinicalChemistryQuestions from "../data/questions/clinical_chemistry.json";
import immunologyQuestions        from "../data/questions/immunology.json";
import physiologyLevel1           from "../data/questions/physiology_level1.json";
import physiologyLevel2           from "../data/questions/physiology_level2.json";
import clinicalSkillsQuestions    from "../data/questions/clinical_skills.json";
import {
  antibiotics, antifungals, antiparasitics,
  cardiovascular as pharmaCardio, cns, disinfectants,
  endocrine as pharmaEndocrine,
} from "../data/questions/pharmacology/index.js";

let clickSound;
try { clickSound = new Audio(require("../sound/click.wav")); }
catch { clickSound = null; }

// ── Topic definitions — icons only, no emojis ─────────────────────────────
const TOPICS = [
  {
    id: "anatomy",
    name: "Anatomy",
    Icon: Bone,
    description: "Structures of the human body",
    accentVar: "--sd-coral",
    accent: "#f97066",
    hasSubcategories: true,
    subcategories: [
      { name: "Gross Anatomy", Icon: Bone,       description: "Macroscopic body structures",  path: "/study/gross_anatomy",    questions: grossAnatomy,  count: grossAnatomy?.length  || 0 },
      { name: "Histology",     Icon: Microscope,  description: "Microscopic tissue anatomy",   path: "/study/histology",         questions: histology,     count: histology?.length     || 0 },
      { name: "Embryology",    Icon: Baby,        description: "Developmental biology",        path: "/study/embryology",        questions: embryology,    count: embryology?.length    || 0 },
    ],
    get count() { return (grossAnatomy?.length||0)+(histology?.length||0)+(embryology?.length||0); },
  },
  {
    id: "pathology",
    name: "Pathology",
    Icon: FlaskConical,
    description: "Disease mechanisms and processes",
    accent: "#f59e0b",
    hasSubcategories: true,
    subcategories: [
      { name: "General Pathology",  Icon: FlaskConical, description: "Disease processes & mechanisms",       path: "/study/pathology",         questions: pathologyQuestions,         count: pathologyQuestions?.length         || 0 },
      { name: "Haematology",        Icon: Droplets,     description: "Blood disorders & transfusion",        path: "/study/haematology",       questions: haematologyQuestions,       count: haematologyQuestions?.length       || 0 },
      { name: "Clinical Chemistry", Icon: TestTube,     description: "Lab tests & biochemical interpretation",path: "/study/clinical_chemistry",questions: clinicalChemistryQuestions, count: clinicalChemistryQuestions?.length || 0 },
      { name: "Immunology",         Icon: Shield,       description: "Immunity, hypersensitivity & autoimmunity", path: "/study/immunology",    questions: immunologyQuestions,        count: immunologyQuestions?.length        || 0 },
    ],
    get count() {
      return (pathologyQuestions?.length||0)+(haematologyQuestions?.length||0)+
             (clinicalChemistryQuestions?.length||0)+(immunologyQuestions?.length||0);
    },
  },
  {
    id: "physiology",
    name: "Physiology",
    Icon: HeartPulse,
    description: "How the body functions",
    accent: "#14b8a6",
    hasSubcategories: true,
    subcategories: [
      { name: "Level 1 Physiology", Icon: HeartPulse, description: "Core concepts & fundamentals",    path: "/study/physiology_level1", questions: physiologyLevel1, count: physiologyLevel1?.length || 0 },
      { name: "Level 2 Physiology", Icon: Wind,       description: "Respiratory, renal & advanced",  path: "/study/physiology_level2", questions: physiologyLevel2, count: physiologyLevel2?.length || 0 },
    ],
    count: (physiologyLevel1?.length||0)+(physiologyLevel2?.length||0),
  },
  {
    id: "microbiology",
    name: "Microbiology",
    Icon: Microscope,
    description: "Microorganisms and infectious disease",
    accent: "#ef4444",
    hasSubcategories: true,
    count: 0,
    subcategories: [
      { name: "Virology",      Icon: Microscope, description: "", path: "/study/virology",      questions: [], count: 0 },
      { name: "Bacteriology",  Icon: TestTube,   description: "", path: "/study/bacteriology",  questions: [], count: 0 },
      { name: "Mycology",      Icon: FlaskConical, description: "", path: "/study/mycology",    questions: [], count: 0 },
      { name: "Parasitology",  Icon: Droplets,   description: "", path: "/study/parasitology",  questions: [], count: 0 },
    ],
  },
  {
    id: "pharmacology",
    name: "Pharmacology",
    Icon: Pill,
    description: "Drugs, mechanisms of action and therapeutics",
    accent: "#8b5cf6",
    hasSubcategories: true,
    subcategories: [
      { name: "Antimicrobials",  Icon: Syringe,      description: "", path: "/study/antibiotics",    questions: [...(antibiotics||[]), ...(antifungals||[]), ...(antiparasitics||[]), ...(disinfectants||[])], count: (antibiotics?.length||0)+(antifungals?.length||0)+(antiparasitics?.length||0)+(disinfectants?.length||0) },
      { name: "Cardiovascular",  Icon: Heart,        description: "", path: "/study/cardiovascular", questions: pharmaCardio,    count: pharmaCardio?.length    || 0 },
      { name: "CNS Drugs",       Icon: Brain,        description: "", path: "/study/cns",            questions: cns,             count: cns?.length             || 0 },
      { name: "Endocrine",       Icon: Activity,     description: "", path: "/study/endocrine",      questions: pharmaEndocrine, count: pharmaEndocrine?.length || 0 },
      { name: "Respiratory",     Icon: Wind,         description: "", path: "/study/respiratory",    questions: [],              count: 0 },
      { name: "GIT",             Icon: FlaskConical, description: "", path: "/study/git",            questions: [],              count: 0 },
      { name: "Renal",           Icon: Droplets,     description: "", path: "/study/renal",          questions: [],              count: 0 },
      { name: "Immune System",   Icon: Shield,       description: "", path: "/study/immune",         questions: [],              count: 0 },
    ],
    get count() {
      return (antibiotics?.length||0)+(antifungals?.length||0)+(antiparasitics?.length||0)+
             (disinfectants?.length||0)+(pharmaCardio?.length||0)+(cns?.length||0)+(pharmaEndocrine?.length||0);
    },
  },
  {
    id: "clinical_skills",
    name: "Clinical Skills",
    Icon: Stethoscope,
    description: "Practical bedside skills, examination and diagnostics",
    accent: "#0d7c6e",
    hasSubcategories: false,
    count: clinicalSkillsQuestions?.length || 0,
    path: "/study/clinical_skills",
    questions: clinicalSkillsQuestions,
    comingSoon: false,
  },
];

// ── Component ─────────────────────────────────────────────────────────────────
export default function StudyDashboard() {
  const navigate  = useNavigate();
  const [expanded, setExpanded] = useState(null);

  const go = (path, questions = null) => {
    if (clickSound) clickSound.play().catch(() => {});
    if (questions) navigate(path, { state: { questions, originalPath: path } });
    else           navigate(path, { state: { originalPath: path } });
  };

  const toggle = (id) => setExpanded(v => v === id ? null : id);

  const totalQuestions = TOPICS.reduce((a, t) => a + (t.count || 0), 0);

  return (
    <div className="sd-page">

      {/* ── Header ── */}
      <header className="sd-header">
        <button className="sd-back" onClick={() => navigate("/home")}>
          <ArrowLeft size={15} />
          <span>Back</span>
        </button>

        <div className="sd-header-center">
          <div className="sd-header-icon">
            <BookOpen size={18} />
          </div>
          <div>
            <h1 className="sd-title">Study Centre</h1>
            <p className="sd-subtitle">{totalQuestions.toLocaleString()} questions · {TOPICS.length} subjects</p>
          </div>
        </div>

        <button className="sd-ai-btn" onClick={() => navigate("/ai-quiz")}>
          <BrainCircuit size={14} />
          <span>AI Quiz</span>
        </button>
      </header>

      {/* ── Body ── */}
      <div className="sd-body">

        {/* Stats strip */}
        <div className="sd-stats-strip">
          {[
            { Icon: Layers,        label: "Subjects",  value: TOPICS.length },
            { Icon: ClipboardList, label: "Questions", value: totalQuestions.toLocaleString() },
            { Icon: BookOpen,      label: "Modes",     value: "Quiz + Flash" },
          ].map(({ Icon, label, value }) => (
            <div key={label} className="sd-stat-item">
              <Icon size={15} className="sd-stat-icon" />
              <span className="sd-stat-value">{value}</span>
              <span className="sd-stat-label">{label}</span>
            </div>
          ))}
        </div>

        {/* Topic list */}
        <div className="sd-list">
          {TOPICS.map((topic) => {
            const isOpen = expanded === topic.id;
            const TIcon  = topic.Icon;

            return (
              <div key={topic.id} className="sd-topic-wrap">

                {/* Main row */}
                <div
                  className={`sd-card ${isOpen ? "sd-card--open" : ""} ${topic.comingSoon ? "sd-card--muted" : ""}`}
                  style={{ "--accent": topic.accent }}
                  onClick={() => {
                    if (topic.comingSoon) return;
                    if (topic.hasSubcategories) toggle(topic.id);
                    else go(topic.path, topic.questions);
                  }}
                >
                  {/* Left accent bar */}
                  <div className="sd-card-bar" />

                  {/* Icon */}
                  <div className="sd-card-icon-wrap">
                    <TIcon size={20} />
                  </div>

                  {/* Text */}
                  <div className="sd-card-text">
                    <div className="sd-card-name-row">
                      <span className="sd-card-name">{topic.name}</span>
                      {topic.comingSoon && <span className="sd-coming-badge">Coming soon</span>}
                    </div>
                    <p className="sd-card-desc">{topic.description}</p>
                  </div>

                  {/* Right */}
                  <div className="sd-card-right">
                    {!topic.comingSoon && (
                      <span className="sd-card-count">
                        {topic.count > 0 ? `${topic.count} Qs` : "—"}
                      </span>
                    )}
                    {topic.hasSubcategories
                      ? <ChevronDown size={16} className={`sd-chevron ${isOpen ? "sd-chevron--open" : ""}`} />
                      : !topic.comingSoon && <ChevronRight size={16} className="sd-chevron" />
                    }
                  </div>
                </div>

                {/* Subcategory drawer */}
                {topic.hasSubcategories && isOpen && (
                  <div className="sd-drawer">
                    {topic.subcategories.map((sub) => {
                      const SIcon = sub.Icon;
                      return (
                        <button
                          key={sub.name}
                          className="sd-sub-row"
                          style={{ "--accent": topic.accent }}
                          onClick={() => go(sub.path, sub.questions)}
                        >
                          <div className="sd-sub-icon-wrap">
                            <SIcon size={15} />
                          </div>
                          <div className="sd-sub-text">
                            <span className="sd-sub-name">{sub.name}</span>
                            <span className="sd-sub-desc">{sub.description}</span>
                          </div>
                          <span className="sd-sub-count">
                            {sub.count > 0 ? `${sub.count} Qs` : "—"}
                          </span>
                          <ChevronRight size={13} className="sd-sub-arrow" />
                        </button>
                      );
                    })}
                  </div>
                )}

              </div>
            );
          })}
        </div>

        {/* AI prompt card */}
        <div className="sd-ai-card" onClick={() => navigate("/ai-quiz")}>
          <div className="sd-ai-card-left">
            <div className="sd-ai-orb">
              <BrainCircuit size={22} />
            </div>
            <div className="sd-ai-card-text">
              <h3>Need custom questions?</h3>
              <p>Generate questions on any topic, difficulty or year level using AI.</p>
            </div>
          </div>
          <button className="sd-ai-card-btn">
            Generate Quiz <ChevronRight size={14} />
          </button>
        </div>

      </div>
    </div>
  );
}