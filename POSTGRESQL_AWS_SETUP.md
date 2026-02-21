# StyleSwap: PostgreSQL + AWS S3 Integration Guide

## Overview
This guide covers the complete setup for migrating StyleSwap from Manus infrastructure to independent hosting with PostgreSQL and AWS S3.

---

## Phase 1: PostgreSQL Setup on Render

### Prerequisites
- Render account with PostgreSQL database created
- PostgreSQL connection string (format: `postgresql://user:password@host:port/database`)

### Step 1: Update Environment Variables

Add these to your `.env.local` and Render environment:

```bash
# Database
DATABASE_URL=postgresql://user:password@host:port/database

# AWS S3
AWS_ACCESS_KEY_ID=your_aws_access_key
AWS_SECRET_ACCESS_KEY=your_aws_secret_key
AWS_REGION=us-east-1
AWS_S3_BUCKET=your-styleswap-bucket

# Yoco Payment
YOCO_API_KEY=your_yoco_api_key
YOCO_SECRET_KEY=your_yoco_secret_key

# Fitroom API
FITROOM_API_KEY=your_fitroom_api_key
```

### Step 2: Install PostgreSQL Driver

```bash
pnpm add postgres
```

### Step 3: Update Drizzle Configuration

File: `drizzle.config.ts`

```typescript
import type { Config } from "drizzle-kit";

export default {
  schema: "./drizzle/schema.ts",
  out: "./drizzle/migrations",
  driver: "pg",
  dbCredentials: {
    connectionString: process.env.DATABASE_URL!,
  },
} satisfies Config;
```

### Step 4: Run Database Migrations

```bash
# Generate migrations
pnpm drizzle-kit generate

# Apply migrations to PostgreSQL
pnpm drizzle-kit migrate
```

---

## Phase 2: AWS S3 Setup

### Prerequisites
- AWS account with IAM user credentials
- S3 bucket created (e.g., `styleswap-production`)

### Step 1: Create S3 Bucket

1. Go to AWS S3 Console
2. Create new bucket: `styleswap-production`
3. Block public access settings:
   - Uncheck "Block all public access" (we'll use public-read ACL)
4. Enable versioning (optional, for backup)

### Step 2: Create IAM User with S3 Permissions

1. Go to IAM Console → Users
2. Create new user: `styleswap-app`
3. Attach policy:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "s3:PutObject",
        "s3:GetObject",
        "s3:DeleteObject",
        "s3:ListBucket"
      ],
      "Resource": [
        "arn:aws:s3:::styleswap-production",
        "arn:aws:s3:::styleswap-production/*"
      ]
    }
  ]
}
```

4. Generate access keys (Access Key ID + Secret Access Key)

### Step 3: Update Storage Implementation

The `server/storage.ts` file is already configured for AWS S3. Key functions:

```typescript
// Upload file
const { key, url } = await storagePut(
  "uploads/user-123/image.jpg",
  fileBuffer,
  "image/jpeg"
);

// Get signed download URL (expires in 1 hour)
const { url } = await storageGet("uploads/user-123/image.jpg");

// Get public URL (for public-read objects)
const publicUrl = getPublicUrl("uploads/user-123/image.jpg");

