// src/data/dailyChallengeQuestions.js
// Year-based daily challenge — each year draws from its own subject pool

// ── Imports ───────────────────────────────────────────────────────────────────
import grossAnatomy      from "./questions/gross_anatomy.json";
import histology         from "./questions/histology.json";
import embryology        from "./questions/embryology.json";
import physiologyL1      from "./questions/physiology_level1.json";
import physiologyL2      from "./questions/physiology_level2.json";
import pharmacology      from "./questions/pharmacology.json";
import pathology         from "./questions/pathology.json";
import microbiology      from "./questions/microbiology.json";
import haematology       from "./questions/haematology.json";
import immunology        from "./questions/immunology.json";
import clinicalChemistry from "./questions/clinical_chemistry.json";
import antibiotics       from "./questions/pharmacology/antibiotics.json";
import antiparasitics    from "./questions/pharmacology/antiparasitics.json";
import antifungals       from "./questions/pharmacology/antifungals.json";
import disinfectants     from "./questions/pharmacology/disinfectants.json";

// ── Normalizer ────────────────────────────────────────────────────────────────
// Unifies the two question formats:
//   Format A (anatomy files): { text, options, correctAnswer (index), xpValue, ... }
//   Format B (most others):   { question, options, answer (string), xpValue, ... }
function normalizeQuestion(q, subjectTag) {
  if (!q) return null;

  // Already in Format B
  if (q.question && q.answer !== undefined) {
    return {
      ...q,
      type: q.type || (q.options ? "mcq" : "short"),
      xpValue: 3,
      subject: q.subject || subjectTag,
    };
  }

  // Format A — convert to Format B
  if (q.text && q.options && typeof q.correctAnswer === "number") {
    return {
      id:          q.id,
      type:        "mcq",
      question:    q.text,
      options:     q.options,
      answer:      q.options[q.correctAnswer],
      explanation: q.explanation || "",
      difficulty:  q.difficulty || "medium",
      year:        q.year,
      xpValue:     3,
      subject:     subjectTag,
      category:    q.category || subjectTag,
    };
  }

  return null;
}

// ── Subject pools ─────────────────────────────────────────────────────────────
// Normalize each bank once, tagged with its subject name

const POOLS = {
  grossAnatomy:      grossAnatomy.map(q      => normalizeQuestion(q, "Gross Anatomy")).filter(Boolean),
  histology:         histology.map(q         => normalizeQuestion(q, "Histology")).filter(Boolean),
  embryology:        embryology.map(q        => normalizeQuestion(q, "Embryology")).filter(Boolean),
  physiologyL1:      physiologyL1.map(q      => normalizeQuestion(q, "Physiology")).filter(Boolean),
  physiologyL2:      physiologyL2.map(q      => normalizeQuestion(q, "Physiology")).filter(Boolean),
  pharmacology:      pharmacology.map(q      => normalizeQuestion(q, "Pharmacology")).filter(Boolean),
  pathology:         pathology.map(q         => normalizeQuestion(q, "Pathology")).filter(Boolean),
  microbiology:      microbiology.map(q      => normalizeQuestion(q, "Microbiology")).filter(Boolean),
  haematology:       haematology.map(q       => normalizeQuestion(q, "Haematology")).filter(Boolean),
  immunology:        immunology.map(q        => normalizeQuestion(q, "Immunology")).filter(Boolean),
  clinicalChemistry: clinicalChemistry.map(q => normalizeQuestion(q, "Clinical Chemistry")).filter(Boolean),
  // Pharmacology sub-banks (microbiology-adjacent for Y2/Y3)
  antibiotics:       antibiotics.map(q       => normalizeQuestion(q, "Pharmacology")).filter(Boolean),
  antiparasitics:    antiparasitics.map(q    => normalizeQuestion(q, "Pharmacology")).filter(Boolean),
  antifungals:       antifungals.map(q       => normalizeQuestion(q, "Pharmacology")).filter(Boolean),
  disinfectants:     disinfectants.map(q     => normalizeQuestion(q, "Pharmacology")).filter(Boolean),
};

// ── Curriculum map ────────────────────────────────────────────────────────────
// Each year entry lists { pool, weight } pairs.
// Weight controls how many questions are drawn from that bank (out of 20 total).
// Higher weight = more questions from that subject today.

