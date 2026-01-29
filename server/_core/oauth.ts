import { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";
import type { Express, Request, Response } from "express";
import * as db from "../db";
import { getSessionCookieOptions } from "./cookies";
import { sdk } from "./sdk";

function getQueryParam(req: Request, key: string): string | undefined {
  const value = req.query[key];
  return typeof value === "string" ? value : undefined;
}

export function registerOAuthRoutes(app: Express) {
  app.get("/api/oauth/callback", async (req: Request, res: Response) => {
    const code = getQueryParam(req, "code");
    const state = getQueryParam(req, "state");

    if (!code || !state) {
      res.status(400).json({ error: "code and state are required" });
      return;
    }

    try {
      console.log("[OAuth] Starting callback with code:", code?.substring(0, 10), "state:", state?.substring(0, 10));
      const tokenResponse = await sdk.exchangeCodeForToken(code, state);
      console.log("[OAuth] Got token response");
      const userInfo = await sdk.getUserInfo(tokenResponse.accessToken);
      console.log("[OAuth] Got user info:", userInfo.openId);

      if (!userInfo.openId) {
        res.status(400).json({ error: "openId missing from user info" });
        return;
      }

      // Check if email already exists with a different role
      if (userInfo.email) {
        const existingUser = await db.getUserByEmail(userInfo.email);
        const requestedUserType = getQueryParam(req, "userType") || "customer";
        
        if (existingUser && existingUser.userType !== requestedUserType) {
          const currentRole = existingUser.userType === "merchant" ? "boutique owner" : "customer";
          const requestedRole = requestedUserType === "merchant" ? "boutique owner" : "customer";
          res.status(400).json({
            error: `This email is already registered as a ${currentRole}. Cannot use same email for ${requestedRole}.`,
            code: "EMAIL_ALREADY_REGISTERED_AS_DIFFERENT_ROLE",
          });
          return;
        }
      }

      await db.upsertUser({
        openId: userInfo.openId,
        name: userInfo.name || null,
        email: userInfo.email ?? null,
        loginMethod: userInfo.loginMethod ?? userInfo.platform ?? null,
        lastSignedIn: new Date(),
      });

      const sessionToken = await sdk.createSessionToken(userInfo.openId, {
        name: userInfo.name || "",
        expiresInMs: ONE_YEAR_MS,
      });

      const cookieOptions = getSessionCookieOptions(req);
      res.cookie(COOKIE_NAME, sessionToken, { ...cookieOptions, maxAge: ONE_YEAR_MS });

      res.redirect(302, "/");
    } catch (error) {
      console.error("[OAuth] Callback failed:", error instanceof Error ? error.message : String(error));
      console.error("[OAuth] Full error:", error);
      res.status(500).json({ error: "OAuth callback failed", details: error instanceof Error ? error.message : String(error) });
    }
  });
}
