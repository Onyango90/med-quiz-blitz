import { allQuestions, questionPoolFiles } from "./index";

/**
 * Get random questions from a subject or from all pool.
 * @param {Object} options
 *  - subject: 'anatomy' | 'physiology' | ... or 'all'
 *  - count: number of questions to return
 *  - type: optional filter type ('mcq','short','vignette')
 *  - difficulty: optional ('easy','medium','hard')
 */
export function getQuestions({ subject = "all", count = 10, type, difficulty }) {
  let pool = subject === "all" ? [...allQuestions] : [...(questionPoolFiles[subject] || [])];

  if (type) pool = pool.filter((q) => q.type === type);
  if (difficulty) pool = pool.filter((q) => q.difficulty === difficulty);

  // shuffle
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  return pool.slice(0, Math.min(count, pool.length));
}
