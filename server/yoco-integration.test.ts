import { describe, it, expect, beforeAll } from 'vitest';
import { PAYMENT_PACKAGES } from './yoko-payment';
import { ENV } from './_core/env';

describe('Yoco Payment Integration - Credential Validation', () => {
  beforeAll(() => {
    console.log('[Yoco Test] Environment check:');
    console.log('[Yoco Test] Secret Key configured:', !!ENV.yocoSecretKey);
    console.log('[Yoco Test] Public Key configured:', !!ENV.yocoPublicKey);
    console.log('[Yoco Test] API Base URL:', ENV.yocoApiBaseUrl || 'Not configured');
  });

  describe('Credentials Configuration', () => {
    it('should have Yoco secret key configured', () => {
      expect(ENV.yocoSecretKey).toBeTruthy();
      expect(ENV.yocoSecretKey).toMatch(/^sk_live_/);
    });

    it('should have Yoco public key configured', () => {
      expect(ENV.yocoPublicKey).toBeTruthy();
      expect(ENV.yocoPublicKey).toMatch(/^pk_live_/);
    });

    it('should have Yoco API base URL configured', () => {
      expect(ENV.yocoApiBaseUrl).toBeTruthy();
    });
  });

  describe('Yoco API Connectivity', () => {
    it('should validate credentials with Yoco API', async () => {
      if (!ENV.yocoSecretKey || !ENV.yocoApiBaseUrl) {
        throw new Error('Yoco credentials not configured');
      }

      try {
        // Test API connectivity by making a simple request
        // Using a minimal request to validate the credentials
        const response = await fetch(`${ENV.yocoApiBaseUrl}/api/checkouts`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${ENV.yocoSecretKey}`,
          },
          body: JSON.stringify({
            amount: 100, // R1.00 - minimal amount for testing
            currency: 'ZAR',
            successUrl: 'https://example.com/success',
            cancelUrl: 'https://example.com/cancel',
          }),
        });

        // Even if the response is not 200, the credentials should be accepted
        // A 400 error means the API received the request with valid credentials
        // A 401 error would mean invalid credentials
        expect(response.status).not.toBe(401);
        expect(response.status).not.toBe(403);

        console.log('[Yoco Test] API Response Status:', response.status);
        
        if (response.ok) {
          const data = await response.json();
          console.log('[Yoco Test] Checkout created successfully');
          expect(data.id).toBeTruthy();
        } else if (response.status === 400) {
          // 400 is expected for invalid amount/currency combination
          // But it means credentials were accepted
          console.log('[Yoco Test] Credentials validated (400 response expected for test amount)');
        }
      } catch (error) {
        console.error('[Yoco Test] API Error:', error);
        throw error;
      }
    });
  });

  describe('Payment Package Configuration', () => {
    it('should have correct pricing for boutique credit tiers', () => {
      // These are the boutique credit tiers from BoutiqueCredits.tsx
      const expectedPrices = {
        100: 38500,   // R385
        200: 75000,   // R750
        500: 135000,  // R1350
        1000: 220000, // R2200
        5000: 625000, // R6250
        20000: 1860000, // R18600
      };

      for (const [credits, expectedPrice] of Object.entries(expectedPrices)) {
        const pkg = PAYMENT_PACKAGES.find(p => p.credits === parseInt(credits));
        expect(pkg).toBeDefined();
        expect(pkg?.price).toBe(expectedPrice);
        console.log(`[Yoco Test] ✓ ${credits} credits = R${expectedPrice / 100}`);
      }
    });
  });
});
