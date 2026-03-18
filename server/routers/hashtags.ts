import { router, protectedProcedure, publicProcedure } from "../_core/trpc";
import { z } from "zod";
import { trendingHashtags, hashtagUsage, savedOutfits } from "../../drizzle/schema";
import { eq, desc, and } from "drizzle-orm";

export const hashtagsRouter = router({
  // Get trending hashtags
  getTrendingHashtags: publicProcedure
    .input(z.object({ limit: z.number().default(20) }))
    .query(async ({ ctx, input }) => {
      const trending = await ctx.db
        .select()
        .from(trendingHashtags)
        .where(eq(trendingHashtags.isActive, true))
        .orderBy(desc(trendingHashtags.trendingScore))
        .limit(input.limit);

      return trending;
    }),

  // Add hashtag to outfit
  addHashtagToOutfit: protectedProcedure
    .input(z.object({ outfitId: z.number(), hashtag: z.string() }))
    .mutation(async ({ ctx, input }) => {
      // Check if hashtag exists
      let hashtagRecord = await ctx.db
        .select()
        .from(trendingHashtags)
        .where(eq(trendingHashtags.hashtag, input.hashtag.toLowerCase()));

      if (hashtagRecord.length === 0) {
        // Create new hashtag
        const result = await ctx.db
          .insert(trendingHashtags)
          .values({
            hashtag: input.hashtag.toLowerCase(),
            usageCount: 1,
            trendingScore: "1",
          })
          .returning();
        hashtagRecord = result;
      } else {
        // Update usage count
        await ctx.db
          .update(trendingHashtags)
          .set({
            usageCount: (hashtagRecord[0]?.usageCount || 0) + 1,
            trendingScore: ((hashtagRecord[0]?.usageCount || 0) + 1).toString(),
          })
          .where(eq(trendingHashtags.id, hashtagRecord[0]?.id));
      }

      // Add hashtag usage
      await ctx.db.insert(hashtagUsage).values({
        hashtagId: hashtagRecord[0]?.id,
        outfitId: input.outfitId,
      });

      return { success: true, hashtag: input.hashtag.toLowerCase() };
    }),

  // Search hashtags
  searchHashtags: publicProcedure
    .input(z.object({ query: z.string().min(1), limit: z.number().default(10) }))
    .query(async ({ ctx, input }) => {
      const results = await ctx.db
        .select()
        .from(trendingHashtags)
        .where(and(
          eq(trendingHashtags.isActive, true),
          // Using LIKE for PostgreSQL
        ))
        .orderBy(desc(trendingHashtags.usageCount))
        .limit(input.limit);

      return results.filter(h => h.hashtag.toLowerCase().includes(input.query.toLowerCase()));
    }),

  // Get outfits by hashtag
  getOutfitsByHashtag: publicProcedure
    .input(z.object({ hashtag: z.string(), limit: z.number().default(20), page: z.number().default(1) }))
    .query(async ({ ctx, input }) => {
      const offset = (input.page - 1) * input.limit;

      // First get the hashtag
      const hashtagRecord = await ctx.db
        .select()
        .from(trendingHashtags)
        .where(eq(trendingHashtags.hashtag, input.hashtag.toLowerCase()));

      if (hashtagRecord.length === 0) {
        return [];
      }

      // Get outfits with this hashtag
      const outfits = await ctx.db
        .select()
        .from(hashtagUsage)
        .innerJoin(savedOutfits, eq(hashtagUsage.outfitId, savedOutfits.id))
        .where(eq(hashtagUsage.hashtagId, hashtagRecord[0]?.id))
        .limit(input.limit)
        .offset(offset);

      return outfits;
    }),
});
