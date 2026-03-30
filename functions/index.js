const functions = require("firebase-functions");
const cors = require("cors")({ origin: true });

exports.generateQuestions = functions.https.onRequest((req, res) => {
  cors(req, res, async () => {
    // Only allow POST requests
    if (req.method !== "POST") {
      return res.status(400).json({ error: "POST method required" });
    }

    try {
      const { prompt } = req.body;

      // Get API key from Firebase config
      const config = functions.config();
      const apiKey = config.deepseek.api_key;

      if (!apiKey) {
        return res.status(500).json({ error: "API key not configured in Firebase" });
      }

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
  });
});
