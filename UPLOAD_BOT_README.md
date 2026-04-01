# Medical Questions Upload Bot Documentation

A complete AI-powered system for uploading medical quiz questions with validation and management. Includes CLI tool, backend API, and web admin interface.

## 📋 Features

- **CLI Tool**: Batch upload questions from JSON files
- **AI Validation**: Validate questions using DeepSeek API before uploading
- **Web UI Admin Panel**: User-friendly interface for uploading questions
- **Structure Validation**: Automatic validation of question format
- **Error Reporting**: Detailed error messages for invalid questions
- **Multiple Input Methods**: Web interface, CLI, programmatic API

## 🏗️ Architecture

```
Medical Quiz App
├── CLI Tool (scripts/uploadQuestions.js)
├── Web Admin UI (src/components/AdminUploader.jsx)
├── Backend API (microservice/server.js - /api/uploadQuestions)
└── Data Storage (Your database - Firebase/MongoDB/etc)
```

## 🚀 Quick Start

### 1. Using the Web Admin Interface

1. **Navigate to Admin Panel** (add AdminUploader component to your app):
   ```jsx
   import AdminUploader from "./components/AdminUploader";
   
   // In your admin/settings page:
   <AdminUploader />
   ```

2. **Upload Questions**:
   - Click the file input area
   - Select a JSON file with questions
   - Optionally enable AI validation and enter your DeepSeek API key
   - Click "Upload Questions"
   - View the results

### 2. Using the CLI Tool

#### Installation

```bash
cd scripts
npm install  # If not already installed
```

#### Basic Upload

```bash
# Upload questions from a JSON file
node uploadQuestions.js --file sample-questions.json
```

#### Upload with AI Validation

```bash
# Validate questions using AI before uploading
node uploadQuestions.js --file questions.json --validate --api-key YOUR_DEEPSEEK_KEY
```

#### Preview Before Upload (Dry Run)

```bash
# View what will be uploaded without actually uploading
node uploadQuestions.js --file questions.json --dry-run
```

#### Custom Backend URL

```bash
# Upload to a specific backend URL
node uploadQuestions.js --file questions.json --backend https://api.yourdomain.com
```

#### Full Command Reference

```bash
node uploadQuestions.js [options]

Options:
  --file <path>            Path to JSON file with questions (required)
  --validate              Validate questions using AI before uploading
  --backend <url>         Backend URL (default: http://localhost:3001)
  --api-key <key>         DeepSeek API key (or use DEEPSEEK_API_KEY env)
  --dry-run               Preview upload without actually uploading
  --help                  Show help message
```

#### Using Environment Variables

```bash
# Set API key and backend URL as environment variables
export DEEPSEEK_API_KEY=your_api_key
export BACKEND_URL=http://your-backend.com

# Then run without specifying them
node uploadQuestions.js --file questions.json --validate
```

## 📝 Question Format

Your JSON file must contain an array of questions with this structure:

```json
[
  {
    "text": "What is the primary function of mitochondria?",
    "options": [
      "Protein synthesis",
      "Energy production (ATP synthesis)",
      "DNA replication",
      "Hormone storage"
    ],
    "correctAnswer": 1,
    "difficulty": "easy",
    "year": 1,
    "category": "Cell Biology",
    "explanation": "Mitochondria are the powerhouse of the cell, responsible for producing adenosine triphosphate (ATP)."
  }
]
```

### Field Requirements

| Field | Type | Required | Details |
|-------|------|----------|---------|
| `text` | string | ✅ | The question text |
| `options` | array | ✅ | 2-5 answer options (strings) |
| `correctAnswer` | number | ✅ | Index of correct answer (0-based) |
| `difficulty` | string | ✅ | One of: `easy`, `medium`, `hard` |
| `year` | number | ✅ | Medical year (1-6) |
| `category` | string | ✅ | Question category (e.g., "Anatomy", "Pharmacology") |
| `explanation` | string | ✅ | Explanation of the correct answer |
| `id` | string | ❌ | Auto-generated if not provided |

