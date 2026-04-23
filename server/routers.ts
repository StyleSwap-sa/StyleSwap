import { COOKIE_NAME } from "../shared/const";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router } from "./_core/trpc";
import * as db from "./db";

import bcrypt from 'bcrypt';
import { createToken } from './_core/jwt';
import { z } from 'zod';
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
import { getFitroomCredits, isCreditsLow, isCreditsCritical } from "./fitroom-integration";
import { globalFeedRouter } from "./routers/global-feed";
import { globalRecommendationsRouter } from "./routers/global-recommendations";


const ONE_YEAR_MS = 365 * 24 * 60 * 60 * 1000;

function setAuthCookie(res: any, token: string) {
  res.cookie(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 30 * 24 * 60 * 60 * 1000,
    path: '/',
  });
}

// Helper function to map database user to frontend-friendly format
function mapUserToFrontend(user: any) {
  if (!user) return null;
  return {
    id: user.id,
    openId: user.openId,
    name: user.name,
    email: user.email,
    loginMethod: user.loginMethod,
    role: user.user_role,
    userType: user.user_type,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
    lastSignedIn: user.lastSignedIn,
    phone: user.phone,
    currentBoutiqueId: user.currentBoutiqueId,
    freeTrialUsed: user.freeTrialUsed,
    freeTrialUsedAt: user.freeTrialUsedAt,
    freeTrialExpiresAt: user.freeTrialExpiresAt,
  };
}

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(async (opts) => {
      return mapUserToFrontend(opts.ctx.user);
    }),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true };
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
      const token = createToken(user.id, user.openId);
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.cookie(COOKIE_NAME, token, { ...cookieOptions, maxAge: ONE_YEAR_MS });
      return { success: true, user: mapUserToFrontend(user) };
    }),
    // Email/password signup
    signup: publicProcedure
  .input(z.object({
    email: z.string().email(),
    password: z.string().min(6),
    name: z.string().optional(),
    userType: z.enum(['customer', 'merchant']).default('customer'),
  }))
  .mutation(async ({ input, ctx }) => {
    console.log("[Signup] Starting for:", input.email);
    console.log("[Signup] Received userType from frontend:", input.userType);
    
    const existing = await db.getUserByEmail(input.email);
    if (existing) {
      console.log("[Signup] User already exists:", input.email);
      throw new Error('Email already in use');
    }

    console.log("[Signup] Hashing password...");
    const hashed = await bcrypt.hash(input.password, 10);
    console.log("[Signup] Password hashed, length:", hashed.length);
    
    const openId = `email-${Date.now()}`;
    console.log("[Signup] OpenId:", openId);
    
    const userData = {
      openId,
      email: input.email,
      name: input.name || input.email,
      loginMethod: 'email',
      password: hashed,
      userType: input.userType,
      role: input.userType === 'merchant' ? 'merchant' : 'user',
    };
    
    console.log("[Signup] userData.user_type:", userData.userType);
    console.log("[Signup] userData.user_role:", userData.role);
    
    await db.upsertUser(userData);
    console.log("[Signup] upsertUser completed");
    
    const user = await db.getUserByOpenId(openId);
    console.log("[Signup] Retrieved user from DB - user_type:", user?.user_type);
    console.log("[Signup] Retrieved user from DB - user_role:", user?.user_role);
    
    if (!user) throw new Error('Failed to create user');

    const token = createToken(user.id, user.openId);
    setAuthCookie(ctx.res, token);
    console.log("[Signup] Success for:", input.email);
    
    return { success: true, user: mapUserToFrontend(user) };
  }),
    // Email/password login
    login: publicProcedure
      .input(z.object({
        email: z.string().email(),
        password: z.string(),
      }))
      .mutation(async ({ input, ctx }) => {
        const user = await db.getUserByEmail(input.email);
        if (!user) throw new Error('Invalid credentials');
        if (!user.password) throw new Error('Please sign up first');

        const valid = await bcrypt.compare(input.password, user.password);
        if (!valid) throw new Error('Invalid credentials');

        const token = createToken(user.id, user.openId);
        setAuthCookie(ctx.res, token);
        return { success: true, user: mapUserToFrontend(user) };
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
  globalFeed: globalFeedRouter,
  globalRecommendations: globalRecommendationsRouter,
  protectedApi: protectedApiRouter,
  verification: verificationRouter,
  freeTrial: freeTrialRouter,
  widget: widgetRouter,
  fitroom: router({
    getCredits: publicProcedure.query(async () => {
      try {
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