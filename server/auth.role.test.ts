import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { getDb } from "./db";
import { users } from "../drizzle/schema";
import { eq } from "drizzle-orm";

let db: any;

describe("User Role Field", () => {
  let testUserId: number;
  const testOpenId = `test-role-${Date.now()}`;
  const testEmail = `test-role-${Date.now()}@test.com`;

  beforeAll(async () => {
    db = await getDb();
    if (!db) {
      throw new Error("Database connection failed");
    }
  });

  afterAll(async () => {
    // Cleanup
    if (testUserId) {
      await db.delete(users).where(eq(users.id, testUserId));
    }
  });

  it("should insert user with role field correctly", async () => {
    const result = await db
      .insert(users)
      .values({
        openId: testOpenId,
        name: "Test User",
        email: testEmail,
        loginMethod: "oauth",
        role: "user",
      })
      .returning();

    expect(result).toHaveLength(1);
    expect(result[0].role).toBe("user");
    testUserId = result[0].id;
  });

  it("should retrieve user with role field", async () => {
    const result = await db
      .select()
      .from(users)
      .where(eq(users.id, testUserId));

    expect(result).toHaveLength(1);
    expect(result[0].role).toBe("user");
    expect(result[0].role).not.toBeUndefined();
    expect(result[0].role).not.toBeNull();
  });

  it("should update user role correctly", async () => {
    const result = await db
      .update(users)
      .set({ role: "admin" })
      .where(eq(users.id, testUserId))
      .returning();

    expect(result).toHaveLength(1);
    expect(result[0].role).toBe("admin");
  });

  it("should retrieve updated admin role", async () => {
    const result = await db
      .select()
      .from(users)
      .where(eq(users.id, testUserId));

    expect(result).toHaveLength(1);
    expect(result[0].role).toBe("admin");
  });
});