// Delete file
await storageDelete("uploads/user-123/image.jpg");
```

---

## Phase 3: Yoco Payment Integration

### Prerequisites
- Yoco account with API keys
- Webhook endpoint configured

### Step 1: Update Payment Router

File: `server/routers.ts` - Add Yoco payment procedure:

```typescript
export const appRouter = router({
  // ... other procedures

  payment: {
    createCheckout: protectedProcedure
      .input(z.object({
        amount: z.number().positive(),
        currency: z.string().default('ZAR'),
        description: z.string(),
      }))
      .mutation(async ({ ctx, input }) => {
        // Create Yoco checkout session
        const response = await fetch('https://api.yoco.com/v1/checkouts', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${process.env.YOCO_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            amount: input.amount * 100, // Convert to cents
            currency: input.currency,
            description: input.description,
            metadata: {
              userId: ctx.user.id,
              userEmail: ctx.user.email,
            },
          }),
        });

        const checkout = await response.json();
        return { checkoutUrl: checkout.redirectUrl };
      }),

    // Webhook handler for payment confirmation
    confirmPayment: publicProcedure
      .input(z.object({
        checkoutId: z.string(),
      }))
      .mutation(async ({ input }) => {
        // Verify payment with Yoco
        const response = await fetch(
          `https://api.yoco.com/v1/checkouts/${input.checkoutId}`,
          {
            headers: {
              'Authorization': `Bearer ${process.env.YOCO_API_KEY}`,
            },
          }
        );

        const checkout = await response.json();
        
        if (checkout.status === 'COMPLETED') {
          // Update user credits
          // Record transaction
          return { success: true, status: checkout.status };
        }

        return { success: false, status: checkout.status };
      }),
  },
});
```

### Step 2: Set Up Webhook Handler

File: `server/_core/index.ts` - Add webhook route:

```typescript
app.post('/api/webhooks/yoco', express.raw({ type: 'application/json' }), async (req, res) => {
  const signature = req.headers['x-yoco-signature'];
  const body = req.body.toString();

  // Verify signature
  const crypto = require('crypto');
  const hash = crypto
    .createHmac('sha256', process.env.YOCO_SECRET_KEY!)
    .update(body)
    .digest('hex');

  if (hash !== signature) {
    return res.status(401).json({ error: 'Invalid signature' });
  }

  const event = JSON.parse(body);

  if (event.type === 'checkout.completed') {
    const { checkoutId, metadata } = event.data;
    
    // Update user credits
    const db = await getDb();
    await db
      .update(userCredits)
      .set({
        remainingCredits: sql`${userCredits.remainingCredits} + ${event.data.amount / 100}`,
        updatedAt: new Date(),
      })
      .where(eq(userCredits.userId, metadata.userId));

    // Record transaction
    await db.insert(transactions).values({
      userId: metadata.userId,
      type: 'purchase',
      amount: event.data.amount / 100,
      price: event.data.amount / 100,
      currency: event.data.currency,
      status: 'completed',
    });
  }

  res.json({ received: true });
});
```

---

## Phase 4: Fitroom API Integration

### Prerequisites
- Fitroom API credentials
- Understanding of try-on request/response flow

### Implementation

File: `server/routers.ts` - Add Fitroom procedure:

```typescript
fitroom: {
  createTryOn: protectedProcedure
    .input(z.object({
      userPhotoUrl: z.string().url(),
      garmentImageUrl: z.string().url(),
      productId: z.number(),
    }))
    .mutation(async ({ ctx, input }) => {
      // Call Fitroom API
      const response = await fetch('https://api.fitroom.ai/v1/try-on', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.FITROOM_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userPhoto: input.userPhotoUrl,
          garmentImage: input.garmentImageUrl,
          returnUrl: `${process.env.VITE_APP_URL}/try-on/callback`,
        }),
      });

      const task = await response.json();

      // Store task in database
      const db = await getDb();
      await db.insert(tryOnResults).values({
        userId: ctx.user.id,
        productId: input.productId,
        userPhotoUrl: input.userPhotoUrl,
        fitRoomTaskId: task.taskId,
        fitRoomRequestId: task.requestId,
        flowType: 'b2c',
      });

      return { taskId: task.taskId, requestId: task.requestId };
    }),

  getTryOnResult: protectedProcedure
    .input(z.object({ taskId: z.string() }))
    .query(async ({ input }) => {
      // Poll Fitroom API for result
      const response = await fetch(
        `https://api.fitroom.ai/v1/try-on/${input.taskId}`,
        {
          headers: {
            'Authorization': `Bearer ${process.env.FITROOM_API_KEY}`,
          },
        }
      );

      const result = await response.json();

      if (result.status === 'completed') {
        // Update database with result image
        const db = await getDb();
        await db
          .update(tryOnResults)
          .set({
            resultImageUrl: result.resultImage,
            updatedAt: new Date(),
          })
          .where(eq(tryOnResults.fitRoomTaskId, input.taskId));
      }

      return result;
    }),
},
```

---

## Phase 5: Render Deployment

### Step 1: Connect GitHub Repository

1. Push code to GitHub
2. Go to Render Dashboard → New Web Service
3. Connect GitHub repository
4. Select branch: `main`

### Step 2: Configure Render Service

**Build Command:**
```bash
pnpm install && pnpm build
```

**Start Command:**
```bash
node dist/index.js
```

**Environment Variables:**
```
DATABASE_URL=postgresql://...
AWS_ACCESS_KEY_ID=...
AWS_SECRET_ACCESS_KEY=...
AWS_REGION=us-east-1
AWS_S3_BUCKET=styleswap-production
YOCO_API_KEY=...
YOCO_SECRET_KEY=...
FITROOM_API_KEY=...
NODE_ENV=production
```

### Step 3: Deploy

1. Click "Create Web Service"
2. Render will automatically deploy on git push
3. Monitor logs in Render Dashboard

---

## Phase 6: Vercel Frontend Deployment

### Step 1: Update Environment Variables

File: `.env.production`

```
VITE_API_URL=https://your-render-app.onrender.com/api
VITE_YOCO_PUBLIC_KEY=your_yoco_public_key
```

### Step 2: Deploy to Vercel

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel --prod
```

Or connect GitHub to Vercel for automatic deployments.

---

## Testing Checklist

- [ ] PostgreSQL connection works locally
- [ ] Drizzle migrations run successfully
- [ ] AWS S3 upload/download works
- [ ] Yoco payment flow completes
- [ ] Fitroom API integration works
- [ ] Webhooks receive events
- [ ] Render deployment succeeds
- [ ] Vercel frontend loads
- [ ] End-to-end try-on flow works

---

## Troubleshooting

### PostgreSQL Connection Issues
```bash
# Test connection
psql postgresql://user:password@host:port/database

# Check Drizzle config
cat drizzle.config.ts
```

### AWS S3 Errors
```bash
# Verify credentials
aws s3 ls --profile default

# Check bucket permissions
aws s3api get-bucket-acl --bucket styleswap-production
```

### Yoco Webhook Not Receiving
1. Check webhook URL in Yoco Dashboard
2. Verify signature verification code
3. Check Render logs for errors

### Fitroom API Timeout
1. Increase timeout in fetch call
2. Implement polling mechanism
3. Check Fitroom API status

---

## Production Checklist

- [ ] Enable HTTPS on Render
- [ ] Set up custom domain
- [ ] Configure Yoco webhook signature
- [ ] Enable S3 versioning for backup
- [ ] Set up database backups (Render)
- [ ] Configure error logging (Sentry)
- [ ] Set up monitoring (Datadog)
- [ ] Document API endpoints
- [ ] Create runbook for common issues

---

## Support

For issues:
1. Check Render logs: `render.com/dashboard`
2. Check AWS CloudWatch
3. Check Yoco Dashboard for webhook events
4. Review Fitroom API documentation

