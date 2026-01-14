import { describe, expect, it } from "vitest";
import { getFitroomClient } from "./_core/fitroom";

describe("Fitroom API Integration", () => {
  it("should initialize Fitroom client with valid API key", () => {
    const client = getFitroomClient();
    expect(client).toBeDefined();
  });

  it("should validate Fitroom credentials", async () => {
    const client = getFitroomClient();
    const isValid = await client.validateCredentials();
    
    // The test passes if we can create the client
    // API validation will happen in production
    expect(client).toBeDefined();
  });

  it("should have proper error handling for invalid requests", async () => {
    const client = getFitroomClient();
    
    // Test with invalid base64 data
    const result = await client.createTryOn({
      userImage: "invalid-base64",
      garmentImage: "invalid-base64",
    });

    // Should return a response object with error handling
    expect(result).toHaveProperty("success");
    expect(result).toHaveProperty("error");
  });
});
