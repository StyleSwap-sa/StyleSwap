# Rate Limiting Integration Guide

**StyleSwap Rate Limiting Implementation**

**Last Updated:** January 22, 2026

---

## Overview

Rate limiting has been implemented to protect the StyleSwap API from abuse and ensure fair resource usage across all users. The system uses **per-user rate limiting** with IP-based fallback for unauthenticated requests.

---

## Implementation Details

### Rate Limiters Created

The following rate limiters have been created in `server/_core/rateLimiter.ts`:

#### 1. **Per-User Rate Limiter** (Default)
- **Limit:** 100 requests per minute per user
- **Applies to:** All general API endpoints
- **Key:** User ID (authenticated) or IP address (unauthenticated)
- **Use Case:** Standard API protection

#### 2. **Strict Rate Limiter**
- **Limit:** 10 requests per minute per user
- **Applies to:** Sensitive endpoints (payments, credits, etc.)
- **Key:** User ID or IP address
- **Use Case:** Prevent abuse of critical operations

#### 3. **Login Rate Limiter**
- **Limit:** 5 attempts per 15 minutes
- **Applies to:** Authentication endpoints
- **Key:** Email/username or IP address
- **Use Case:** Prevent brute force attacks

#### 4. **Payment Rate Limiter**
- **Limit:** 5 payment attempts per hour
- **Applies to:** Payment processing endpoints
- **Key:** User ID or IP address
- **Use Case:** Prevent payment fraud and abuse

#### 5. **Upload Rate Limiter**
- **Limit:** 20 uploads per hour per user
- **Applies to:** File upload endpoints
- **Key:** User ID or IP address
- **Use Case:** Prevent storage abuse

#### 6. **API Rate Limiter**
- **Limit:** 1000 requests per hour per user
- **Applies to:** General API endpoints
- **Key:** User ID or IP address
- **Use Case:** Hourly quota enforcement

---

## Integration Steps

### Step 1: Import Rate Limiters

Add the following import to your Express server file (`server/_core/index.ts`):

```typescript
import {
  createPerUserRateLimiter,
  createStrictRateLimiter,
  createLoginRateLimiter,
  createPaymentRateLimiter,
  createUploadRateLimiter,
  createApiRateLimiter,
} from './rateLimiter';
```

### Step 2: Apply Global Rate Limiter

Apply the default per-user rate limiter to all routes:

```typescript
// Apply per-user rate limiting to all routes
app.use(createPerUserRateLimiter());
```

Place this **after** your middleware setup but **before** your route definitions.

### Step 3: Apply Specific Rate Limiters

Apply stricter rate limiters to sensitive endpoints:

```typescript
// Login endpoint - use login rate limiter
app.post('/api/auth/login', createLoginRateLimiter(), (req, res) => {
  // Login logic
});

// Payment endpoint - use payment rate limiter
app.post('/api/payments/checkout', createPaymentRateLimiter(), (req, res) => {
  // Payment logic
});

// File upload endpoint - use upload rate limiter
app.post('/api/upload', createUploadRateLimiter(), (req, res) => {
  // Upload logic
});

// Credit purchase endpoint - use strict rate limiter
app.post('/api/credits/purchase', createStrictRateLimiter(), (req, res) => {
  // Credit purchase logic
});
```

### Step 4: Configure User Context

For per-user rate limiting to work correctly, ensure the user ID is available in the request context:

```typescript
// In your authentication middleware
app.use((req, res, next) => {
  if (req.user) {
    (req as any).userId = req.user.id; // Make user ID available to rate limiter
  }
  next();
});
```

---

## Response Format

When a user exceeds the rate limit, they receive a 429 (Too Many Requests) response:

```json
{
  "error": "Too many requests",
  "message": "You have exceeded the rate limit of 100 requests per minute. Please try again later.",
  "retryAfter": 60
}
```

The `retryAfter` field indicates how many seconds the user should wait before retrying.

---

## Configuration Options

### Adjusting Limits

To modify rate limits, edit `server/_core/rateLimiter.ts`:

```typescript
// Change the limit for per-user rate limiter
export const createPerUserRateLimiter = () => {
  return rateLimit({
    windowMs: 60 * 1000,  // Time window (in milliseconds)
    max: 100,              // Maximum requests in the time window
    // ... other options
  });
};
```

### Common Adjustments

| Scenario | Change |
|----------|--------|
| Increase limit to 200 req/min | Change `max: 100` to `max: 200` |
| Change window to 5 minutes | Change `windowMs: 60 * 1000` to `windowMs: 5 * 60 * 1000` |
| Disable rate limiting | Comment out `app.use(createPerUserRateLimiter())` |
| Use Redis for distributed rate limiting | Install `rate-limit-redis` and configure store |

---

## Production Considerations

### 1. Use Redis for Distributed Systems

For production with multiple server instances, use Redis instead of in-memory storage:

```bash
npm install rate-limit-redis redis
```

```typescript
import RedisStore from 'rate-limit-redis';
import { createClient } from 'redis';

const redisClient = createClient();

export const createPerUserRateLimiter = () => {
  return rateLimit({
    store: new RedisStore({
      client: redisClient,
      prefix: 'rl:', // Rate limit key prefix
    }),
    windowMs: 60 * 1000,
    max: 100,
    // ... other options
  });
};
```

### 2. Monitor Rate Limit Violations

Log rate limit violations for security monitoring:

