import { z } from "zod";
import { protectedProcedure, publicProcedure, router } from "../_core/trpc";
import { getFitroomClient } from "../_core/fitroom";
import { deductCredits, getUserCredits, refundCredits } from "../db.credits";
import { enforceSubscriptionCheck } from "../middleware/subscriptionValidation";
import { TRPCError } from "@trpc/server";
import { storagePut, storageGet, copyImageToS3 } from "../storage";
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
   * Create a virtual try-on task for CUSTOMERS (no subscription check)
   * Accepts base64 encoded images and creates async task with Fitroom
   */
  customerCreateTryOn: protectedProcedure
    .input(
      z.object({
        modelImageBase64: z.string(),
        clothImageBase64: z.string(),
        lowerClothImageBase64: z.string().optional(),
        clothType: z.enum(["upper", "lower", "combo", "full"]).default("upper"),
        selectedSize: z.enum(["XS", "S", "M", "L", "XL", "XXL", "XXXL"]).optional().default("M"),
        hdMode: z.boolean().optional().default(false),
        testMode: z.boolean().optional().default(false),
      })
    )
    .mutation(async ({ ctx, input }) => {
      let tempDir: string | null = null;
      try {
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

        console.log("[Try-On] Customer creating try-on task with base64 images...");

        const fitroomClient = getFitroomClient();
        
        const taskResult = await fitroomClient.createTryOnWithBase64({
          modelImageBase64: input.modelImageBase64,
          clothImageBase64: input.clothImageBase64,
          lowerClothImageBase64: input.lowerClothImageBase64,
          clothType: input.clothType,
          hdMode: input.hdMode || false,
        });

        // Clean up temp files
        try {
          if (tempDir && fs.existsSync(tempDir)) {
            fs.rmSync(tempDir, { recursive: true, force: true });
          }
        } catch (e) {
          console.warn("[Try-On] Failed to clean temp files:", e);
        }

        if (!taskResult.success || !taskResult.taskId) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: taskResult.error || "Failed to create try-on task",
          });
        }

        // Deduct credits after successful task creation (skip in test mode)
        if (!input.testMode) {
          await deductCredits(ctx.user.id, creditsNeeded);
          console.log(`[Try-On] Deducted ${creditsNeeded} credit(s) for customer ${input.hdMode ? "HD" : "standard"} try-on`);
        }

        console.log(`[Try-On] Customer task created successfully: ${taskResult.taskId}`);
        
        return {
          success: true,
          taskId: taskResult.taskId,
          status: taskResult.status || "CREATED",
        };
      } catch (error) {
        console.error("[Try-On] Customer error:", error);
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

  /**
   * Create a virtual try-on task for BOUTIQUES (with subscription check)
   */
  boutiqueCreateTryOn: protectedProcedure
    .input(
      z.object({
        modelImageBase64: z.string(),
        clothImageBase64: z.string(),
        lowerClothImageBase64: z.string().optional(),
        clothType: z.enum(["upper", "lower", "combo", "full"]).default("upper"),
        selectedSize: z.enum(["XS", "S", "M", "L", "XL", "XXL", "XXXL"]).optional().default("M"),
        hdMode: z.boolean().optional().default(false),
        testMode: z.boolean().optional().default(false),
      })
    )
    .mutation(async ({ ctx, input }) => {
      let tempDir: string | null = null;
      try {
        // Check subscription for boutiques
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

        console.log("[Try-On] Boutique creating try-on task with base64 images...");

        const fitroomClient = getFitroomClient();
        
        const taskResult = await fitroomClient.createTryOnWithBase64({
          modelImageBase64: input.modelImageBase64,
          clothImageBase64: input.clothImageBase64,
          lowerClothImageBase64: input.lowerClothImageBase64,
          clothType: input.clothType,
          hdMode: input.hdMode || false,
        });

        // Clean up temp files
        try {
          if (tempDir && fs.existsSync(tempDir)) {
            fs.rmSync(tempDir, { recursive: true, force: true });
          }
        } catch (e) {
          console.warn("[Try-On] Failed to clean temp files:", e);
        }

        if (!taskResult.success || !taskResult.taskId) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: taskResult.error || "Failed to create try-on task",
          });
        }

        // Deduct credits after successful task creation (skip in test mode)
        if (!input.testMode) {
          await deductCredits(ctx.user.id, creditsNeeded);
          console.log(`[Try-On] Deducted ${creditsNeeded} credit(s) for boutique ${input.hdMode ? "HD" : "standard"} try-on`);
        }

        console.log(`[Try-On] Boutique task created successfully: ${taskResult.taskId}`);
        
        return {
          success: true,
          taskId: taskResult.taskId,
          status: taskResult.status || "CREATED",
        };
      } catch (error) {
        console.error("[Try-On] Boutique error:", error);
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

  /**
   * Legacy createTryOn - determines which procedure to use based on user type
   */
  createTryOn: protectedProcedure
    .input(
      z.object({
        modelImageBase64: z.string(),
        clothImageBase64: z.string(),
        lowerClothImageBase64: z.string().optional(),
        clothType: z.enum(["upper", "lower", "combo", "full"]).default("upper"),
        selectedSize: z.enum(["XS", "S", "M", "L", "XL", "XXL", "XXXL"]).optional().default("M"),
        hdMode: z.boolean().optional().default(false),
        testMode: z.boolean().optional().default(false),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Route to appropriate procedure based on user type
      const isMerchant = ctx.user.userType === 'merchant' || ctx.user.role === 'merchant';
      
      if (isMerchant) {
        // Use the legacy router directly (or call boutiqueCreateTryOn)
        // For now, we'll keep the existing logic
        let tempDir: string | null = null;
        try {
          if (!input.testMode) {
            await enforceSubscriptionCheck(ctx.user.id);
          }

          const creditsNeeded = input.hdMode ? 2 : 1;
          if (!input.testMode) {
            const credits = await getUserCredits(ctx.user.id);
            if (credits.remainingCredits < creditsNeeded) {
              throw new TRPCError({
                code: "FORBIDDEN",
                message: `Insufficient credits. You need ${creditsNeeded} credits for ${input.hdMode ? "HD" : "standard"} try-on, but only have ${credits.remainingCredits} remaining.`,
              });
            }
          }

          tempDir = path.join("/tmp", `fitroom-${crypto.randomBytes(8).toString("hex")}`);
          fs.mkdirSync(tempDir, { recursive: true });

          const fitroomClient = getFitroomClient();
          const taskResult = await fitroomClient.createTryOnWithBase64({
            modelImageBase64: input.modelImageBase64,
            clothImageBase64: input.clothImageBase64,
            lowerClothImageBase64: input.lowerClothImageBase64,
            clothType: input.clothType,
            hdMode: input.hdMode || false,
          });

          if (tempDir && fs.existsSync(tempDir)) {
            fs.rmSync(tempDir, { recursive: true, force: true });
          }

          if (!taskResult.success || !taskResult.taskId) {
            throw new TRPCError({
              code: "INTERNAL_SERVER_ERROR",
              message: taskResult.error || "Failed to create try-on task",
            });
          }

          if (!input.testMode) {
            await deductCredits(ctx.user.id, creditsNeeded);
          }

          return {
            success: true,
            taskId: taskResult.taskId,
            status: taskResult.status || "CREATED",
          };
        } catch (error) {
          if (tempDir && fs.existsSync(tempDir)) {
            try {
              fs.rmSync(tempDir, { recursive: true, force: true });
            } catch (e) {}
          }
          throw error;
        }
      } else {
        // Customer flow - no subscription check
        let tempDir: string | null = null;
        try {
          const creditsNeeded = input.hdMode ? 2 : 1;
          if (!input.testMode) {
            const credits = await getUserCredits(ctx.user.id);
            if (credits.remainingCredits < creditsNeeded) {
              throw new TRPCError({
                code: "FORBIDDEN",
                message: `Insufficient credits. You need ${creditsNeeded} credits for ${input.hdMode ? "HD" : "standard"} try-on, but only have ${credits.remainingCredits} remaining.`,
              });
            }
          }

          tempDir = path.join("/tmp", `fitroom-${crypto.randomBytes(8).toString("hex")}`);
          fs.mkdirSync(tempDir, { recursive: true });

          const fitroomClient = getFitroomClient();
          const taskResult = await fitroomClient.createTryOnWithBase64({
            modelImageBase64: input.modelImageBase64,
            clothImageBase64: input.clothImageBase64,
            lowerClothImageBase64: input.lowerClothImageBase64,
            clothType: input.clothType,
            hdMode: input.hdMode || false,
          });

          if (tempDir && fs.existsSync(tempDir)) {
            fs.rmSync(tempDir, { recursive: true, force: true });
          }

          if (!taskResult.success || !taskResult.taskId) {
            throw new TRPCError({
              code: "INTERNAL_SERVER_ERROR",
              message: taskResult.error || "Failed to create try-on task",
            });
          }

          if (!input.testMode) {
            await deductCredits(ctx.user.id, creditsNeeded);
          }

          return {
            success: true,
            taskId: taskResult.taskId,
            status: taskResult.status || "CREATED",
          };
        } catch (error) {
          if (tempDir && fs.existsSync(tempDir)) {
            try {
              fs.rmSync(tempDir, { recursive: true, force: true });
            } catch (e) {}
          }
          throw error;
        }
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

    // Generate a permanent key for this image
    const timestamp = Date.now();
    const userId = ctx.user.id;
    const destinationKey = `saved-outfits/user-${userId}/tryon-${timestamp}.jpg`;
    
    try {
      // Copy the temporary Fitroom image to your permanent S3 bucket
      const permanentUrl = await copyImageToS3(input.resultImageUrl, destinationKey);
      
      // Save the permanent URL to the database
      const [inserted] = await db.insert(savedOutfits).values({
      userId: ctx.user.id,
      title: input.title || "My Try-On",
      description: "Generated with StyleSwap AI",
      watermarkedImageUrl: permanentUrl,
      isFavorite: 1,
      style: input.style,
      brand: input.brand,
      source: "tryon",
      createdAt: new Date(),
      updatedAt: new Date(),
    }).returning({ id: savedOutfits.id });

    return { success: true, outfitId: inserted?.id };
    } catch (error) {
      console.error("[SaveToFeed] Error copying image to S3:", error);
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to save image to feed. Please try again.",
      });
    }
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
