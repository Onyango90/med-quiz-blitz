#!/usr/bin/env node

/**
 * CLI Tool: Upload Medical Questions with AI Validation
 * Usage: node uploadQuestions.js --file path/to/questions.json [--validate] [--backend http://localhost:3001]
 */

const fs = require("fs");
const path = require("path");
const fetch = require("node-fetch");

// Color output for CLI
const colors = {
  reset: "\x1b[0m",
  green: "\x1b[32m",
  red: "\x1b[31m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  cyan: "\x1b[36m",
};

function log(message, color = "reset") {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logSuccess(message) {
  log(`✓ ${message}`, "green");
}

function logError(message) {
  log(`✗ ${message}`, "red");
}

function logWarning(message) {
  log(`⚠ ${message}`, "yellow");
}

function logInfo(message) {
  log(`ℹ ${message}`, "cyan");
}

/**
 * Parse command line arguments
 */
function parseArgs() {
  const args = process.argv.slice(2);
  const options = {
    file: null,
    validate: false,
    backend: process.env.BACKEND_URL || "http://localhost:3001",
    apiKey: process.env.DEEPSEEK_API_KEY || null,
    dryRun: false,
  };

  for (let i = 0; i < args.length; i++) {
    switch (args[i]) {
      case "--file":
        options.file = args[++i];
        break;
      case "--validate":
        options.validate = true;
        break;
      case "--backend":
        options.backend = args[++i];
        break;
      case "--dry-run":
        options.dryRun = true;
        break;
      case "--api-key":
        options.apiKey = args[++i];
        break;
      case "--help":
        showHelp();
        process.exit(0);
    }
  }

  return options;
}

/**
 * Show help message
 */
function showHelp() {
  log(`
Medical Questions Upload CLI
=============================

Usage: node uploadQuestions.js [options]

Options:
  --file <path>            Path to JSON file with questions (required)
  --validate               Validate questions using AI before uploading
  --backend <url>          Backend URL (default: http://localhost:3001)
  --api-key <key>          DeepSeek API key (or use DEEPSEEK_API_KEY env)
  --dry-run                Preview upload without actually uploading
  --help                   Show this help message

Environment Variables:
  DEEPSEEK_API_KEY         API key for AI validation
  BACKEND_URL              Backend server URL

Examples:
  # Upload questions without validation
  node uploadQuestions.js --file questions.json

  # Upload with AI validation
  node uploadQuestions.js --file questions.json --validate --api-key YOUR_KEY

  # View what will be uploaded (dry run)
  node uploadQuestions.js --file questions.json --dry-run

Question JSON Format:
[
  {
    "text": "Question text?",
    "options": ["Option A", "Option B", "Option C", "Option D"],
    "correctAnswer": 0,
    "difficulty": "easy|medium|hard",
    "year": 1-6,
    "category": "Category Name",
    "explanation": "Explanation of the answer"
  }
]
  `, "cyan");
}

/**
 * Load and parse JSON file
 */
function loadQuestionsFile(filePath) {
  try {
    if (!fs.existsSync(filePath)) {
      throw new Error(`File not found: ${filePath}`);
    }

    const content = fs.readFileSync(filePath, "utf-8");
    const questions = JSON.parse(content);

    if (!Array.isArray(questions)) {
      throw new Error("Questions file must contain a JSON array");
    }

    return questions;
  } catch (error) {
    logError(`Failed to load questions file: ${error.message}`);
    process.exit(1);
  }
}

/**
 * Validate question structure
 */
function validateQuestionStructure(question, index) {
  const errors = [];

  if (!question.text || typeof question.text !== "string") {
    errors.push("Missing or invalid 'text' field");
  }

  if (
    !Array.isArray(question.options) ||
    question.options.length < 2 ||
    question.options.length > 5
  ) {
    errors.push("Options must be an array with 2-5 items");
  }

  if (
    typeof question.correctAnswer !== "number" ||
    question.correctAnswer < 0 ||
    question.correctAnswer >= question.options.length
  ) {
    errors.push(
      `Invalid correctAnswer index (must be 0-${question.options.length - 1})`
    );
  }

  if (!question.difficulty || !["easy", "medium", "hard"].includes(question.difficulty)) {
    errors.push("Difficulty must be 'easy', 'medium', or 'hard'");
  }

  if (!question.year || question.year < 1 || question.year > 6) {
    errors.push("Year must be 1-6");
  }

  if (!question.category || typeof question.category !== "string") {
    errors.push("Missing or invalid 'category' field");
  }

  if (!question.explanation || typeof question.explanation !== "string") {
    errors.push("Missing or invalid 'explanation' field");
  }

  if (errors.length > 0) {
    return {
      valid: false,
      errors: errors,
    };
  }

  return { valid: true, errors: [] };
}

/**
 * Validate all questions
 */
function validateQuestions(questions) {
  const results = {
    total: questions.length,
    valid: 0,
    invalid: [],
  };

  questions.forEach((question, index) => {
    const validation = validateQuestionStructure(question, index);
    if (validation.valid) {
      results.valid++;
    } else {
      results.invalid.push({
        index,
        errors: validation.errors,
      });
    }
  });

  return results;
}

/**
 * Validate questions using AI
 */
async function validateWithAI(questions, apiKey) {
  if (!apiKey) {
    logWarning("No API key provided. Skipping AI validation.");
    return null;
  }

  logInfo("Validating questions with AI...");

  try {
    const prompt = `You are a medical education expert. Validate these medical quiz questions and ensure they meet these criteria:
1. Question text is clear and medically accurate
2. All 4 options are plausible and distinct
3. The correct answer is clearly right
4. The explanation is educational and accurate
5. Difficulty level matches question complexity

Return ONLY a JSON object with this structure:
{
  "validityScore": 0-100,
  "issues": [
    {"index": 0, "severity": "error|warning", "message": "description"}
  ],
  "recommendations": ["suggestion 1", "suggestion 2"]
}

Questions to validate:
${JSON.stringify(questions.slice(0, 5), null, 2)} ${questions.length > 5 ? "\n... and " + (questions.length - 5) + " more questions" : ""}`;

    const response = await fetch("https://api.deepseek.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "deepseek-chat",
        max_tokens: 2000,
        temperature: 0.3,
        messages: [
          {
            role: "system",
            content:
              "You are a medical education expert. Always respond with valid JSON only — no markdown, no explanation outside the JSON.",
          },
          {
            role: "user",
            content: prompt,
          },
        ],
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`API error: ${error.error?.message || response.status}`);
    }

    const data = await response.json();
    const raw = data.choices?.[0]?.message?.content || "";
    const clean = raw.replace(/```json|```/g, "").trim();
    const result = JSON.parse(clean);

    return result;
  } catch (error) {
    logError(`AI validation failed: ${error.message}`);
    return null;
  }
}

/**
 * Upload questions to backend
 */
async function uploadQuestions(questions, backendUrl) {
  try {
    logInfo(`Uploading ${questions.length} questions to ${backendUrl}...`);

    const response = await fetch(`${backendUrl}/api/uploadQuestions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        questions,
        timestamp: new Date().toISOString(),
        uploadedVia: "CLI-Bot",
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || `HTTP ${response.status}`);
    }

    const result = await response.json();
    return result;
  } catch (error) {
    logError(`Upload failed: ${error.message}`);
    throw error;
  }
}

/**
 * Main function
 */
async function main() {
  logInfo("Medical Questions Upload Bot");
  log("=============================\n");

  const options = parseArgs();

  if (!options.file) {
    logError("Missing required --file argument");
    showHelp();
    process.exit(1);
  }

  // Load questions
  logInfo(`Loading questions from ${options.file}...`);
  const questions = loadQuestionsFile(options.file);
  logSuccess(`Loaded ${questions.length} questions`);

  // Validate structure
  logInfo("Validating question structure...");
  const structureValidation = validateQuestions(questions);

  if (structureValidation.valid === questions.length) {
    logSuccess(`All ${questions.length} questions have valid structure`);
  } else {
    logWarning(
      `${structureValidation.valid}/${questions.length} questions are valid`
    );
    structureValidation.invalid.forEach(({ index, errors }) => {
      log(`  Question ${index + 1}:`, "red");
      errors.forEach((err) => log(`    - ${err}`, "red"));
    });

    if (
      structureValidation.invalid.length >
      structureValidation.valid * 0.1
    ) {
      logError("Too many invalid questions. Please fix them first.");
      process.exit(1);
    }
  }

  // AI Validation
  if (options.validate) {
    const aiResult = await validateWithAI(questions, options.apiKey);
    if (aiResult) {
      logSuccess(`AI Validation Score: ${aiResult.validityScore}/100`);
      if (aiResult.issues.length > 0) {
        log("\nAI Issues Found:", "yellow");
        aiResult.issues.slice(0, 5).forEach(({ index, severity, message }) => {
          const icon = severity === "error" ? "✗" : "⚠";
          log(`  ${icon} Q${index + 1}: ${message}`, severity === "error" ? "red" : "yellow");
        });
        if (aiResult.issues.length > 5) {
          log(`  ... and ${aiResult.issues.length - 5} more issues`, "yellow");
        }
      }
      if (aiResult.recommendations.length > 0) {
        log("\nRecommendations:", "cyan");
        aiResult.recommendations.forEach((rec) => {
          log(`  • ${rec}`, "cyan");
        });
      }
    }
  }

  // Dry run
  if (options.dryRun) {
    logInfo("\nDry Run - Showing first 3 questions that would be uploaded:");
    questions.slice(0, 3).forEach((q, i) => {
      log(`\n  Q${i + 1}: ${q.text}`, "blue");
      q.options.forEach((opt, idx) => {
        const mark = idx === q.correctAnswer ? " ✓" : "";
        log(`    ${idx + 1}. ${opt}${mark}`);
      });
      log(`    Category: ${q.category} | Year: ${q.year} | Difficulty: ${q.difficulty}`);
    });
    if (questions.length > 3) {
      log(`\n  ... and ${questions.length - 3} more questions`, "blue");
    }
    logSuccess("\nDry run complete. No questions were uploaded.");
    process.exit(0);
  }

  // Upload
  try {
    const result = await uploadQuestions(questions, options.backend);
    logSuccess(
      `Successfully uploaded ${result.uploadedCount || questions.length} questions!`
    );
    if (result.message) {
      logInfo(result.message);
    }
  } catch (error) {
    logError(`Upload failed: ${error.message}`);
    process.exit(1);
  }
}

main().catch((error) => {
  logError(`Fatal error: ${error.message}`);
  process.exit(1);
});
