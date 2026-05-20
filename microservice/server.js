const express = require("express");
const cors    = require("cors");
require("dotenv").config();

// ── Firebase Admin SDK ────────────────────────────────────────────────────────
const admin = require("firebase-admin");

admin.initializeApp({
  credential: admin.credential.cert({
    projectId:   process.env.FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    privateKey:  (process.env.FIREBASE_PRIVATE_KEY || "").replace(/\\n/g, "\n"),
  }),
  databaseURL: process.env.FIREBASE_DATABASE_URL ||
               "https://medblitz-9c4e7-default-rtdb.firebaseio.com",
});

const firestore = admin.firestore();
const rtdb      = admin.database();

// ─────────────────────────────────────────────────────────────────────────────
const app  = express();
const PORT = process.env.PORT || 3001;

// ── CORS ──────────────────────────────────────────────────────────────────────
const ALLOWED_ORIGINS = [
  "http://localhost:3000",
  "https://med-quiz-blitz.pages.dev",
  "https://41ad2eac.med-quiz-blitz.pages.dev",
];

const corsOptions = {
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, curl, Postman) and allowed origins
    if (!origin || ALLOWED_ORIGINS.includes(origin) ||
        origin.endsWith(".med-quiz-blitz.pages.dev")) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  methods:          ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders:   ["Content-Type", "Authorization", "X-Requested-With"],
  credentials:      true,
  optionsSuccessStatus: 200,
};

app.use(cors(corsOptions));
app.options("*", cors(corsOptions));
app.use(express.json({ limit: "10mb" }));

// ── Health check ──────────────────────────────────────────────────────────────
app.get("/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// ── Helper: call DeepSeek API ─────────────────────────────────────────────────
async function callDeepSeek(prompt) {
  const apiKey = process.env.DEEPSEEK_API_KEY;
  if (!apiKey) throw new Error("DEEPSEEK_API_KEY not configured");

  const response = await fetch("https://api.deepseek.com/v1/chat/completions", {
    method:  "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization:  `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model:       "deepseek-chat",
      max_tokens:  4000,
      temperature: 0.7,
      messages: [
        {
          role:    "system",
          content: "You are a medical education expert. Always respond with valid JSON only — no markdown, no explanation outside the JSON array.",
        },
        { role: "user", content: prompt },
      ],
    }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error?.message || `DeepSeek API error: ${response.status}`);
  }

  const data  = await response.json();
  const raw   = data.choices?.[0]?.message?.content || "";
  const clean = raw.replace(/```json|```/g, "").trim();
  const parsed = JSON.parse(clean);

  if (!Array.isArray(parsed)) throw new Error("Expected JSON array from DeepSeek");
  return parsed;
}

// ── Helper: save generated questions to Firestore ─────────────────────────────
async function saveGeneratedQuestions({ questions, topic, userId, source }) {
  try {
    const batch = firestore.batch();

    // 1. Save to aiGeneratedQuestions collection (for admin review)
    const sessionRef = firestore.collection("aiGeneratedQuestions").doc();
    batch.set(sessionRef, {
      topic,
      userId:    userId || "anonymous",
      source:    source || "ai_quiz",
      count:     questions.length,
      questions,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      reviewed:  false,
    });

    // 2. Save each question individually for easy querying
    questions.forEach((q, i) => {
      const qRef = firestore.collection("questionBank").doc();
      batch.set(qRef, {
        ...q,
        id:        qRef.id,
        topic,
        source:    "ai_generated",
        verified:  false,
        userId:    userId || "anonymous",
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      });
    });

    await batch.commit();
    console.log(`Saved ${questions.length} questions to Firestore for topic: ${topic}`);
  } catch (err) {
    // Log but don't crash — questions still return to the client
    console.error("Failed to save questions to Firestore:", err.message);
  }
}

// ── Helper: check cache in Firestore ─────────────────────────────────────────
async function getCachedQuestions(topic) {
  try {
    const snap = await firestore
      .collection("aiGeneratedQuestions")
      .where("topic", "==", topic)
      .orderBy("createdAt", "desc")
      .limit(1)
      .get();

    if (snap.empty) return null;

    const data = snap.docs[0].data();
    // Cache valid for 7 days
    const createdAt  = data.createdAt?.toDate() || new Date(0);
    const ageInDays  = (Date.now() - createdAt.getTime()) / (1000 * 60 * 60 * 24);
    if (ageInDays > 7) return null;

    console.log(`Cache hit for topic: ${topic}`);
    return data.questions;
  } catch {
    return null; // Cache miss on error — generate fresh
  }
}

// ── POST /api/generateQuestions ───────────────────────────────────────────────
app.post("/api/generateQuestions", async (req, res) => {
  try {
    const { prompt, topic, userId, useCache = true } = req.body;

    if (!prompt) {
      return res.status(400).json({ error: "Prompt is required" });
    }

    // 1. Check cache first (skip if useCache=false)
    if (useCache && topic) {
      const cached = await getCachedQuestions(topic);
      if (cached) {
        return res.status(200).json({ questions: cached, cached: true });
      }
    }

    // 2. Call DeepSeek
    console.log(`Generating questions for topic: ${topic || "unspecified"}`);
    const questions = await callDeepSeek(prompt);

    // 3. Save to Firebase (fire-and-forget — don't await to keep response fast)
    if (topic) {
      saveGeneratedQuestions({ questions, topic, userId, source: "ai_quiz" });
    }

    res.status(200).json({ questions, cached: false });

  } catch (error) {
    console.error("Error in generateQuestions:", error.message);
    res.status(500).json({ error: error.message || "Internal server error" });
  }
});

