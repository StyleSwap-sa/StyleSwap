import { describe, it, expect, vi, beforeEach } from "vitest";
import { tryonRouter } from "./tryon";
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
          clothType: "single",
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
          clothType: "single",
          hdMode: false,
        })
      ).rejects.toThrow("Insufficient credits");
    });
  });
});
