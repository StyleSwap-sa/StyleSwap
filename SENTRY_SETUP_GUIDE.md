# Sentry Error Monitoring Setup Guide

**StyleSwap Error Tracking and Performance Monitoring**

**Last Updated:** January 22, 2026

---

## Overview

Sentry is a real-time error tracking and performance monitoring platform that helps you identify, track, and fix errors in your application. This guide provides step-by-step instructions for integrating Sentry into StyleSwap.

**Benefits of Sentry:**
- Real-time error notifications
- Detailed error context and stack traces
- Performance monitoring and metrics
- Release tracking and deployment monitoring
- Team collaboration and issue management
- Integrations with Slack, GitHub, and other tools

---

## Step 1: Create a Sentry Account

### 1.1 Sign Up

1. Visit [https://sentry.io/](https://sentry.io/)
2. Click "Sign Up" and create an account
3. Choose your organization name (e.g., "StyleSwap")
4. Verify your email address

### 1.2 Create a Project

1. In the Sentry dashboard, click "Create Project"
2. Select "React" as the platform
3. Select "Alert me on every new issue" (or customize alerts)
4. Name the project "styleswap-frontend"
5. Click "Create Project"

### 1.3 Get Your DSN

1. After project creation, you'll see your **Data Source Name (DSN)**
2. Copy the DSN (looks like: `https://xxxxx@xxxxx.ingest.sentry.io/xxxxx`)
3. Save this for the next step

---

## Step 2: Install Sentry SDK

### 2.1 Install Dependencies

Install the Sentry SDK for React:

```bash
pnpm add @sentry/react @sentry/tracing
```

### 2.2 Install Browser Monitoring (Optional)

For additional browser performance monitoring:

```bash
pnpm add @sentry/browser
```

---

## Step 3: Initialize Sentry in Your Application

### 3.1 Frontend Setup

Update your `client/src/main.tsx` to initialize Sentry:

```typescript
import React from 'react';
import ReactDOM from 'react-dom/client';
import * as Sentry from '@sentry/react';
import { BrowserTracing } from '@sentry/tracing';
import App from './App';

// Initialize Sentry
Sentry.init({
  // Replace with your actual DSN
  dsn: 'https://YOUR_DSN@ingest.sentry.io/YOUR_PROJECT_ID',
  
  // Environment
  environment: process.env.NODE_ENV || 'development',
  
  // Release version
  release: '1.0.0',
  
  // Performance monitoring
  integrations: [
    new BrowserTracing({
      // Set sampling rate for performance monitoring
      tracingOrigins: ['localhost', /^\//],
      routingInstrumentation: Sentry.reactRouterV6Instrumentation(
        window.history
      ),
    }),
  ],
  
  // Capture 10% of transactions for performance monitoring
  tracesSampleRate: 0.1,
  
  // Capture 100% of errors
  sampleRate: 1.0,
  
  // Ignore certain errors
  ignoreErrors: [
    // Browser extensions
    'top.GLOBALS',
    // See: http://blog.errorception.com/2012/03/tale-of-unfindable-js-error.html
    'originalCreateNotification',
    'canvas.contentDocument',
    'MyApp_RemoveAllHighlights',
  ],
  
  // Before sending to Sentry
  beforeSend(event, hint) {
    // Filter out certain errors
    if (event.exception) {
      const error = hint.originalException;
      
      // Don't send network errors
      if (error instanceof TypeError && error.message.includes('Failed to fetch')) {
        return null;
      }
    }
    
    return event;
  },
});

// Wrap your app with Sentry's error boundary
const SentryApp = Sentry.withProfiler(App);

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <SentryApp />
  </React.StrictMode>
);
```

### 3.2 Backend Setup (Optional)

If you want to monitor your backend errors, install the Node SDK:

```bash
pnpm add @sentry/node @sentry/tracing
```

Update your `server/_core/index.ts`:

```typescript
import * as Sentry from '@sentry/node';
import { nodeProfilingIntegration } from '@sentry/profiling-node';

// Initialize Sentry
Sentry.init({
  dsn: 'https://YOUR_DSN@ingest.sentry.io/YOUR_PROJECT_ID',
  environment: process.env.NODE_ENV || 'development',
  release: '1.0.0',
  
  integrations: [
    nodeProfilingIntegration(),
    new Sentry.Integrations.Http({ tracing: true }),
    new Sentry.Integrations.OnUncaughtException(),
    new Sentry.Integrations.OnUnhandledRejection(),
  ],
  
  tracesSampleRate: 0.1,
  profilesSampleRate: 0.1,
});

// Capture unhandled exceptions
process.on('uncaughtException', (error) => {
  Sentry.captureException(error);
});

// Capture unhandled promise rejections
process.on('unhandledRejection', (reason) => {
  Sentry.captureException(reason);
});

// Add Sentry middleware to Express
app.use(Sentry.Handlers.requestHandler());
app.use(Sentry.Handlers.errorHandler());
```

---

## Step 4: Configure Environment Variables

### 4.1 Add to `.env` File

Create or update your `.env` file:

```env
VITE_SENTRY_DSN=https://YOUR_DSN@ingest.sentry.io/YOUR_PROJECT_ID
VITE_SENTRY_ENVIRONMENT=development
VITE_SENTRY_RELEASE=1.0.0
```

### 4.2 Use Environment Variables

Update your Sentry initialization:

```typescript
Sentry.init({
  dsn: import.meta.env.VITE_SENTRY_DSN,
  environment: import.meta.env.VITE_SENTRY_ENVIRONMENT,
  release: import.meta.env.VITE_SENTRY_RELEASE,
  // ... other options
});
```

---

## Step 5: Test Sentry Integration

### 5.1 Test Error Capture

Add a test button to your app to verify Sentry is working:

```typescript
// In a test component
const testSentryError = () => {
  try {
    throw new Error('Test error from StyleSwap');
  } catch (error) {
    Sentry.captureException(error);
  }
};

return (
  <button onClick={testSentryError}>
    Test Sentry Error Capture
  </button>
);
```

### 5.2 Verify in Sentry Dashboard

1. Click the test button
2. Go to your Sentry dashboard
3. You should see the error appear in real-time
4. Click on the error to see details

---

## Step 6: Configure Alerts and Notifications

### 6.1 Create Alert Rules

1. In Sentry dashboard, go to **Alerts** → **Alert Rules**
2. Click **Create Alert Rule**
3. Configure the alert:
   - **Condition:** When an event is first seen
   - **Filter:** All environments
   - **Actions:** Send to Slack, Email, or PagerDuty

### 6.2 Slack Integration

1. Go to **Integrations** → **Slack**
2. Click **Install**
3. Authorize Sentry to access your Slack workspace
4. Select the channel to receive notifications
5. Configure notification settings

### 6.3 Email Notifications

1. Go to **Project Settings** → **Alerts**
2. Configure email recipients
3. Set notification frequency (immediate, daily, weekly)

---

## Step 7: Set Up Release Tracking

### 7.1 Create Release

When deploying, create a release in Sentry:

```bash
# Install Sentry CLI
npm install -g @sentry/cli

# Create a release
sentry-cli releases create -o styleswap -p styleswap-frontend 1.0.0

# Upload source maps
sentry-cli releases -o styleswap -p styleswap-frontend files upload-sourcemaps ./dist

# Finalize release
sentry-cli releases -o styleswap -p styleswap-frontend finalize 1.0.0
```

### 7.2 Track Deployments

```bash
# Record a deployment
sentry-cli releases -o styleswap -p styleswap-frontend deploys 1.0.0 new -e production
```

---

## Step 8: Advanced Configuration

### 8.1 Custom Context

Add custom data to errors:

```typescript
// Set user context
Sentry.setUser({
  id: user.id,
  email: user.email,
  username: user.username,
});

// Set custom tags
Sentry.setTag('boutique_id', boutiqueId);
Sentry.setTag('try_on_id', tryOnId);

// Set custom context
Sentry.setContext('boutique', {
  name: boutiqueName,
  credits: boutique Credits,
  status: boutiqueStatus,
});
```

### 8.2 Breadcrumbs

Track user actions leading up to errors:

```typescript
// Automatically captured breadcrumbs
// Manual breadcrumbs
Sentry.captureMessage('User clicked payment button', 'info');

Sentry.addBreadcrumb({
  category: 'payment',
  message: 'Payment initiated',
  level: 'info',
  data: {
    amount: 1000,
    currency: 'ZAR',
  },
});
```

### 8.3 Performance Monitoring

Monitor specific operations:

```typescript
const transaction = Sentry.startTransaction({
  op: 'http.client',
  name: 'GET /api/trpc/boutiques.list',
});

try {
  // Your code here
  const response = await fetch('/api/trpc/boutiques.list');
  
  transaction.setStatus('ok');
} catch (error) {
  transaction.setStatus('error');
  throw error;
} finally {
  transaction.finish();
}
```

---

## Step 9: Team Collaboration

### 9.1 Invite Team Members

1. Go to **Settings** → **Members**
2. Click **Invite Member**
3. Enter email address
4. Set role (Owner, Manager, Member)
5. Send invitation

### 9.2 Assign Issues

1. Click on an issue in the dashboard
2. Click **Assign**
3. Select team member
4. Issue is now assigned

### 9.3 Create Teams

1. Go to **Settings** → **Teams**
2. Click **Create Team**
3. Add team members
4. Assign projects to team

---

## Step 10: Monitoring and Maintenance

### 10.1 Dashboard Metrics

Monitor these key metrics:

| Metric | Target | Action |
|--------|--------|--------|
| Error Rate | < 0.1% | Investigate spikes |
| Crash Rate | < 0.05% | Fix critical issues |
| Avg Response Time | < 500ms | Optimize slow endpoints |
| Apdex Score | > 0.95 | Monitor performance |

### 10.2 Weekly Review

- Review new errors and crashes
- Check performance trends
- Assign and resolve issues
- Update team on critical issues

### 10.3 Monthly Review

- Analyze error patterns
- Identify recurring issues
- Plan fixes for top errors
- Review performance trends

---

## Troubleshooting

### Issue: Errors Not Appearing in Sentry

**Solution:** Verify DSN is correct and environment is not filtered

```typescript
// Check if Sentry is initialized
console.log(Sentry.getCurrentHub().getClient());

// Verify DSN
console.log(import.meta.env.VITE_SENTRY_DSN);

// Check if error is being filtered
// Remove filters temporarily to test
```

### Issue: Source Maps Not Working

**Solution:** Upload source maps during deployment

```bash
# Build with source maps
npm run build

# Upload source maps
sentry-cli releases files upload-sourcemaps ./dist
```

### Issue: Too Many Errors

**Solution:** Adjust sample rate or add filters

```typescript
Sentry.init({
  // Reduce sample rate to 50%
  sampleRate: 0.5,
  
  // Filter out specific errors
  beforeSend(event) {
    if (event.exception?.values?.[0]?.value?.includes('Network')) {
      return null; // Don't send network errors
    }
    return event;
  },
});
```

---

## Best Practices

1. **Use Releases:** Always set a release version for better tracking
2. **Set User Context:** Help identify which users are affected
3. **Add Breadcrumbs:** Provide context for what happened before the error
4. **Monitor Performance:** Track slow endpoints and optimize
5. **Review Regularly:** Check dashboard weekly for new issues
6. **Assign Issues:** Ensure someone is responsible for each issue
7. **Set Alerts:** Get notified immediately of critical errors
8. **Document Errors:** Add notes to issues for team reference

---

## Integration with Other Tools

### GitHub Integration

1. Go to **Integrations** → **GitHub**
2. Click **Install**
3. Authorize Sentry
4. Create issues directly from Sentry errors

### Slack Integration

1. Go to **Integrations** → **Slack**
2. Click **Install**
3. Configure notification channels
4. Receive error alerts in Slack

### PagerDuty Integration

1. Go to **Integrations** → **PagerDuty**
2. Click **Install**
3. Configure incident creation
4. Critical errors trigger incidents

---

## Pricing and Limits

### Free Plan

- Up to 5,000 errors/month
- 30-day data retention
- Basic features
- 1 team member

### Pro Plan

- Unlimited errors
- 90-day data retention
- Advanced features
- Unlimited team members
- Custom integrations

### Pricing Calculator

Visit [https://sentry.io/pricing/](https://sentry.io/pricing/) to estimate costs based on your error volume.

---

## Next Steps

1. **Create Sentry account** and project
2. **Install SDK** in your application
3. **Configure environment variables**
4. **Test error capture**
5. **Set up alerts** and notifications
6. **Invite team members**
7. **Monitor dashboard** regularly
8. **Review and fix** errors

---

## Resources

- [Sentry Documentation](https://docs.sentry.io/)
- [React Integration Guide](https://docs.sentry.io/platforms/javascript/guides/react/)
- [Node.js Integration Guide](https://docs.sentry.io/platforms/node/)
- [Sentry Best Practices](https://docs.sentry.io/product/best-practices/)
- [Sentry Community](https://forum.sentry.io/)

---

**Document Version:** 1.0  
**Prepared By:** Manus AI  
**Review Date:** Upon Launch  
**Next Review:** Monthly or upon major updates
