import rateLimit from 'express-rate-limit';
import { Request, Response } from 'express';

/**
 * Per-user rate limiter: 100 requests per minute per authenticated user
 * Falls back to IP-based limiting for unauthenticated requests
 */
export const createPerUserRateLimiter = () => {
  return rateLimit({
    // Use user ID if authenticated, otherwise use IP address
    keyGenerator: (req: Request, res: Response) => {
      // Try to get user ID from session/auth context
      const userId = (req as any).user?.id || (req as any).userId;
      if (userId) {
        return `user:${userId}`;
      }
      // Fall back to IP address for unauthenticated requests
      return req.ip || 'unknown';
    },
    
    // 100 requests per 60 seconds (1 minute)
    windowMs: 60 * 1000,
    max: 100,
    
    // Message sent when rate limit is exceeded
    message: {
      error: 'Too many requests from this user. Please try again later.',
      retryAfter: 60,
    },
    
    // HTTP status code when rate limit is exceeded
    statusCode: 429,
    
    // Skip rate limiting for certain requests
    skip: (req: Request, res: Response) => {
      // Skip rate limiting for health checks
      if (req.path === '/health' || req.path === '/healthz') {
        return true;
      }
      return false;
    },
    
    // Handler for when rate limit is exceeded
    handler: (req: Request, res: Response) => {
      res.status(429).json({
        error: 'Too many requests',
        message: 'You have exceeded the rate limit of 100 requests per minute. Please try again later.',
        retryAfter: 60,
      });
    },
    
    // Store requests in memory (for production, consider Redis)
    store: undefined, // Uses default in-memory store
    
    // Don't skip successful requests
    skipSuccessfulRequests: false,
    
    // Don't skip failed requests
    skipFailedRequests: false,
  });
};

/**
 * Strict rate limiter for sensitive endpoints: 10 requests per minute
 * Used for login, payment, and other sensitive operations
 */
export const createStrictRateLimiter = () => {
  return rateLimit({
    keyGenerator: (req: Request, res: Response) => {
      const userId = (req as any).user?.id || (req as any).userId;
      if (userId) {
        return `strict:${userId}`;
      }
      return `strict:${req.ip || 'unknown'}`;
    },
    
    // 10 requests per 60 seconds (1 minute)
    windowMs: 60 * 1000,
    max: 10,
    
    message: {
      error: 'Too many requests. Please try again later.',
      retryAfter: 60,
    },
    
    statusCode: 429,
    
    handler: (req: Request, res: Response) => {
      res.status(429).json({
        error: 'Rate limit exceeded',
        message: 'Too many requests to this sensitive endpoint. Please try again after 1 minute.',
        retryAfter: 60,
      });
    },
    
    skipSuccessfulRequests: false,
    skipFailedRequests: false,
  });
};

/**
 * Login rate limiter: 5 attempts per 15 minutes
 * Prevents brute force attacks on authentication
 */
export const createLoginRateLimiter = () => {
  return rateLimit({
    keyGenerator: (req: Request, res: Response) => {
      // Use email or username if provided, otherwise use IP
      const email = (req.body?.email || req.body?.username || '').toLowerCase();
      if (email) {
        return `login:${email}`;
      }
      return `login:${req.ip || 'unknown'}`;
    },
    
    // 5 attempts per 15 minutes
    windowMs: 15 * 60 * 1000,
    max: 5,
    
    message: {
      error: 'Too many login attempts. Please try again later.',
      retryAfter: 900,
    },
    
    statusCode: 429,
    
    handler: (req: Request, res: Response) => {
      res.status(429).json({
        error: 'Too many login attempts',
        message: 'You have exceeded the login attempt limit. Please try again after 15 minutes.',
        retryAfter: 900,
      });
    },
    
    skipSuccessfulRequests: true, // Don't count successful logins
    skipFailedRequests: false, // Count failed attempts
  });
};

/**
 * Payment rate limiter: 5 payment attempts per hour
 * Prevents abuse of payment endpoints
 */
export const createPaymentRateLimiter = () => {
  return rateLimit({
    keyGenerator: (req: Request, res: Response) => {
      const userId = (req as any).user?.id || (req as any).userId;
      if (userId) {
        return `payment:${userId}`;
      }
      return `payment:${req.ip || 'unknown'}`;
    },
    
    // 5 payment attempts per hour
    windowMs: 60 * 60 * 1000,
    max: 5,
    
    message: {
      error: 'Too many payment attempts. Please try again later.',
      retryAfter: 3600,
    },
    
    statusCode: 429,
    
    handler: (req: Request, res: Response) => {
      res.status(429).json({
        error: 'Payment rate limit exceeded',
        message: 'You have exceeded the payment attempt limit. Please try again after 1 hour.',
        retryAfter: 3600,
      });
    },
    
    skipSuccessfulRequests: true, // Don't count successful payments
    skipFailedRequests: false, // Count failed attempts
  });
};

/**
 * File upload rate limiter: 20 uploads per hour per user
 * Prevents abuse of file upload endpoints
 */
export const createUploadRateLimiter = () => {
  return rateLimit({
    keyGenerator: (req: Request, res: Response) => {
      const userId = (req as any).user?.id || (req as any).userId;
      if (userId) {
        return `upload:${userId}`;
      }
      return `upload:${req.ip || 'unknown'}`;
    },
    
    // 20 uploads per hour
    windowMs: 60 * 60 * 1000,
    max: 20,
    
    message: {
      error: 'Too many upload attempts. Please try again later.',
      retryAfter: 3600,
    },
    
    statusCode: 429,
    
    handler: (req: Request, res: Response) => {
      res.status(429).json({
        error: 'Upload rate limit exceeded',
        message: 'You have exceeded the upload limit. Please try again after 1 hour.',
        retryAfter: 3600,
      });
    },
    
    skipSuccessfulRequests: false,
    skipFailedRequests: false,
  });
};

/**
 * API endpoint rate limiter: 1000 requests per hour per user
 * For general API endpoints
 */
export const createApiRateLimiter = () => {
  return rateLimit({
    keyGenerator: (req: Request, res: Response) => {
      const userId = (req as any).user?.id || (req as any).userId;
      if (userId) {
        return `api:${userId}`;
      }
      return `api:${req.ip || 'unknown'}`;
    },
    
    // 1000 requests per hour
    windowMs: 60 * 60 * 1000,
    max: 1000,
    
    message: {
      error: 'API rate limit exceeded. Please try again later.',
      retryAfter: 3600,
    },
    
    statusCode: 429,
    
    handler: (req: Request, res: Response) => {
      res.status(429).json({
        error: 'API rate limit exceeded',
        message: 'You have exceeded the API rate limit. Please try again after 1 hour.',
        retryAfter: 3600,
      });
    },
    
    skipSuccessfulRequests: false,
    skipFailedRequests: false,
  });
};

export default {
  createPerUserRateLimiter,
  createStrictRateLimiter,
  createLoginRateLimiter,
  createPaymentRateLimiter,
  createUploadRateLimiter,
  createApiRateLimiter,
};
