// src/data/questions/index.js

// Import year files from the year folder
import year1 from "./year/year1.json";
import year2 from "./year/year2.json";
import year3 from "./year/year3.json";
import year4 from "./year/year4.json";
import year5 from "./year/year5.json";
import year6 from "./year/year6.json";

// Combine all questions by year
export const questionsByYear = {
  1: year1,
  2: year2,
  3: year3,
  4: year4,
  5: year5,
  6: year6
};

// Get questions for a user's year (shows questions up to their year)
export const getQuestionsByYearRange = (userYear) => {
  let questions = [];
  for (let y = 1; y <= userYear; y++) {
    if (questionsByYear[y]) {
      questions = [...questions, ...questionsByYear[y]];
    }
  }
  return questions;
};

// Get all questions
export const getAllQuestions = () => {
  return [
    ...year1,
    ...year2,
    ...year3,
    ...year4,
    ...year5,
    ...year6
  ];
};