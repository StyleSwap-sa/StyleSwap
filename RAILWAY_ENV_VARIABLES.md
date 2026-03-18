# Environment Variables for Railway Deployment

These are the environment variables you need to add to Railway for your StyleSwap application to work properly.

## How to Add Them in Railway

1. Go to **Settings** → **Environments** tab
2. Click **"Add Variable"** for each one
3. Copy the **Variable Name** and **Value** exactly as shown below
4. Click **"Save"** after adding each one

---

## Required Environment Variables

### 1. Database Connection
**Variable Name:** `DATABASE_URL`
**Value:** Get this from your Manus project settings or your database provider

### 2. Authentication & Security
**Variable Name:** `JWT_SECRET`
**Value:** Get this from your Manus project settings (same secret you use locally)

### 3. Manus OAuth Configuration
**Variable Name:** `VITE_APP_ID`
**Value:** Your Manus application ID

**Variable Name:** `OAUTH_SERVER_URL`
**Value:** Your Manus OAuth server URL (usually something like `https://oauth.manus.im`)

**Variable Name:** `VITE_OAUTH_PORTAL_URL`
**Value:** Your Manus OAuth portal URL for login

### 4. Owner Information
**Variable Name:** `OWNER_OPEN_ID`
**Value:** Your owner ID from Manus

**Variable Name:** `OWNER_NAME`
**Value:** Your name

### 5. Manus Forge API (LLM, Storage, etc.)
**Variable Name:** `BUILT_IN_FORGE_API_URL`
**Value:** Your Manus Forge API URL

**Variable Name:** `BUILT_IN_FORGE_API_KEY`
**Value:** Your Manus Forge API key (server-side)

**Variable Name:** `VITE_FRONTEND_FORGE_API_KEY`
**Value:** Your frontend Forge API key

**Variable Name:** `VITE_FRONTEND_FORGE_API_URL`
**Value:** Your frontend Forge API URL

### 6. Analytics
**Variable Name:** `VITE_ANALYTICS_ENDPOINT`
**Value:** Your analytics endpoint URL

**Variable Name:** `VITE_ANALYTICS_WEBSITE_ID`
**Value:** Your analytics website ID

### 7. App Configuration
**Variable Name:** `VITE_APP_TITLE`
**Value:** `StyleSwap`

**Variable Name:** `VITE_APP_LOGO`
**Value:** URL to your logo image

### 8. Node Environment
**Variable Name:** `NODE_ENV`
**Value:** `production`

---

## Where to Get These Values

All these values are available in your **Manus project settings**:

1. Open your Manus Management UI
2. Go to **Settings** → **Secrets**
3. You'll see all your configured environment variables
4. Copy each value and paste it into Railway

---

## Important Notes

- **Do NOT share these values** with anyone - they contain sensitive API keys
- Make sure you copy the exact values - even small typos will cause errors
- After adding all variables, your app should automatically restart
- If something doesn't work, check the **Logs** tab in Railway to see error messages

---

## Quick Checklist

After adding all variables, verify:
- [ ] DATABASE_URL is set
- [ ] JWT_SECRET is set
- [ ] VITE_APP_ID is set
- [ ] OAUTH_SERVER_URL is set
- [ ] VITE_OAUTH_PORTAL_URL is set
- [ ] OWNER_OPEN_ID is set
- [ ] OWNER_NAME is set
- [ ] BUILT_IN_FORGE_API_URL is set
- [ ] BUILT_IN_FORGE_API_KEY is set
- [ ] VITE_FRONTEND_FORGE_API_KEY is set
- [ ] VITE_FRONTEND_FORGE_API_URL is set
- [ ] VITE_ANALYTICS_ENDPOINT is set
- [ ] VITE_ANALYTICS_WEBSITE_ID is set
- [ ] VITE_APP_TITLE is set
- [ ] VITE_APP_LOGO is set
- [ ] NODE_ENV is set to `production`

---

Once all variables are set, your StyleSwap app will be fully functional on Railway! 🚀
