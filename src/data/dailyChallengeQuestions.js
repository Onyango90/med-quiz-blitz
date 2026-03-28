// src/data/dailyChallengeQuestions.js
import pharmacology from "../data/questions/pharmacology.json";
import pathology from "../data/questions/pathology.json";
import microbiology from "../data/questions/microbiology.json";
import physiology from "../data/questions/physiology.json";

function pickRandom(arr) {
  if (!arr || arr.length === 0) return null;
  return arr[Math.floor(Math.random() * arr.length)];
}

function pickQuestion(topics, type, year, difficulty = null) {
  let pool = [];
  topics.forEach(topic => {
    if (Array.isArray(topic)) {
      const filtered = topic.filter(q => {
        const matchesYear = !q.year || q.year === year || q.year === parseInt(year);
        const qType = q.type ? q.type.toLowerCase() : (q.options ? "mcq" : "short");
        const matchesType = qType === type.toLowerCase();
        const matchesDifficulty = difficulty ? q.difficulty?.toLowerCase() === difficulty.toLowerCase() : true;
        return matchesYear && matchesType && matchesDifficulty;
      });
      pool.push(...filtered);
    }
  });
  return pickRandom(pool);
}

const allTopics = [pharmacology, pathology, microbiology, physiology];

// Fallback questions for each year level (with 3 XP)
const fallbackQuestions = {
  1: [
    {
      id: "fallback_year1_1",
      type: "mcq",
      question: "What is the basic structural and functional unit of the kidney?",
      options: ["Nephron", "Glomerulus", "Bowman's capsule", "Loop of Henle"],
      answer: "Nephron",
      xpValue: 3,
      difficulty: "easy",
      year: 1,
      explanation: "The nephron is the microscopic structural and functional unit of the kidney."
    },
    {
      id: "fallback_year1_2",
      type: "mcq",
      question: "Which of the following is a function of the liver?",
      options: ["Detoxification", "Bile production", "Protein synthesis", "All of the above"],
      answer: "All of the above",
      xpValue: 3,
      difficulty: "medium",
      year: 1,
      explanation: "The liver performs multiple functions including detoxification, bile production, and protein synthesis."
    },
    {
      id: "fallback_year1_3",
      type: "short",
      question: "What is the function of mitochondria?",
      answer: "ATP production",
      xpValue: 3,
      difficulty: "easy",
      year: 1,
      explanation: "Mitochondria are the powerhouses of the cell, producing ATP through cellular respiration."
    }
  ],
  2: [
    {
      id: "fallback_year2_1",
      type: "mcq",
      question: "What is the mechanism of action of beta-blockers?",
      options: ["Block calcium channels", "Block beta-adrenergic receptors", "Inhibit ACE", "Block alpha receptors"],
      answer: "Block beta-adrenergic receptors",
      xpValue: 3,
      difficulty: "medium",
      year: 2,
      explanation: "Beta-blockers work by blocking beta-adrenergic receptors, reducing heart rate and blood pressure."
    },
    {
      id: "fallback_year2_2",
      type: "mcq",
      question: "Which of the following is a characteristic of malignant tumors?",
      options: ["Encapsulated", "Slow growing", "Metastasis", "Well differentiated"],
      answer: "Metastasis",
      xpValue: 3,
      difficulty: "medium",
      year: 2,
      explanation: "Metastasis is a key characteristic of malignant tumors, where cancer cells spread to distant sites."
    }
  ],
  3: [
    {
      id: "fallback_year3_1",
      type: "mcq",
      question: "What is the most common cause of community-acquired pneumonia?",
      options: ["Mycoplasma pneumoniae", "Streptococcus pneumoniae", "Haemophilus influenzae", "Legionella pneumophila"],
      answer: "Streptococcus pneumoniae",
      xpValue: 3,
      difficulty: "medium",
      year: 3,
      explanation: "Streptococcus pneumoniae remains the most common cause of community-acquired pneumonia."
    }
  ],
  4: [
    {
      id: "fallback_year4_1",
      type: "mcq",
      question: "What is the first-line treatment for acute ischemic stroke within 4.5 hours?",
      options: ["Aspirin", "Clopidogrel", "tPA", "Heparin"],
      answer: "tPA",
      xpValue: 3,
      difficulty: "hard",
      year: 4,
      explanation: "tPA (tissue plasminogen activator) is the standard of care for acute ischemic stroke within 4.5 hours of symptom onset."
    }
  ],
  5: [
    {
      id: "fallback_year5_1",
      type: "mcq",
      question: "What is the recommended initial therapy for septic shock?",
      options: ["Norepinephrine", "Dopamine", "Epinephrine", "Phenylephrine"],
      answer: "Norepinephrine",
      xpValue: 3,
      difficulty: "hard",
      year: 5,
      explanation: "Norepinephrine is the first-line vasopressor for septic shock according to Surviving Sepsis Campaign guidelines."
    }
  ],
  6: [
    {
      id: "fallback_graduate_1",
      type: "mcq",
      question: "Which of the following is a risk factor for osteoporosis?",
      options: ["Female gender", "Advanced age", "Low calcium intake", "All of the above"],
      answer: "All of the above",
      xpValue: 3,
      difficulty: "medium",
      year: 6,
      explanation: "Multiple factors including female gender, advanced age, and low calcium intake contribute to osteoporosis risk."
    }
  ]
};

