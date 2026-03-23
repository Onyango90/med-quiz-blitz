import pharmacology from "../data/questions/pharmacology.json";
import pathology from "../data/questions/pathology.json";
import microbiology from "../data/questions/microbiology.json";
import physiology from "../data/questions/physiology.json";

function pickRandom(arr) {
  if (!arr || arr.length === 0) return null;
  return arr[Math.floor(Math.random() * arr.length)];
}

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

const allTopics = [pharmacology, pathology, microbiology, physiology];

export function getDailyChallengeQuestions() {
  const questions = [
    pickQuestion(allTopics, "mcq", "easy"),
    pickQuestion(allTopics, "mcq", "medium"),
    pickQuestion(allTopics, "short"),
    pickQuestion(allTopics, "vignette"),
    pickQuestion(allTopics, "image"),
    pickQuestion(allTopics, "short")
  ];

  return questions.filter(Boolean);
}