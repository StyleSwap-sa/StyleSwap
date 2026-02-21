# StyleSwap - Render Deployment Guide

## Overview
This guide walks you through deploying StyleSwap to Render with PostgreSQL, independent of Manus infrastructure.

## Prerequisites
- ✅ Render account (created)
- ✅ PostgreSQL database on Render (created)
- ✅ GitHub repository (connected)
- ✅ API keys ready:
  - Yoco API Key & Secret
  - Fitroom API Key
  - AWS S3 credentials
  - JWT Secret

## Step 1: Prepare Your PostgreSQL Database

### Get Your Connection String
1. Go to **Render Dashboard** → **Databases**
2. Click your `styleswap-db` database
3. Copy the **External Database URL** (looks like: `postgresql://user:password@host:port/database`)

### Create Database Schema
Run this SQL to create the necessary tables:

```sql
-- Users table
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  openId VARCHAR(64) UNIQUE NOT NULL,
  clerkId VARCHAR(255),
  email VARCHAR(320) UNIQUE NOT NULL,
  name TEXT,
  loginMethod VARCHAR(64),
  role VARCHAR(50) DEFAULT 'user',
  phone VARCHAR(20),
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  lastSignedIn TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Try-on results table
CREATE TABLE tryOnResults (
  id SERIAL PRIMARY KEY,
  userId INT NOT NULL REFERENCES users(id),
  modelImageUrl TEXT,
  clothImageUrl TEXT,
  resultImageUrl TEXT,
  status VARCHAR(50) DEFAULT 'pending',
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (userId) REFERENCES users(id)
);

-- Orders table (for Yoco payments)
CREATE TABLE orders (
  id SERIAL PRIMARY KEY,
  userId INT NOT NULL REFERENCES users(id),
  yocoTransactionId VARCHAR(255) UNIQUE,
  amount DECIMAL(10, 2),
  currency VARCHAR(3) DEFAULT 'ZAR',
  status VARCHAR(50) DEFAULT 'pending',
  metadata JSONB,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (userId) REFERENCES users(id)
);

-- Garments table
CREATE TABLE garments (
  id SERIAL PRIMARY KEY,
  userId INT NOT NULL REFERENCES users(id),
  name TEXT,
  imageUrl TEXT,
  category VARCHAR(100),
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (userId) REFERENCES users(id)
);
```

## Step 2: Set Up Environment Variables on Render

1. Go to **Render Dashboard** → **Web Services** → **styleswap-backend**
2. Click **Environment** tab
3. Add these variables:

| Key | Value | Notes |
|-----|-------|-------|
| `NODE_ENV` | `production` | Already set |
| `DATABASE_URL` | Your PostgreSQL connection string | From Step 1 |
| `JWT_SECRET` | Generate a random string (32+ chars) | Use: `openssl rand -base64 32` |
| `YOCO_API_KEY` | Your Yoco API key | From Yoco dashboard |
| `YOCO_SECRET_KEY` | Your Yoco secret key | From Yoco dashboard |
| `FITROOM_API_KEY` | Your Fitroom API key | From Fitroom dashboard |
| `AWS_ACCESS_KEY_ID` | Your AWS access key | From AWS IAM |
| `AWS_SECRET_ACCESS_KEY` | Your AWS secret key | From AWS IAM |
| `AWS_S3_BUCKET` | Your S3 bucket name | e.g., `styleswap-uploads` |
| `AWS_REGION` | `us-east-1` | Or your preferred region |

## Step 3: Deploy to Render

### Option A: Automatic Deployment (Recommended)
1. Push your code to GitHub:
   ```bash
   git add .
   git commit -m "Prepare for Render deployment"
   git push origin main
   ```

2. Render will automatically detect `render.yaml` and deploy

### Option B: Manual Deployment
1. Go to **Render Dashboard** → **New** → **Web Service**
2. Connect your GitHub repository
3. Configure:
   - **Name:** `styleswap-backend`
   - **Runtime:** Node
   - **Build Command:** `pnpm install && pnpm build`
   - **Start Command:** `NODE_ENV=production node dist/index.js`
   - **Plan:** Standard (minimum for production)
4. Add environment variables from Step 2
5. Click **Create Web Service**

## Step 4: Verify Deployment

### Check Health
```bash
curl https://your-render-url.onrender.com/health
```

Expected response:
```json
{ "status": "ok" }
```

### Check Database Connection
```bash
curl https://your-render-url.onrender.com/api/trpc/auth.me
```

## Step 5: Migrate Data from Manus (Optional)

If you want to migrate existing user data from Manus:

### Export from Manus
```bash
# Connect to Manus MySQL database
mysql -h $MANUS_HOST -u $MANUS_USER -p$MANUS_PASSWORD $MANUS_DB \
  -e "SELECT * FROM users;" > users_export.sql
```

### Import to PostgreSQL
```bash
# Connect to your Render PostgreSQL
psql $DATABASE_URL < users_export.sql
```

---

## Step 6: Set Up Frontend (Next.js on Vercel)

1. Go to **Vercel** → **New Project**
2. Import your GitHub repository
3. Configure:
   - **Framework:** Next.js
   - **Root Directory:** `./client`
   - **Build Command:** `pnpm build`
   - **Output Directory:** `.next`
4. Add environment variables:
   - `NEXT_PUBLIC_API_URL`: `https://your-render-url.onrender.com`
5. Deploy

---

## Troubleshooting

### 502 Error on Render
**Cause:** Build failed or start command incorrect
**Fix:**
1. Check build logs: Render Dashboard → Logs
2. Verify `dist/index.js` exists after build
3. Ensure all environment variables are set

### Database Connection Refused
**Cause:** DATABASE_URL not set or incorrect
**Fix:**
1. Verify connection string format: `postgresql://user:password@host:port/database`
2. Check firewall allows Render IP
3. Test connection locally: `psql $DATABASE_URL`

### Port Already in Use
**Cause:** Port 3000 is hardcoded
**Fix:**
- Render sets `PORT` env var automatically
- Ensure your server listens to `process.env.PORT || 3000`

## Next Steps

1. ✅ Deploy backend to Render
2. ✅ Deploy frontend to Vercel
3. ✅ Test payment flow with Yoco
4. ✅ Test virtual try-on with Fitroom API
5. ✅ Set up monitoring & logging
6. ✅ Configure custom domain

---

## Support

- **Render Docs:** https://render.com/docs
- **PostgreSQL Docs:** https://www.postgresql.org/docs/
- **Yoco Integration:** https://yoco.com/docs
- **Fitroom API:** Contact Fitroom support
