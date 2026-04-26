import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import { getFitroomClient } from "../_core/fitroom";
import { deductCredits, getUserCredits, refundCredits } from "../db.credits";
import { enforceSubscriptionCheck } from "../middleware/subscriptionValidation";
import { TRPCError } from "@trpc/server";
import { storagePut, storageGet } from "../storage";
import fs from "fs";
import path from "path";
import crypto from "crypto";
import { getDb } from "../db";
import { savedOutfits } from "../../drizzle/schema";

export const tryonRouter = router({
  /**
   * Get user's current credit balance
   */
  getCredits: protectedProcedure.query(async ({ ctx }) => {
    const credits = await getUserCredits(ctx.user.id);
    return {
      totalCredits: credits.totalCredits,
      usedCredits: credits.usedCredits,
      remainingCredits: credits.remainingCredits,
      expiresAt: credits.expiresAt,
    };
  }),

  /**
   * Create a virtual try-on task
   * Accepts base64 encoded images and creates async task with Fitroom
   * Returns task ID for polling results
   */
  createTryOn: protectedProcedure
    .input(
      z.object({
        modelImageBase64: z.string().describe("Base64 encoded customer body photo"),
        clothImageBase64: z.string().describe("Base64 encoded garment image"),
        clothType: z.enum(["upper", "lower", "combo", "full"]).default("upper"), // "upper" for tops, "lower" for bottoms, "combo" for top+bottom, "full" for dresses/jumpsuits
        selectedSize: z.enum(["XS", "S", "M", "L", "XL", "XXL", "XXXL"]).optional().default("M"),
        hdMode: z.boolean().optional().default(false),
        testMode: z.boolean().optional().default(false).describe("Skip credit deduction for testing"),
      })
    )
    .mutation(async ({ ctx, input }) => {
      let tempDir: string | null = null;
      try {
        // Check if user's boutique has an active paid subscription
        if (!input.testMode) {
          await enforceSubscriptionCheck(ctx.user.id);
        }

        // Calculate credits needed based on HD mode
        const creditsNeeded = input.hdMode ? 2 : 1;
        
        // Skip credit check in test mode
        if (!input.testMode) {
          const credits = await getUserCredits(ctx.user.id);
          if (credits.remainingCredits < creditsNeeded) {
            throw new TRPCError({
              code: "FORBIDDEN",
              message: `Insufficient credits. You need ${creditsNeeded} credits for ${input.hdMode ? "HD" : "standard"} try-on, but only have ${credits.remainingCredits} remaining.`,
            });
          }
        }

        // Create temp directory for image files
        tempDir = path.join("/tmp", `fitroom-${crypto.randomBytes(8).toString("hex")}`);
        fs.mkdirSync(tempDir, { recursive: true });

        // Helper function to detect image format from base64
        const detectImageFormat = (base64: string): string => {
          if (base64.startsWith("/9j/")) return "jpg"; // JPEG
          if (base64.startsWith("iVBORw0KGgo")) return "png"; // PNG
          if (base64.startsWith("R0lGODlh")) return "gif"; // GIF
          if (base64.startsWith("UklGR")) return "webp"; // WebP
          return "jpg"; // Default to JPG
        };

        const modelFormat = detectImageFormat(input.modelImageBase64);
        const clothFormat = detectImageFormat(input.clothImageBase64);

        const modelImagePath = path.join(tempDir, `model.${modelFormat}`);
        const clothImagePath = path.join(tempDir, `cloth.${clothFormat}`);

        // Decode base64 images to binary
        let modelBuffer = Buffer.from(input.modelImageBase64, "base64");
        let clothBuffer = Buffer.from(input.clothImageBase64, "base64");
        
        // Log original sizes
        console.log(`[Try-On] Original model image size: ${modelBuffer.length} bytes`);
        console.log(`[Try-On] Original cloth image size: ${clothBuffer.length} bytes`);
        
        // Log if images exceed typical API limits
        const MAX_IMAGE_SIZE = 2 * 1024 * 1024; // 2MB
        if (modelBuffer.length > MAX_IMAGE_SIZE) {
          console.log(`[Try-On] WARNING: Model image exceeds ${MAX_IMAGE_SIZE} bytes (${modelBuffer.length} bytes)`);
        }
        if (clothBuffer.length > MAX_IMAGE_SIZE) {
          console.log(`[Try-On] WARNING: Cloth image exceeds ${MAX_IMAGE_SIZE} bytes (${clothBuffer.length} bytes)`);
        }


        console.log("[Try-On] Using base64 encoded images for try-on task creation");

        const fitroomClient = getFitroomClient();
        
        // Create try-on task with base64 encoded images
        console.log("[Try-On] Creating try-on task with base64 images...");
        const taskResult = await fitroomClient.createTryOnWithBase64({
          modelImageBase64: input.modelImageBase64,
          clothImageBase64: input.clothImageBase64,
          clothType: input.clothType as "upper" | "lower" | "combo" | "full",
          hdMode: input.hdMode || false,
        });

        // Clean up temp files
        try {
          if (tempDir && fs.existsSync(tempDir)) {
            fs.rmSync(tempDir, { recursive: true, force: true });
            console.log("[Try-On] Cleaned up temp files");
          }
        } catch (e) {
          console.warn("[Try-On] Failed to clean temp files:", e);
        }

        console.log("[Try-On] Fitroom response:", JSON.stringify(taskResult));
        
        if (!taskResult.success || !taskResult.taskId) {
          console.error("[Try-On] Fitroom failed:", taskResult.error);
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: taskResult.error || "Failed to create try-on task",
          });
        }

        // Deduct credits after successful task creation (skip in test mode)
        if (!input.testMode) {
          await deductCredits(ctx.user.id, creditsNeeded);
          console.log(`[Try-On] Deducted ${creditsNeeded} credit(s) for ${input.hdMode ? "HD" : "standard"} try-on`);
        } else {
          console.log(`[Try-On] Test mode - skipping ${creditsNeeded} credit deduction`);
        }

        console.log(`[Try-On] Task created successfully: ${taskResult.taskId}`);
        
        return {
          success: true,
          taskId: taskResult.taskId,
          status: taskResult.status || "CREATED",
        };
      } catch (error) {
        console.error("[Try-On] Error:", error);
        // Clean up temp files on error
        if (tempDir && fs.existsSync(tempDir)) {
          try {
            fs.rmSync(tempDir, { recursive: true, force: true });
          } catch (e) {
            console.warn("[Try-On] Failed to clean temp files on error:", e);
          }
        }
        throw error;
      }
    }),

  pollTryOnStatus: protectedProcedure
  .input(z.object({ taskId: z.string() }))
  .query(async ({ ctx, input }) => {
    const fitroomClient = getFitroomClient();
    const status = await fitroomClient.getTryOnStatus(input.taskId);

    // If task failed, return the failure status
    if (status.status === "FAILED") {
      return {
        taskId: input.taskId,
        status: "FAILED",
        error: status.error || "Try-on generation failed",
        progress: 100,
        isComplete: false,
        isFailed: true,
      };
    }

    // If there was an error getting status
    if (!status.success) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: status.error || "Failed to get task status",
      });
    }

    // 🔥 FIX: Add resultUrl field that frontend expects
    return {
      taskId: input.taskId,
      status: status.status,
      resultImage: status.resultImage,
      resultImageUrl: status.resultImage,
      resultUrl: status.resultImage,  // ← Add this line
      error: status.error,
      progress: status.progress || 0,
      isComplete: status.status === "COMPLETED",
      isFailed: status.status === "FAILED",
    };
  }),

  /**
   * Get try-on task status (alias for frontend compatibility)
   */
  getTryOnStatus: protectedProcedure
    .input(z.object({ taskId: z.string() }))
    .query(async ({ ctx, input }) => {
      const fitroomClient = getFitroomClient();
      const status = await fitroomClient.getTryOnStatus(input.taskId);

      if (status.status === "FAILED") {
        return {
          taskId: input.taskId,
          status: "FAILED",
          error: status.error || "Try-on generation failed",
          progress: 100,
          isComplete: false,
          isFailed: true,
        };
      }

      if (!status.success) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: status.error || "Failed to get task status",
        });
      }

      return {
        taskId: input.taskId,
        status: status.status,
        resultImage: status.resultImage,
        resultImageUrl: status.resultImage,
        error: status.error,
        progress: status.progress || 0,
        isComplete: status.status === "COMPLETED",
        isFailed: status.status === "FAILED",
      };
    }),

  /**
   * Save try-on result to user's history
   */
  saveTryOnResult: protectedProcedure
  .input(z.object({
    resultImageUrl: z.string(),
    title: z.string().optional(),
    style: z.string().optional(),
    brand: z.string().optional(),
  }))
  .mutation(async ({ ctx, input }) => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    const result = await db
      .insert(savedOutfits)
      .values({
        userId: ctx.user.id,
        title: input.title || "My Try-On",
        description: "Generated with StyleSwap AI",
        watermarkedImageUrl: input.resultImageUrl,
        isFavorite: 1,
        style: input.style,
        brand: input.brand,
        source: "tryon",
        createdAt: new Date(),
      })
      .returning({ id: savedOutfits.id });

    return { success: true, outfitId: result[0]?.id };
  }),


  /**
   * Refund credits for failed try-on
   */
  refundTryOnCredits: protectedProcedure
    .input(z.object({ taskId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      try {
        await refundCredits(ctx.user.id, 1);
        return { success: true };
      } catch (error) {
        console.error("[Try-On] Refund error:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to refund credits",
        });
      }
    }),
    
});

/**
 * Size scaling factors for visual scaling based on selected size
 * M (Medium) is the baseline at 1.0
 * Scaling is relative: XS is 0.85 (15% smaller), XXXL is 1.25 (25% larger)
 */
export const SIZE_SCALING_FACTORS: Record<string, number> = {
  XS: 0.85,
  S: 0.92,
  M: 1.0,
  L: 1.08,
  XL: 1.15,
  XXL: 1.22,
  XXXL: 1.25,
};

/**
 * Calculate size scaling factor for a given size
 * Returns decimal value for visual scaling (e.g., 0.85 for XS, 1.25 for XXXL)
 */
export function calculateSizeScalingFactor(size: string): number {
  return SIZE_SCALING_FACTORS[size] || 1.0;
}
