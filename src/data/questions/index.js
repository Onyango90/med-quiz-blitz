// Import all your JSON files
import anatomy from "./anatomy.json";
import physiology from "./physiology.json";
import microbiology from "./microbiology.json";
import pharmacology from "./pharmacology.json";
import pathology from "./pathology.json";
import clinicalSkills from "./clinicalSkills.json";
import examPrep from "./examPrep.json";

// Combine them in a single object
export const allQuestions = {
  anatomy,
  physiology,
  microbiology,
  pharmacology,
  pathology,
  clinicalSkills,
  examPrep,
};

// Helper function to get questions by subject
export const getQuestions = (subject) => {
  return allQuestions[subject] || [];
};
