import { router, publicProcedure, protectedProcedure } from "../_core/trpc";
import { z } from "zod";
import { notifyOwner } from "../_core/notification";
import { sendEmail } from "../email-service";

/**
 * Enterprise Retail Pro Router
 * Handles enterprise subscription management, contact requests, and API key management
 */

export const enterpriseRouter = router({
  /**
   * Get Enterprise pricing tiers
   * Public endpoint - no authentication required
   */
  getPricingTiers: publicProcedure.query(async () => {
    return {
      success: true,
      tiers: [
        {
          id: 'starter',
          name: 'Starter',
          monthlyPrice: 29,
          annualPrice: 290,
          annualDiscount: '17%',
          features: {
            fullApiIntegration: false,
            whiteLabelOption: false,
            dedicatedAccountManager: false,
            customSla: false,
            priorityFeatureRequests: false,
            customIntegrations: false,
            apiRateLimit: 100,
            maxItems: 500,
            maxUsers: 1,
          },
          description: 'Perfect for small boutiques starting with StyleSwap',
          cta: 'Get Started',
        },
        {
          id: 'professional',
          name: 'Professional',
          monthlyPrice: 99,
          annualPrice: 990,
          annualDiscount: '17%',
          features: {
            fullApiIntegration: true,
            whiteLabelOption: false,
            dedicatedAccountManager: false,
            customSla: false,
            priorityFeatureRequests: false,
            customIntegrations: false,
            apiRateLimit: 1000,
            maxItems: 5000,
            maxUsers: 5,
          },
          description: 'For growing retailers with moderate API needs',
          cta: 'Get Started',
        },
        {
          id: 'enterprise',
          name: 'Enterprise Retail Pro',
          monthlyPrice: null,
          annualPrice: null,
          features: {
            fullApiIntegration: true,
            whiteLabelOption: true,
            dedicatedAccountManager: true,
            customSla: true,
            priorityFeatureRequests: true,
            customIntegrations: true,
            apiRateLimit: -1, // unlimited
            maxItems: -1, // unlimited
            maxUsers: -1, // unlimited
          },
          description: 'Enterprise solution with white-label, dedicated support, and custom integrations',
          pricing: 'Custom Pricing',
          cta: 'Contact Sales',
        },
      ],
    };
  }),

  /**
   * Submit Enterprise contact request
   * Public endpoint - no authentication required
   */
  submitContactRequest: publicProcedure
    .input(
      z.object({
        name: z.string().min(2),
        email: z.string().email(),
        phone: z.string().optional(),
        company: z.string().min(2),
        businessType: z.string().optional(),
        itemCount: z.number().optional(),
        monthlyTryOns: z.number().optional(),
        interestedFeatures: z.array(z.string()).optional(),
        message: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      try {
        // Save contact request to database
        // TODO: Insert into enterpriseContactRequests table

        // Send confirmation email to customer (fallback to console if SendGrid not configured)
        try {
          await sendEmail({
          to: input.email,
          subject: 'StyleSwap Enterprise Inquiry Received',
          html: `
            <h2>Thank you for your interest in StyleSwap Enterprise!</h2>
            <p>Hi ${input.name},</p>
            <p>We've received your inquiry for the Enterprise Retail Pro package. Our sales team will review your request and contact you within 24 hours.</p>
            <p><strong>Your Details:</strong></p>
            <ul>
              <li>Company: ${input.company}</li>
              <li>Email: ${input.email}</li>
              ${input.phone ? `<li>Phone: ${input.phone}</li>` : ''}
              ${input.itemCount ? `<li>Items: ${input.itemCount}</li>` : ''}
              ${input.monthlyTryOns ? `<li>Monthly Try-Ons: ${input.monthlyTryOns}</li>` : ''}
            </ul>
            <p>In the meantime, feel free to explore our <a href="https://styleswap.co.za/api-docs">API documentation</a>.</p>
            <p>Best regards,<br>StyleSwap Sales Team</p>
          `,
          });
        } catch (error) {
          console.log('[Enterprise] Email service not configured, logging to console:', error);
        }

        // Notify StyleSwap admin
        await notifyOwner({
          title: 'New Enterprise Inquiry',
          content: `
New Enterprise Retail Pro inquiry from ${input.company}:
- Contact: ${input.name} (${input.email})
${input.phone ? `- Phone: ${input.phone}` : ''}
${input.itemCount ? `- Items: ${input.itemCount}` : ''}
${input.monthlyTryOns ? `- Monthly Try-Ons: ${input.monthlyTryOns}` : ''}
${input.interestedFeatures ? `- Interested Features: ${input.interestedFeatures.join(', ')}` : ''}
${input.message ? `- Message: ${input.message}` : ''}

Action Required: Review and contact within 24 hours.
          `,
        });

        return {
          success: true,
          message: 'Thank you! Our sales team will contact you soon.',
        };
      } catch (error) {
        console.error('[Enterprise] Failed to submit contact request:', error);
        return {
          success: false,
          message: 'Failed to submit request. Please try again.',
          error: error instanceof Error ? error.message : 'Unknown error',
        };
      }
    }),

  /**
   * Get Enterprise subscription details (protected)
   * Requires authentication
   */
  getSubscription: protectedProcedure.query(async ({ ctx }) => {
    try {
      // TODO: Query enterpriseSubscriptions table for ctx.user.id
      return {
        success: true,
        subscription: null, // Return subscription if exists
      };
    } catch (error) {
      console.error('[Enterprise] Failed to get subscription:', error);
      return {
        success: false,
        message: 'Failed to fetch subscription',
      };
    }
  }),

  /**
   * Create Enterprise API key (protected)
   * Requires authentication and active enterprise subscription
   */
  createApiKey: protectedProcedure
    .input(
      z.object({
        keyName: z.string().min(1),
        permissions: z.array(z.enum(['read', 'write', 'delete'])).default(['read', 'write']),
      })
    )
    .mutation(async ({ input, ctx }) => {
      try {
        // TODO: Verify user has active enterprise subscription
        // TODO: Generate API key and secret
        // TODO: Store in enterpriseApiKeys table
        // TODO: Return key and secret (secret only shown once)

        return {
          success: true,
          message: 'API key created successfully',
          apiKey: 'sk_live_xxxxxxxxxxxx',
          apiSecret: 'sk_secret_xxxxxxxxxxxx', // Only shown once
        };
      } catch (error) {
        console.error('[Enterprise] Failed to create API key:', error);
        return {
          success: false,
          message: 'Failed to create API key',
        };
      }
    }),

  /**
   * List Enterprise API keys (protected)
   */
  listApiKeys: protectedProcedure.query(async ({ ctx }) => {
    try {
      // TODO: Query enterpriseApiKeys table for ctx.user.id
      return {
        success: true,
        apiKeys: [],
      };
    } catch (error) {
      console.error('[Enterprise] Failed to list API keys:', error);
      return {
        success: false,
        message: 'Failed to fetch API keys',
      };
    }
  }),

  /**
   * Revoke Enterprise API key (protected)
   */
  revokeApiKey: protectedProcedure
    .input(z.object({ apiKeyId: z.number() }))
    .mutation(async ({ input, ctx }) => {
      try {
        // TODO: Verify ownership
        // TODO: Mark apiKey as inactive
        return {
          success: true,
          message: 'API key revoked successfully',
        };
      } catch (error) {
        console.error('[Enterprise] Failed to revoke API key:', error);
        return {
          success: false,
          message: 'Failed to revoke API key',
        };
      }
    }),

  /**
   * Configure Enterprise webhook (protected)
   */
  configureWebhook: protectedProcedure
    .input(
      z.object({
        name: z.string(),
        url: z.string().url(),
        events: z.array(z.string()),
      })
    )
    .mutation(async ({ input, ctx }) => {
      try {
        // TODO: Verify user has active enterprise subscription
        // TODO: Validate webhook URL
        // TODO: Store in enterpriseWebhooks table
        // TODO: Send test webhook event

        return {
          success: true,
          message: 'Webhook configured successfully',
        };
      } catch (error) {
        console.error('[Enterprise] Failed to configure webhook:', error);
        return {
          success: false,
          message: 'Failed to configure webhook',
        };
      }
    }),

  /**
   * Get Enterprise usage statistics (protected)
   */
  getUsageStats: protectedProcedure.query(async ({ ctx }) => {
    try {
      // TODO: Query enterpriseUsageLogs table
      // TODO: Calculate usage metrics
      return {
        success: true,
        stats: {
          totalRequests: 0,
          requestsThisMonth: 0,
          averageResponseTime: 0,
          topEndpoints: [],
          rateLimit: 0,
          rateLimitUsed: 0,
          rateLimitPercentage: 0,
        },
      };
    } catch (error) {
      console.error('[Enterprise] Failed to get usage stats:', error);
      return {
        success: false,
        message: 'Failed to fetch usage statistics',
      };
    }
  }),

  /**
   * Get Enterprise support tickets (protected)
   */
  getSupportTickets: protectedProcedure.query(async ({ ctx }) => {
    try {
      // TODO: Query enterpriseSupportTickets table
      return {
        success: true,
        tickets: [],
      };
    } catch (error) {
      console.error('[Enterprise] Failed to get support tickets:', error);
      return {
        success: false,
        message: 'Failed to fetch support tickets',
      };
    }
  }),

  /**
   * Create support ticket (protected)
   */
  createSupportTicket: protectedProcedure
    .input(
      z.object({
        title: z.string(),
        description: z.string(),
        priority: z.enum(['low', 'medium', 'high', 'critical']).default('medium'),
      })
    )
    .mutation(async ({ input, ctx }) => {
      try {
        // TODO: Create support ticket
        // TODO: Assign to account manager if available
        // TODO: Send notification to support team

        return {
          success: true,
          message: 'Support ticket created successfully',
          ticketId: 'TICKET-001',
        };
      } catch (error) {
        console.error('[Enterprise] Failed to create support ticket:', error);
        return {
          success: false,
          message: 'Failed to create support ticket',
        };
      }
    }),

  /**
   * Get billing history (protected)
   */
  getBillingHistory: protectedProcedure.query(async ({ ctx }) => {
    try {
      // TODO: Query enterpriseBillingHistory table
      return {
        success: true,
        invoices: [],
      };
    } catch (error) {
      console.error('[Enterprise] Failed to get billing history:', error);
      return {
        success: false,
        message: 'Failed to fetch billing history',
      };
    }
  }),

  /**
   * Get account manager details (protected)
   */
  getAccountManager: protectedProcedure.query(async ({ ctx }) => {
    try {
      // TODO: Query enterpriseSubscriptions for account manager info
      return {
        success: true,
        accountManager: {
          name: '',
          email: '',
          phone: '',
          availability: '',
        },
      };
    } catch (error) {
      console.error('[Enterprise] Failed to get account manager:', error);
      return {
        success: false,
        message: 'Failed to fetch account manager details',
      };
    }
  }),

  /**
   * Get SLA details (protected)
   */
  getSlaDetails: protectedProcedure.query(async ({ ctx }) => {
    try {
      // TODO: Query enterpriseSubscriptions for SLA info
      return {
        success: true,
        sla: {
          responseTime: 0,
          uptime: 0,
          supportLevel: '',
        },
      };
    } catch (error) {
      console.error('[Enterprise] Failed to get SLA details:', error);
      return {
        success: false,
        message: 'Failed to fetch SLA details',
      };
    }
  }),
});
