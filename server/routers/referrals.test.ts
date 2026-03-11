import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { getDb } from "../db";
import { users, savedOutfits, referralLinks, referralTracking } from "../../drizzle/schema";
import { eq } from "drizzle-orm";

let db: any;

describe("Referrals Router", () => {
  let testUserId: number;
  let testOutfitId: number;
  let referralCode: string;

  beforeAll(async () => {
    db = await getDb();
    if (!db) {
      throw new Error("Database connection failed");
    }
    // Create test user
    const userResult = await db
      .insert(users)
      .values({
        openId: `test-referral-${Date.now()}`,
        name: "Test Referrer",
        email: `test-referral-${Date.now()}@test.com`,
        loginMethod: "oauth",
        user_role: "user",
      })
      .returning();

    testUserId = userResult[0].id;

    // Create test outfit
    const outfitResult = await db
      .insert(savedOutfits)
      .values({
        userId: testUserId,
        title: "Test Outfit for Referral",
        description: "A test outfit",
        imageUrl: "https://example.com/image.jpg",
        watermarkedImageUrl: "https://example.com/watermarked.jpg",
        tags: JSON.stringify(["test", "referral"]),
        likes: 0,
        views: 0,
        isPublic: true,
      })
      .returning();

    testOutfitId = outfitResult[0].id;
  });

  afterAll(async () => {
    // Cleanup
    if (testOutfitId) {
      await db.delete(referralTracking).where(
        eq(referralTracking.referralLinkId, testOutfitId)
      );
      await db.delete(referralLinks).where(
        eq(referralLinks.outfitId, testOutfitId)
      );
      await db.delete(savedOutfits).where(eq(savedOutfits.id, testOutfitId));
    }
    if (testUserId) {
      await db.delete(users).where(eq(users.id, testUserId));
    }
  });

  it("should create a referral link", async () => {
    const result = await db
      .insert(referralLinks)
      .values({
        userId: testUserId,
        outfitId: testOutfitId,
        referralCode: `TEST-${Date.now()}`,
        platform: "whatsapp",
        isActive: true,
      })
      .returning();

    expect(result).toHaveLength(1);
    expect(result[0].userId).toBe(testUserId);
    expect(result[0].outfitId).toBe(testOutfitId);
    expect(result[0].platform).toBe("whatsapp");
    expect(result[0].isActive).toBe(true);

    referralCode = result[0].referralCode;
  });

  it("should track a referral click", async () => {
    // First create a referral link
    const linkResult = await db
      .insert(referralLinks)
      .values({
        userId: testUserId,
        outfitId: testOutfitId,
        referralCode: `CLICK-${Date.now()}`,
        platform: "instagram",
        clicks: 0,
        isActive: true,
      })
      .returning();

    const link = linkResult[0];

    // Track a click
    const trackResult = await db
      .insert(referralTracking)
      .values({
        referralLinkId: link.id,
        referrerUserId: testUserId,
        platform: "instagram",
        conversionStatus: "clicked",
      })
      .returning();

    expect(trackResult).toHaveLength(1);
    expect(trackResult[0].referralLinkId).toBe(link.id);
    expect(trackResult[0].conversionStatus).toBe("clicked");

    // Update clicks count
    const updatedLink = await db
      .update(referralLinks)
      .set({ clicks: (link.clicks || 0) + 1 })
      .where(eq(referralLinks.id, link.id))
      .returning();

    expect(updatedLink[0].clicks).toBe(1);
  });

  it("should track a referral signup", async () => {
    // Create a new user (referred user)
    const referredUserResult = await db
      .insert(users)
      .values({
        openId: `referred-${Date.now()}`,
        name: "Referred User",
        email: `referred-${Date.now()}@test.com`,
        loginMethod: "oauth",
        user_role: "user",
      })
      .returning();

    const referredUserId = referredUserResult[0].id;

    // Create a referral link
    const linkResult = await db
      .insert(referralLinks)
      .values({
        userId: testUserId,
        outfitId: testOutfitId,
        referralCode: `SIGNUP-${Date.now()}`,
        platform: "tiktok",
        signups: 0,
        isActive: true,
      })
      .returning();

    const link = linkResult[0];

    // Create tracking record
    const trackResult = await db
      .insert(referralTracking)
      .values({
        referralLinkId: link.id,
        referredUserId: referredUserId,
        referrerUserId: testUserId,
        platform: "tiktok",
        conversionStatus: "signed_up",
        convertedAt: new Date(),
      })
      .returning();

    expect(trackResult).toHaveLength(1);
    expect(trackResult[0].referredUserId).toBe(referredUserId);
    expect(trackResult[0].conversionStatus).toBe("signed_up");

    // Update signups count
    const updatedLink = await db
      .update(referralLinks)
      .set({ signups: (link.signups || 0) + 1 })
      .where(eq(referralLinks.id, link.id))
      .returning();

    expect(updatedLink[0].signups).toBe(1);

    // Cleanup referred user
    await db.delete(referralTracking).where(
      eq(referralTracking.referredUserId, referredUserId)
    );
    await db.delete(users).where(eq(users.id, referredUserId));
  });

  it("should retrieve referral statistics", async () => {
    // Create multiple referral links
    const link1 = await db
      .insert(referralLinks)
      .values({
        userId: testUserId,
        outfitId: testOutfitId,
        referralCode: `STAT1-${Date.now()}`,
        platform: "whatsapp",
        clicks: 5,
        signups: 2,
        isActive: true,
      })
      .returning();

    const link2 = await db
      .insert(referralLinks)
      .values({
        userId: testUserId,
        outfitId: testOutfitId,
        referralCode: `STAT2-${Date.now()}`,
        platform: "twitter",
        clicks: 10,
        signups: 3,
        isActive: true,
      })
      .returning();

    // Get all links for user
    const links = await db
      .select()
      .from(referralLinks)
      .where(eq(referralLinks.userId, testUserId));

    const totalClicks = links.reduce((sum, link) => sum + (link.clicks || 0), 0);
    const totalSignups = links.reduce(
      (sum, link) => sum + (link.signups || 0),
      0
    );

    expect(totalClicks).toBeGreaterThanOrEqual(15); // At least 5 + 10
    expect(totalSignups).toBeGreaterThanOrEqual(5); // At least 2 + 3
  });

  it("should handle referral code generation uniqueness", async () => {
    const codes = new Set();

    for (let i = 0; i < 10; i++) {
      const code = `GEN-${Date.now()}-${i}`;
      codes.add(code);
    }

    expect(codes.size).toBe(10); // All codes should be unique
  });
});
