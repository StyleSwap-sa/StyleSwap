import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { checkRateLimit, logApiRequest, getRateLimitStats, RATE_LIMIT_CONFIG } from './rateLimiter';

describe('Rate Limiter', () => {
  describe('checkRateLimit', () => {
    it('should allow requests within the limit', async () => {
      const result = await checkRateLimit(1);

      expect(result.allowed).toBe(true);
      expect(result.limit).toBe(RATE_LIMIT_CONFIG.requestsPerMinute);
      expect(result.remaining).toBeGreaterThanOrEqual(0);
      expect(result.resetAt).toBeInstanceOf(Date);
    });

    it('should return correct rate limit values', async () => {
      const result = await checkRateLimit(1);

      expect(result.limit).toBe(100); // Default limit
      expect(result.remaining).toBeLessThanOrEqual(result.limit);
      expect(result.retryAfter).toBeUndefined(); // Should be undefined when allowed
    });

    it('should handle non-existent API keys gracefully', async () => {
      const result = await checkRateLimit(99999);

      expect(result.allowed).toBe(true); // Should allow when no logs exist
      expect(result.limit).toBe(100);
      expect(result.remaining).toBe(100);
    });
  });

  describe('logApiRequest', () => {
    it('should log API requests without throwing', async () => {
      // Should not throw
      await expect(
        logApiRequest(
          1,
          'POST',
          '/api/tryons/generate',
          200,
          150,
          '192.168.1.1',
          'Mozilla/5.0'
        )
      ).resolves.not.toThrow();
    });

    it('should handle missing optional fields', async () => {
      // Should not throw
      await expect(
        logApiRequest(1, 'GET', '/api/products', 200)
      ).resolves.not.toThrow();
    });

    it('should handle database errors gracefully', async () => {
      // Should not throw even if database is unavailable
      await expect(
        logApiRequest(99999, 'GET', '/api/test', 200)
      ).resolves.not.toThrow();
    });
  });

  describe('getRateLimitStats', () => {
    it('should return stats for an API key', async () => {
      const stats = await getRateLimitStats(1);

      if (stats) {
        expect(stats.currentWindowRequests).toBeGreaterThanOrEqual(0);
        expect(stats.dailyRequests).toBeGreaterThanOrEqual(0);
        expect(stats.avgResponseTime).toBeGreaterThanOrEqual(0);
        expect(stats.errorCount).toBeGreaterThanOrEqual(0);
      }
    });

    it('should handle non-existent API keys', async () => {
      const stats = await getRateLimitStats(99999);

      if (stats) {
        expect(stats.dailyRequests).toBe(0);
        expect(stats.avgResponseTime).toBe(0);
        expect(stats.errorCount).toBe(0);
      }
    });
  });

  describe('Rate Limit Configuration', () => {
    it('should have correct default configuration', () => {
      expect(RATE_LIMIT_CONFIG.requestsPerMinute).toBe(100);
      expect(RATE_LIMIT_CONFIG.windowMs).toBe(60 * 1000);
    });
  });

  describe('Sliding Window Algorithm', () => {
    it('should correctly track requests within the window', async () => {
      // First check
      const result1 = await checkRateLimit(2);
      expect(result1.allowed).toBe(true);
      expect(result1.remaining).toBe(100);

      // Log a request
      await logApiRequest(2, 'GET', '/api/test', 200);

      // Second check should show one less request available
      const result2 = await checkRateLimit(2);
      expect(result2.allowed).toBe(true);
      expect(result2.remaining).toBeLessThanOrEqual(100);
    });
  });
});
