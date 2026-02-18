import { router, publicProcedure, protectedProcedure } from '../_core/trpc';
import { z } from 'zod';
import { getDb } from '../db';
import { widgets, widgetAnalytics } from '../../drizzle/schema';
import { eq, and, gte } from 'drizzle-orm';
import { TRPCError } from '@trpc/server';

export const widgetRouter = router({
  /**
   * Generate widget code snippet for a boutique
   * Returns the HTML/JavaScript code that boutiques paste on their websites
   */
  getCode: protectedProcedure
    .input(z.object({
      boutiqueId: z.string().uuid(),
    }))
    .query(async ({ input, ctx }) => {
      // Verify boutique ownership
      const boutique = await db.query.boutiques.findFirst({
        where: (b) => eq(b.id, input.boutiqueId),
      });

      if (!boutique) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Boutique not found',
        });
      }

      if (boutique.ownerId !== ctx.user.id) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'You do not have permission to access this boutique',
        });
      }

      // Get or create widget for this boutique
      let widget = await db.query.widgets.findFirst({
        where: (w) => eq(w.boutiqueId, input.boutiqueId),
      });

      if (!widget) {
        // Create new widget
        const widgetId = `widget_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        await db.insert(widgets).values({
          id: widgetId,
          boutiqueId: input.boutiqueId,
          name: `${boutique.name} Widget`,
          isActive: true,
          primaryColor: '#FF6B35',
          accentColor: '#004E89',
          createdAt: new Date(),
          updatedAt: new Date(),
        });
        widget = { id: widgetId } as any;
      }

      // Generate widget code
      const widgetCode = `
<!-- StyleSwap Virtual Try-On Widget -->
<div id="styleswap-widget"></div>
<script>
  window.StyleSwapWidget = {
    widgetId: '${widget.id}',
    containerId: 'styleswap-widget',
    primaryColor: '${widget.primaryColor || '#FF6B35'}',
    accentColor: '${widget.accentColor || '#004E89'}'
  };
</script>
<script src="https://styleswap.co.za/styleswap-widget.js"></script>
`;

      return {
        widgetId: widget.id,
        code: widgetCode,
        installationUrl: `https://styleswap.co.za/widget-install/${widget.id}`,
      };
    }),

  /**
   * Get widget settings
   */
  getSettings: protectedProcedure
    .input(z.object({
      widgetId: z.string(),
    }))
    .query(async ({ input, ctx }) => {
      const widget = await db.query.widgets.findFirst({
        where: (w) => eq(w.id, input.widgetId),
      });

      if (!widget) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Widget not found',
        });
      }

      // Verify ownership
      const boutique = await db.query.boutiques.findFirst({
        where: (b) => eq(b.id, widget.boutiqueId),
      });

      if (boutique?.ownerId !== ctx.user.id) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'You do not have permission to access this widget',
        });
      }

      return {
        id: widget.id,
        name: widget.name,
        isActive: widget.isActive,
        primaryColor: widget.primaryColor,
        accentColor: widget.accentColor,
      };
    }),

  /**
   * Update widget settings
   */
  updateSettings: protectedProcedure
    .input(z.object({
      widgetId: z.string(),
      name: z.string().optional(),
      isActive: z.boolean().optional(),
      primaryColor: z.string().regex(/^#[0-9A-F]{6}$/i).optional(),
      accentColor: z.string().regex(/^#[0-9A-F]{6}$/i).optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const widget = await db.query.widgets.findFirst({
        where: (w) => eq(w.id, input.widgetId),
      });

      if (!widget) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Widget not found',
        });
      }

      // Verify ownership
      const boutique = await db.query.boutiques.findFirst({
        where: (b) => eq(b.id, widget.boutiqueId),
      });

      if (boutique?.ownerId !== ctx.user.id) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'You do not have permission to update this widget',
        });
      }

      // Update widget
      await db.update(widgets)
        .set({
          name: input.name ?? widget.name,
          isActive: input.isActive ?? widget.isActive,
          primaryColor: input.primaryColor ?? widget.primaryColor,
          accentColor: input.accentColor ?? widget.accentColor,
          updatedAt: new Date(),
        })
        .where(eq(widgets.id, input.widgetId));

      return { success: true };
    }),

  /**
   * Get widget analytics
   */
  getAnalytics: protectedProcedure
    .input(z.object({
      widgetId: z.string(),
      startDate: z.date().optional(),
      endDate: z.date().optional(),
    }))
    .query(async ({ input, ctx }) => {
      const widget = await db.query.widgets.findFirst({
        where: (w) => eq(w.id, input.widgetId),
      });

      if (!widget) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Widget not found',
        });
      }

      // Verify ownership
      const boutique = await db.query.boutiques.findFirst({
        where: (b) => eq(b.id, widget.boutiqueId),
      });

      if (boutique?.ownerId !== ctx.user.id) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'You do not have permission to access this widget',
        });
      }

      // Get analytics data
      const startDate = input.startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000); // Last 30 days
      const endDate = input.endDate || new Date();

      const analytics = await db.query.widgetAnalytics.findMany({
        where: and(
          eq(widgetAnalytics.widgetId, input.widgetId),
          gte(widgetAnalytics.timestamp, startDate),
          gte(widgetAnalytics.timestamp, endDate)
        ),
      });

      // Calculate metrics
      const impressions = analytics.filter(a => a.eventType === 'impression').length;
      const clicks = analytics.filter(a => a.eventType === 'click').length;
      const tryOns = analytics.filter(a => a.eventType === 'tryon_started').length;
      const completedTryOns = analytics.filter(a => a.eventType === 'tryon_completed').length;
      const downloads = analytics.filter(a => a.eventType === 'download').length;
      const shares = analytics.filter(a => a.eventType === 'share').length;

      const conversionRate = impressions > 0 ? (clicks / impressions) * 100 : 0;
      const completionRate = tryOns > 0 ? (completedTryOns / tryOns) * 100 : 0;

      return {
        impressions,
        clicks,
        tryOns,
        completedTryOns,
        downloads,
        shares,
        conversionRate: parseFloat(conversionRate.toFixed(2)),
        completionRate: parseFloat(completionRate.toFixed(2)),
      };
    }),

  /**
   * Track widget events (called from the widget script)
   */
  trackEvent: publicProcedure
    .input(z.object({
      widgetId: z.string(),
      eventType: z.enum([
        'impression',
        'click',
        'tryon_started',
        'tryon_completed',
        'download',
        'share',
        'error',
      ]),
      data: z.record(z.any()).optional(),
    }))
    .mutation(async ({ input }) => {
      // Verify widget exists
      const widget = await db.query.widgets.findFirst({
        where: (w) => eq(w.id, input.widgetId),
      });

      if (!widget) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Widget not found',
        });
      }

      // Track event
      await db.insert(widgetAnalytics).values({
        id: `analytics_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        widgetId: input.widgetId,
        eventType: input.eventType,
        data: input.data || {},
        timestamp: new Date(),
      });

      return { success: true };
    }),

  /**
   * Get all widgets for a boutique
   */
  listByBoutique: protectedProcedure
    .input(z.object({
      boutiqueId: z.string().uuid(),
    }))
    .query(async ({ input, ctx }) => {
      // Verify boutique ownership
      const boutique = await db.query.boutiques.findFirst({
        where: (b) => eq(b.id, input.boutiqueId),
      });

      if (!boutique || boutique.ownerId !== ctx.user.id) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'You do not have permission to access this boutique',
        });
      }

      const boutiquWidgets = await db.query.widgets.findMany({
        where: (w) => eq(w.boutiqueId, input.boutiqueId),
      });

      return boutiquWidgets;
    }),

  /**
   * Delete a widget
   */
  delete: protectedProcedure
    .input(z.object({
      widgetId: z.string(),
    }))
    .mutation(async ({ input, ctx }) => {
      const widget = await db.query.widgets.findFirst({
        where: (w) => eq(w.id, input.widgetId),
      });

      if (!widget) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Widget not found',
        });
      }

      // Verify ownership
      const boutique = await db.query.boutiques.findFirst({
        where: (b) => eq(b.id, widget.boutiqueId),
      });

      if (boutique?.ownerId !== ctx.user.id) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'You do not have permission to delete this widget',
        });
      }

      // Delete widget and its analytics
      await db.delete(widgets).where(eq(widgets.id, input.widgetId));
      await db.delete(widgetAnalytics).where(eq(widgetAnalytics.widgetId, input.widgetId));

      return { success: true };
    }),
});
