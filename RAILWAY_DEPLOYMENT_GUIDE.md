# StyleSwap Railway Deployment Guide

This guide will walk you through deploying the StyleSwap application to Railway with your custom domain styleswap.co.za.

## Prerequisites

- Railway account (free at https://railway.app)
- GitHub account (to connect your repository)
- Your custom domain styleswap.co.za (already purchased)

## Step 1: Create Railway Account

1. Go to https://railway.app
2. Click "Sign Up"
3. Connect with GitHub (recommended for easy deployment)
4. Complete the setup

## Step 2: Create a New Project on Railway

1. In Railway dashboard, click "New Project"
2. Select "Deploy from GitHub"
3. Connect your GitHub account if not already connected
4. Select the repository containing your StyleSwap code
5. Click "Deploy"

## Step 3: Configure Environment Variables

Railway will automatically detect your Node.js application. Now you need to add environment variables:

1. In your Railway project, click on the service
2. Go to "Variables" tab
3. Add the following environment variables (copy from your Manus project settings):

```
DATABASE_URL=your_database_url
JWT_SECRET=your_jwt_secret
VITE_APP_ID=your_app_id
OAUTH_SERVER_URL=your_oauth_server_url
VITE_OAUTH_PORTAL_URL=your_oauth_portal_url
OWNER_OPEN_ID=your_owner_id
OWNER_NAME=your_name
BUILT_IN_FORGE_API_URL=your_forge_api_url
BUILT_IN_FORGE_API_KEY=your_forge_api_key
VITE_FRONTEND_FORGE_API_KEY=your_frontend_api_key
VITE_FRONTEND_FORGE_API_URL=your_frontend_forge_url
VITE_ANALYTICS_ENDPOINT=your_analytics_endpoint
VITE_ANALYTICS_WEBSITE_ID=your_analytics_id
VITE_APP_TITLE=StyleSwap
VITE_APP_LOGO=your_logo_url
NODE_ENV=production
```

## Step 4: Configure the Build and Start Commands

Railway should auto-detect these, but verify in the "Settings" tab:

- **Build Command:** `pnpm install && pnpm build`
- **Start Command:** `pnpm start`

## Step 5: Connect Your Custom Domain

1. In Railway, go to your project settings
2. Click "Domains"
3. Click "Add Domain"
4. Enter: `styleswap.co.za`
5. Railway will provide DNS records to add to your domain registrar

### Update DNS Records

1. Log in to your domain registrar (where you purchased styleswap.co.za)
2. Go to DNS settings
3. Add the DNS records provided by Railway:
   - Add a CNAME record pointing to Railway's domain
   - Or add the A record if provided
4. Wait 24-48 hours for DNS propagation (usually faster)

## Step 6: Verify Deployment

1. Once Railway shows "Deployment Successful", visit https://styleswap.co.za
2. Your site should now be live!
3. Check the Railway logs if there are any issues

## Troubleshooting

### Build Fails
- Check the build logs in Railway
- Ensure all environment variables are set
- Verify database connection string is correct

### Site Shows Blank
- Check browser console for errors (F12)
- Verify all API endpoints in environment variables
- Check Railway logs for server errors

### Domain Not Working
- Verify DNS records are correctly added
- Wait for DNS propagation (up to 48 hours)
- Check Railway domain settings

## Monitoring and Logs

In Railway dashboard:
- **Logs tab**: View real-time server logs
- **Metrics tab**: Monitor CPU, memory, and network usage
- **Deployments tab**: See deployment history

## Database Migrations

If you need to run database migrations:

1. In Railway, go to your project
2. Click the service
3. Go to "Command" tab
4. Run: `pnpm db:push`

## Support

If you encounter issues:
1. Check Railway documentation: https://docs.railway.app
2. Review application logs in Railway dashboard
3. Contact Railway support: https://railway.app/support

---

**Your site will be live at https://styleswap.co.za once deployment is complete!** 🚀
