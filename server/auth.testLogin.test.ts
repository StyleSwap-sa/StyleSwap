import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { appRouter } from "./routers";
import { createContext } from "./_core/context";
import type { CreateExpressContextOptions } from "@trpc/server/adapters/express";
import * as db from "./db";

describe("auth.testLogin", () => {
  let caller: ReturnType<typeof appRouter.createCaller>;

  beforeAll(async () => {
    // Create a mock context
    const mockReq = {
      cookies: {},
      headers: {},
    } as any;

    const mockRes = {
      cookie: () => {},
      clearCookie: () => {},
    } as any;

    const context = await createContext({
      req: mockReq,
      res: mockRes,
    } as CreateExpressContextOptions);

    caller = appRouter.createCaller(context);
  });

  it("should create a test user and return success", async () => {
    const result = await caller.auth.testLogin();
    
    expect(result.success).toBe(true);
    expect(result.user).toBeDefined();
    expect(result.user?.id).toBeGreaterThan(0);
    expect(result.user?.email).toMatch(/^test-\d+@styleswap\.co\.za$/);
    expect(result.user?.name).toBe("Test User");
  });

  it("should create unique users on each call", async () => {
    const result1 = await caller.auth.testLogin();
    const result2 = await caller.auth.testLogin();

    expect(result1.user?.id).not.toBe(result2.user?.id);
    expect(result1.user?.email).not.toBe(result2.user?.email);
    expect(result1.user?.openId).not.toBe(result2.user?.openId);
  });

  it("should create a user that can be retrieved by openId", async () => {
    const result = await caller.auth.testLogin();
    const user = await db.getUserByOpenId(result.user!.openId!);

    expect(user).toBeDefined();
    expect(user?.id).toBe(result.user?.id);
    expect(user?.email).toBe(result.user?.email);
  });
});
