# StyleSwap - Quick Start Railway Deployment (5 Minutes)

## What You Need

1. GitHub account (to push your code)
2. Railway account (free at https://railway.app)
3. Your custom domain styleswap.co.za (already purchased)

## Quick Steps

### Step 1: Push Code to GitHub (2 minutes)

Your code is already in a Git repository. If you haven't pushed it to GitHub yet:

```bash
git remote add origin https://github.com/YOUR_USERNAME/styleswap.git
git branch -M main
git push -u origin main
```

### Step 2: Create Railway Project (2 minutes)

1. Go to https://railway.app
2. Sign up with GitHub
3. Click "New Project" → "Deploy from GitHub"
4. Select your styleswap repository
5. Click "Deploy"

Railway will automatically:
- Detect it's a Node.js app
- Build your project
- Deploy it

### Step 3: Add Environment Variables (1 minute)

In Railway dashboard:

1. Click your service
2. Go to "Variables" tab
3. Add these variables (get values from your Manus project):

| Variable | Value |
|----------|-------|
| `DATABASE_URL` | Your MySQL connection string |
| `JWT_SECRET` | Your JWT secret |
| `VITE_APP_ID` | Your Manus App ID |
| `OAUTH_SERVER_URL` | Your OAuth server URL |
| `VITE_OAUTH_PORTAL_URL` | Your OAuth portal URL |
| `OWNER_OPEN_ID` | Your owner ID |
| `OWNER_NAME` | Your name |
| `BUILT_IN_FORGE_API_URL` | Your Forge API URL |
| `BUILT_IN_FORGE_API_KEY` | Your Forge API key |
| `VITE_FRONTEND_FORGE_API_KEY` | Your frontend API key |
| `VITE_FRONTEND_FORGE_API_URL` | Your frontend Forge URL |
| `VITE_ANALYTICS_ENDPOINT` | Your analytics endpoint |
| `VITE_ANALYTICS_WEBSITE_ID` | Your analytics website ID |
| `NODE_ENV` | `production` |

### Step 4: Connect Your Domain (Varies)

1. In Railway, click "Domains"
2. Click "Add Domain"
3. Enter: `styleswap.co.za`
4. Railway gives you DNS records
5. Add those records to your domain registrar
6. Wait 24-48 hours for DNS to propagate

### Done! 🎉

Your site will be live at **https://styleswap.co.za** once:
- Deployment completes in Railway
- DNS records propagate (24-48 hours)

## Check Deployment Status

In Railway dashboard:
- Green checkmark = Deployment successful
- Red X = Check logs for errors
- Click "Logs" tab to see what went wrong

## Need Help?

- Railway docs: https://docs.railway.app
- Check the full guide: `RAILWAY_DEPLOYMENT_GUIDE.md`
- Railway support: https://railway.app/support

---

**That's it! Your StyleSwap site will be live on styleswap.co.za!** 🚀
