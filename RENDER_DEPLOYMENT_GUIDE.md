# StyleSwap - Render Deployment Guide

## Overview
This guide will help you deploy StyleSwap to Render in 15 minutes.

## Prerequisites
- GitHub account (free)
- Render account (free tier available)
- Your Fitroom API key: `b419554294f044339b165910d5bd62b167f4a4dd8ea8655e1e982adcd16fa1a7`

## Step 1: Push Code to GitHub

### 1.1 Create a GitHub Repository
1. Go to https://github.com/new
2. Create a new repository named `styleswap`
3. Choose "Private" (recommended for security)
4. Click "Create repository"

### 1.2 Push Code to GitHub
```bash
cd /home/ubuntu/fitroom-ai-research

# Initialize git if not already done
git init

# Add all files
git add .

# Commit
git commit -m "Initial StyleSwap deployment"

# Add remote (replace YOUR_USERNAME with your GitHub username)
git remote add origin https://github.com/YOUR_USERNAME/styleswap.git

# Push to main branch
git branch -M main
git push -u origin main
```

## Step 2: Deploy to Render

### 2.1 Create Render Account
1. Go to https://render.com
2. Sign up with GitHub (easiest option)
3. Authorize Render to access your GitHub account

### 2.2 Create New Web Service
1. Go to https://dashboard.render.com
2. Click "New +" → "Web Service"
3. Select your `styleswap` repository
4. Configure:
   - **Name:** styleswap
   - **Environment:** Node
   - **Build Command:** `pnpm install && pnpm build`
   - **Start Command:** `node dist/index.js`
   - **Plan:** Free (or Starter for better performance)

### 2.3 Add Environment Variables
In Render dashboard, go to Environment section and add:

```
DATABASE_URL=your_database_url
JWT_SECRET=your_jwt_secret
VITE_APP_ID=your_app_id
OAUTH_SERVER_URL=your_oauth_url
VITE_OAUTH_PORTAL_URL=your_oauth_portal_url
OWNER_OPEN_ID=your_owner_id
OWNER_NAME=your_name
BUILT_IN_FORGE_API_URL=your_forge_api_url
BUILT_IN_FORGE_API_KEY=your_forge_api_key
VITE_FRONTEND_FORGE_API_KEY=your_frontend_key
VITE_FRONTEND_FORGE_API_URL=your_frontend_url
FITROOM_API_KEY=b419554294f044339b165910d5bd62b167f4a4dd8ea8655e1e982adcd16fa1a7
VITE_APP_TITLE=StyleSwap
NODE_ENV=production
```

### 2.4 Deploy
1. Click "Create Web Service"
2. Render will automatically deploy your app
3. Wait for the deployment to complete (5-10 minutes)
4. Your app will be live at: `https://styleswap.onrender.com` (or similar)

## Step 3: Configure Database

If you need a database:

### 3.1 Create PostgreSQL Database on Render
1. In Render dashboard, click "New +" → "PostgreSQL"
2. Configure:
   - **Name:** styleswap-db
   - **Database:** styleswap
   - **User:** styleswap_user
   - **Region:** Same as your web service
   - **Plan:** Free

### 3.2 Connect Database to Web Service
1. Copy the database connection string from Render
2. Add it as `DATABASE_URL` environment variable in your web service
3. Redeploy the web service

## Step 4: Test Your Deployment

1. Visit your Render URL: `https://styleswap.onrender.com`
2. Test the following:
   - ✅ Homepage loads
   - ✅ Navigation works
   - ✅ Try-on feature works
   - ✅ Boutique signup works
   - ✅ Dashboard loads

## Troubleshooting

### Build Fails
- Check build logs in Render dashboard
- Ensure all dependencies are in package.json
- Run `pnpm install` locally to verify

### App Crashes After Deploy
- Check logs in Render dashboard
- Verify all environment variables are set
- Check database connection string

### Fitroom API Not Working
- Verify `FITROOM_API_KEY` is set correctly
- Check that the key is active in your Fitroom account
- Test the API key locally first

## Next Steps

1. **Custom Domain:** Add your own domain in Render settings
2. **SSL Certificate:** Automatically provided by Render
3. **Auto-deploy:** Render will auto-deploy on git push
4. **Monitoring:** Set up alerts in Render dashboard

## Support

For Render support: https://render.com/docs
For StyleSwap issues: Check the logs in Render dashboard

---

**Deployment Status:** Ready to deploy! 🚀
