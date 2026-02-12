import { protectedProcedure, router } from "../_core/trpc";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import {
  addCreditsAdmin,
  deductCreditsAdmin,
  getUserCredits,
  getUserTransactionHistoryAdmin,
  searchUsersForAdmin,
} from "../db.credits";
import { getDb } from "../db";
import { users, userCredits, transactions } from "../../drizzle/schema";
import { eq, sql, gt, lte, and } from "drizzle-orm";

/**
 * Admin Credit Management Router
 * Restricted to admin users only
 * Used for managing customer credits and creating custom packages
 */

export const adminCreditsRouter = router({
  /**
   * Search for customers by email or name
   */
  searchCustomers: protectedProcedure
    .input(z.object({ query: z.string().min(1), limit: z.number().optional().default(20) }))
    .query(async ({ ctx, input }) => {
      if (ctx.user.role !== "admin") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Only admins can search customers",
        });
      }

      try {
        const results = await searchUsersForAdmin(input.query, input.limit);
        
        // Fetch credit info for each user
        const customersWithCredits = await Promise.all(
          results.map(async (user) => {
            const credits = await getUserCredits(user.id);
            return {
              ...user,
              credits,
            };
          })
        );

        return customersWithCredits;
      } catch (error) {
        console.error("[Admin Credits] Search error:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to search customers",
        });
      }
    }),

  /**
   * Get customer details with full credit history
   */
  getCustomerDetails: protectedProcedure
    .input(z.object({ userId: z.number() }))
    .query(async ({ ctx, input }) => {
      if (ctx.user.role !== "admin") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Only admins can view customer details",
        });
      }

      try {
        const db = await getDb();
        if (!db) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Database not available",
          });
        }

        // Get user info
        const userInfo = await db
          .select()
          .from(users)
          .where(eq(users.id, input.userId))
          .limit(1);

        if (userInfo.length === 0) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Customer not found",
          });
        }

        // Get credit info
        const credits = await getUserCredits(input.userId);

        // Get transaction history
        const transactions = await getUserTransactionHistoryAdmin(input.userId, 100);

        return {
          user: userInfo[0],
          credits,
          transactions,
        };
      } catch (error) {
        if (error instanceof TRPCError) throw error;
        console.error("[Admin Credits] Get customer details error:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to fetch customer details",
        });
      }
    }),

  /**
   * Add credits to a customer (for custom packages)
   */
  addCreditsToCustomer: protectedProcedure
    .input(
      z.object({
        userId: z.number(),
        creditsToAdd: z.number().min(1),
        reason: z.string().min(1).max(500),
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (ctx.user.role !== "admin") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Only admins can add credits",
        });
      }

      try {
        const result = await addCreditsAdmin(
          input.userId,
          input.creditsToAdd,
          input.reason
        );

        // Log admin action
        console.log(
          `[Admin Credits] Admin ${ctx.user.id} added ${input.creditsToAdd} credits to user ${input.userId}. Reason: ${input.reason}`
        );

        return {
          success: true,
          newBalance: result.remainingCredits,
          totalCredits: result.totalCredits,
        };
      } catch (error) {
        console.error("[Admin Credits] Add credits error:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: error instanceof Error ? error.message : "Failed to add credits",
        });
      }
    }),

  /**
   * Deduct credits from a customer (for corrections/adjustments)
   */
  deductCreditsFromCustomer: protectedProcedure
    .input(
      z.object({
        userId: z.number(),
        creditsToDeduct: z.number().min(1),
        reason: z.string().min(1).max(500),
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (ctx.user.role !== "admin") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Only admins can deduct credits",
        });
      }

      try {
        const result = await deductCreditsAdmin(
          input.userId,
          input.creditsToDeduct,
          input.reason
        );

        // Log admin action
        console.log(
          `[Admin Credits] Admin ${ctx.user.id} deducted ${input.creditsToDeduct} credits from user ${input.userId}. Reason: ${input.reason}`
        );

        return {
          success: true,
          newBalance: result.remainingCredits,
          usedCredits: result.usedCredits,
        };
      } catch (error) {
        console.error("[Admin Credits] Deduct credits error:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: error instanceof Error ? error.message : "Failed to deduct credits",
        });
      }
    }),

  /**
   * Get all customers with low credits (for outreach)
   */
  getCustomersWithLowCredits: protectedProcedure
    .input(z.object({ threshold: z.number().optional().default(10) }))
    .query(async ({ ctx, input }) => {
      if (ctx.user.role !== "admin") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Only admins can view this data",
        });
      }

      try {
        const db = await getDb();
        if (!db) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Database not available",
          });
        }

        const result = await db
          .select({
            userId: userCredits.userId,
            email: users.email,
            name: users.name,
            remainingCredits: userCredits.remainingCredits,
            totalCredits: userCredits.totalCredits,
            usedCredits: userCredits.usedCredits,
            lastUpdated: userCredits.updatedAt,
          })
          .from(userCredits)
          .innerJoin(users, eq(userCredits.userId, users.id))
          .where(sql`${userCredits.remainingCredits} <= ${input.threshold}`)
          .limit(100);

        return result;
      } catch (error) {
        console.error("[Admin Credits] Get low credits error:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to fetch customers with low credits",
        });
      }
    }),

  /**
   * Get credit statistics
   */
  getCreditsStatistics: protectedProcedure.query(async ({ ctx }) => {
    if (ctx.user.role !== "admin") {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "Only admins can view statistics",
      });
    }

    try {
      const db = await getDb();
      if (!db) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Database not available",
        });
      }

      const stats = await db
        .select({
          totalCustomers: sql`COUNT(DISTINCT ${userCredits.userId})`.as('totalCustomers'),
          totalCreditsDistributed: sql`SUM(${userCredits.totalCredits})`.as('totalCreditsDistributed'),
          totalCreditsUsed: sql`SUM(${userCredits.usedCredits})`.as('totalCreditsUsed'),
          totalCreditsRemaining: sql`SUM(${userCredits.remainingCredits})`.as('totalCreditsRemaining'),
          averageCreditsPerCustomer: sql`AVG(${userCredits.remainingCredits})`.as('averageCreditsPerCustomer'),
        })
        .from(userCredits);

      return stats[0] || {
        totalCustomers: 0,
        totalCreditsDistributed: 0,
        totalCreditsUsed: 0,
        totalCreditsRemaining: 0,
        averageCreditsPerCustomer: 0,
      };
    } catch (error) {
      console.error("[Admin Credits] Get statistics error:", error);
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to fetch statistics",
      });
    }
  }),

  /**
   * Bulk add credits from CSV
   * Expected CSV format: email,credits,reason
   * Example: john@example.com,500,Retail partnership
   */
  bulkAddCredits: protectedProcedure
    .input(
      z.object({
        csvData: z.string().describe("CSV content with email,credits,reason format"),
      })
    )
    .mutation(async ({ input, ctx }) => {
      if (ctx.user.role !== "admin") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Only admins can perform bulk operations",
        });
      }

      const db = await getDb();
      if (!db) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Database not available",
        });
      }

      const lines = input.csvData.trim().split("\n");
      const results = {
        success: 0,
        failed: 0,
        errors: [] as string[],
      };

      for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;

        const [email, creditsStr, reason] = line.split(",").map((s) => s.trim());

        if (!email || !creditsStr || !reason) {
          results.errors.push(`Row ${i + 1}: Missing required fields`);
          results.failed++;
          continue;
        }

        const credits = parseInt(creditsStr);
        if (isNaN(credits) || credits <= 0) {
          results.errors.push(`Row ${i + 1}: Invalid credits amount`);
          results.failed++;
          continue;
        }

        try {
          const user = await db.query.users.findFirst({
            where: eq(users.email, email),
          });

          if (!user) {
            results.errors.push(`Row ${i + 1}: User not found (${email})`);
            results.failed++;
            continue;
          }

          await addCreditsAdmin(user.id, credits, reason, ctx.user.id);
          results.success++;
        } catch (error) {
          results.errors.push(
            `Row ${i + 1}: ${error instanceof Error ? error.message : "Unknown error"}`
          );
          results.failed++;
        }
      }

      return results;
    }),

  /**
   * Get customers with expiring credits (within 7 days)
   */
  getExpiringCredits: protectedProcedure
    .input(
      z.object({
        daysUntilExpiry: z.number().default(7),
      })
    )
    .query(async ({ ctx, input }) => {
      if (ctx.user.role !== "admin") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Only admins can view this data",
        });
      }

      try {
        const db = await getDb();
        if (!db) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Database not available",
          });
        }

        const expiryDate = new Date();
        expiryDate.setDate(expiryDate.getDate() + input.daysUntilExpiry);

        const result = await db.query.userCredits.findMany({
          where: and(
            gt(userCredits.expiresAt, new Date()),
            lte(userCredits.expiresAt, expiryDate)
          ),
          with: {
            user: {
              columns: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        });

        return result;
      } catch (error) {
        console.error("[Admin Credits] Get expiring credits error:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to fetch expiring credits",
        });
      }
    }),

  /**
   * Extend credit expiration date
   */
  extendCreditExpiry: protectedProcedure
    .input(
      z.object({
        userId: z.number(),
        newExpiryDate: z.date(),
        reason: z.string(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      if (ctx.user.role !== "admin") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Only admins can extend credit expiry",
        });
      }

      try {
        const db = await getDb();
        if (!db) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Database not available",
          });
        }

        const creditRecord = await db.query.userCredits.findFirst({
          where: eq(userCredits.userId, input.userId),
        });

        if (!creditRecord) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "No credit record found for this user",
          });
        }

        await db
          .update(userCredits)
          .set({
            expiresAt: input.newExpiryDate,
            updatedAt: new Date(),
          })
          .where(eq(userCredits.userId, input.userId));

        // Log transaction
        await db.insert(transactions).values({
          userId: input.userId,
          type: "expiry_extension",
          amount: 0,
          description: `Credit expiry extended to ${input.newExpiryDate.toLocaleDateString()}. Reason: ${input.reason}`,
          adminId: ctx.user.id,
          createdAt: new Date(),
        });

        return { success: true };
      } catch (error) {
        if (error instanceof TRPCError) throw error;
        console.error("[Admin Credits] Extend expiry error:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to extend credit expiry",
        });
      }
    }),
});