// General questions for all years
const generalQuestions = [
  {
    id: "general_1",
    type: "mcq",
    question: "What is the most common pathogen causing urinary tract infections?",
    options: ["Klebsiella", "Proteus", "E. coli", "Enterococcus"],
    answer: "E. coli",
    xpValue: 3,
    difficulty: "medium",
    explanation: "Escherichia coli is responsible for approximately 80% of community-acquired UTIs."
  },
  {
    id: "general_2",
    type: "mcq",
    question: "What is the normal range for fasting blood glucose?",
    options: ["50-80 mg/dL", "70-100 mg/dL", "90-120 mg/dL", "100-140 mg/dL"],
    answer: "70-100 mg/dL",
    xpValue: 3,
    difficulty: "easy",
    explanation: "Normal fasting blood glucose ranges from 70-100 mg/dL (3.9-5.6 mmol/L)."
  },
  {
    id: "general_3",
    type: "short",
    question: "What is the function of hemoglobin?",
    answer: "Oxygen transport",
    xpValue: 3,
    difficulty: "easy",
    explanation: "Hemoglobin in red blood cells binds and transports oxygen from the lungs to tissues."
  },
  {
    id: "general_4",
    type: "mcq",
    question: "Which vitamin is produced by the skin when exposed to sunlight?",
    options: ["Vitamin A", "Vitamin B12", "Vitamin C", "Vitamin D"],
    answer: "Vitamin D",
    xpValue: 3,
    difficulty: "easy",
    explanation: "Vitamin D is synthesized in the skin upon exposure to UVB radiation from sunlight."
  }
];

// Generate 20 questions for daily challenge
export function getDailyChallengeQuestions(yearOfStudy = 1) {
  const yearNum = typeof yearOfStudy === 'number' ? yearOfStudy : parseInt(yearOfStudy);
  const effectiveYear = Math.min(Math.max(yearNum || 1, 1), 6);
  
  // Create 20 questions with a good mix
  const questions = [];
  
  // Mix of question types
  const types = [
    "mcq", "mcq", "mcq", "mcq", "mcq",  // 5 easy MCQs
    "mcq", "mcq", "mcq", "mcq", "mcq",  // 5 medium MCQs
    "mcq", "mcq", "mcq", "mcq", "mcq",  // 5 hard MCQs
    "short", "short", "short", "short", "short"  // 5 short answer
  ];
  
  // Difficulties distribution
  const difficulties = [
    "easy", "easy", "easy", "easy", "easy",
    "medium", "medium", "medium", "medium", "medium",
    "hard", "hard", "hard", "hard", "hard",
    null, null, null, null, null
  ];
  
  for (let i = 0; i < 20; i++) {
    const type = types[i];
    const difficulty = difficulties[i];
    let question = null;
    
    if (type === "short") {
      question = pickQuestion(allTopics, "short", effectiveYear);
    } else {
      question = pickQuestion(allTopics, "mcq", effectiveYear, difficulty);
    }
    
    if (question) {
      // Override XP to 3
      questions.push({ ...question, xpValue: 3 });
    } else {
      // Add fallback
      const yearFallbacks = fallbackQuestions[effectiveYear] || fallbackQuestions[1];
      const fallbackIndex = i % yearFallbacks.length;
      questions.push({ ...yearFallbacks[fallbackIndex], xpValue: 3 });
    }
  }
  
  return questions;
}

// Get daily questions for a specific year (same for all users on same day)
export function getDailyQuestions(yearOfStudy) {
  const today = new Date().toISOString().split('T')[0];
  const seed = today.split('-').join('');
  const questions = getDailyChallengeQuestions(yearOfStudy);
  
  // Shuffle based on date to keep same questions for all users on same day
  const shuffled = [...questions];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = (parseInt(seed) + i) % (i + 1);
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  
  return shuffled;
}