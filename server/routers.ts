import { getSessionCookieOptions } from "./_core/cookies";
import { COOKIE_NAME } from "../shared/const";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router } from "./_core/trpc";
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
  boutiqueDiscovery: router(boutiqueDiscoveryRouter),
  api: apiRouter,
});

export type AppRouter = typeof appRouter;
