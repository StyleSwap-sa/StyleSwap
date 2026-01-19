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
        clothType: z.enum(["upper", "lower", "full_set"]).default("upper"),
        hdMode: z.boolean().optional().default(false),
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        // Check user has credits
        const credits = await getUserCredits(ctx.user.id);
        if (credits.remainingCredits < 1) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "Insufficient credits. Please purchase more try-ons.",
          });
        }

        // Convert base64 to temporary files
        const tempDir = path.join("/tmp", `fitroom-${ctx.user.id}-${Date.now()}`);
        if (!fs.existsSync(tempDir)) {
          fs.mkdirSync(tempDir, { recursive: true });
        }

        const modelImagePath = path.join(tempDir, "model.jpg");
        const clothImagePath = path.join(tempDir, "cloth.jpg");

        // Decode base64 and write to temp files
        const modelBuffer = Buffer.from(input.modelImageBase64, "base64");
        const clothBuffer = Buffer.from(input.clothImageBase64, "base64");

        fs.writeFileSync(modelImagePath, modelBuffer);
        fs.writeFileSync(clothImagePath, clothBuffer);

        // Call Fitroom API to create task
        const fitroomClient = getFitroomClient();
        const taskResult = await fitroomClient.createTryOn({
          modelImagePath,
          clothImagePath,
          clothType: input.clothType as "upper" | "lower" | "full_set",
          hdMode: input.hdMode,
        });

        // Clean up temp files
        try {
          fs.rmSync(tempDir, { recursive: true, force: true });
        } catch (err) {
          console.warn("[Cleanup] Failed to remove temp files:", err);
        }

        if (!taskResult.success) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: `Failed to create try-on task: ${taskResult.error}`,
          });
        }

        // Deduct credit from user account (deduct immediately when task is created)
        const updatedCredits = await deductCredits(ctx.user.id, 1);

        return {
          success: true,
          taskId: taskResult.taskId,
          status: taskResult.status,
          remainingCredits: updatedCredits.remainingCredits,
          estimatedProcessingTime: input.hdMode ? "~30 seconds" : "~9 seconds",
        };
      } catch (error) {
        console.error("[Try-On Creation Error]", error);
        if (error instanceof TRPCError) throw error;
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to create virtual try-on task",
        });
      }
    }),

  /**
   * Get the status and result of a try-on task
   * Poll this endpoint to check if processing is complete
   */
  getTryOnStatus: protectedProcedure
    .input(
      z.object({
        taskId: z.string().describe("Task ID from createTryOn"),
      })
    )
    .query(async ({ ctx, input }) => {
      try {
        const fitroomClient = getFitroomClient();
        const statusResult = await fitroomClient.getTaskStatus(input.taskId);

        if (!statusResult.success) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: `Failed to get task status: ${statusResult.error}`,
          });
        }

        return {
          success: true,
          status: statusResult.status,
          resultImage: statusResult.resultImage,
          isComplete: statusResult.status === "COMPLETED",
          isFailed: statusResult.status === "FAILED",
        };
      } catch (error) {
        console.error("[Try-On Status Error]", error);
        if (error instanceof TRPCError) throw error;
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to get try-on status",
        });
      }
    }),

  /**
   * Validate model image before try-on
   * Checks if the image is suitable for virtual try-on
   */
  validateModelImage: protectedProcedure
    .input(
      z.object({
        imageBase64: z.string().describe("Base64 encoded image to validate"),
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        // Convert base64 to temp file
        const tempDir = path.join("/tmp", `fitroom-validate-${ctx.user.id}-${Date.now()}`);
        if (!fs.existsSync(tempDir)) {
          fs.mkdirSync(tempDir, { recursive: true });
        }

        const imagePath = path.join(tempDir, "model.jpg");
        const buffer = Buffer.from(input.imageBase64, "base64");
        fs.writeFileSync(imagePath, buffer);

        // Validate with Fitroom
        const fitroomClient = getFitroomClient();
        const validationResult = await fitroomClient.validateModelImage(imagePath);

        // Clean up
        try {
          fs.rmSync(tempDir, { recursive: true, force: true });
        } catch (err) {
          console.warn("[Cleanup] Failed to remove temp files:", err);
        }

        return {
          valid: validationResult.valid,
          error: validationResult.error,
        };
      } catch (error) {
        console.error("[Model Validation Error]", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to validate model image",
        });
      }
    }),

  /**
   * Validate clothing image before try-on
   * Checks if the image is suitable for virtual try-on
   */
  validateClothImage: protectedProcedure
    .input(
      z.object({
        imageBase64: z.string().describe("Base64 encoded image to validate"),
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        // Convert base64 to temp file
        const tempDir = path.join("/tmp", `fitroom-validate-${ctx.user.id}-${Date.now()}`);
        if (!fs.existsSync(tempDir)) {
          fs.mkdirSync(tempDir, { recursive: true });
        }

        const imagePath = path.join(tempDir, "cloth.jpg");
        const buffer = Buffer.from(input.imageBase64, "base64");
        fs.writeFileSync(imagePath, buffer);

        // Validate with Fitroom
        const fitroomClient = getFitroomClient();
        const validationResult = await fitroomClient.validateClothImage(imagePath);

        // Clean up
        try {
          fs.rmSync(tempDir, { recursive: true, force: true });
        } catch (err) {
          console.warn("[Cleanup] Failed to remove temp files:", err);
        }

        return {
          valid: validationResult.valid,
          error: validationResult.error,
        };
      } catch (error) {
        console.error("[Cloth Validation Error]", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to validate clothing image",
        });
      }
    }),

  /**
   * Refund credits for failed/timeout try-ons
   */
  refundTryOn: protectedProcedure
    .input(
      z.object({
        taskId: z.string().describe("Task ID to refund"),
        reason: z.string().optional().describe("Reason for refund"),
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        // Refund 1 credit
        const result = await refundCredits(ctx.user.id, 1);
        return {
          success: true,
          message: "Credit refunded successfully",
          remainingCredits: result.remainingCredits,
        };
      } catch (error) {
        console.error("[Refund Error]", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to refund credit",
        });
      }
    }),

  /**
   * Get user's transaction history
   */
  getTransactionHistory: protectedProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(100).default(50),
      })
    )
    .query(async ({ ctx, input }) => {
      const { getUserTransactions } = await import("../db.credits");
      return await getUserTransactions(ctx.user.id, input.limit);
    }),
});
