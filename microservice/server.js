const express = require("express");
const cors = require("cors");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Health check endpoint
app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

// Generate questions endpoint
app.post("/api/generateQuestions", async (req, res) => {
  try {
    const { prompt } = req.body;

    if (!prompt) {
      return res.status(400).json({ error: "Prompt is required" });
    }

    // Get API key from environment variables
    const apiKey = process.env.DEEPSEEK_API_KEY;

    if (!apiKey) {
      console.error("DEEPSEEK_API_KEY environment variable not found");
      return res.status(500).json({ error: "API key not configured" });
    }

    console.log("Calling DeepSeek API with prompt...");

    // Call DeepSeek API
    const response = await fetch("https://api.deepseek.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "deepseek-chat",
        max_tokens: 4000,
        temperature: 0.7,
        messages: [
          {
            role: "system",
            content:
              "You are a medical education expert. Always respond with valid JSON only — no markdown, no explanation outside the JSON array.",
          },
          {
            role: "user",
            content: prompt,
          },
        ],
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error("DeepSeek API error:", errorData);
      throw new Error(
        errorData.error?.message || `API error: ${response.status}`
      );
    }

    const data = await response.json();
    const raw = data.choices?.[0]?.message?.content || "";
    const clean = raw.replace(/```json|```/g, "").trim();
    const parsed = JSON.parse(clean);

    if (!Array.isArray(parsed)) {
      throw new Error("Invalid response format - expected array of questions");
    }

    res.status(200).json({ questions: parsed });
  } catch (error) {
    console.error("Error in generateQuestions:", error);
    res.status(500).json({
      error: error.message || "Internal server error",
    });
  }
});

// Upload questions endpoint
app.post("/api/uploadQuestions", async (req, res) => {
  try {
    const { questions, timestamp, uploadedVia } = req.body;

    if (!Array.isArray(questions) || questions.length === 0) {
      return res.status(400).json({ error: "Questions array is required and must not be empty" });
    }

    // Validate each question structure
    const validationErrors = [];
    const validQuestions = [];

    questions.forEach((question, index) => {
      const errors = [];

      if (!question.text || typeof question.text !== "string") {
        errors.push("Missing or invalid 'text' field");
      }

      if (!Array.isArray(question.options) || question.options.length < 2) {
        errors.push("Options must be an array with at least 2 items");
      }

      if (typeof question.correctAnswer !== "number" || question.correctAnswer < 0) {
        errors.push("Invalid or missing 'correctAnswer'");
      }

      if (!question.difficulty || !["easy", "medium", "hard"].includes(question.difficulty)) {
        errors.push("Difficulty must be 'easy', 'medium', or 'hard'");
      }

      if (!question.year || question.year < 1 || question.year > 6) {
        errors.push("Year must be 1-6");
      }

      if (!question.category) {
        errors.push("Missing 'category'");
      }

      if (errors.length > 0) {
        validationErrors.push({ index, errors });
      } else {
        // Add metadata to valid questions
        validQuestions.push({
          ...question,
          id: question.id || `${question.category.toLowerCase().replace(/\s+/g, "_")}_${Date.now()}_${index}`,
          uploadedAt: timestamp || new Date().toISOString(),
          uploadedVia: uploadedVia || "unknown",
          verified: false,
        });
      }
    });

    if (validQuestions.length === 0) {
      return res.status(400).json({
        error: "No valid questions to upload",
        validationErrors,
      });
    }

    // TODO: Save to database (Firebase, MongoDB, etc.)
    // For now, we'll log and return the response
    console.log(`Received ${validQuestions.length} valid questions for upload`);
    console.log("Uploaded via:", uploadedVia);
    console.log("Timestamp:", timestamp);

    // This is where you would save to your database
    // Example: await db.collection('questions').insertMany(validQuestions);

    res.status(201).json({
      success: true,
      uploadedCount: validQuestions.length,
      failedCount: validationErrors.length,
      message: `Successfully validated and prepared ${validQuestions.length} questions for upload. ${validationErrors.length} questions had validation errors.`,
      validationErrors: validationErrors.length > 0 ? validationErrors : undefined,
      uploadedQuestions: validQuestions, // Return for confirmation
    });
  } catch (error) {
    console.error("Error in uploadQuestions:", error);
    res.status(500).json({
      error: error.message || "Internal server error",
    });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

module.exports = app;
