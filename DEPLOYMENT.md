# Deployment Guide: Free Cloud Hosting

## Best Option: Render.com (Recommended)

**Why Render?**
- ✅ Completely FREE (no credit card required)
- ✅ Supports Node.js backend + Static frontend
- ✅ Automatic HTTPS
- ✅ Persistent URLs
- ✅ Easy GitHub integration
- ✅ Auto-deploy on push

---

## Step-by-Step Deployment

### Prerequisites
1. Create a GitHub account (if you don't have one)
2. Create a Render account at https://render.com (sign up with GitHub)

### Step 1: Push Code to GitHub

1. **Initialize Git (if not already done):**
   ```powershell
   cd d:\TEST Platfom
   git init
   git add .
   git commit -m "Initial commit - Online Test Platform"
   ```

2. **Create GitHub Repository:**
   - Go to https://github.com/new
   - Name: `online-test-platform`
   - Make it Public
   - Don't initialize with README
   - Click "Create repository"

3. **Push to GitHub:**
   ```powershell
   git remote add origin https://github.com/YOUR_USERNAME/online-test-platform.git
   git branch -M main
   git push -u origin main
   ```

### Step 2: Deploy Backend on Render

1. **Go to Render Dashboard:**
   - Visit https://dashboard.render.com
   - Click "New +" → "Web Service"

2. **Connect Repository:**
   - Select your `online-test-platform` repository
   - Click "Connect"

3. **Configure Backend:**
   - **Name:** `online-test-backend`
   - **Root Directory:** `backend`
   - **Environment:** `Node`
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`
   - **Plan:** `Free`
   - Click "Create Web Service"

4. **Wait for Deployment:**
   - Render will build and deploy (takes 2-3 minutes)
   - You'll get a URL like: `https://online-test-backend.onrender.com`
   - **Copy this URL!**

### Step 3: Update Frontend to Use Backend URL

1. **Update API Base URL in Frontend:**
   
   Edit these files to use your Render backend URL:
   
   **AdminPage.jsx:**
   ```javascript
   const API_BASE = `https://online-test-backend.onrender.com`;
   ```
   
   **TestPage.jsx:**
   ```javascript
   const API_BASE = `https://online-test-backend.onrender.com`;
   ```
   
   **ResultPage.jsx:**
   ```javascript
   const API_BASE = `https://online-test-backend.onrender.com`;
   ```
   
   **CandidateLandingPage.jsx:**
   ```javascript
   const API_BASE = `https://online-test-backend.onrender.com`;
   ```

2. **Commit Changes:**
   ```powershell
   git add .
   git commit -m "Update API URLs for production"
   git push
   ```

### Step 4: Deploy Frontend on Render

1. **Create Static Site:**
   - In Render Dashboard, click "New +" → "Static Site"
   - Select same repository
   - Click "Connect"

2. **Configure Frontend:**
   - **Name:** `online-test-frontend`
   - **Root Directory:** `frontend`
   - **Build Command:** `npm install && npm run build`
   - **Publish Directory:** `dist`
   - Click "Create Static Site"

3. **Wait for Deployment:**
   - You'll get a URL like: `https://online-test-frontend.onrender.com`
   - **This is your public URL!**

### Step 5: Update Backend CORS

Update `backend/server.js` to allow your frontend domain:

```javascript
app.use(cors({
    origin: 'https://online-test-frontend.onrender.com',
    credentials: true
}));
```

Commit and push:
```powershell
git add .
git commit -m "Update CORS for production"
git push
```

---

## Alternative: Railway.app

If Render doesn't work, try Railway:

1. Go to https://railway.app
2. Sign up with GitHub
3. Click "New Project" → "Deploy from GitHub repo"
4. Select your repository
5. Railway auto-detects Node.js and deploys both services
6. Get your URLs from the dashboard

---

## Final URLs

After deployment, you'll have:
- **Admin Portal:** `https://online-test-frontend.onrender.com/`
- **Backend API:** `https://online-test-backend.onrender.com/`
- **Test Links:** `https://online-test-frontend.onrender.com/test/{testId}`

Share the test links with anyone, anywhere!

---

## Important Notes

⚠️ **Free Tier Limitations:**
- Backend may "sleep" after 15 minutes of inactivity
- First request after sleep takes 30-60 seconds to wake up
- 750 hours/month free (enough for testing)

💡 **Tips:**
- Keep the app active by pinging it every 10 minutes (use a service like UptimeRobot)
- For production use, consider upgrading to paid tier ($7/month)

---

## Troubleshooting

**Backend won't start?**
- Check logs in Render dashboard
- Ensure `package.json` has correct `start` script
- Verify all dependencies are listed

**Frontend shows blank page?**
- Check browser console for errors
- Verify API_BASE URLs are correct
- Check CORS settings in backend

**Can't push to GitHub?**
- Run: `git config --global user.email "your@email.com"`
- Run: `git config --global user.name "Your Name"`