// ── POST /api/uploadQuestions ─────────────────────────────────────────────────
app.post("/api/uploadQuestions", async (req, res) => {
  try {
    const { questions, timestamp, uploadedVia, userId } = req.body;

    if (!Array.isArray(questions) || questions.length === 0) {
      return res.status(400).json({ error: "Questions array is required and must not be empty" });
    }

    // ── Validate ──────────────────────────────────────────────────────────────
    const validationErrors = [];
    const validQuestions   = [];

    questions.forEach((question, index) => {
      const errors = [];

      if (!question.text || typeof question.text !== "string")
        errors.push("Missing or invalid 'text' field");

      if (!Array.isArray(question.options) || question.options.length < 2)
        errors.push("Options must be an array with at least 2 items");

      if (typeof question.correctAnswer !== "number" || question.correctAnswer < 0)
        errors.push("Invalid or missing 'correctAnswer'");

      if (!question.difficulty || !["easy", "medium", "hard"].includes(question.difficulty))
        errors.push("Difficulty must be 'easy', 'medium', or 'hard'");

      if (!question.year || question.year < 1 || question.year > 6)
        errors.push("Year must be between 1 and 6");

      if (!question.category)
        errors.push("Missing 'category'");

      if (errors.length > 0) {
        validationErrors.push({ index, errors });
      } else {
        validQuestions.push({
          ...question,
          id:         question.id || `${question.category.toLowerCase().replace(/\s+/g, "_")}_${Date.now()}_${index}`,
          uploadedAt: timestamp || new Date().toISOString(),
          uploadedVia: uploadedVia || "unknown",
          userId:     userId || "anonymous",
          verified:   false,
          source:     "manual_upload",
        });
      }
    });

    if (validQuestions.length === 0) {
      return res.status(400).json({
        error: "No valid questions to upload",
        validationErrors,
      });
    }

    // ── Save to Firebase ──────────────────────────────────────────────────────
    const batch = firestore.batch();

    // Save as a batch upload record
    const batchRef = firestore.collection("questionUploads").doc();
    batch.set(batchRef, {
      uploadedBy:  userId || "anonymous",
      uploadedVia: uploadedVia || "unknown",
      count:       validQuestions.length,
      createdAt:   admin.firestore.FieldValue.serverTimestamp(),
      reviewed:    false,
    });

    // Save each question to questionBank
    validQuestions.forEach(q => {
      const qRef = firestore.collection("questionBank").doc(q.id);
      batch.set(qRef, {
        ...q,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      });
    });

    await batch.commit();

    console.log(`Uploaded ${validQuestions.length} questions by ${userId || "anonymous"} via ${uploadedVia}`);

    res.status(201).json({
      success:            true,
      uploadedCount:      validQuestions.length,
      failedCount:        validationErrors.length,
      message:            `Successfully saved ${validQuestions.length} questions to Firebase.`,
      validationErrors:   validationErrors.length > 0 ? validationErrors : undefined,
      uploadedQuestions:  validQuestions,
    });

  } catch (error) {
    console.error("Error in uploadQuestions:", error.message);
    res.status(500).json({ error: error.message || "Internal server error" });
  }
});

// ── POST /api/saveBlitzHostSession ────────────────────────────────────────────
// Saves a BlitzHost session's generated questions for reuse
app.post("/api/saveBlitzHostSession", async (req, res) => {
  try {
    const { sessionCode, questions, config, hostUid } = req.body;
    if (!sessionCode || !Array.isArray(questions)) {
      return res.status(400).json({ error: "sessionCode and questions required" });
    }

    await firestore.collection("blitzHostSessions").doc(sessionCode).set({
      sessionCode,
      hostUid:   hostUid || "anonymous",
      config:    config || {},
      questions,
      count:     questions.length,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    res.status(200).json({ success: true, sessionCode });
  } catch (error) {
    console.error("Error saving BlitzHost session:", error.message);
    res.status(500).json({ error: error.message });
  }
});

// ── GET /api/questionBank ─────────────────────────────────────────────────────
// Retrieve saved AI questions by topic (for admin review or reuse)
app.get("/api/questionBank", async (req, res) => {
  try {
    const { topic, verified, limit: lim = 20 } = req.query;

    let query = firestore.collection("questionBank")
      .orderBy("createdAt", "desc")
      .limit(parseInt(lim));

    if (topic)    query = query.where("topic",    "==", topic);
    if (verified !== undefined) query = query.where("verified", "==", verified === "true");

    const snap = await query.get();
    const questions = snap.docs.map(d => ({ id: d.id, ...d.data() }));

    res.status(200).json({ questions, count: questions.length });
  } catch (error) {
    console.error("Error fetching question bank:", error.message);
    res.status(500).json({ error: error.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`MedBlitz microservice running on port ${PORT}`);
});

module.exports = app;