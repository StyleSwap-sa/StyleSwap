import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import { db } from "../db";
import { sql, eq, and } from "drizzle-orm";

/**
 * Outfit Polls Feature
 * Biggest growth driver: Force sharing to WhatsApp to get more votes
 * 
 * How it works:
 * 1. User creates a poll comparing 2 outfits
 * 2. They can vote immediately
 * 3. To see results, they must share the poll to WhatsApp
 * 4. Each share brings in new users who vote
 */
export const outfitPollsRouter = router({
  /**
   * Create a new outfit poll
   * Compares 2 outfits and asks "Which outfit is better?"
   */
  createPoll: protectedProcedure
    .input(
      z.object({
        outfit1Id: z.number().describe("First outfit ID"),
        outfit2Id: z.number().describe("Second outfit ID"),
        question: z.string().optional().describe("Custom poll question"),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.user.id;
      const question =
        input.question || "Which outfit is better?";

      // Create poll in database
      // Note: This assumes a polls table exists in the schema
      const pollQuery = sql`
        INSERT INTO polls (user_id, outfit1_id, outfit2_id, question, created_at)
        VALUES (${userId}, ${input.outfit1Id}, ${input.outfit2Id}, ${question}, NOW())
        RETURNING id, outfit1_id, outfit2_id, question, created_at
      `;

      try {
        const result = await db.execute(pollQuery);
        const poll = result.rows[0];

        return {
          success: true,
          pollId: poll.id,
          shareUrl: `/polls/${poll.id}`,
          whatsappShareText: `Check out this outfit poll! Which one do you prefer? ${question}`,
        };
      } catch (error) {
        console.error("Error creating poll:", error);
        return {
          success: false,
          error: "Failed to create poll",
        };
      }
    }),

  /**
   * Vote on a poll
   * User votes for outfit1 or outfit2
   */
  votePoll: protectedProcedure
    .input(
      z.object({
        pollId: z.number(),
        voteFor: z.enum(["outfit1", "outfit2"]),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.user.id;

      // Record vote
      const voteQuery = sql`
        INSERT INTO poll_votes (poll_id, user_id, vote_for, created_at)
        VALUES (${input.pollId}, ${userId}, ${input.voteFor}, NOW())
        ON CONFLICT (poll_id, user_id) DO UPDATE SET vote_for = ${input.voteFor}
        RETURNING id
      `;

      try {
        await db.execute(voteQuery);

        return {
          success: true,
          message: "Vote recorded",
        };
      } catch (error) {
        console.error("Error recording vote:", error);
        return {
          success: false,
          error: "Failed to record vote",
        };
      }
    }),

  /**
   * Get poll results
   * Only shows results if user has shared to WhatsApp
   * Otherwise shows "Share to see results" CTA
   */
  getPollResults: protectedProcedure
    .input(z.object({ pollId: z.number() }))
    .query(async ({ ctx, input }) => {
      const userId = ctx.user.id;

      // Check if user has shared this poll
      const shareQuery = sql`
        SELECT id FROM poll_shares 
        WHERE poll_id = ${input.pollId} AND user_id = ${userId}
        LIMIT 1
      `;

      try {
        const shareResult = await db.execute(shareQuery);
        const hasShared = shareResult.rows.length > 0;

        if (!hasShared) {
          return {
            success: true,
            hasShared: false,
            message: "Share this poll to WhatsApp to see results!",
            results: null,
            shareUrl: `https://styleswap.co.za/polls/${input.pollId}?ref=${userId}`,
            whatsappMessage: "Check out this outfit poll! Which one do you prefer?",
          };
        }

        // Get poll results
        const resultsQuery = sql`
          SELECT 
            (SELECT COUNT(*) FROM poll_votes WHERE poll_id = ${input.pollId} AND vote_for = 'outfit1') as outfit1_votes,
            (SELECT COUNT(*) FROM poll_votes WHERE poll_id = ${input.pollId} AND vote_for = 'outfit2') as outfit2_votes,
            (SELECT COUNT(*) FROM poll_votes WHERE poll_id = ${input.pollId}) as total_votes
        `;

        const resultsData = await db.execute(resultsQuery);
        const results = resultsData.rows[0];

        return {
          success: true,
          hasShared: true,
          results: {
            outfit1Votes: results.outfit1_votes || 0,
            outfit2Votes: results.outfit2_votes || 0,
            totalVotes: results.total_votes || 0,
            outfit1Percentage:
              results.total_votes > 0
                ? Math.round((results.outfit1_votes / results.total_votes) * 100)
                : 0,
            outfit2Percentage:
              results.total_votes > 0
                ? Math.round((results.outfit2_votes / results.total_votes) * 100)
                : 0,
          },
        };
      } catch (error) {
        console.error("Error getting poll results:", error);
        return {
          success: false,
          error: "Failed to get poll results",
        };
      }
    }),

  /**
   * Track poll share to WhatsApp
   * When user shares, unlock results and track the share
   */
  trackPollShare: protectedProcedure
    .input(
      z.object({
        pollId: z.number(),
        platform: z.enum(["whatsapp", "instagram", "twitter"]),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.user.id;

      // Record share
      const shareQuery = sql`
        INSERT INTO poll_shares (poll_id, user_id, platform, created_at)
        VALUES (${input.pollId}, ${userId}, ${input.platform}, NOW())
        RETURNING id
      `;

      try {
        await db.execute(shareQuery);

        // Award bonus credits for sharing
        const bonusQuery = sql`
          INSERT INTO transactions (user_id, amount, status, reason, created_at)
          VALUES (${userId}, '0.5', 'completed', 'Poll share bonus', NOW())
        `;

        await db.execute(bonusQuery);

        return {
          success: true,
          message: "Share tracked! You earned 0.5 bonus credits",
          bonusCredits: 0.5,
        };
      } catch (error) {
        console.error("Error tracking share:", error);
        return {
          success: false,
          error: "Failed to track share",
        };
      }
    }),

  /**
   * Get trending polls
   * Shows most shared and voted polls to drive engagement
   */
  getTrendingPolls: protectedProcedure.query(async ({ ctx }) => {
    const trendingQuery = sql`
      SELECT 
        p.id,
        p.outfit1_id,
        p.outfit2_id,
        p.question,
        (SELECT COUNT(*) FROM poll_votes WHERE poll_id = p.id) as total_votes,
        (SELECT COUNT(*) FROM poll_shares WHERE poll_id = p.id) as total_shares,
        p.created_at
      FROM polls p
      ORDER BY total_shares DESC, total_votes DESC
      LIMIT 10
    `;

    try {
      const result = await db.execute(trendingQuery);
      return {
        success: true,
        polls: result.rows,
      };
    } catch (error) {
      console.error("Error getting trending polls:", error);
      return {
        success: false,
        error: "Failed to get trending polls",
        polls: [],
      };
    }
  }),
});