const CURRICULUM = {
  1: [
    { pool: POOLS.grossAnatomy,  weight: 6 },
    { pool: POOLS.histology,     weight: 4 },
    { pool: POOLS.embryology,    weight: 3 },
    { pool: POOLS.physiologyL1,  weight: 7 },
  ],
  2: [
    { pool: POOLS.grossAnatomy,  weight: 3 },
    { pool: POOLS.physiologyL2,  weight: 6 },
    { pool: POOLS.pharmacology,  weight: 5 },
    { pool: POOLS.microbiology,  weight: 3 },
    { pool: POOLS.antibiotics,   weight: 2 },
    { pool: POOLS.disinfectants, weight: 1 },
  ],
  3: [
    { pool: POOLS.pharmacology,   weight: 5 },
    { pool: POOLS.pathology,      weight: 5 },
    { pool: POOLS.microbiology,   weight: 4 },
    { pool: POOLS.antiparasitics, weight: 2 },
    { pool: POOLS.antifungals,    weight: 1 },
    { pool: POOLS.haematology,    weight: 3 },
  ],
  4: [
    { pool: POOLS.pharmacology,      weight: 4 },
    { pool: POOLS.pathology,         weight: 4 },
    { pool: POOLS.haematology,       weight: 3 },
    { pool: POOLS.immunology,        weight: 3 },
    { pool: POOLS.clinicalChemistry, weight: 4 },
    { pool: POOLS.microbiology,      weight: 2 },
  ],
  5: [
    { pool: POOLS.pharmacology,      weight: 4 },
    { pool: POOLS.pathology,         weight: 4 },
    { pool: POOLS.clinicalChemistry, weight: 4 },
    { pool: POOLS.haematology,       weight: 3 },
    { pool: POOLS.immunology,        weight: 3 },
    { pool: POOLS.microbiology,      weight: 2 },
  ],
  6: [
    { pool: POOLS.pharmacology,      weight: 4 },
    { pool: POOLS.pathology,         weight: 4 },
    { pool: POOLS.clinicalChemistry, weight: 4 },
    { pool: POOLS.haematology,       weight: 3 },
    { pool: POOLS.immunology,        weight: 3 },
    { pool: POOLS.microbiology,      weight: 2 },
  ],
};

// ── Seeded shuffle (date-based) ───────────────────────────────────────────────
// Same seed = same order for all users on the same day
function seededShuffle(arr, seed) {
  const result = [...arr];
  let s = seed;
  for (let i = result.length - 1; i > 0; i--) {
    s = (s * 1664525 + 1013904223) & 0xffffffff;
    const j = Math.abs(s) % (i + 1);
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

function dateSeed() {
  const today = new Date().toISOString().split("T")[0]; // "2026-04-17"
  return today.split("-").reduce((acc, part) => acc * 31 + parseInt(part, 10), 0);
}

// ── Core picker ───────────────────────────────────────────────────────────────
// Picks `count` questions from a pool, shuffled by today's seed
function pickFromPool(pool, count, seed, usedIds) {
  if (!pool || pool.length === 0) return [];
  const shuffled = seededShuffle(pool, seed);
  const picked = [];
  for (const q of shuffled) {
    if (picked.length >= count) break;
    if (!usedIds.has(q.id)) {
      picked.push(q);
      usedIds.add(q.id);
    }
  }
  return picked;
}

// ── Main export: getDailyQuestions ────────────────────────────────────────────
export function getDailyQuestions(yearOfStudy = 1) {
  const year    = Math.min(Math.max(parseInt(yearOfStudy) || 1, 1), 6);
  const seed    = dateSeed() + year; // different shuffle per year
  const curriculum = CURRICULUM[year] || CURRICULUM[1];
  const usedIds = new Set();
  const questions = [];

  // ── Pass 1: draw weighted questions from each subject pool ──
  for (const { pool, weight } of curriculum) {
    const picked = pickFromPool(pool, weight, seed + questions.length, usedIds);
    questions.push(...picked);
  }

  // ── Pass 2: if we're short (small question banks), backfill from the
  //            same pools without the weight restriction ──
  if (questions.length < 20) {
    const allInCurriculum = curriculum.flatMap(({ pool }) => pool);
    const extras = pickFromPool(allInCurriculum, 20 - questions.length, seed + 999, usedIds);
    questions.push(...extras);
  }

  // ── Pass 3: if STILL short, pull from across all pools (safety net) ──
  if (questions.length < 20) {
    const everything = Object.values(POOLS).flat();
    const extras = pickFromPool(everything, 20 - questions.length, seed + 9999, usedIds);
    questions.push(...extras);
  }

  // Final shuffle so subjects are interleaved (not all anatomy then all physio)
  return seededShuffle(questions.slice(0, 20), seed + year * 7);
}

// ── Legacy alias (used in HomeDashboard) ─────────────────────────────────────
export function getDailyChallengeQuestions(yearOfStudy = 1) {
  return getDailyQuestions(yearOfStudy);
}

// ── Utility: get subject label for a year (used in UI) ───────────────────────
export function getYearSubjectLabel(year) {
  const labels = {
    1: "Anatomy & Physiology",
    2: "Physiology, Pharmacology & Microbiology",
    3: "Pharmacology, Pathology & Microbiology",
    4: "Clinical Sciences",
    5: "Clinical Sciences",
    6: "Clinical Sciences",
  };
  return labels[Math.min(Math.max(parseInt(year) || 1, 1), 6)];
}