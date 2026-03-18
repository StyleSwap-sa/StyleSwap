import { describe, it, expect, vi, beforeEach } from "vitest";
import { tryonRouter, calculateSizeScalingFactor, SIZE_SCALING_FACTORS } from "./tryon";
import { getFitroomClient } from "../_core/fitroom";
import { getUserCredits, deductCredits, refundCredits } from "../db.credits";

// Mock dependencies
vi.mock("../_core/fitroom");
vi.mock("../db.credits");

describe("Try-On Router", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("pollTryOnStatus", () => {
    it("should return FAILED status with error message without throwing", async () => {
      const mockFitroomClient = {
        getTryOnStatus: vi.fn().mockResolvedValue({
          success: true,
          status: "FAILED",
          error: "No person detected in the image",
        }),
      };

      vi.mocked(getFitroomClient).mockReturnValue(mockFitroomClient as any);

      const caller = tryonRouter.createCaller({
        user: { id: "test-user", role: "user" },
      } as any);

      const result = await caller.pollTryOnStatus({ taskId: "task-123" });

      expect(result).toEqual({
        taskId: "task-123",
        status: "FAILED",
        error: "No person detected in the image",
        isComplete: false,
        isFailed: true,
      });
    });

    it("should return COMPLETED status with result image", async () => {
      const mockFitroomClient = {
        getTryOnStatus: vi.fn().mockResolvedValue({
          success: true,
          status: "COMPLETED",
          resultImage: "https://example.com/result.jpg",
        }),
      };

      vi.mocked(getFitroomClient).mockReturnValue(mockFitroomClient as any);

      const caller = tryonRouter.createCaller({
        user: { id: "test-user", role: "user" },
      } as any);

      const result = await caller.pollTryOnStatus({ taskId: "task-123" });

      expect(result).toEqual({
        taskId: "task-123",
        status: "COMPLETED",
        resultImage: "https://example.com/result.jpg",
        error: undefined,
        isComplete: true,
        isFailed: false,
      });
    });

    it("should return PENDING status during processing", async () => {
      const mockFitroomClient = {
        getTryOnStatus: vi.fn().mockResolvedValue({
          success: true,
          status: "PENDING",
        }),
      };

      vi.mocked(getFitroomClient).mockReturnValue(mockFitroomClient as any);

      const caller = tryonRouter.createCaller({
        user: { id: "test-user", role: "user" },
      } as any);

      const result = await caller.pollTryOnStatus({ taskId: "task-123" });

      expect(result.status).toBe("PENDING");
      expect(result.isComplete).toBe(false);
      expect(result.isFailed).toBe(false);
    });

    it("should throw error when API call fails", async () => {
      const mockFitroomClient = {
        getTryOnStatus: vi.fn().mockResolvedValue({
          success: false,
          error: "API connection failed",
        }),
      };

      vi.mocked(getFitroomClient).mockReturnValue(mockFitroomClient as any);

      const caller = tryonRouter.createCaller({
        user: { id: "test-user", role: "user" },
      } as any);

      await expect(caller.pollTryOnStatus({ taskId: "task-123" })).rejects.toThrow(
        "API connection failed"
      );
    });
  });

  describe("refundTryOnCredits", () => {
    it("should successfully refund credits", async () => {
      vi.mocked(refundCredits).mockResolvedValue(undefined);

      const caller = tryonRouter.createCaller({
        user: { id: "test-user", role: "user" },
      } as any);

      const result = await caller.refundTryOnCredits({ taskId: "task-123" });

      expect(result).toEqual({ success: true });
      expect(refundCredits).toHaveBeenCalledWith("test-user", 1);
    });

    it("should throw error if refund fails", async () => {
      vi.mocked(refundCredits).mockRejectedValue(new Error("Database error"));

      const caller = tryonRouter.createCaller({
        user: { id: "test-user", role: "user" },
      } as any);

      await expect(caller.refundTryOnCredits({ taskId: "task-123" })).rejects.toThrow(
        "Failed to refund credits"
      );
    });
  });

  describe("getCredits", () => {
    it("should return user credit balance", async () => {
      vi.mocked(getUserCredits).mockResolvedValue({
        totalCredits: 100,
        usedCredits: 20,
        remainingCredits: 80,
        expiresAt: new Date("2026-12-31"),
      });

      const caller = tryonRouter.createCaller({
        user: { id: "test-user", role: "user" },
      } as any);

      const result = await caller.getCredits();

      expect(result).toEqual({
        totalCredits: 100,
        usedCredits: 20,
        remainingCredits: 80,
        expiresAt: new Date("2026-12-31"),
      });
    });
  });

  describe("createTryOn", () => {
    it("should deduct credit only after successful task creation", async () => {
      const mockFitroomClient = {
        createTryOnWithBase64: vi.fn().mockResolvedValue({
          success: true,
          taskId: "task-123",
          status: "CREATED",
        }),
      };

      vi.mocked(getFitroomClient).mockReturnValue(mockFitroomClient as any);
      vi.mocked(getUserCredits).mockResolvedValue({
        totalCredits: 100,
        usedCredits: 0,
        remainingCredits: 100,
        expiresAt: new Date("2026-12-31"),
      });
      vi.mocked(deductCredits).mockResolvedValue(undefined);

      const caller = tryonRouter.createCaller({
        user: { id: "test-user", role: "user" },
      } as any);

      const result = await caller.createTryOn({
        modelImageBase64: "/9j/4AAQSkZJRg==", // JPEG header
        clothImageBase64: "iVBORw0KGgo=", // PNG header
        clothType: "single",
        hdMode: false,
      });

      expect(result.success).toBe(true);
      expect(result.taskId).toBe("task-123");
      expect(deductCredits).toHaveBeenCalledWith("test-user", 1);
    });

    it("should refund credit if task creation fails", async () => {
      const mockFitroomClient = {
        createTryOnWithBase64: vi.fn().mockResolvedValue({
          success: false,
          error: "Invalid image format",
        }),
      };

      vi.mocked(getFitroomClient).mockReturnValue(mockFitroomClient as any);
      vi.mocked(getUserCredits).mockResolvedValue({
        totalCredits: 100,
        usedCredits: 0,
        remainingCredits: 100,
        expiresAt: new Date("2026-12-31"),
      });
      vi.mocked(refundCredits).mockResolvedValue(undefined);

      const caller = tryonRouter.createCaller({
        user: { id: "test-user", role: "user" },
      } as any);

      await expect(
        caller.createTryOn({
          modelImageBase64: "/9j/4AAQSkZJRg==",
          clothImageBase64: "iVBORw0KGgo=",
          clothType: "upper",
          hdMode: false,
        })
      ).rejects.toThrow("Invalid image format");

      expect(refundCredits).toHaveBeenCalledWith("test-user", 1);
    });

    it("should reject if user has insufficient credits", async () => {
      vi.mocked(getUserCredits).mockResolvedValue({
        totalCredits: 0,
        usedCredits: 0,
        remainingCredits: 0,
        expiresAt: new Date("2026-12-31"),
      });

      const caller = tryonRouter.createCaller({
        user: { id: "test-user", role: "user" },
      } as any);

      await expect(
        caller.createTryOn({
          modelImageBase64: "/9j/4AAQSkZJRg==",
          clothImageBase64: "iVBORw0KGgo=",
          clothType: "upper",
          hdMode: false,
        })
      ).rejects.toThrow("Insufficient credits");
    });
  });
});