### Optional Fields

```json
{
  "id": "gross_anatomy_001",           // Auto-generated if missing
  "xpValue": 5,                        // Experience points for correct answer
  "difficulty": "medium",
  "year": 2,
  "category": "Gross Anatomy"
}
```

## 📋 Example Questions File

See [scripts/sample-questions.json](../scripts/sample-questions.json) for a complete example with:
- Anatomy questions
- Biochemistry questions
- Pharmacology questions
- Microbiology questions

Use this as a template for your own questions.

## 🤖 AI Validation

### How It Works

The system uses **DeepSeek API** to validate:
1. ✓ Question clarity and accuracy
2. ✓ Option plausibility and distinctness
3. ✓ Correct answer validity
4. ✓ Explanation quality
5. ✓ Difficulty appropriateness

### Setting Up AI Validation

1. **Get a DeepSeek API key**:
   - Visit https://platform.deepseek.com
   - Sign up and get your API key
   - Store it securely (use environment variables)

2. **Enable in CLI**:
   ```bash
   node uploadQuestions.js --file questions.json --validate --api-key YOUR_KEY
   ```

3. **Enable in Web UI**:
   - Check "Validate with AI before uploading"
   - Enter your API key in the input field
   - Click Upload

### AI Validation Output

```
✓ AI Validation Score: 92/100

⚠ Issues Found:
  ✗ Q2: Option wording could be clearer
  ✗ Q4: Difficulty may be too high for year 1

📋 Recommendations:
• Consider clarifying medical terminology in options
• Add more medium difficulty questions for year 1
```

## 🔌 Backend API

### Upload Endpoint

**POST** `/api/uploadQuestions`

**Request Body**:
```json
{
  "questions": [
    {
      "text": "...",
      "options": [...],
      "correctAnswer": 0,
      "difficulty": "easy",
      "year": 1,
      "category": "Category",
      "explanation": "..."
    }
  ],
  "timestamp": "2024-01-15T10:30:00Z",
  "uploadedVia": "CLI-Bot"
}
```

**Response (Success - 201)**:
```json
{
  "success": true,
  "uploadedCount": 5,
  "failedCount": 0,
  "message": "Successfully validated and prepared 5 questions for upload.",
  "uploadedQuestions": [...]
}
```

**Response (Partial Failure - 201)**:
```json
{
  "success": true,
  "uploadedCount": 4,
  "failedCount": 1,
  "message": "Successfully validated and prepared 4 questions for upload.",
  "validationErrors": [
    {
      "index": 2,
      "errors": ["Missing 'explanation' field"]
    }
  ]
}
```

**Response (Error - 400)**:
```json
{
  "error": "No valid questions to upload",
  "validationErrors": [...]
}
```

## 🔄 Workflow Examples

### Example 1: Simple CLI Upload

```bash
# Prepare your questions.json file
# Then run:
node uploadQuestions.js --file questions.json

# Output:
# ✓ Loaded 5 questions
# ✓ All 5 questions have valid structure
# ✓ Successfully uploaded 5 questions!
```

### Example 2: CLI with AI Validation

```bash
export DEEPSEEK_API_KEY=sk-xxx...
node uploadQuestions.js --file questions.json --validate

# Output:
# ✓ Loaded 10 questions
# ✓ All 10 questions have valid structure
# ℹ Validating questions with AI...
# ✓ AI Validation Score: 95/100
# ✓ Successfully uploaded 10 questions!
```

### Example 3: Dry Run Preview

```bash
node uploadQuestions.js --file questions.json --dry-run

# Shows preview without uploading:
# ℹ Dry Run - Showing first 3 questions:
#   Q1: What is the longest bone...
#     1. Femur ✓
#     2. Tibia
#     3. Fibula
#     4. Humerus
#   Category: Gross Anatomy | Year: 1 | Difficulty: easy
```

### Example 4: Custom Backend

