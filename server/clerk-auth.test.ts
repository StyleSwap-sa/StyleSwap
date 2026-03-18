import { describe, it, expect } from 'vitest';
import { createClerkClient } from '@clerk/backend';

describe('Clerk Authentication', () => {
  it('should validate Clerk credentials', async () => {
    const clerkSecretKey = process.env.CLERK_SECRET_KEY;
    
    expect(clerkSecretKey).toBeDefined();
    expect(clerkSecretKey).toMatch(/^sk_test_/);
    
    // Create Clerk client with the secret key
    const clerk = createClerkClient({ secretKey: clerkSecretKey });
    
    // Test basic connectivity by fetching users (should return empty list for new account)
    const users = await clerk.users.getUserList({ limit: 1 });
    
    expect(users).toBeDefined();
    expect(Array.isArray(users.data)).toBe(true);
  });

  it('should have valid VITE_CLERK_PUBLISHABLE_KEY', () => {
    const publishableKey = process.env.VITE_CLERK_PUBLISHABLE_KEY;
    
    expect(publishableKey).toBeDefined();
    expect(publishableKey).toMatch(/^pk_test_/);
  });
});
