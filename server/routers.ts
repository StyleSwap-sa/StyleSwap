import { COOKIE_NAME } from "@shared/const";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router } from "./_core/trpc";
import * as db from "./db";
import { sdk } from "./_core/sdk";
import { getSessionCookieOptions } from "./_core/cookies";
import { tryonRouter } from "./routers/tryon";
import { garmentsRouter } from "./routers/garments";
import { sharingRouter } from "./routers/sharing";
import { paymentRouter } from "./routers/payment";
import { boutiquesRouter } from "./routers/boutiques";
import { productsRouter } from "./routers/products";
import { b2bTryonRouter } from "./routers/b2b-tryon";
import { billingRouter } from "./routers/billing";
import { adminRouter } from "./routers/admin";
import { boutiqueDashboardRouter } from "./routers/boutique-dashboard";
import { webhookAdminRouter } from "./routers/webhookAdmin";
import { analyticsRouter } from "./routers/analytics";
import { reviewsRouter } from "./routers/reviews";
import { batchUploadsRouter } from "./routers/batchUploads";
import { otpRouter } from "./routers/otp";
import { referralRouter } from "./routers/referral";
import { ordersRouter } from "./routers/orders";
import { payoutsRouter } from "./routers/payouts";
import { instantPayoutRouter } from "./routers/payouts-instant";
import { boutiqueDiscoveryRouter } from "./routers/boutique-discovery";
import { apiRouter } from "./routers/api";
import { apiKeysRouter } from "./routers/boutiques.apikeys";
import { webhookEventsRouter } from "./routers/webhookEvents";
import { protectedApiRouter } from "./routers/protectedApi";
import { verificationRouter } from "./routers/verification";
import { adminCreditsRouter } from "./routers/admin-credits";
import { subscriptionAdminRouter } from "./routers/subscriptionAdmin";
import { subscriptionRouter } from "./routers/subscription";
import { freeTrialRouter } from "./routers/freetrial";
import { widgetRouter } from "./routers/widget";
import { promotionalRouter } from "./routers/promotional";
import { closetRouter } from "./routers/closet";
import { votingRouter } from "./routers/voting";
import { discoveryRouter } from "./routers/discovery";
import { commentsRouter } from "./routers/comments";
import { notificationsRouter } from "./routers/notifications";
import { moderationRouter } from "./routers/moderation";
import { followsRouter } from "./routers/follows";
import { mentionsRouter } from "./routers/mentions";
import { hashtagsRouter } from "./routers/hashtags";
import { profilesRouter } from "./routers/profiles";
import { referralsRouter } from "./routers/referrals";
import { contactRouter } from "./routers/contact";
import { affiliateRouter } from "./routers/affiliate";
import { appRegistrationRouter } from "./routers/app-registration";
import { developerDashboardRouter } from "./routers/developer-dashboard";
import { monitoringRouter } from "./routers/monitoring";
import { webhooksRouter } from "./routers/webhooks";
import { apiDocsRouter } from "./routers/api-docs";
import { developerMarketplaceRouter } from "./routers/developer-marketplace";
import { boutiqueMarketplaceRouter } from "./routers/boutique-marketplace";
import { enterpriseRouter } from "./routers/enterprise";
import { inviteCampaignRouter } from "./routers/invite-campaign";
import { getFitroomCredits, isCreditsLow, isCreditsCritical } from "./fitroom-integration";

export const appRouter = router({
    // if you need to use socket.io, read and register route in server/_core/index.ts, all api should start with '/api/' so that the gateway can route correctly
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
    testLogin: publicProcedure.mutation(async ({ ctx }) => {
      const timestamp = Date.now();
      const testUser = {
        openId: "test-" + timestamp,
        email: `test-${timestamp}@styleswap.co.za`,
        name: "Test User",
      };
      await db.upsertUser(testUser);
      const user = await db.getUserByOpenId(testUser.openId);
      if (!user || !user.id) throw new Error("Failed to create user");
      const ONE_YEAR_MS = 365 * 24 * 60 * 60 * 1000;
      const sessionToken = await sdk.createSessionToken(testUser.openId, { name: testUser.name, expiresInMs: ONE_YEAR_MS });
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.cookie(COOKIE_NAME, sessionToken, { ...cookieOptions, maxAge: ONE_YEAR_MS });
      return { success: true, user };
    }),
  }),

  tryon: tryonRouter,
  garments: garmentsRouter,
  sharing: sharingRouter,
  payment: paymentRouter,
  boutiques: boutiquesRouter,
  products: productsRouter,
  b2bTryon: b2bTryonRouter,
  billing: billingRouter,
  admin: adminRouter,
  adminCredits: adminCreditsRouter,
  subscriptionAdmin: subscriptionAdminRouter,
  subscription: subscriptionRouter,
  boutiqueDashboard: boutiqueDashboardRouter,
  webhookAdmin: webhookAdminRouter,
  analytics: router(analyticsRouter),
  reviews: reviewsRouter,
  batchUploads: batchUploadsRouter,
  otp: otpRouter,
  referral: referralRouter,
  orders: ordersRouter,
  payouts: payoutsRouter,
  instantPayouts: instantPayoutRouter,
  boutiqueDiscovery: boutiqueDiscoveryRouter,
  api: apiRouter,
  apiKeys: apiKeysRouter,
  webhookEvents: webhookEventsRouter,
  protectedApi: protectedApiRouter,
  verification: verificationRouter,
  freeTrial: freeTrialRouter,
  widget: widgetRouter,
  promotional: promotionalRouter,
  closet: closetRouter,
  voting: votingRouter,
  discovery: discoveryRouter,
  comments: commentsRouter,
  notifications: notificationsRouter,
  moderation: moderationRouter,
  follows: followsRouter,
  mentions: mentionsRouter,
  hashtags: hashtagsRouter,
  profiles: profilesRouter,
  referrals: referralsRouter,
  inviteCampaign: inviteCampaignRouter,
  contact: contactRouter,
  affiliate: affiliateRouter,
  appRegistration: appRegistrationRouter,
  developerDashboard: developerDashboardRouter,
  monitoring: monitoringRouter,
  webhooks: webhooksRouter,
  apiDocs: apiDocsRouter,
  developerMarketplace: developerMarketplaceRouter,
  boutiqueMarketplace: boutiqueMarketplaceRouter,
  enterprise: enterpriseRouter,
  fitroom: router({
    getCredits: publicProcedure.query(async () => {
      try {
        // Import ENV to get the server-side Fitroom API key
        const { ENV } = await import("./_core/env");
        if (!ENV.fitroomApiKey) {
          console.warn("[Fitroom] API key not configured in environment");
          return { success: false, error: "Fitroom API key not configured", credits: null };
        }
        const credits = await getFitroomCredits(ENV.fitroomApiKey);
        if (!credits) {
          return { success: false, error: "Could not fetch Fitroom credits", credits: null };
        }
        return {
          success: true,
          credits,
          isLow: isCreditsLow(credits),
          isCritical: isCreditsCritical(credits),
        };
      } catch (error) {
        console.error("[Fitroom] Error fetching credits:", error);
        return { success: false, error: "Failed to fetch Fitroom credits" };
      }
    }),
  }),
});

export type AppRouter = typeof appRouter;