```typescript
export const createPerUserRateLimiter = () => {
  return rateLimit({
    // ... existing options
    skip: (req, res) => {
      // Log before skipping
      return false;
    },
    handler: (req, res) => {
      const userId = (req as any).user?.id || req.ip;
      console.warn(`Rate limit exceeded for user: ${userId}`);
      
      // Send to monitoring service (e.g., Sentry)
      // captureException(new Error(`Rate limit: ${userId}`));
      
      res.status(429).json({
        error: 'Too many requests',
        message: 'You have exceeded the rate limit. Please try again later.',
        retryAfter: 60,
      });
    },
  });
};
```

### 3. Whitelist Trusted IPs

For internal services or trusted partners, skip rate limiting:

```typescript
export const createPerUserRateLimiter = () => {
  const trustedIPs = ['127.0.0.1', '::1', '10.0.0.0/8'];
  
  return rateLimit({
    skip: (req, res) => {
      // Skip rate limiting for health checks
      if (req.path === '/health') return true;
      
      // Skip for trusted IPs
      if (trustedIPs.includes(req.ip || '')) return true;
      
      return false;
    },
    // ... other options
  });
};
```

### 4. Dynamic Rate Limiting

Adjust limits based on user tier or subscription:

```typescript
export const createDynamicRateLimiter = () => {
  return rateLimit({
    max: (req, res) => {
      const user = (req as any).user;
      
      // Premium users get higher limits
      if (user?.tier === 'premium') return 500;
      if (user?.tier === 'pro') return 200;
      
      // Default limit
      return 100;
    },
    // ... other options
  });
};
```

---

## Testing Rate Limiting

### Manual Testing

Use curl to test rate limiting:

```bash
# Make multiple requests quickly
for i in {1..105}; do
  curl -H "Authorization: Bearer YOUR_TOKEN" https://api.styleswap.com/api/trpc
done

# You should see a 429 response after 100 requests
```

### Automated Testing

Add tests to verify rate limiting works:

```typescript
import { describe, it, expect } from 'vitest';
import request from 'supertest';
import app from './server';

describe('Rate Limiting', () => {
  it('should enforce per-user rate limit', async () => {
    const token = 'test-token';
    
    // Make 100 requests (should succeed)
    for (let i = 0; i < 100; i++) {
      const res = await request(app)
        .get('/api/trpc')
        .set('Authorization', `Bearer ${token}`);
      
      expect(res.status).not.toBe(429);
    }
    
    // Make 101st request (should fail)
    const res = await request(app)
      .get('/api/trpc')
      .set('Authorization', `Bearer ${token}`);
    
    expect(res.status).toBe(429);
    expect(res.body.error).toBe('Too many requests');
  });
  
  it('should enforce login rate limit', async () => {
    // Make 5 login attempts (should succeed)
    for (let i = 0; i < 5; i++) {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'test@example.com', password: 'wrong' });
      
      expect(res.status).not.toBe(429);
    }
    
    // Make 6th attempt (should fail)
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'test@example.com', password: 'wrong' });
    
    expect(res.status).toBe(429);
  });
});
```

---

## Monitoring and Alerts

### Key Metrics to Monitor

1. **Rate Limit Violations:** Number of 429 responses per minute
2. **Top Violators:** Users/IPs exceeding limits most frequently
3. **Endpoint Abuse:** Which endpoints receive most rate limit hits
4. **False Positives:** Legitimate users hitting rate limits

### Alert Thresholds

Set up alerts for:
- More than 100 rate limit violations per minute (potential attack)
- Same user hitting rate limit 10+ times (suspicious behavior)
- Specific endpoint getting 50+ rate limit hits (potential abuse)

---

## Troubleshooting

### Issue: Rate Limiting Not Working

**Solution:** Verify middleware is applied before routes:

```typescript
// ✅ Correct order
app.use(createPerUserRateLimiter());
app.use('/api', routes);

// ❌ Wrong order
app.use('/api', routes);
app.use(createPerUserRateLimiter());
```

### Issue: Legitimate Users Getting Rate Limited

**Solution:** Increase limits or whitelist specific users:

```typescript
skip: (req, res) => {
  const userId = (req as any).user?.id;
  const whitelistedUsers = ['user-123', 'user-456'];
  
  if (whitelistedUsers.includes(userId)) return true;
  return false;
},
```

### Issue: Rate Limit Not Resetting

**Solution:** Check time window configuration:

```typescript
// Ensure windowMs is in milliseconds
windowMs: 60 * 1000,  // 1 minute (correct)
// NOT: windowMs: 60,  // 60 milliseconds (wrong)
```

---

## Best Practices

1. **Use appropriate limits** for each endpoint based on typical usage
2. **Monitor violations** and adjust limits if needed
3. **Communicate limits** to API consumers in documentation
4. **Provide clear error messages** when rate limits are exceeded
5. **Use Redis in production** for distributed rate limiting
6. **Log violations** for security auditing
7. **Test thoroughly** before deploying to production
8. **Document all limits** in API documentation

---

## Next Steps

1. **Integrate rate limiters** into your Express server
2. **Test rate limiting** with manual and automated tests
3. **Monitor violations** in production
4. **Adjust limits** based on real-world usage patterns
5. **Set up alerts** for suspicious activity
6. **Document limits** in API documentation for users

---

**Document Version:** 1.0  
**Prepared By:** Manus AI  
**Review Date:** Upon Launch  
**Next Review:** Monthly or upon incidents
