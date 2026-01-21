import { describe, it, expect } from 'vitest';

describe('Yoco Frontend Configuration', () => {
  it('should have Yoco public key configured in frontend', () => {
    const publicKey = import.meta.env.VITE_YOCO_PUBLIC_KEY;
    expect(publicKey).toBeTruthy();
    expect(publicKey).toMatch(/^pk_live_/);
    console.log('[Yoco Frontend] Public key configured:', publicKey.substring(0, 10) + '...');
  });

  it('should have correct public key format', () => {
    const publicKey = import.meta.env.VITE_YOCO_PUBLIC_KEY;
    expect(publicKey).toHaveLength(28); // pk_live_ + 20 chars
    expect(publicKey).toMatch(/^pk_live_[a-zA-Z0-9]+$/);
  });
});
