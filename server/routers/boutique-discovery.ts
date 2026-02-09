import { publicProcedure, router } from "../_core/trpc";
import { z } from "zod";
import { getDb } from "../db";
import { boutiques, shopOrders } from "../../drizzle/schema";
import { eq, and, desc, asc, sql, count, avg } from "drizzle-orm";

/**
 * Boutique Discovery Router
 * Public procedures for customers to discover and browse boutiques
 * Does not interfere with existing workflows (picture uploads, try-on generation)
 */

export const boutiqueDiscoveryRouter = router({
  /**
   * Get paginated list of all boutiques with search and filtering
   */
  getBoutiquesList: publicProcedure
    .input(
      z.object({
        page: z.number().int().positive().default(1),
        limit: z.number().int().positive().max(50).default(12),
        search: z.string().optional(),
        sortBy: z.enum(["newest", "rating", "products", "name"]).default("newest"),
      })
    )
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database connection failed");

      const offset = (input.page - 1) * input.limit;

      // Build where clause
      let whereConditions = [eq(boutiques.status, "active")];
      if (input.search) {
        whereConditions.push(
          sql`(${boutiques.name} LIKE ${`%${input.search}%`} OR ${boutiques.description} LIKE ${`%${input.search}%`})`
        );
      }

      // Build sort clause
      let orderBy;
      switch (input.sortBy) {
        case "rating":
          orderBy = desc(sql`(SELECT AVG(rating) FROM shopOrders WHERE boutiqueId = ${boutiques.id})`);
          break;
        case "products":
          orderBy = desc(sql`(SELECT COUNT(*) FROM products WHERE boutiqueId = ${boutiques.id})`);
          break;
        case "name":
          orderBy = asc(boutiques.name);
          break;
        case "newest":
        default:
          orderBy = desc(boutiques.createdAt);
      }

      // Get total count
      const [{ total }] = await db
        .select({ total: count() })
        .from(boutiques)
        .where(and(...whereConditions));

      // Get paginated boutiques
      const boutiquesList = await db
        .select({
          id: boutiques.id,
          name: boutiques.name,
          slug: boutiques.slug,
          description: boutiques.description,
          logoUrl: boutiques.logoUrl,
          createdAt: boutiques.createdAt,
        })
        .from(boutiques)
        .where(and(...whereConditions))
        .orderBy(orderBy)
        .limit(input.limit)
        .offset(offset);

      return {
        boutiques: boutiquesList,
        pagination: {
          page: input.page,
          limit: input.limit,
          total,
          pages: Math.ceil(total / input.limit),
        },
      };
    }),

  /**
   * Get featured boutiques for homepage showcase
   */
  getFeaturedBoutiques: publicProcedure
    .input(z.object({ limit: z.number().int().positive().max(10).default(6) }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database connection failed");

      // Featured boutiques: verified, active, with products
      const featured = await db
        .select({
          id: boutiques.id,
          name: boutiques.name,
          slug: boutiques.slug,
          description: boutiques.description,
          logoUrl: boutiques.logoUrl,
          isVerified: boutiques.isVerified,
        })
        .from(boutiques)
        .where(
          and(
            eq(boutiques.status, "active"),
            eq(boutiques.isVerified, 1)
          )
        )
        .orderBy(desc(boutiques.createdAt))
        .limit(input.limit);

      return featured;
    }),

  /**
   * Get trending boutiques based on recent order volume
   */
  getTrendingBoutiques: publicProcedure
    .input(z.object({ limit: z.number().int().positive().max(10).default(6), days: z.number().default(30) }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database connection failed");

      const daysAgo = new Date(Date.now() - input.days * 24 * 60 * 60 * 1000);

      const trending = await db
        .select({
          id: boutiques.id,
          name: boutiques.name,
          slug: boutiques.slug,
          description: boutiques.description,
          logoUrl: boutiques.logoUrl,
          orderCount: count(shopOrders.id),
        })
        .from(boutiques)
        .leftJoin(shopOrders, eq(boutiques.id, shopOrders.boutiqueId))
        .where(
          and(
            eq(boutiques.status, "active"),
            sql`${shopOrders.createdAt} >= ${daysAgo.toISOString()}`
          )
        )
        .groupBy(boutiques.id)
        .orderBy(desc(count(shopOrders.id)))
        .limit(input.limit);

      return trending;
    }),

  /**
   * Get recently registered boutiques
   */
  getNewBoutiques: publicProcedure
    .input(z.object({ limit: z.number().int().positive().max(10).default(6) }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database connection failed");

      const newBoutiques = await db
        .select({
          id: boutiques.id,
          name: boutiques.name,
          slug: boutiques.slug,
          description: boutiques.description,
          logoUrl: boutiques.logoUrl,
          createdAt: boutiques.createdAt,
        })
        .from(boutiques)
        .where(eq(boutiques.status, "active"))
        .orderBy(desc(boutiques.createdAt))
        .limit(input.limit);

      return newBoutiques;
    }),

  /**
   * Get detailed boutique profile with statistics
   */
  getBoutiqueDetails: publicProcedure
    .input(z.object({ slug: z.string() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database connection failed");

      const boutique = await db
        .select({
          id: boutiques.id,
          name: boutiques.name,
          slug: boutiques.slug,
          description: boutiques.description,
          logoUrl: boutiques.logoUrl,
          websiteUrl: boutiques.websiteUrl,
          instagramHandle: boutiques.instagramHandle,
          tiktokHandle: boutiques.tiktokHandle,
          facebookUrl: boutiques.facebookUrl,
          whatsappNumber: boutiques.whatsappNumber,
          isVerified: boutiques.isVerified,
          createdAt: boutiques.createdAt,
        })
        .from(boutiques)
        .where(
          and(
            eq(boutiques.slug, input.slug),
            eq(boutiques.status, "active")
          )
        )
        .limit(1);

      if (!boutique.length) {
        throw new Error("Boutique not found");
      }

      // Get boutique statistics
      const [stats] = await db
        .select({
          totalOrders: count(shopOrders.id),
          avgRating: avg(shopOrders.rating),
        })
        .from(shopOrders)
        .where(eq(shopOrders.boutiqueId, boutique[0].id));

      return {
        ...boutique[0],
        statistics: {
          totalOrders: stats?.totalOrders || 0,
          avgRating: stats?.avgRating ? parseFloat(stats.avgRating.toString()) : 0,
        },
      };
    }),

  /**
   * Search boutiques by name or description
   */
  searchBoutiques: publicProcedure
    .input(
      z.object({
        query: z.string().min(1),
        limit: z.number().int().positive().max(50).default(20),
      })
    )
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database connection failed");

      const searchQuery = `%${input.query}%`;

      const results = await db
        .select({
          id: boutiques.id,
          name: boutiques.name,
          slug: boutiques.slug,
          description: boutiques.description,
          logoUrl: boutiques.logoUrl,
        })
        .from(boutiques)
        .where(
          and(
            eq(boutiques.status, "active"),
            sql`(${boutiques.name} LIKE ${searchQuery} OR ${boutiques.description} LIKE ${searchQuery})`
          )
        )
        .limit(input.limit);

      return results;
    }),
});
