import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { getDb } from './db';
import { 
  createBoutique, 
  getBoutiqueCredits, 
  addBoutiqueCredit,
  createBoutiqueCredits,
  deductBoutiqueCredit 
} from './db.boutiques';
import { boutiques, boutiqueCredits, users } from '../drizzle/schema';
import { eq } from 'drizzle-orm';

describe('Credit Purchase and Addition', () => {
  let testBoutiqueId: number;
  let testOwnerId: number;

  beforeAll(async () => {
    const db = await getDb();
    if (!db) throw new Error('Database not available');
    
    // Get a valid owner ID from the database
    const userList = await db.select().from(users).limit(1);
    if (userList.length === 0) throw new Error('No users in database');
    testOwnerId = userList[0].id;

    // Create a test boutique
    const boutique = await createBoutique({
      name: 'Test Boutique for Credits',
      slug: `test-boutique-credits-${Date.now()}`,
      ownerId: testOwnerId,
      description: 'Test boutique for credit testing',
    });
    testBoutiqueId = boutique.insertId;

    // Create initial credits record
    await createBoutiqueCredits({
      boutiqueId: testBoutiqueId,
      totalCredits: 0,
      usedCredits: 0,
      remainingCredits: 0,
    });
  });

  afterAll(async () => {
    // Cleanup test data
    const db = await getDb();
    if (db) {
      await db.delete(boutiqueCredits).where(eq(boutiqueCredits.boutiqueId, testBoutiqueId));
      await db.delete(boutiques).where(eq(boutiques.id, testBoutiqueId));
    }
  });

  it('should add credits to boutique', async () => {
    // Initial state
    let credits = await getBoutiqueCredits(testBoutiqueId);
    expect(credits?.totalCredits).toBe(0);
    expect(credits?.remainingCredits).toBe(0);

    // Add 100 credits
    await addBoutiqueCredit(testBoutiqueId, 100);

    // Verify credits were added
    credits = await getBoutiqueCredits(testBoutiqueId);
    expect(credits?.totalCredits).toBe(100);
    expect(credits?.remainingCredits).toBe(100);
  });

  it('should add multiple credit purchases', async () => {
    // Start fresh
    let credits = await getBoutiqueCredits(testBoutiqueId);
    const startingTotal = credits?.totalCredits || 0;

    // Add 200 credits (first purchase)
    await addBoutiqueCredit(testBoutiqueId, 200);
    
    credits = await getBoutiqueCredits(testBoutiqueId);
    expect(credits?.totalCredits).toBe(startingTotal + 200);

    // Add 500 credits (second purchase)
    await addBoutiqueCredit(testBoutiqueId, 500);
    
    credits = await getBoutiqueCredits(testBoutiqueId);
    expect(credits?.totalCredits).toBe(startingTotal + 700);
    expect(credits?.remainingCredits).toBe(startingTotal + 700);
  });

  it('should deduct credits correctly', async () => {
    // Get current credits
    let credits = await getBoutiqueCredits(testBoutiqueId);
    const currentTotal = credits?.totalCredits || 0;
    const currentRemaining = credits?.remainingCredits || 0;

    // Deduct 50 credits
    await deductBoutiqueCredit(testBoutiqueId, 50);

    // Verify deduction
    credits = await getBoutiqueCredits(testBoutiqueId);
    expect(credits?.totalCredits).toBe(currentTotal); // Total should not change
    expect(credits?.usedCredits).toBe((credits?.usedCredits || 0) + 50);
    expect(credits?.remainingCredits).toBe(currentRemaining - 50);
  });

  it('should handle credit addition and deduction together', async () => {
    // Start with known state
    let credits = await getBoutiqueCredits(testBoutiqueId);
    const startingTotal = credits?.totalCredits || 0;

    // Add 1000 credits
    await addBoutiqueCredit(testBoutiqueId, 1000);
    
    credits = await getBoutiqueCredits(testBoutiqueId);
    expect(credits?.totalCredits).toBe(startingTotal + 1000);
    expect(credits?.remainingCredits).toBe((credits?.remainingCredits || 0) + 1000);

    // Deduct 300 credits
    await deductBoutiqueCredit(testBoutiqueId, 300);

    // Verify final state
    credits = await getBoutiqueCredits(testBoutiqueId);
    expect(credits?.totalCredits).toBe(startingTotal + 1000); // Total unchanged
    expect(credits?.usedCredits).toBeGreaterThanOrEqual(300);
    expect(credits?.remainingCredits).toBe(startingTotal + 1000 - (credits?.usedCredits || 0));
  });
});
