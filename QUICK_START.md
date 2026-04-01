# 🚀 Quick Start: Medical Questions Upload Bot

Get started uploading medical questions in **5 minutes**!

## Step 1: Test with Sample Questions (CLI) ⏱️ 2 min

```bash
# Navigate to the scripts folder
cd scripts

# Run the CLI with sample questions (no upload, just preview)
node uploadQuestions.js --file sample-questions.json --dry-run
```

**Expected Output**: You'll see the 5 sample questions formatted nicely.

## Step 2: Start Your Backend 🚀 1 min

```bash
# In a new terminal
cd microservice
npm install  # First time only
npm start
```

Your backend should now be running on `http://localhost:3001`

## Step 3: Actually Upload Sample Questions 📤 1 min

```bash
# In the scripts folder, upload for real
node uploadQuestions.js --file sample-questions.json
```

**Expected Output**:
```
✓ Loaded 5 questions
✓ All 5 questions have valid structure
✓ Successfully uploaded 5 questions!
```

## Step 4: Prepare Your Own Questions 📝 ∞ min

Create a JSON file with your questions. Use this template:

```json
[
  {
    "text": "What is the correct answer?",
    "options": ["Wrong A", "Correct Answer", "Wrong B", "Wrong C"],
    "correctAnswer": 1,
    "difficulty": "easy",
    "year": 1,
    "category": "Your Category",
    "explanation": "Why this is the correct answer..."
  }
]
```

## Step 5: Upload Your Questions 📤

```bash
# Upload your custom questions
node uploadQuestions.js --file your-questions.json
```

---

## 🤖 Want AI Validation? (Optional)

### Get DeepSeek API Key (Free)

1. Go to https://platform.deepseek.com
2. Sign up (free tier available)
3. Get your API key from the dashboard
4. Copy it somewhere safe

### Upload with AI Validation

```bash
# Option A: Pass API key directly
node uploadQuestions.js \
  --file your-questions.json \
  --validate \
  --api-key sk_YOUR_KEY_HERE

# Option B: Set environment variable first
export DEEPSEEK_API_KEY=sk_YOUR_KEY_HERE
node uploadQuestions.js --file your-questions.json --validate
```

**AI will validate**:
- ✓ Medical accuracy
- ✓ Question clarity
- ✓ Option quality
- ✓ Difficulty appropriateness

---

## 💻 Use the Web Admin Panel (Instead of CLI)

**Coming Soon**: Add this to your React app to upload via web interface!

```jsx
import AdminUploader from "./components/AdminUploader";

// Add to your admin page:
<AdminUploader />
```

---

## 📚 Full Documentation

For complete documentation, API details, and advanced usage:

👉 See [UPLOAD_BOT_README.md](../UPLOAD_BOT_README.md)

---

## ⚙️ Useful Commands

```bash
# See all CLI options
node uploadQuestions.js --help

# Preview what will be uploaded without uploading
node uploadQuestions.js --file questions.json --dry-run

# Upload with detailed feedback
node uploadQuestions.js --file questions.json --validate --api-key YOUR_KEY

# Set environment variable for API key (keeps it secret)
export DEEPSEEK_API_KEY=your_key_here
node uploadQuestions.js --file questions.json --validate

# Upload to custom backend URL
node uploadQuestions.js \
  --file questions.json \
  --backend https://api.yourdomain.com
```

---

## 🐛 Common Issues

**"Module not found" error**
```bash
# Make sure you're in the scripts folder
cd scripts
npm install  # Install dependencies
```

**"File not found" error**
```bash
# Make sure your JSON file is in the scripts folder or use full path
node uploadQuestions.js --file /full/path/to/your-questions.json
```

**"API key invalid" error**
```bash
# Check your DeepSeek API key is correct
# Should start with "sk_test" or "sk_"
```

**"Cannot connect to backend" error**
```bash
# Make sure backend is running in another terminal
cd microservice && npm start
```

---

## ✅ Checklist

- [ ] CLI tool works with sample questions
- [ ] Backend is running on localhost:3001
- [ ] Can upload questions successfully
- [ ] Have my questions ready in JSON format
- [ ] (Optional) Have DeepSeek API key for AI validation
- [ ] Web admin UI is integrated into app

---

## 🎯 Next Level Features (Coming Soon)

- [ ] Automatic CSV to JSON conversion
- [ ] Bulk import from Excel
- [ ] Question review & approval workflow
- [ ] AI-generated questions from topics
- [ ] Question analytics dashboard
- [ ] Database integration (Firebase/MongoDB)

---

## 📞 Need Help?

1. Check the [full documentation](../UPLOAD_BOT_README.md)
2. Review [sample-questions.json](./sample-questions.json) for examples
3. Check the troubleshooting section in the main README

---

**Happy uploading! 🎓**
