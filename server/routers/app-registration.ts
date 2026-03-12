import { z } from "zod";
import { publicProcedure, router } from "../_core/trpc";
import { registerApp } from "../app-registration";

export const appRegistrationRouter = router({
  /**
   * Register a new app and get instant API credentials
   */
  registerApp: publicProcedure
    .input(
      z.object({
        appName: z.string().min(1, "App name is required"),
        companyName: z.string().min(1, "Company name is required"),
        email: z.string().email("Valid email is required"),
        website: z.string().url("Valid website URL is required"),
        platformType: z.enum([
          "web",
          "mobile",
          "shopify",
          "woocommerce",
          "custom",
        ]),
        description: z.string().min(10, "Description must be at least 10 characters"),
      })
    )
    .mutation(async ({ input }) => {
      return await registerApp(input);
    }),
});
