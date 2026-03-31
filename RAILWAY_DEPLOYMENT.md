# Deploy MedBlitz Microservice to Railway

## Step-by-Step Setup

### 1. Create a Railway Account
- Visit [railway.app](https://railway.app)
- Sign up with GitHub (recommended for easy integration)

### 2. Create a New Project
1. Click **"New Project"** or **"+ New"**
2. Select **"Deploy from GitHub repo"**
3. Authorize Railway to access your GitHub account
4. Select your `med-quiz-blitz` repository
5. Click **"Deploy"**

### 3. Configure the Service
Railway will automatically detect your `package.json` but we need to specify the microservice:

1. In your Railway project dashboard:
   - Click **"Settings"** (gear icon)
   - Look for **"Root Directory"** or **"Start Command"**
   - Set **Root Directory** to `microservice` (important!)
   - Or create a `Procfile` in the microservice folder with:
     ```
     web: npm start
     ```

### 4. Set Environment Variables
1. In Railway dashboard, go to the **"Variables"** tab
2. Add a new variable:
   - **Key:** `DEEPSEEK_API_KEY`
   - **Value:** `sk-f0964e30a71f46a1968af4201773b7ea` (your actual key)
3. Click **"Add"**

### 5. Deploy
Railway will automatically deploy when you push to GitHub. You can also:
1. Click **"Deploy"** button in Railway dashboard
2. Watch the build logs in real-time

### 6. Get Your Service URL
Once deployed:
1. Go to **"Deployments"** tab
2. Find your active deployment
3. Click on it to see the public URL (something like `https://your-service-xxx.railway.app`)
4. Copy this URL

### 7. Update Your Frontend .env Files

**For Development** (`.env` file):
```
REACT_APP_API_BASE_URL=https://your-service-xxx.railway.app
```

**For Production** (create `.env.production`):
```
REACT_APP_API_BASE_URL=https://your-service-xxx.railway.app
```

Replace `your-service-xxx.railway.app` with your actual Railway URL.

### 8. Rebuild and Deploy Frontend
```bash
npm run build
firebase deploy --only hosting
```

Or if using GitHub Pages/other hosting, push these changes and redeploy.

---

## Testing the Microservice

Once deployed, test with:
```bash
curl -X POST https://your-service-xxx.railway.app/api/generateQuestions \
  -H "Content-Type: application/json" \
  -d '{"prompt": "Create 3 medical multiple choice questions about anatomy"}'
```

## Verify Health Check
```bash
curl https://your-service-xxx.railway.app/health
```

Should return:
```json
{"status": "ok"}
```

---

## Next Steps After Deployment

1. ✅ Verify the microservice is running
2. ✅ Test the AI Quiz in production
3. ✅ Monitor logs in Railway dashboard
4. ✅ Celebrate! 🎉

## Troubleshooting

If you get a 502 error:
- Check Railway logs for errors
- Verify `DEEPSEEK_API_KEY` is set correctly
- Ensure microservice root directory is configured as `microservice`

If CORS errors occur:
- The microservice already handles CORS with `*`
- Check browser console for exact error

For help, Railway has great docs at [railway.app/docs](https://railway.app/docs)
