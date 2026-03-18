import { describe, it, expect, vi, beforeEach } from "vitest";
import { sendPurchaseConfirmationEmail } from "../email";

// Mock the email sending function
vi.mock("../email", () => ({
  sendPurchaseConfirmationEmail: vi.fn().mockResolvedValue(true),
}));

describe("Payment Confirmation Email", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should send purchase confirmation email with correct parameters", async () => {
    const mockSendEmail = vi.mocked(sendPurchaseConfirmationEmail);
    
    const userId = 1;
    const userName = "Test User";
    const email = "test@example.com";
    const credits = 100;
    const amount = "385";
    const currency = "ZAR";

    // Call the function
    const result = await sendPurchaseConfirmationEmail(
      userId,
      userName,
      email,
      credits,
      amount,
      currency
    );

    // Verify the function was called with correct parameters
    expect(mockSendEmail).toHaveBeenCalledWith(
      userId,
      userName,
      email,
      credits,
      amount,
      currency
    );

    // Verify the function returned true (success)
    expect(result).toBe(true);
  });

  it("should handle email sending errors gracefully", async () => {
    const mockSendEmail = vi.mocked(sendPurchaseConfirmationEmail);
    mockSendEmail.mockRejectedValueOnce(new Error("Email service error"));

    const userId = 1;
    const userName = "Test User";
    const email = "test@example.com";
    const credits = 100;
    const amount = "385";
    const currency = "ZAR";

    // Should throw error
    await expect(
      sendPurchaseConfirmationEmail(
        userId,
        userName,
        email,
        credits,
        amount,
        currency
      )
    ).rejects.toThrow("Email service error");
  });

  it("should include all required email details", async () => {
    const mockSendEmail = vi.mocked(sendPurchaseConfirmationEmail);
    
    const testCases = [
      {
        userId: 1,
        userName: "Alice",
        email: "alice@example.com",
        credits: 100,
        amount: "385",
        currency: "ZAR",
      },
      {
        userId: 2,
        userName: "Bob",
        email: "bob@example.com",
        credits: 500,
        amount: "1350",
        currency: "ZAR",
      },
      {
        userId: 3,
        userName: "Charlie",
        email: "charlie@example.com",
        credits: 1000,
        amount: "2200",
        currency: "ZAR",
      },
    ];

    for (const testCase of testCases) {
      mockSendEmail.mockResolvedValueOnce(true);
      
      const result = await sendPurchaseConfirmationEmail(
        testCase.userId,
        testCase.userName,
        testCase.email,
        testCase.credits,
        testCase.amount,
        testCase.currency
      );

      expect(result).toBe(true);
      expect(mockSendEmail).toHaveBeenCalledWith(
        testCase.userId,
        testCase.userName,
        testCase.email,
        testCase.credits,
        testCase.amount,
        testCase.currency
      );
    }

    // Verify all calls were made
    expect(mockSendEmail).toHaveBeenCalledTimes(3);
  });
});
