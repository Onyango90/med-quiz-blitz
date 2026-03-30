const functions = require("firebase-functions");
const admin = require("firebase-admin");

admin.initializeApp();

exports.generateQuestions = functions.https.onRequest((req, res) => {
  // Enable CORS
  res.set("Access-Control-Allow-Origin", "*");
  res.set("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.set("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    res.status(204).send("");
    return;
  }

  if (req.method !== "POST") {
    return res.status(400).json({ error: "POST method required" });
  }

  (async () => {
    try {
      const { prompt } = req.body;

      // Get API key from Firebase config
      const config = functions.config();
      const apiKey = config.deepseek?.api_key;

      if (!apiKey) {
        console.error("API key not found in config:", config);
        return res.status(500).json({ error: "API key not configured" });
      }

      console.log("Using API key:", apiKey.substring(0, 10) + "...");

      // Call DeepSeek API
      const response = await fetch("https://api.deepseek.com/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: "deepseek-chat",
          max_tokens: 4000,
          temperature: 0.7,
          messages: [
            {
              role: "user",
              content: prompt,
            },
          ],
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error("DeepSeek API error:", errorData);
        throw new Error(errorData.error?.message || `API error: ${response.status}`);
      }

      const data = await response.json();
      res.status(200).json(data);
    } catch (error) {
      console.error("Error:", error);
      res.status(500).json({
        error: error.message || "Internal server error",
      });
    }
  })();
});
