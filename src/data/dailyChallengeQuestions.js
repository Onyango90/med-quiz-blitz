// src/data/dailyChallengeQuestions.js
// 5 questions per level, 4 levels = 20 total available
// Students only NEED Level 1 to keep streak. Levels 2-4 are bonus.

import physiologyLevel1  from "./questions/physiology_level1.json";
import physiologyLevel2  from "./questions/physiology_level2.json";
import pharmacology      from "./questions/pharmacology.json";
import antibiotics       from "./questions/pharmacology/antibiotics.json";
import antiparasitics    from "./questions/pharmacology/antiparasitics.json";
import microbiology      from "./questions/microbiology.json";
import pathology         from "./questions/pathology.json";
import immunology        from "./questions/immunology.json";
import haematology       from "./questions/haematology.json";
import clinicalChemistry from "./questions/clinical_chemistry.json";

// ── Curriculum — 80% core / 20% preview per year ──────────────────────────
const CURRICULUM = {
  1: { core: [physiologyLevel1, immunology, haematology],                            preview: [physiologyLevel2, pharmacology] },
  2: { core: [physiologyLevel2, pharmacology, microbiology],                         preview: [pathology, antibiotics] },
  3: { core: [pharmacology, pathology, microbiology, antiparasitics],                preview: [clinicalChemistry, haematology] },
  4: { core: [pathology, clinicalChemistry, haematology, pharmacology],              preview: [immunology, microbiology] },
  5: { core: [pathology, pharmacology, clinicalChemistry, haematology, microbiology, immunology], preview: [] },
  6: { core: [pathology, pharmacology, clinicalChemistry, haematology, microbiology, immunology, physiologyLevel2], preview: [] },
};

// ── Level config — each level has 5 questions at escalating difficulty ─────
export const LEVEL_CONFIG = [
  { level: 1, label: "Warm Up",    icon: "⚡", difficulty: "easy",   xpPerQ: 10, color: "#22c55e", tagline: "Let's get started" },
  { level: 2, label: "Building",   icon: "🔥", difficulty: "medium", xpPerQ: 15, color: "#f59e0b", tagline: "Now we're cooking" },
  { level: 3, label: "Advanced",   icon: "💎", difficulty: "hard",   xpPerQ: 20, color: "#6366f1", tagline: "This is where legends are made" },
  { level: 4, label: "Champion",   icon: "👑", difficulty: "hard",   xpPerQ: 25, color: "#f43f5e", tagline: "Only the dedicated reach here" },
];

// ── Meddy's between-level messages ─────────────────────────────────────────
export const MEDDY_MESSAGES = {
  1: {
    title: "Solid start, Doctor! 🧠",
    lines: [
      "Your attending would nod approvingly.",
      "That's the foundation right there.",
      "Every great clinician started exactly here.",
    ],
    cta: "Take on Level 2 🔥",
    mood: "happy",
  },
  2: {
    title: "Now we're talking! 🔥",
    lines: [
      "Even Robbins would approve of that.",
      "The questions get spicier from here.",
      "You're thinking like a doctor.",
    ],
    cta: "Bring on Level 3 💎",
    mood: "excited",
  },
  3: {
    title: "Impressive. 💎",
    lines: [
      "Most students stop here. Are you most students?",
      "That's consultant-level thinking.",
      "One more level stands between you and glory.",
    ],
    cta: "Claim the Crown 👑",
    mood: "proud",
  },
  4: {
    title: "DAILY CHAMPION! 👑",
    lines: [
      "You just outworked 90% of your class.",
      "Keep this up and you'll be the one teaching.",
      "See you tomorrow — if you dare.",
    ],
    cta: "Back to Dashboard",
    mood: "champion",
    isLast: true,
  },
};

// ── Seeded RNG — same seed = same questions for everyone on same day ────────
function seededRandom(seed) {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) & 0xffffffff;
    return (s >>> 0) / 0xffffffff;
  };
}

function dateSeed(year) {
  const d = new Date().toISOString().split("T")[0];
  return d.split("-").reduce((a, n) => a * 100 + parseInt(n), 0) + year * 1000;
}

function flatten(arrays) {
  return arrays.reduce((a, arr) => (Array.isArray(arr) && arr.length ? [...a, ...arr] : a), []);
}

function shuffle(arr, rand) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function pickByDifficulty(pool, difficulty, rand, n) {
  const byDiff = pool.filter(q => q.difficulty === difficulty);
  const fallback = pool;
  const source = shuffle(byDiff.length >= n ? byDiff : fallback, rand);
  return source.slice(0, n);
}

// ── Build all 4 levels for a given year ────────────────────────────────────
export function getDailyLevels(yearOfStudy = 1) {
  const year = Math.min(Math.max(parseInt(yearOfStudy) || 1, 1), 6);
  const curriculum = CURRICULUM[year] || CURRICULUM[1];

  const corePool    = flatten(curriculum.core);
  const previewPool = flatten(curriculum.preview);

  // 80/20 pool: 4 core + 1 preview per level
  const rand = seededRandom(dateSeed(year));
  const shuffledCore    = shuffle(corePool,    rand);
  const shuffledPreview = shuffle(previewPool, rand);

  const levels = LEVEL_CONFIG.map((cfg, i) => {
    const levelRand = seededRandom(dateSeed(year) + (i + 1) * 777);

    // Pick 4 from core + 1 from preview
    const coreOffset    = i * 4;
    const previewOffset = i * 1;

    const coreSlice    = shuffledCore.slice(coreOffset, coreOffset + 4);
    const previewSlice = shuffledPreview.length
      ? shuffledPreview.slice(previewOffset, previewOffset + 1)
      : shuffledCore.slice(coreOffset + 4, coreOffset + 5);

    const questions = shuffle([...coreSlice, ...previewSlice], levelRand)
      .slice(0, 5)
      .map(q => ({
        ...q,
        xpValue:   cfg.xpPerQ,
        isPreview: false,
      }));

    // Tag last one as preview hint if it came from preview pool
    if (previewSlice.length && questions.length === 5) {
      questions[4] = { ...questions[4], isPreview: !!previewPool.length };
    }

    return {
      ...cfg,
      questions,
      totalXP: cfg.xpPerQ * 5,
    };
  });

  return levels;
}

// ── Convenience: flat list of 5 questions for Level 1 (streak qualifier) ───
export function getDailyQuestions(yearOfStudy = 1) {
  const levels = getDailyLevels(yearOfStudy);
  return levels[0]?.questions || [];
}

export function getCurriculumLabel(yearOfStudy) {
  const labels = {
    1: "Year 1 — Preclinical Foundations",
    2: "Year 2 — Systems Physiology & Pharmacology",
    3: "Year 3 — Pathology, Pharmacology & Microbiology",
    4: "Year 4 — Clinical Sciences",
    5: "Year 5 — Integrated Clinical",
    6: "Year 6 — Finals Preparation",
  };
  return labels[parseInt(yearOfStudy)] || `Year ${yearOfStudy}`;
}