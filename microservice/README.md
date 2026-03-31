# MedBlitz AI API Microservice

Express.js microservice for handling DeepSeek API requests for the MedBlitz application.

## Local Development

1. Install dependencies:
```bash
npm install
```

2. Create a `.env` file (copy from `.env.example`):
```bash
cp .env.example .env
```

3. Add your DeepSeek API key to `.env`:
```
DEEPSEEK_API_KEY=sk-your-api-key-here
```

4. Start the server:
```bash
npm start
```

The server will run on `http://localhost:3001`

## API Endpoints

### POST /api/generateQuestions
Generate medical questions using DeepSeek AI

**Request:**
```json
{
  "prompt": "Your prompt here"
}
```

**Response:**
```json
{
  "questions": [
    {
      "id": "1",
      "question": "...",
      "options": [...],
      "correctAnswer": "..."
    }
  ]
}
```

## Deployment Options

### Option 1: Railway.app (Recommended - Free Tier Available)
1. Sign up at [railway.app](https://railway.app)
2. Connect your GitHub repository
3. Create a new project and select this microservice folder
4. Add environment variable `DEEPSEEK_API_KEY` in Railway dashboard
5. Deploy

### Option 2: Render.com (Free Tier Available)
1. Sign up at [render.com](https://render.com)
2. Create a new Web Service
3. Connect your repository
4. Set Build Command: `npm install`
5. Set Start Command: `npm start`
6. Add environment variable `DEEPSEEK_API_KEY`
7. Deploy

### Option 3: Heroku Alternative (Fly.io)
1. Sign up at [fly.io](https://fly.io)
2. Install Fly CLI: `brew install flyctl` (or download)
3. Run: `flyctl launch`
4. Add `DEEPSEEK_API_KEY` secret: `flyctl secrets set DEEPSEEK_API_KEY=your_key`
5. Deploy: `flyctl deploy`

### Option 4: Vercel Serverless Functions
1. Create a `vercel.json` in root:
```json
{
  "functions": {
    "api/**": {
      "runtime": "node18.x"
    }
  }
}
```
2. Move server logic to `api/generateQuestions.js`
3. Deploy with Vercel CLI or GitHub integration

## Environment Variables

- `DEEPSEEK_API_KEY`: Your DeepSeek API key (required)
- `PORT`: Server port (default: 3001)

## Testing

```bash
curl -X POST http://localhost:3001/api/generateQuestions \
  -H "Content-Type: application/json" \
  -d '{"prompt": "Test prompt"}'
```
