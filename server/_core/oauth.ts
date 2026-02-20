import type { Express, Request, Response } from "express";
import * as db from "../db";
import { getSessionCookieOptions } from "./cookies";
import { sdk } from "./sdk";
import { COOKIE_NAME } from "@shared/const";

function getQueryParam(req: Request, key: string): string | undefined {
  const value = req.query[key];
  return typeof value === "string" ? value : undefined;
}

export function registerOAuthRoutes(app: Express) {
  console.log("[OAuth] Registering OAuth routes...");
  
  // Test endpoint to debug OAuth configuration
  app.get("/api/oauth/debug", (req: Request, res: Response) => {
    console.log("[OAuth] DEBUG endpoint called!");
    const { ENV } = require("./env");
    res.json({
      appId: ENV.appId,
      oAuthServerUrl: ENV.oAuthServerUrl,
      cookieSecret: ENV.cookieSecret ? "***set***" : "NOT SET",
      databaseUrl: ENV.databaseUrl ? "***set***" : "NOT SET",
      currentOrigin: req.get("origin") || req.get("host"),
      expectedCallbackUrl: `${req.protocol}://${req.get("host")}/api/oauth/callback`,
      timestamp: new Date().toISOString(),
    });
  });

  app.get("/api/oauth/callback", async (req: Request, res: Response) => {
    const code = getQueryParam(req, "code");
    const state = getQueryParam(req, "state");
    const origin = req.protocol + "://" + req.get("host");

    console.log("\n========== OAUTH CALLBACK DEBUG START ==========");
    console.log("[OAuth] Callback received");
    console.log("[OAuth] Code:", code?.substring(0, 20) + "...");
    console.log("[OAuth] State:", state?.substring(0, 20) + "...");
    console.log("[OAuth] Request origin:", origin);
    console.log("[OAuth] Request host:", req.get("host"));
    console.log("[OAuth] Request protocol:", req.protocol);

    if (!code || !state) {
      console.error("[OAuth] Missing code or state");
      res.status(400).json({ error: "code and state are required" });
      return;
    }

    try {
      console.log("[OAuth] Starting token exchange...");
      
      // The redirect URI must be the actual callback URL where Manus is redirecting to
      // This is: origin + /api/oauth/callback
      const redirectUri = origin + "/api/oauth/callback";
      console.log("[OAuth] Using redirect URI:", redirectUri);
      console.log("[OAuth] Request origin:", origin);
      
      // Exchange the authorization code for a token using the actual callback URL
      const tokenResponse = await sdk.exchangeCodeForToken(code, state, redirectUri);
      console.log("[OAuth] ✓ Token exchange successful");
      const userInfo = await sdk.getUserInfo(tokenResponse.accessToken);
      console.log("[OAuth] ✓ Got user info, openId:", userInfo.openId);

      if (!userInfo.openId) {
        res.status(400).json({ error: "openId missing from user info" });
        return;
      }

      // Upsert user in database
      console.log("[OAuth] Upserting user...");
      await db.upsertUser({
        openId: userInfo.openId,
        email: userInfo.email || "",
        name: userInfo.name || "",
      });

      // Fetch the user after upsert to get the ID
      const user = await db.getUserByOpenId(userInfo.openId);
      
      if (!user || !user.id) {
        console.error("[OAuth] ✗ User not found after upsert:", userInfo.openId);
        res.status(500).json({ error: "Failed to create or retrieve user" });
        return;
      }

      console.log("[OAuth] ✓ User upserted and retrieved, userId:", user.id);

      const ONE_YEAR_MS = 365 * 24 * 60 * 60 * 1000;

      console.log("[OAuth] Creating session token...");
      const sessionToken = await sdk.createSessionToken(
        userInfo.openId,
        {
          name: userInfo.name || "",
          expiresInMs: ONE_YEAR_MS,
        }
      );

      const cookieOptions = getSessionCookieOptions(req);
      res.cookie(COOKIE_NAME, sessionToken, { ...cookieOptions, maxAge: ONE_YEAR_MS });
      console.log("[OAuth] ✓ Session cookie set");

      // Determine redirect destination based on user role
      let redirectPath = "/";
      if (user.role === 'admin') {
        redirectPath = "/admin";
      } else {
        redirectPath = "/dashboard";
      }
      
      console.log("[OAuth] ✓ OAuth callback completed successfully");
      console.log("========== OAUTH CALLBACK DEBUG END ==========");
      
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
      console.error("\n========== OAUTH CALLBACK ERROR ==========");
      console.error("[OAuth] ✗ Callback failed:", error instanceof Error ? error.message : String(error));
      if (error instanceof Error && error.message.includes("401")) {
        console.error("[OAuth] ERROR TYPE: Token exchange rejected by OAuth server");
        console.error("[OAuth] LIKELY CAUSE: Redirect URI mismatch or invalid authorization code");
        console.error("[OAuth] EXPECTED REDIRECT URI:", Buffer.from(getQueryParam(req, "state") || "", 'base64').toString('utf-8'));
        console.error("[OAuth] ACTUAL CALLBACK URL:", origin + "/api/oauth/callback");
      }
      console.error("[OAuth] Full error:", error);
      console.error("========== OAUTH CALLBACK ERROR END ==========");
      res.status(500).json({ error: "OAuth callback failed", details: error instanceof Error ? error.message : String(error) });
    }
  });
}
