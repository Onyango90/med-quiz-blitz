// Import all category questions
import antibiotics from './antibiotics.json';
import cardiovascular from './cardiovascular.json';
import cns from './cns.json';
import endocrine from './endocrine.json';

// Combine all questions into one array
const allPharmacologyQuestions = [
    ...antibiotics,
    ...cardiovascular,
    ...cns,
    ...endocrine
];

export default allPharmacologyQuestions;

// Export categories separately for the dropdown
export {
    antibiotics,
    cardiovascular,
    cns,
    endocrine
};