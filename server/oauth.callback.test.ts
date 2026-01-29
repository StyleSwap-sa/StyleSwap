import { describe, it, expect } from "vitest";
import * as db from "./db";

describe("OAuth Callback - getUserByEmail Fix", () => {
  it("should export getUserByEmail function", () => {
    expect(typeof db.getUserByEmail).toBe("function");
  });

  it("should export getUserByOpenId function", () => {
    expect(typeof db.getUserByOpenId).toBe("function");
  });

  it("should export upsertUser function", () => {
    expect(typeof db.upsertUser).toBe("function");
  });

  it("should have all functions needed for OAuth callback", () => {
    const hasAllFunctions =
      typeof db.getUserByEmail === "function" &&
      typeof db.getUserByOpenId === "function" &&
      typeof db.upsertUser === "function";

    expect(hasAllFunctions).toBe(true);
  });
});