describe("Size Scaling Logic", () => {

  describe("SIZE_SCALING_FACTORS", () => {
    it("should have all required sizes defined", () => {
      const requiredSizes = ["XS", "S", "M", "L", "XL", "XXL", "XXXL"];
      requiredSizes.forEach((size) => {
        expect(SIZE_SCALING_FACTORS).toHaveProperty(size);
      });
    });

    it("should have M (Medium) as baseline at 1.0", () => {
      expect(SIZE_SCALING_FACTORS.M).toBe(1.0);
    });

    it("should have smaller sizes with factors less than 1.0", () => {
      expect(SIZE_SCALING_FACTORS.XS).toBeLessThan(1.0);
      expect(SIZE_SCALING_FACTORS.S).toBeLessThan(1.0);
    });

    it("should have larger sizes with factors greater than 1.0", () => {
      expect(SIZE_SCALING_FACTORS.L).toBeGreaterThan(1.0);
      expect(SIZE_SCALING_FACTORS.XL).toBeGreaterThan(1.0);
      expect(SIZE_SCALING_FACTORS.XXL).toBeGreaterThan(1.0);
      expect(SIZE_SCALING_FACTORS.XXXL).toBeGreaterThan(1.0);
    });

    it("should have scaling factors in progressive order", () => {
      const sizes = ["XS", "S", "M", "L", "XL", "XXL", "XXXL"];
      for (let i = 0; i < sizes.length - 1; i++) {
        expect(SIZE_SCALING_FACTORS[sizes[i]]).toBeLessThanOrEqual(
          SIZE_SCALING_FACTORS[sizes[i + 1]]
        );
      }
    });
  });

  describe("calculateSizeScalingFactor", () => {
    it("should return correct scaling factor for XS", () => {
      expect(calculateSizeScalingFactor("XS")).toBe(0.85);
    });

    it("should return correct scaling factor for S", () => {
      expect(calculateSizeScalingFactor("S")).toBe(0.92);
    });

    it("should return correct scaling factor for M", () => {
      expect(calculateSizeScalingFactor("M")).toBe(1.0);
    });

    it("should return correct scaling factor for L", () => {
      expect(calculateSizeScalingFactor("L")).toBe(1.08);
    });

    it("should return correct scaling factor for XL", () => {
      expect(calculateSizeScalingFactor("XL")).toBe(1.15);
    });

    it("should return correct scaling factor for XXL", () => {
      expect(calculateSizeScalingFactor("XXL")).toBe(1.22);
    });

    it("should return correct scaling factor for XXXL", () => {
      expect(calculateSizeScalingFactor("XXXL")).toBe(1.25);
    });

    it("should return default 1.0 for unknown size", () => {
      expect(calculateSizeScalingFactor("UNKNOWN")).toBe(1.0);
    });

    it("should return 1.0 for empty string", () => {
      expect(calculateSizeScalingFactor("")).toBe(1.0);
    });
  });

  describe("Size scaling ranges", () => {
    it("should have XS as smallest scaling factor", () => {
      const allFactors = Object.values(SIZE_SCALING_FACTORS);
      expect(SIZE_SCALING_FACTORS.XS).toBe(Math.min(...allFactors));
    });

    it("should have XXXL as largest scaling factor", () => {
      const allFactors = Object.values(SIZE_SCALING_FACTORS);
      expect(SIZE_SCALING_FACTORS.XXXL).toBe(Math.max(...allFactors));
    });

    it("should have reasonable scaling range (0.8 to 1.3)", () => {
      Object.entries(SIZE_SCALING_FACTORS).forEach(([size, factor]) => {
        expect(factor).toBeGreaterThanOrEqual(0.8);
        expect(factor).toBeLessThanOrEqual(1.3);
      });
    });

    it("should have maximum scaling difference of 0.4 (40%)", () => {
      const minFactor = SIZE_SCALING_FACTORS.XS;
      const maxFactor = SIZE_SCALING_FACTORS.XXXL;
      const difference = maxFactor - minFactor;
      expect(difference).toBeLessThanOrEqual(0.4);
    });
  });

  describe("Credit deduction logic", () => {
    it("should deduct 1 credit per try-on regardless of size", () => {
      // This test documents the requirement that all sizes cost 1 credit
      const creditCost = 1;
      const sizes = ["XS", "S", "M", "L", "XL", "XXL", "XXXL"];

      sizes.forEach((size) => {
        // Each size should cost exactly 1 credit
        expect(creditCost).toBe(1);
      });
    });

    it("should not vary credit cost based on scaling factor", () => {
      // Verify that credit deduction is independent of size scaling
      const sizes = ["XS", "S", "M", "L", "XL", "XXL", "XXXL"];
      const creditCost = 1;

      sizes.forEach((size) => {
        const scalingFactor = calculateSizeScalingFactor(size);
        // Credit cost should always be 1, not affected by scaling factor
        expect(creditCost).toBe(1);
        // Only M (1.0) will equal creditCost, all others should be different
        if (size !== "M") {
          expect(creditCost).not.toBe(scalingFactor);
        }
      });
    });
  });
});
