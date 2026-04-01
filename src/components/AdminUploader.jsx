import React, { useState, useRef } from "react";
import "./AdminUploader.css";

export default function AdminUploader() {
  const fileInputRef = useRef(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [validating, setValidating] = useState(false);
  const [uploadResult, setUploadResult] = useState(null);
  const [aiValidation, setAiValidation] = useState(null);
  const [validateWithAI, setValidateWithAI] = useState(false);
  const [backendUrl] = useState(process.env.REACT_APP_BACKEND_URL || "http://localhost:3001");
  const [apiKey, setApiKey] = useState("");

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.name.endsWith(".json")) {
        alert("Please select a JSON file");
        return;
      }
      setSelectedFile(file);
      setUploadResult(null);
      setAiValidation(null);
    }
  };

  const validateQuestionsFile = (questions) => {
    const errors = [];
    if (!Array.isArray(questions)) {
      errors.push("File must contain a JSON array of questions");
      return errors;
    }

    questions.forEach((q, idx) => {
      if (!q.text) errors.push(`Q${idx + 1}: Missing question text`);
      if (!Array.isArray(q.options) || q.options.length < 2) {
        errors.push(`Q${idx + 1}: Options must be array with 2-5 items`);
      }
      if (typeof q.correctAnswer !== "number" || q.correctAnswer >= q.options.length) {
        errors.push(`Q${idx + 1}: Invalid correctAnswer index`);
      }
      if (!["easy", "medium", "hard"].includes(q.difficulty)) {
        errors.push(`Q${idx + 1}: Invalid difficulty level`);
      }
      if (q.year < 1 || q.year > 6) {
        errors.push(`Q${idx + 1}: Year must be 1-6`);
      }
      if (!q.category) errors.push(`Q${idx + 1}: Missing category`);
      if (!q.explanation) errors.push(`Q${idx + 1}: Missing explanation`);
    });

    return errors;
  };

  const handleValidateWithAI = async (questions) => {
    if (!apiKey && !validateWithAI) {
      alert("Enter your DeepSeek API key for AI validation");
      return;
    }

    setValidating(true);
    try {
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
                "You are a medical education expert. Always respond with valid JSON only.",
            },
            {
              role: "user",
              content: `Validate these medical questions for accuracy and quality. Return JSON: {validityScore: 0-100, issues: [{index, severity, message}], recommendations: []}. Questions: ${JSON.stringify(
                questions.slice(0, 5)
              )}`,
            },
          ],
        }),
      });

      const data = await response.json();
      const content = data.choices?.[0]?.message?.content || "{}";
      const clean = content.replace(/```json|```/g, "").trim();
      const result = JSON.parse(clean);
      setAiValidation(result);
    } catch (error) {
      alert(`AI validation error: ${error.message}`);
    } finally {
      setValidating(false);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      alert("Please select a file");
      return;
    }

    setLoading(true);
    try {
      const content = await selectedFile.text();
      const questions = JSON.parse(content);

      // Validate structure
      const structureErrors = validateQuestionsFile(questions);
      if (structureErrors.length > 0) {
        alert(`Validation errors:\n${structureErrors.join("\n")}`);
        setLoading(false);
        return;
      }

      // Optional AI validation
      if (validateWithAI) {
        await handleValidateWithAI(questions);
      }

      // Upload to backend
      const uploadResponse = await fetch(`${backendUrl}/api/uploadQuestions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          questions,
          timestamp: new Date().toISOString(),
          uploadedVia: "Web-UI",
        }),
      });

      const result = await uploadResponse.json();
      setUploadResult(result);

      if (!uploadResponse.ok) {
        alert(`Upload failed: ${result.error}`);
      } else {
        alert(`Successfully uploaded ${result.uploadedCount} questions!`);
      }
    } catch (error) {
      alert(`Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="admin-uploader">
      <div className="uploader-header">
        <h1>📚 Medical Questions Uploader</h1>
        <p>Upload questions from JSON file with optional AI validation</p>
      </div>

      <div className="uploader-card">
        <div className="file-section">
          <label className="file-label">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileSelect}
              accept=".json"
              style={{ display: "none" }}
            />
            <div className="file-input-box">
              <span className="file-icon">📄</span>
              <span className="file-text">
                {selectedFile ? selectedFile.name : "Click to select JSON file"}
              </span>
            </div>
          </label>
        </div>

        {selectedFile && (
          <div className="file-info">
            <span className="file-size">{(selectedFile.size / 1024).toFixed(2)} KB</span>
          </div>
        )}

        <div className="validation-section">
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={validateWithAI}
              onChange={(e) => setValidateWithAI(e.target.checked)}
            />
            Validate with AI before uploading
          </label>

          {validateWithAI && (
            <input
              type="password"
              placeholder="DeepSeek API Key"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              className="api-key-input"
            />
          )}
        </div>

        {aiValidation && (
          <div className="validation-result">
            <h3>AI Validation Score: {aiValidation.validityScore}/100</h3>
            {aiValidation.issues?.length > 0 && (
              <div className="issues-list">
                <h4>Issues Found:</h4>
                {aiValidation.issues.slice(0, 5).map((issue, i) => (
                  <div key={i} className={`issue ${issue.severity}`}>
                    Q{issue.index + 1}: {issue.message}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        <button
          onClick={handleUpload}
          disabled={!selectedFile || loading || validating}
          className="upload-btn"
        >
          {loading || validating ? "Processing..." : "Upload Questions"}
        </button>

        {uploadResult && (
          <div className={`upload-result ${uploadResult.success ? "success" : "error"}`}>
            <h3>{uploadResult.message}</h3>
            {uploadResult.uploadedCount && (
              <p>✓ Uploaded: {uploadResult.uploadedCount} questions</p>
            )}
            {uploadResult.failedCount > 0 && (
              <p>✗ Failed: {uploadResult.failedCount} questions</p>
            )}
          </div>
        )}
      </div>

      <div className="instructions">
        <h3>📋 File Format</h3>
        <pre>{`[
  {
    "text": "Question ?",
    "options": ["A", "B", "C", "D"],
    "correctAnswer": 0,
    "difficulty": "easy|medium|hard",
    "year": 1-6,
    "category": "Category",
    "explanation": "Answer explanation"
  }
]`}</pre>
      </div>
    </div>
  );
}
