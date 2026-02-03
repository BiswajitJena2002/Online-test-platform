# Quick Deployment Guide - Render.com

## ✅ Code is on GitHub!
Repository: https://github.com/BiswajitJena2002/Online-test-platform.git

---

## Step 1: Deploy Backend (5 minutes)

1. **Go to Render Dashboard:**
   - Visit: https://dashboard.render.com
   - Sign up/Login with GitHub

2. **Create Web Service:**
   - Click "New +" → "Web Service"
   - Click "Connect account" if needed
   - Find and select `Online-test-platform` repository
   - Click "Connect"

3. **Configure Backend:**
   ```
   Name: online-test-backend
   Root Directory: backend
   Environment: Node
   Build Command: npm install
   Start Command: npm start
   Instance Type: Free
   ```
   - Click "Create Web Service"

4. **Wait for Deployment** (2-3 minutes)
   - You'll see build logs
   - When done, you'll get a URL like:
     `https://online-test-backend.onrender.com`
   - **COPY THIS URL!** You need it for Step 2

5. **Test Backend:**
   - Open: `https://online-test-backend.onrender.com`
   - Should show: "Online Test API is running"

---

## Step 2: Update Frontend API URLs

**IMPORTANT:** Replace `YOUR_BACKEND_URL` with the URL from Step 1!

Update these 4 files:

### 1. `frontend/src/pages/AdminPage.jsx`
Find line 12 and change to:
```javascript
const API_BASE = 'https://online-test-backend.onrender.com';
```

### 2. `frontend/src/pages/TestPage.jsx`
Find line 17 and change to:
```javascript
const API_BASE = 'https://online-test-backend.onrender.com';
```

### 3. `frontend/src/pages/ResultPage.jsx`
Find line 9 and change to:
```javascript
const API_BASE = 'https://online-test-backend.onrender.com';
```

### 4. `frontend/src/pages/CandidateLandingPage.jsx`
Find line 11 and change to:
```javascript
const API_BASE = 'https://online-test-backend.onrender.com';
```

**Push changes to GitHub:**
```powershell
cd d:\TEST Platfom
git add .
git commit -m "Update API URLs for production"
git push
```

---

## Step 3: Deploy Frontend (5 minutes)

1. **Create Static Site:**
   - In Render Dashboard, click "New +" → "Static Site"
   - Select `Online-test-platform` repository
   - Click "Connect"

2. **Configure Frontend:**
   ```
   Name: online-test-frontend
   Root Directory: frontend
   Build Command: npm install && npm run build
   Publish Directory: dist
   ```
   - Click "Create Static Site"

3. **Wait for Deployment** (2-3 minutes)
   - You'll get a URL like:
     `https://online-test-frontend.onrender.com`
   - **THIS IS YOUR PUBLIC URL!**

---

## Step 4: Update CORS in Backend

1. **Edit `backend/server.js`:**
   Find line 9 and change to:
   ```javascript
   app.use(cors({
       origin: 'https://online-test-frontend.onrender.com',
       credentials: true
   }));
   ```

2. **Push to GitHub:**
   ```powershell
   git add .
   git commit -m "Update CORS for production frontend"
   git push
   ```

3. **Render will auto-deploy** (wait 1-2 minutes)

---

## 🎉 You're Done!

### Your Public URLs:
- **Admin Portal:** `https://online-test-frontend.onrender.com/`
- **Backend API:** `https://online-test-backend.onrender.com/`

### How to Use:
1. Open admin portal
2. Create a test
3. Copy the generated test link
4. Share with anyone - works from any device, anywhere!

---

## ⚠️ Important Notes

**Free Tier Limitations:**
- Backend sleeps after 15 min of inactivity
- First request after sleep takes 30-60 seconds
- 750 hours/month free

**Keep Backend Awake (Optional):**
- Use UptimeRobot.com (free)
- Ping your backend URL every 10 minutes

---

## Troubleshooting

**Backend shows "Application failed to respond":**
- Check Render logs for errors
- Verify `package.json` has `"start": "node server.js"`

**Frontend shows blank page:**
- Check browser console (F12)
- Verify API_BASE URLs are correct
- Check CORS settings in backend

**Test link doesn't work:**
- Make sure you updated all 4 frontend files with backend URL
- Check that changes are pushed to GitHub
- Wait for Render to redeploy

---

Need help? Check the full guide in `DEPLOYMENT.md`
