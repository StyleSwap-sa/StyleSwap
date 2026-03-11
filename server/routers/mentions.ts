import { router, protectedProcedure } from "../_core/trpc";
import { z } from "zod";
import { userMentions, users } from "../../drizzle/schema";
import { eq, and, like } from "drizzle-orm";

export const mentionsRouter = router({
  // Create mention in comment
  createMention: protectedProcedure
    .input(z.object({ commentId: z.number(), mentionedUserId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.db.insert(userMentions).values({
        commentId: input.commentId,
        mentionedUserId: input.mentionedUserId,
        mentionedBy: ctx.user.id,
      });

      return { success: true, message: "Mention created" };
    }),

  // Search users for mention autocomplete
  searchUsers: protectedProcedure
    .input(z.object({ query: z.string().min(1), limit: z.number().default(10) }))
    .query(async ({ ctx, input }) => {
      const results = await ctx.db
        .select({
          id: users.id,
          name: users.name,
          email: users.email,
        })
        .from(users)
        .where(like(users.name, `%${input.query}%`))
        .limit(input.limit);

      return results;
    }),

  // Get mentions for a user
  getUserMentions: protectedProcedure
    .input(z.object({ limit: z.number().default(20), page: z.number().default(1) }))
    .query(async ({ ctx, input }) => {
      const offset = (input.page - 1) * input.limit;

      const mentions = await ctx.db
        .select()
        .from(userMentions)
        .where(eq(userMentions.mentionedUserId, ctx.user.id))
        .limit(input.limit)
        .offset(offset);

      return mentions;
    }),

  // Mark mention as notified
  markMentionNotified: protectedProcedure
    .input(z.object({ mentionId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.db
        .update(userMentions)
        .set({ isNotified: true })
        .where(eq(userMentions.id, input.mentionId));

      return { success: true };
    }),
});