```bash
node uploadQuestions.js \
  --file questions.json \
  --backend https://api.production.com \
  --validate \
  --api-key sk-xxx...
```

## 🛠️ Integration Guide

### 1. Add Admin Route to Your App

In your main app routing:

```jsx
import AdminUploader from "./components/AdminUploader";
import { Route } from "react-router-dom";

// Add admin route (protect with authentication)
<Route 
  path="/admin/upload-questions" 
  element={<AdminUploader />} 
/>
```

### 2. Integrate with Firebase

Currently, the backend logs the questions. To save to Firebase:

```javascript
// In microservice/server.js, replace the TODO section:

import admin from 'firebase-admin';

const db = admin.firestore();

// In uploadQuestions endpoint:
await db.collection('questions').insertMany(validQuestions);
```

### 3. Add User Authentication

```javascript
// Protect the endpoint with auth middleware
app.post("/api/uploadQuestions", authenticateAdmin, async (req, res) => {
  // Only admins can upload questions
  // ...
});
```

### 4. Set Up Environment Variables

Create a `.env` file in your backend:

```env
# Backend Configuration
PORT=3001
DEEPSEEK_API_KEY=sk_test_xxx...
DATABASE_URL=your_database_url

# Frontend Configuration (in .env)
REACT_APP_BACKEND_URL=http://localhost:3001
```

## 🐛 Troubleshooting

### CLI Issues

**Error: "File not found"**
```bash
# Make sure file path is correct and relative to script location
node uploadQuestions.js --file ./sample-questions.json
```

**Error: "Invalid JSON"**
```bash
# Validate your JSON file:
# Use an online JSON validator or:
node -e "console.log(JSON.parse(require('fs').readFileSync('questions.json')))"
```

**Error: "API key not configured"**
```bash
# Set the environment variable:
export DEEPSEEK_API_KEY=your_key_here
# Or pass it directly:
node uploadQuestions.js --file questions.json --validate --api-key sk-xxx...
```

### Backend Issues

**Error: "Cannot POST /api/uploadQuestions"**
- Make sure backend is running
- Check backend URL is correct
- Verify backend has the upload endpoint

**Error: "Connection refused"**
```bash
# Start backend:
cd microservice
npm install
npm start
```

## 📊 Performance Tips

1. **Batch Size**: Upload in batches of 100-500 questions for best performance
2. **AI Validation**: Use for critical questions or every Nth batch
3. **Scheduling**: Schedule uploads during off-peak hours
4. **Backup**: Always backup your original JSON files

## 📞 Support

For issues or questions:
1. Check the troubleshooting section above
2. Review the example in `scripts/sample-questions.json`
3. Check backend logs: `docker logs your_backend_container`
4. Verify your DeepSeek API key and quota

## 🔐 Security Notes

- ⚠️ Never commit API keys to version control
- ⚠️ Use environment variables for sensitive data
- ⚠️ Protect `/api/uploadQuestions` endpoint with authentication
- ⚠️ Validate all uploads on the backend
- ⚠️ Log and audit all question uploads

## 📈 Next Steps

1. ✅ Set up the CLI tool (complete - see scripts/uploadQuestions.js)
2. ✅ Add backend endpoint (complete - see microservice/server.js)
3. ✅ Create web UI (complete - see src/components/AdminUploader.jsx)
4. ⏳ Connect to database (save to Firebase/MongoDB)
5. ⏳ Add authentication/authorization
6. ⏳ Create question review/approval workflow
7. ⏳ Add bulk import from CSV
8. ⏳ Create question analytics dashboard

## 📦 File Summary

| File | Purpose |
|------|---------|
| `scripts/uploadQuestions.js` | CLI tool for batch uploads |
| `scripts/sample-questions.json` | Example questions file |
| `microservice/server.js` | Backend API with upload endpoint |
| `src/components/AdminUploader.jsx` | React web UI component |
| `src/components/AdminUploader.css` | Styling for web UI |
| `UPLOAD_BOT_README.md` | This documentation |

---

**Happy uploading! 🚀**
