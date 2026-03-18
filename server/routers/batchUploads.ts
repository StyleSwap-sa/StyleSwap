import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { batchUploads, batchUploadFiles } from "../../drizzle/schema";
import { eq, desc, and } from "drizzle-orm";

export const batchUploadsRouter = router({
  // Create a new batch upload
  createBatchUpload: protectedProcedure
    .input(
      z.object({
        boutiqueId: z.number(),
        uploadName: z.string().max(255),
        totalFiles: z.number(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      const result = await db.insert(batchUploads).values({
        boutiqueId: input.boutiqueId,
        userId: ctx.user.id,
        uploadName: input.uploadName,
        totalFiles: input.totalFiles,
        status: "pending",
      });

      return {
        success: true,
        batchUploadId: result[0],
      };
    }),

  // Add files to a batch upload
  addFilesToBatch: protectedProcedure
    .input(
      z.object({
        batchUploadId: z.number(),
        files: z.array(
          z.object({
            fileName: z.string(),
            fileSize: z.number(),
            fileUrl: z.string(),
            clothingType: z.enum(["upper", "lower", "combo", "full"]),
          })
        ),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      const filesToInsert = input.files.map((file) => ({
        batchUploadId: input.batchUploadId,
        fileName: file.fileName,
        fileSize: file.fileSize,
        fileUrl: file.fileUrl,
        clothingType: file.clothingType as "upper" | "lower" | "combo" | "full",
        status: "uploaded" as const,
      }));

      await db.insert(batchUploadFiles).values(filesToInsert);

      // Update batch upload status
      await db
        .update(batchUploads)
        .set({
          status: "completed",
          successfulFiles: input.files.length,
          completedAt: new Date().toISOString(),
        })
        .where(eq(batchUploads.id, input.batchUploadId));

      return { success: true };
    }),

  // Get batch uploads for a boutique
  getBatchUploads: protectedProcedure
    .input(z.object({ boutiqueId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      const uploads = await db
        .select()
        .from(batchUploads)
        .where(eq(batchUploads.boutiqueId, input.boutiqueId))
        .orderBy(desc(batchUploads.createdAt));

      return uploads;
    }),

  // Get files in a batch upload
  getBatchFiles: protectedProcedure
    .input(z.object({ batchUploadId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      const files = await db
        .select()
        .from(batchUploadFiles)
        .where(eq(batchUploadFiles.batchUploadId, input.batchUploadId))
        .orderBy(desc(batchUploadFiles.createdAt));

      return files;
    }),

  // Update batch upload status
  updateBatchStatus: protectedProcedure
    .input(
      z.object({
        batchUploadId: z.number(),
        status: z.enum(["pending", "processing", "completed", "failed"]),
        errorMessage: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      await db
        .update(batchUploads)
        .set({
          status: input.status,
          errorMessage: input.errorMessage,
        })
        .where(eq(batchUploads.id, input.batchUploadId));

      return { success: true };
    }),

  // Get batch upload statistics
  getBatchStats: protectedProcedure
    .input(z.object({ batchUploadId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      const batch = await db
        .select()
        .from(batchUploads)
        .where(eq(batchUploads.id, input.batchUploadId));

      if (batch.length === 0) {
        return null;
      }

      const files = await db
        .select()
        .from(batchUploadFiles)
        .where(eq(batchUploadFiles.batchUploadId, input.batchUploadId));

      return {
        ...batch[0],
        fileCount: files.length,
        uploadedFiles: files.filter((f) => f.status === "uploaded").length,
        failedFiles: files.filter((f) => f.status === "failed").length,
      };
    }),
});
