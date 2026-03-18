import { z } from "zod";
import { publicProcedure, router } from "../_core/trpc";
import { API_ENDPOINTS, API_GUIDES, CODE_EXAMPLES } from "../api-docs-content";

export const apiDocsRouter = router({
  /**
   * Get all API endpoints documentation
   */
  getEndpoints: publicProcedure.query(() => {
    return {
      success: true,
      endpoints: API_ENDPOINTS,
    };
  }),

  /**
   * Get a specific endpoint documentation
   */
  getEndpoint: publicProcedure
    .input(z.object({ path: z.string() }))
    .query(({ input }) => {
      const endpoint = API_ENDPOINTS.find((e) => e.path === input.path);

      if (!endpoint) {
        return {
          success: false,
          error: "Endpoint not found",
        };
      }

      return {
        success: true,
        endpoint,
      };
    }),

  /**
   * Get guide by topic
   */
  getGuide: publicProcedure
    .input(z.object({ topic: z.string() }))
    .query(({ input }) => {
      const guide = (API_GUIDES as Record<string, any>)[input.topic];

      if (!guide) {
        return {
          success: false,
          error: "Guide not found",
          availableTopics: Object.keys(API_GUIDES),
        };
      }

      return {
        success: true,
        guide,
      };
    }),

  /**
   * Get all guides
   */
  getAllGuides: publicProcedure.query(() => {
    return {
      success: true,
      guides: Object.entries(API_GUIDES).map(([key, value]) => ({
        id: key,
        title: (value as any).title,
      })),
    };
  }),

  /**
   * Get code examples
   */
  getCodeExamples: publicProcedure
    .input(z.object({ language: z.string().optional() }))
    .query(({ input }) => {
      if (input.language) {
        const example = (CODE_EXAMPLES as Record<string, any>)[input.language];

        if (!example) {
          return {
            success: false,
            error: "Code example not found",
            availableLanguages: Object.keys(CODE_EXAMPLES),
          };
        }

        return {
          success: true,
          example,
        };
      }

      return {
        success: true,
        examples: Object.entries(CODE_EXAMPLES).map(([key, value]) => ({
          language: key,
          title: (value as any).title,
        })),
      };
    }),

  /**
   * Get API reference summary
   */
  getReferenceSummary: publicProcedure.query(() => {
    return {
      success: true,
      summary: {
        totalEndpoints: API_ENDPOINTS.length,
        baseUrl: "https://api.styleswap.co.za",
        authentication: "Bearer Token (API Key)",
        contentType: "application/json",
        rateLimit: {
          starter: {
            perMinute: 60,
            perHour: 3000,
            perDay: 50000,
          },
          professional: {
            perMinute: 120,
            perHour: 6000,
            perDay: 100000,
          },
        },
        endpoints: API_ENDPOINTS.map((e) => ({
          method: e.method,
          path: e.path,
          title: e.title,
        })),
      },
    };
  }),

  /**
   * Get quick start guide
   */
  getQuickStart: publicProcedure.query(() => {
    return {
      success: true,
      quickStart: {
        steps: [
          {
            step: 1,
            title: "Get Your API Key",
            description: "Sign up and generate your API key from the Developer Dashboard",
            action: "Navigate to Credentials tab",
          },
          {
            step: 2,
            title: "Choose Your Language",
            description: "Select your preferred programming language for code examples",
            languages: ["Python", "JavaScript", "cURL"],
          },
          {
            step: 3,
            title: "Make Your First Request",
            description: "Use the code example to create your first try-on",
            endpoint: "POST /api/trpc/tryOn.create",
          },
          {
            step: 4,
            title: "Handle Responses",
            description: "Learn how to handle errors and rate limits",
            guide: "error_handling",
          },
          {
            step: 5,
            title: "Set Up Webhooks",
            description: "Configure webhooks to receive real-time events",
            guide: "webhooks",
          },
        ],
        resources: [
          {
            title: "API Reference",
            url: "/api-docs/reference",
          },
          {
            title: "Code Examples",
            url: "/api-docs/examples",
          },
          {
            title: "Webhook Documentation",
            url: "/api-docs/webhooks",
          },
          {
            title: "Support",
            url: "mailto:support@styleswap.co.za",
          },
        ],
      },
    };
  }),

  /**
   * Get pricing information
   */
  getPricing: publicProcedure.query(() => {
    return {
      success: true,
      pricing: {
        plans: [
          {
            name: "Starter",
            price: 29,
            currency: "ZAR",
            billingPeriod: "month",
            features: {
              creditsPerMonth: 1000,
              requestsPerMinute: 60,
              requestsPerHour: 3000,
              requestsPerDay: 50000,
              webhooks: true,
              support: "email",
            },
          },
          {
            name: "Professional",
            price: 99,
            currency: "ZAR",
            billingPeriod: "month",
            features: {
              creditsPerMonth: 5000,
              requestsPerMinute: 120,
              requestsPerHour: 6000,
              requestsPerDay: 100000,
              webhooks: true,
              support: "priority",
            },
          },
          {
            name: "Enterprise",
            price: "Custom",
            currency: "ZAR",
            billingPeriod: "custom",
            features: {
              creditsPerMonth: "Custom",
              requestsPerMinute: "Custom",
              requestsPerHour: "Custom",
              requestsPerDay: "Custom",
              webhooks: true,
              support: "dedicated",
            },
            contactSales: true,
          },
        ],
        creditCosts: {
          tryOnGeneration: 10,
          batchTryOn: 90,
          highResolutionOutput: 5,
        },
      },
    };
  }),

  /**
   * Get FAQ
   */
  getFAQ: publicProcedure.query(() => {
    return {
      success: true,
      faq: [
        {
          question: "How do I get started with the StyleSwap API?",
          answer:
            "Sign up for a developer account, generate your API key from the Dashboard, and follow our Quick Start guide. We provide code examples in Python, JavaScript, and cURL.",
        },
        {
          question: "What are the rate limits?",
          answer:
            "Rate limits depend on your plan. Starter: 60 req/min, Professional: 120 req/min. Check your plan details in the Dashboard.",
        },
        {
          question: "How much do API calls cost?",
          answer:
            "Each try-on generation costs 10 credits. Batch operations and high-resolution output have different pricing. See the Pricing guide for details.",
        },
        {
          question: "Can I test the API before purchasing credits?",
          answer:
            "Yes! Sign up for a free account and you'll receive test credits. Use test mode API keys (sk_test_...) to experiment.",
        },
        {
          question: "How do webhooks work?",
          answer:
            "Webhooks allow you to receive real-time notifications about events like completed try-ons. Configure them in your Dashboard and we'll send POST requests to your endpoint.",
        },
        {
          question: "What if I exceed my rate limit?",
          answer:
            "You'll receive a 429 (Too Many Requests) response. Check the Retry-After header and implement exponential backoff.",
        },
        {
          question: "How do I secure my API key?",
          answer:
            "Store your API key in environment variables, never in code. Use separate keys for development and production. Regenerate your secret if compromised.",
        },
        {
          question: "Is there a webhook signature verification?",
          answer:
            "Yes! Every webhook includes an X-Webhook-Signature header with an HMAC-SHA256 signature. Always verify this signature to ensure authenticity.",
        },
      ],
    };
  }),
});
