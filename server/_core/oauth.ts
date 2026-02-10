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

      // Upsert user in database
      const user = await db.upsertUser({
        openId: userInfo.openId,
        email: userInfo.email || "",
        name: userInfo.name || "",
        userType: userInfo.userType || "user",
      });

      console.log("[OAuth] User upserted:", user.id);

      const COOKIE_NAME = "session";
      const ONE_YEAR_MS = 365 * 24 * 60 * 60 * 1000;

      const sessionToken = await sdk.createSessionToken({
        userId: user.id.toString(),
        email: userInfo.email || "",
        name: userInfo.name || "",
        expiresInMs: ONE_YEAR_MS,
      });

      const cookieOptions = getSessionCookieOptions(req);
      res.cookie(COOKIE_NAME, sessionToken, { ...cookieOptions, maxAge: ONE_YEAR_MS });

      // Determine redirect destination based on user type
      let redirectPath = "/";
      if (userInfo.userType === 'merchant') {
        redirectPath = "/boutique-dashboard";
      } else if (userInfo.userType === 'admin') {
        redirectPath = "/admin";
      } else {
        redirectPath = "/dashboard";
      }
      
      // Send HTML that checks localStorage for returnUrl and redirects appropriately
      const html = `
        <!DOCTYPE html>
        <html>
          <head>
            <title>Redirecting...</title>
          </head>
          <body>
            <script>
              const returnUrl = localStorage.getItem('oauth_return_url');
              if (returnUrl) {
                localStorage.removeItem('oauth_return_url');
                window.location.href = returnUrl;
              } else {
                window.location.href = '${redirectPath}';
              }
            </script>
          </body>
        </html>
      `;
      res.send(html);
    } catch (error) {
      console.error("[OAuth] Callback failed:", error instanceof Error ? error.message : String(error));
      console.error("[OAuth] Full error:", error);
      res.status(500).json({ error: "OAuth callback failed", details: error instanceof Error ? error.message : String(error) });
    }
  });
}
