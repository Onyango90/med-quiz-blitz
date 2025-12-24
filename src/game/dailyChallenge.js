// src/game/dailyChallenge.js
import { getName3In10Questions } from "./name3in10Questions";
import clinicalSkills from "../data/questions/clinicalSkills.json";
import pharmacology from "../data/questions/pharmacology.json";
import pathology from "../data/questions/pathology.json";
import microbiology from "../data/questions/microbiology.json";
import physiology from "../data/questions/physiology.json";

// Utility: pick a random item from an array
function pickRandom(arr) {
  if (!arr || arr.length === 0) return null;
  return arr[Math.floor(Math.random() * arr.length)];
}

// Utility: pick a random question by type and difficulty across multiple topics
function pickQuestion(topics, type, difficulty = null) {
  let pool = [];
  topics.forEach(topic => {
    pool.push(
      ...topic.filter(q => q.type.toLowerCase() === type.toLowerCase() &&
        (difficulty ? q.difficulty.toLowerCase() === difficulty.toLowerCase() : true))
    );
  });
  return pickRandom(pool);
}

// ✅ List of all topic arrays
const allTopics = [clinicalSkills, pharmacology, pathology, microbiology, physiology];

// Returns an array of questions for the Daily Challenge
export function getDailyChallengeQuestions() {
  const questions = [
    pickQuestion(allTopics, "mcq", "easy"),
    pickQuestion(allTopics, "mcq", "medium"),
    pickQuestion(allTopics, "short"),
    pickQuestion(allTopics, "vignette"),
    ...getName3In10Questions(), // Name 3 questions
    pickQuestion(allTopics, "image"),
    pickQuestion(allTopics, "short") // closing SAQ
  ];

  // Filter out undefined/null in case some type is missing
  return questions.filter(Boolean);
}
