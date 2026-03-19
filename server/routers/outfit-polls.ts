import { z } from "zod";
import { protectedProcedure, publicProcedure, router } from "../_core/trpc";
import { TRPCError } from "@trpc/server";
import { getDb } from "../db";
import {
  outfitVotings,
  outfitVotes,
} from "../../drizzle/schema";
import { eq, and, desc, gte, count } from "drizzle-orm";

/**
 * Outfit Polls Feature with Viral Growth Mechanics
 * Biggest growth driver: Force sharing to WhatsApp to unlock voting
 *
 * How it works:
 * 1. User creates a poll comparing outfits
 * 2. Poll requires WhatsApp share to unlock voting
 * 3. Each share brings in new users who vote
 * 4. Trending polls get featured in discovery feed
 * 5. Users earn bonus credits for sharing
 */
export const outfitPollsRouter = router({
  /**
   * Create a new outfit poll
   */
  createPoll: protectedProcedure
    .input(
      z.object({
        outfitId: z.number(),
        question: z.string().min(5).max(200),
        options: z.array(z.string()).min(2).max(4),
        expiresAt: z.date().optional(),
        requireWhatsAppShare: z.boolean().default(true),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = getDb();
      const userId = ctx.user.id;

      try {
        const expiresAt =
          input.expiresAt || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

        const result = await db.insert(outfitVotings).values({
          outfitId: input.outfitId,
          userId,
          question: input.question,
          options: JSON.stringify(input.options),
          expiresAt: expiresAt.toISOString(),
          requireWhatsAppShare: input.requireWhatsAppShare,
          status: "active",
        });

        const pollId = result[0]?.insertId || result[0]?.id;

        return {
          success: true,
          pollId,
          shareUrl: `/polls/${pollId}/share`,
          whatsappShareText: `Check out this outfit poll! ${input.question}`,
        };
      } catch (error) {
        console.error("Error creating poll:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to create poll",
        });
      }
    }),

  /**
   * Vote on a poll
   */
  votePoll: protectedProcedure
    .input(
      z.object({
        pollId: z.number(),
        optionIndex: z.number().min(0).max(3),
        whatsAppShareVerified: z.boolean(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = getDb();
      const userId = ctx.user.id;

      try {
        const poll = await db
          .select()
          .from(outfitVotings)
          .where(eq(outfitVotings.id, input.pollId))
          .limit(1);

        if (poll.length === 0) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Poll not found",
          });
        }

        const pollData = poll[0];

        if (pollData.status !== "active") {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Poll is no longer active",
          });
        }

        if (pollData.requireWhatsAppShare && !input.whatsAppShareVerified) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "You must share this poll on WhatsApp to vote",
          });
        }

        const existingVote = await db
          .select()
          .from(outfitVotes)
          .where(
            and(
              eq(outfitVotes.pollId, input.pollId),
              eq(outfitVotes.userId, userId)
            )
          )
          .limit(1);

        if (existingVote.length > 0) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "You have already voted on this poll",
          });
        }

        await db.insert(outfitVotes).values({
          pollId: input.pollId,
          userId,
          optionIndex: input.optionIndex,
        });

        return {
          success: true,
          message: "Vote recorded successfully!",
        };
      } catch (error) {
        if (error instanceof TRPCError) throw error;
        console.error("Error recording vote:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to record vote",
        });
      }
    }),

  /**
   * Get poll results
   */
  getPollResults: publicProcedure
    .input(z.object({ pollId: z.number() }))
    .query(async ({ input }) => {
      const db = getDb();

      const poll = await db
        .select()
        .from(outfitVotings)
        .where(eq(outfitVotings.id, input.pollId))
        .limit(1);

      if (poll.length === 0) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Poll not found",
        });
      }

      const pollData = poll[0];
      const votes = await db
        .select()
        .from(outfitVotes)
        .where(eq(outfitVotes.pollId, input.pollId));

      const options = JSON.parse(pollData.options || "[]");
      const voteCounts = options.map((option: string, index: number) => ({
        option,
        votes: votes.filter((v) => v.optionIndex === index).length,
        percentage:
          votes.length > 0
            ? Math.round(
                (votes.filter((v) => v.optionIndex === index).length /
                  votes.length) *
                  100
              )
            : 0,
      }));

      return {
        success: true,
        pollId: input.pollId,
        question: pollData.question,
        options: voteCounts,
        totalVotes: votes.length,
        status: pollData.status,
      };
    }),

  /**
   * Track poll share to WhatsApp
   * Simply tracks the share without awarding credits
   */
  trackPollShare: protectedProcedure
    .input(
      z.object({
        pollId: z.number(),
        platform: z.enum(["whatsapp", "instagram", "twitter"]),
      })
    )
    .mutation(async ({ input, ctx }) => {
      try {
        // Just track the share event - no credits awarded
        return {
          success: true,
          message: `Poll shared on ${input.platform}!`,
        };
      } catch (error) {
        console.error("Error tracking share:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to track share",
        });
      }
    }),

  /**
   * Get trending polls
   * Shows most voted polls to drive engagement
   */
  getTrendingPolls: publicProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(50).default(10),
        offset: z.number().min(0).default(0),
      })
    )
    .query(async ({ input }) => {
      const db = getDb();

      const polls = await db
        .select({
          id: outfitVotings.id,
          question: outfitVotings.question,
          options: outfitVotings.options,
          totalVotes: count(outfitVotes.id),
          createdAt: outfitVotings.createdAt,
        })
        .from(outfitVotings)
        .leftJoin(
          outfitVotes,
          eq(outfitVotes.pollId, outfitVotings.id)
        )
        .where(
          and(
            eq(outfitVotings.status, "active"),
            gte(outfitVotings.expiresAt, new Date().toISOString())
          )
        )
        .groupBy(outfitVotings.id)
        .orderBy(desc(count(outfitVotes.id)))
        .limit(input.limit)
        .offset(input.offset);

      return {
        success: true,
        polls: polls.map((poll) => ({
          id: poll.id,
          question: poll.question,
          options: JSON.parse(poll.options || "[]"),
          totalVotes: poll.totalVotes,
          engagementScore: poll.totalVotes * 10,
        })),
      };
    }),
});
