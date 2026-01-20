import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import { getFitroomClient } from "../_core/fitroom";
import { deductCredits, getUserCredits, refundCredits } from "../db.credits";
import { TRPCError } from "@trpc/server";
import { storagePut, storageGet } from "../storage";
import fs from "fs";
import path from "path";
import crypto from "crypto";

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
        clothType: z.enum(["single", "combo"]).default("single"), // "single" for one garment, "combo" for top+bottom
        hdMode: z.boolean().optional().default(false),
      })
    )
    .mutation(async ({ ctx, input }) => {
      let tempDir: string | null = null;
      try {
        const credits = await getUserCredits(ctx.user.id);
        if (credits.remainingCredits < 1) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "Insufficient credits. Please purchase more credits to continue.",
          });
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

        console.log(`[Try-On] Saving model image as ${modelFormat}, cloth image as ${clothFormat}`);
        fs.writeFileSync(modelImagePath, modelBuffer);
        fs.writeFileSync(clothImagePath, clothBuffer);

        const fitroomClient = getFitroomClient();
        
        // TEMPORARY: Bypass validation to test if validation endpoint is the issue
        // The validation endpoint appears to be rejecting images that work on Fitroom's official app
        // console.log("[Try-On] Validating model image...");
        // const modelValidation = await fitroomClient.validateModelImage(modelImagePath);
        // if (!modelValidation.success) {
        //   throw new TRPCError({
        //     code: "BAD_REQUEST",
        //     message: `Body photo validation failed: ${modelValidation.error || "Image does not meet requirements. Ensure full body is visible, standing straight, facing forward, with simple background."}`,
        //   });
        // }

        // console.log("[Try-On] Validating clothing image...");
        // const clothValidation = await fitroomClient.validateClothingImage(clothImagePath);
        // if (!clothValidation.success) {
        //   throw new TRPCError({
        //     code: "BAD_REQUEST",
        //     message: `Clothing image validation failed: ${clothValidation.error || "Image does not meet requirements. Ensure clothing is clearly visible, well-lit, on solid background."}`,
        //   });
        // }

         console.log("[Try-On] Skipping validation - sending directly to task creation");
        const modelStats = fs.statSync(modelImagePath);
        const clothStats = fs.statSync(clothImagePath);
        console.log(`[Try-On] Model image: ${modelImagePath} (${modelStats.size} bytes, type: ${path.extname(modelImagePath)})`);
        console.log(`[Try-On] Cloth image: ${clothImagePath} (${clothStats.size} bytes, type: ${path.extname(clothImagePath)})`);
        console.log("[Try-On] Creating try-on task...");
        
        const taskResult = await fitroomClient.createTryOn({
          modelImagePath,
          clothImagePath,
          clothType: input.clothType as "single" | "combo",
          hdMode: input.hdMode,
        });
        
        console.log(`[Try-On] Task result:`, taskResult);

        if (!taskResult.success || !taskResult.taskId) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: taskResult.error || "Failed to create try-on task",
          });
        }

        // Deduct credit AFTER successful task creation
        await deductCredits(ctx.user.id, 1);

        return {
          success: true,
          taskId: taskResult.taskId,
          status: taskResult.status || "CREATED",
        };
      } catch (error) {
        console.error("[Try-On] Error:", error);
        
        // Refund credit if task creation failed
        if (tempDir) {
          try {
            await refundCredits(ctx.user.id, 1);
          } catch (refundError) {
            console.error("[Try-On] Failed to refund credit:", refundError);
          }
        }

        if (error instanceof TRPCError) {
          throw error;
        }

        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: error instanceof Error ? error.message : "Unknown error creating try-on",
        });
      } finally {
        // Cleanup temp files
        if (tempDir && fs.existsSync(tempDir)) {
          fs.rmSync(tempDir, { recursive: true, force: true });
        }
      }
    }),

  /**
   * Poll for try-on task status and results
   */
  pollTryOnStatus: protectedProcedure
    .input(z.object({ taskId: z.string() }))
    .query(async ({ ctx, input }) => {
      const fitroomClient = getFitroomClient();
      const status = await fitroomClient.getTaskStatus(input.taskId);

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
        isComplete: status.status === "COMPLETED",
        isFailed: status.status === "FAILED",
      };
    }),

  /**
   * Save try-on result to user's history
   */
  saveTryOnResult: protectedProcedure
    .input(
      z.object({
        taskId: z.string(),
        resultImageUrl: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // TODO: Save to database
      return { success: true };
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
