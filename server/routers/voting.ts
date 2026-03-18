import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import { outfitVotings, outfitVotes } from "../../drizzle/schema";
import { eq, desc, and, count } from "drizzle-orm";
import { TRPCError } from "@trpc/server";

export const votingRouter = router({
  // Create a new outfit voting poll
  createVotingPoll: protectedProcedure
    .input(
      z.object({
        title: z.string().min(1, "Title is required"),
        description: z.string().optional(),
        outfitAImageUrl: z.string().url(),
        outfitBImageUrl: z.string().url(),
        outfitCImageUrl: z.string().url().optional(),
        outfitATitle: z.string().default("Outfit A"),
        outfitBTitle: z.string().default("Outfit B"),
        outfitCTitle: z.string().default("Outfit C"),
        expiresAt: z.date().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        const [votingPoll] = await ctx.db
          .insert(outfitVotings)
          .values({
            userId: ctx.user.id,
            title: input.title,
            description: input.description,
            outfitAImageUrl: input.outfitAImageUrl,
            outfitBImageUrl: input.outfitBImageUrl,
            outfitCImageUrl: input.outfitCImageUrl,
            outfitATitle: input.outfitATitle,
            outfitBTitle: input.outfitBTitle,
            outfitCTitle: input.outfitCTitle,
            expiresAt: input.expiresAt?.toISOString(),
          })
          .returning();

        return votingPoll;
      } catch (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to create voting poll",
        });
      }
    }),

  // Submit a vote
  submitVote: protectedProcedure
    .input(
      z.object({
        votingId: z.number(),
        selectedOutfit: z.enum(["A", "B", "C"]),
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        // Check if voting poll exists and is active
        const votingPoll = await ctx.db
          .select()
          .from(outfitVotings)
          .where(eq(outfitVotings.id, input.votingId));

        if (!votingPoll.length) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Voting poll not found",
          });
        }

        if (!votingPoll[0].isActive) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "This voting poll is no longer active",
          });
        }

        // Check if user already voted
        const existingVote = await ctx.db
          .select()
          .from(outfitVotes)
          .where(
            and(
              eq(outfitVotes.votingId, input.votingId),
              eq(outfitVotes.voterId, ctx.user.id)
            )
          );

        if (existingVote.length) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "You have already voted on this poll",
          });
        }

        // Submit vote
        const [vote] = await ctx.db
          .insert(outfitVotes)
          .values({
            votingId: input.votingId,
            voterId: ctx.user.id,
            selectedOutfit: input.selectedOutfit,
          })
          .returning();

        // Update total votes count
        await ctx.db
          .update(outfitVotings)
          .set({
            totalVotes: votingPoll[0].totalVotes! + 1,
          })
          .where(eq(outfitVotings.id, input.votingId));

        return vote;
      } catch (error) {
        if (error instanceof TRPCError) throw error;
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to submit vote",
        });
      }
    }),

  // Get voting poll with results
  getVotingPoll: protectedProcedure
    .input(z.object({ votingId: z.number() }))
    .query(async ({ ctx, input }) => {
      try {
        const votingPoll = await ctx.db
          .select()
          .from(outfitVotings)
          .where(eq(outfitVotings.id, input.votingId));

        if (!votingPoll.length) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Voting poll not found",
          });
        }

        // Get vote counts for each outfit
        const voteCountsA = await ctx.db
          .select({ count: count() })
          .from(outfitVotes)
          .where(
            and(
              eq(outfitVotes.votingId, input.votingId),
              eq(outfitVotes.selectedOutfit, "A")
            )
          );

        const voteCountsB = await ctx.db
          .select({ count: count() })
          .from(outfitVotes)
          .where(
            and(
              eq(outfitVotes.votingId, input.votingId),
              eq(outfitVotes.selectedOutfit, "B")
            )
          );

        const voteCountsC = await ctx.db
          .select({ count: count() })
          .from(outfitVotes)
          .where(
            and(
              eq(outfitVotes.votingId, input.votingId),
              eq(outfitVotes.selectedOutfit, "C")
            )
          );

        // Check if user has voted
        const userVote = await ctx.db
          .select()
          .from(outfitVotes)
          .where(
            and(
              eq(outfitVotes.votingId, input.votingId),
              eq(outfitVotes.voterId, ctx.user.id)
            )
          );

        return {
          ...votingPoll[0],
          voteA: voteCountsA[0]?.count || 0,
          voteB: voteCountsB[0]?.count || 0,
          voteC: voteCountsC[0]?.count || 0,
          userVote: userVote[0]?.selectedOutfit || null,
        };
      } catch (error) {
        if (error instanceof TRPCError) throw error;
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to fetch voting poll",
        });
      }
    }),

  // Get user's voting polls
  getUserVotingPolls: protectedProcedure.query(async ({ ctx }) => {
    try {
      const polls = await ctx.db
        .select()
        .from(outfitVotings)
        .where(eq(outfitVotings.userId, ctx.user.id))
        .orderBy(desc(outfitVotings.createdAt));

      return polls;
    } catch (error) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to fetch voting polls",
      });
    }
  }),

  // Close a voting poll
  closeVotingPoll: protectedProcedure
    .input(z.object({ votingId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      try {
        const votingPoll = await ctx.db
          .select()
          .from(outfitVotings)
          .where(eq(outfitVotings.id, input.votingId));

        if (!votingPoll.length) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Voting poll not found",
          });
        }

        if (votingPoll[0].userId !== ctx.user.id) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "You don't have permission to close this poll",
          });
        }

        const [updated] = await ctx.db
          .update(outfitVotings)
          .set({ isActive: false })
          .where(eq(outfitVotings.id, input.votingId))
          .returning();

        return updated;
      } catch (error) {
        if (error instanceof TRPCError) throw error;
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to close voting poll",
        });
      }
    }),
});
