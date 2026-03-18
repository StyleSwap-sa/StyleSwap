import { z } from "zod";
import { publicProcedure, router } from "../_core/trpc";

/**
 * Mock data storage for developer integrations
 */
const integrations = new Map<number, any>();

export const developerMarketplaceRouter = router({
  /**
   * List all integrations with filtering and search
   */
  listIntegrations: publicProcedure
    .input(
      z.object({
        search: z.string().optional(),
        category: z.string().optional(),
        sortBy: z.enum(["newest", "popular", "rating"]).optional().default("newest"),
        limit: z.number().default(20),
        offset: z.number().default(0),
      })
    )
    .query(({ input }) => {
      try {
        let results = Array.from(integrations.values());

        // Filter by search
        if (input.search) {
          const searchLower = input.search.toLowerCase();
          results = results.filter(
            (i) =>
              i.name.toLowerCase().includes(searchLower) ||
              i.description.toLowerCase().includes(searchLower) ||
              i.tags?.some((t: string) => t.toLowerCase().includes(searchLower))
          );
        }

        // Filter by category
        if (input.category) {
          results = results.filter((i) => i.category === input.category);
        }

        // Sort
        if (input.sortBy === "popular") {
          results.sort((a, b) => b.downloadCount - a.downloadCount);
        } else if (input.sortBy === "rating") {
          results.sort((a, b) => parseFloat(b.rating) - parseFloat(a.rating));
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
   * Get a specific integration
   */
  getIntegration: publicProcedure
    .input(z.object({ id: z.number() }))
    .query(({ input }) => {
      try {
        const integration = integrations.get(input.id);

        if (!integration) {
          return {
            success: false,
            error: "Integration not found",
          };
        }

        return {
          success: true,
          integration,
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
   * Get integration categories
   */
  getCategories: publicProcedure.query(() => {
    return {
      success: true,
      categories: [
        { id: "e-commerce", name: "E-Commerce", icon: "🛍️" },
        { id: "social", name: "Social Media", icon: "👥" },
        { id: "mobile-app", name: "Mobile App", icon: "📱" },
        { id: "web-app", name: "Web Application", icon: "🌐" },
        { id: "plugin", name: "Plugin/Extension", icon: "🔌" },
        { id: "saas", name: "SaaS Platform", icon: "☁️" },
        { id: "other", name: "Other", icon: "📦" },
      ],
    };
  }),

  /**
   * Submit a new integration
   */
  submitIntegration: publicProcedure
    .input(
      z.object({
        developerId: z.number(),
        name: z.string(),
        description: z.string(),
        category: z.string(),
        logoUrl: z.string().optional(),
        websiteUrl: z.string().url().optional(),
        githubUrl: z.string().url().optional(),
        documentationUrl: z.string().url().optional(),
        features: z.array(z.string()).optional(),
        tags: z.array(z.string()).optional(),
      })
    )
    .mutation(({ input }) => {
      try {
        const id = Math.max(...integrations.keys(), 0) + 1;

        const integration = {
          id,
          ...input,
          rating: "0.00",
          reviewCount: 0,
          downloadCount: 0,
          isVerified: false,
          isFeatured: false,
          status: "pending-review",
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        integrations.set(id, integration);

        return {
          success: true,
          integration,
          message: "Integration submitted for review. You'll be notified once it's approved.",
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
   * Update integration
   */
  updateIntegration: publicProcedure
    .input(
      z.object({
        id: z.number(),
        developerId: z.number(),
        name: z.string().optional(),
        description: z.string().optional(),
        category: z.string().optional(),
        logoUrl: z.string().optional(),
        websiteUrl: z.string().url().optional(),
        githubUrl: z.string().url().optional(),
        documentationUrl: z.string().url().optional(),
        features: z.array(z.string()).optional(),
        tags: z.array(z.string()).optional(),
      })
    )
    .mutation(({ input }) => {
      try {
        const integration = integrations.get(input.id);

        if (!integration) {
          return {
            success: false,
            error: "Integration not found",
          };
        }

        if (integration.developerId !== input.developerId) {
          return {
            success: false,
            error: "Unauthorized",
          };
        }

        const updated = {
          ...integration,
          name: input.name || integration.name,
          description: input.description || integration.description,
          category: input.category || integration.category,
          logoUrl: input.logoUrl || integration.logoUrl,
          websiteUrl: input.websiteUrl || integration.websiteUrl,
          githubUrl: input.githubUrl || integration.githubUrl,
          documentationUrl: input.documentationUrl || integration.documentationUrl,
          features: input.features || integration.features,
          tags: input.tags || integration.tags,
          updatedAt: new Date(),
        };

        integrations.set(input.id, updated);

        return {
          success: true,
          integration: updated,
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
   * Get featured integrations
   */
  getFeaturedIntegrations: publicProcedure.query(() => {
    try {
      const featured = Array.from(integrations.values())
        .filter((i) => i.isFeatured && i.status === "active")
        .slice(0, 6);

      return {
        success: true,
        integrations: featured,
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
   * Get trending integrations
   */
  getTrendingIntegrations: publicProcedure.query(() => {
    try {
      const trending = Array.from(integrations.values())
        .filter((i) => i.status === "active")
        .sort((a, b) => b.downloadCount - a.downloadCount)
        .slice(0, 6);

      return {
        success: true,
        integrations: trending,
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
   * Get top-rated integrations
   */
  getTopRatedIntegrations: publicProcedure.query(() => {
    try {
      const topRated = Array.from(integrations.values())
        .filter((i) => i.status === "active" && i.reviewCount > 0)
        .sort((a, b) => parseFloat(b.rating) - parseFloat(a.rating))
        .slice(0, 6);

      return {
        success: true,
        integrations: topRated,
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
   * Get developer's integrations
   */
  getDeveloperIntegrations: publicProcedure
    .input(z.object({ developerId: z.number() }))
    .query(({ input }) => {
      try {
        const developerIntegrations = Array.from(integrations.values()).filter(
          (i) => i.developerId === input.developerId
        );

        return {
          success: true,
          integrations: developerIntegrations,
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
   * Record integration view/download
   */
  recordEvent: publicProcedure
    .input(
      z.object({
        integrationId: z.number(),
        eventType: z.enum(["view", "download", "click"]),
      })
    )
    .mutation(({ input }) => {
      try {
        const integration = integrations.get(input.integrationId);

        if (!integration) {
          return {
            success: false,
            error: "Integration not found",
          };
        }

        if (input.eventType === "download") {
          integration.downloadCount += 1;
        }

        integrations.set(input.integrationId, integration);

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
});
