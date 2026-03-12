import { z } from "zod";
import { publicProcedure, router } from "../_core/trpc";

/**
 * Mock data storage for boutiques
 */
const boutiques = new Map<number, any>();

export const boutiqueMarketplaceRouter = router({
  /**
   * List all boutiques with filtering and search
   */
  listBoutiques: publicProcedure
    .input(
      z.object({
        search: z.string().optional(),
        category: z.string().optional(),
        country: z.string().optional(),
        city: z.string().optional(),
        sortBy: z.enum(["newest", "popular", "rating", "trending"]).optional().default("popular"),
        limit: z.number().default(20),
        offset: z.number().default(0),
      })
    )
    .query(({ input }) => {
      try {
        let results = Array.from(boutiques.values()).filter((b) => b.status === "active");

        // Filter by search
        if (input.search) {
          const searchLower = input.search.toLowerCase();
          results = results.filter(
            (b) =>
              b.name.toLowerCase().includes(searchLower) ||
              b.description?.toLowerCase().includes(searchLower) ||
              b.tags?.some((t: string) => t.toLowerCase().includes(searchLower))
          );
        }

        // Filter by category
        if (input.category) {
          results = results.filter((b) => b.category === input.category);
        }

        // Filter by location
        if (input.country) {
          results = results.filter((b) => b.country === input.country);
        }
        if (input.city) {
          results = results.filter((b) => b.city === input.city);
        }

        // Sort
        if (input.sortBy === "popular") {
          results.sort((a, b) => b.followerCount - a.followerCount);
        } else if (input.sortBy === "rating") {
          results.sort((a, b) => parseFloat(b.rating) - parseFloat(a.rating));
        } else if (input.sortBy === "trending") {
          results.sort((a, b) => b.itemCount - a.itemCount);
        } else {
          results.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        }

        // Paginate
        const total = results.length;
        const items = results.slice(input.offset, input.offset + input.limit);

        return {
          success: true,
          items,
          total,
          hasMore: input.offset + input.limit < total,
        };
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        return {
          success: false,
          error: errorMessage,
        };
      }
    }),

  /**
   * Get a specific boutique
   */
  getBoutique: publicProcedure
    .input(z.object({ id: z.number() }))
    .query(({ input }) => {
      try {
        const boutique = boutiques.get(input.id);

        if (!boutique) {
          return {
            success: false,
            error: "Boutique not found",
          };
        }

        return {
          success: true,
          boutique,
        };
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        return {
          success: false,
          error: errorMessage,
        };
      }
    }),

  /**
   * Get boutique categories
   */
  getCategories: publicProcedure.query(() => {
    return {
      success: true,
      categories: [
        { id: "luxury", name: "Luxury", icon: "👑" },
        { id: "casual", name: "Casual Wear", icon: "👕" },
        { id: "streetwear", name: "Streetwear", icon: "🎽" },
        { id: "formal", name: "Formal Wear", icon: "🎩" },
        { id: "activewear", name: "Activewear", icon: "🏃" },
        { id: "vintage", name: "Vintage", icon: "🕰️" },
        { id: "accessories", name: "Accessories", icon: "👜" },
        { id: "designer", name: "Designer", icon: "✨" },
      ],
    };
  }),

  /**
   * Get countries with boutiques
   */
  getCountries: publicProcedure.query(() => {
    try {
      const countries = new Set<string>();
      boutiques.forEach((b) => {
        if (b.country) countries.add(b.country);
      });

      return {
        success: true,
        countries: Array.from(countries).sort(),
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      return {
        success: false,
        error: errorMessage,
      };
    }
  }),

  /**
   * Get cities for a country
   */
  getCities: publicProcedure
    .input(z.object({ country: z.string() }))
    .query(({ input }) => {
      try {
        const cities = new Set<string>();
        boutiques.forEach((b) => {
          if (b.country === input.country && b.city) cities.add(b.city);
        });

        return {
          success: true,
          cities: Array.from(cities).sort(),
        };
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        return {
          success: false,
          error: errorMessage,
        };
      }
    }),

  /**
   * Get featured boutiques
   */
  getFeaturedBoutiques: publicProcedure.query(() => {
    try {
      const featured = Array.from(boutiques.values())
        .filter((b) => b.isFeatured && b.status === "active")
        .slice(0, 6);

      return {
        success: true,
        boutiques: featured,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      return {
        success: false,
        error: errorMessage,
      };
    }
  }),

  /**
   * Get trending boutiques
   */
  getTrendingBoutiques: publicProcedure.query(() => {
    try {
      const trending = Array.from(boutiques.values())
        .filter((b) => b.status === "active")
        .sort((a, b) => b.itemCount - a.itemCount)
        .slice(0, 6);

      return {
        success: true,
        boutiques: trending,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      return {
        success: false,
        error: errorMessage,
      };
    }
  }),

  /**
   * Get top-rated boutiques
   */
  getTopRatedBoutiques: publicProcedure.query(() => {
    try {
      const topRated = Array.from(boutiques.values())
        .filter((b) => b.status === "active" && b.reviewCount > 0)
        .sort((a, b) => parseFloat(b.rating) - parseFloat(a.rating))
        .slice(0, 6);

      return {
        success: true,
        boutiques: topRated,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      return {
        success: false,
        error: errorMessage,
      };
    }
  }),

  /**
   * Get boutique featured items
   */
  getBoutiqueFeaturedItems: publicProcedure
    .input(z.object({ boutiqueId: z.number() }))
    .query(({ input }) => {
      try {
        // TODO: Fetch from database when integrated
        return {
          success: true,
          items: [],
        };
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        return {
          success: false,
          error: errorMessage,
        };
      }
    }),

  /**
   * Record boutique view/click
   */
  recordEvent: publicProcedure
    .input(
      z.object({
        boutiqueId: z.number(),
        eventType: z.enum(["view", "click", "follow"]),
      })
    )
    .mutation(({ input }) => {
      try {
        const boutique = boutiques.get(input.boutiqueId);

        if (!boutique) {
          return {
            success: false,
            error: "Boutique not found",
          };
        }

        if (input.eventType === "follow") {
          boutique.followerCount += 1;
        }

        boutiques.set(input.boutiqueId, boutique);

        return {
          success: true,
        };
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        return {
          success: false,
          error: errorMessage,
        };
      }
    }),

  /**
   * Search boutiques nearby (by location)
   */
  searchNearby: publicProcedure
    .input(
      z.object({
        country: z.string(),
        city: z.string().optional(),
        category: z.string().optional(),
      })
    )
    .query(({ input }) => {
      try {
        let results = Array.from(boutiques.values())
          .filter((b) => b.status === "active" && b.country === input.country)
          .sort((a, b) => b.followerCount - a.followerCount);

        if (input.city) {
          results = results.filter((b) => b.city === input.city);
        }

        if (input.category) {
          results = results.filter((b) => b.category === input.category);
        }

        return {
          success: true,
          boutiques: results.slice(0, 20),
        };
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        return {
          success: false,
          error: errorMessage,
        };
      }
    }),

  /**
   * Get boutique statistics
   */
  getBoutiqueStats: publicProcedure.query(() => {
    try {
      const activeBoutiques = Array.from(boutiques.values()).filter((b) => b.status === "active");
      const totalItems = activeBoutiques.reduce((sum, b) => sum + b.itemCount, 0);
      const totalFollowers = activeBoutiques.reduce((sum, b) => sum + b.followerCount, 0);
      const avgRating =
        activeBoutiques.length > 0
          ? (
              activeBoutiques.reduce((sum, b) => sum + parseFloat(b.rating), 0) /
              activeBoutiques.length
            ).toFixed(2)
          : "0.00";

      return {
        success: true,
        stats: {
          totalBoutiques: activeBoutiques.length,
          totalItems,
          totalFollowers,
          avgRating,
        },
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      return {
        success: false,
        error: errorMessage,
      };
    }
  }),
});
