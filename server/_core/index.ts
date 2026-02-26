import express, { type Express } from "express";
const app = express();
import { createServer } from "http";
import net from "net";
import multer from "multer";
import cookieParser from "cookie-parser";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { registerOAuthRoutes } from "./oauth";
// Clerk middleware removed - using Manus OAuth instead
import { appRouter } from "../routers";
import { createContext } from "./context";
import { serveStatic, setupVite } from "./vite";
import { handleYokoWebhook } from "../webhooks/yoco";
import { handleYocoBoutiqueWebhook } from "../webhooks/yoco-boutique";
import { testYocoBoutiqueWebhook } from "../webhooks/test-webhook";
import yocoPayoutsRouter from "../webhooks/yoco-payouts";
import { getFitroomClient } from "./fitroom";
import { deductCredits, getUserCredits, refundCredits } from "../db.credits";
import { sdk } from "./sdk";
import crypto from "crypto";
import path from "path";
import fs from "fs";
import sharp from "sharp";
import {
  createPerUserRateLimiter,
  createStrictRateLimiter,
  createLoginRateLimiter,
  createPaymentRateLimiter,
  createUploadRateLimiter,
} from "./rateLimiter";
import { initializeWebhookJobs } from "../webhookRetryService";

// Configure multer for file uploads
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 50 * 1024 * 1024 } });

export async function startServer() {
  console.log("[Server] Starting initialization...");
  
  // Initialize database schema
  try {
    console.log("[Server] Initializing database schema...");
    const { sql } = await import("../db");
    
    // Create users table if it doesn't exist
    await sql.unsafe(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY NOT NULL,
        \"openId\" VARCHAR(64) UNIQUE,
        name TEXT,
        email VARCHAR(320) UNIQUE,
        \"loginMethod\" VARCHAR(64),
        role VARCHAR(64) DEFAULT 'user' NOT NULL,
        \"createdAt\" TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
        \"updatedAt\" TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
        \"lastSignedIn\" TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
        phone VARCHAR(20),
        \"userType\" VARCHAR(64) DEFAULT 'customer' NOT NULL,
        \"currentBoutiqueId\" INTEGER,
        \"freeTrialUsed\" INTEGER DEFAULT 0 NOT NULL,
        \"freeTrialUsedAt\" TIMESTAMP,
        \"freeTrialExpiresAt\" TIMESTAMP
      )
    `);
    
    console.log("[Server] ✅ Database schema initialized successfully");
  } catch (dbError) {
    console.error("[Server] ⚠️ Database initialization warning:", dbError instanceof Error ? dbError.message : dbError);
  }
  
  const app = express();
  const server = createServer(app);

  // Middleware
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));
  app.use(cookieParser());

  // Authentication handled by Manus OAuth in context.ts

  // Health check
  app.get("/health", (req, res) => {
    res.json({ status: "ok" });
  });
  
  // OAuth routes MUST be registered FIRST, before any other middleware
  // This ensures they take precedence over Vite SPA fallback
  console.log("[Server] Registering OAuth routes...");
  registerOAuthRoutes(app);
  console.log("[Server] OAuth routes registered:");
  console.log("  - GET /api/oauth/callback");
  console.log("  - GET /api/oauth/debug");

  // Try-on upload endpoint with file upload support
  app.post("/api/tryon/upload", createUploadRateLimiter(), upload.fields([
    { name: "modelImage", maxCount: 1 },
    { name: "clothImage", maxCount: 1 },
    { name: "upperClothImage", maxCount: 1 },
    { name: "lowerClothImage", maxCount: 1 }
  ]), async (req, res) => {
    let tempDir: string | null = null;
    try {
      console.log("[Try-On Upload] Received request");
      console.log("[Try-On Upload] Cookie header:", req.headers.cookie ? "present" : "missing");
      
      // Authenticate the user using Clerk
      let user;
      try {
        const auth = (req as any).auth;
        if (!auth?.userId) {
          return res.status(401).json({ error: "Unauthorized: No authentication token" });
        }
        // Get user from database using Clerk ID
        const { getAuthUser } = await import("./auth-clerk");
        user = await getAuthUser(req);
        if (!user) {
          return res.status(401).json({ error: "Unauthorized: User not found" });
        }
        console.log("[Try-On Upload] Authentication successful for user:", user.id);
      } catch (authError) {
        console.error("[Try-On Upload] Authentication failed:", authError);
        const errorMsg = authError instanceof Error ? authError.message : "Invalid session";
        return res.status(401).json({ error: "Unauthorized: " + errorMsg });
      }
      
      const userId = user.id;
      
      // Get testMode from query param or body
      const testMode = req.query.testMode === 'true' || req.body.testMode === 'true';
      console.log("[Try-On Upload] Test mode:", testMode);
      
      const modelImageFiles = (req.files as any)?.modelImage;
      const clothImageFiles = (req.files as any)?.clothImage;
      const upperClothImageFiles = (req.files as any)?.upperClothImage;
      const lowerClothImageFiles = (req.files as any)?.lowerClothImage;
      let clothType = req.body.clothType || "upper";
      
      // Map frontend cloth types to Fitroom API cloth types
      if (clothType === "full") {
        clothType = "combo";
      }

      console.log("[Try-On Upload] Files received:", Object.keys(req.files || {}));
      console.log("[Try-On Upload] clothType (mapped):", clothType);
      if (!modelImageFiles || !modelImageFiles[0]) {
        return res.status(400).json({ error: "Model image is required" });
      }

      const modelImageBuffer = modelImageFiles[0].buffer;
      let clothImageBuffer: Buffer;
      
      // Handle different cloth image sources based on clothType
      if (clothType === "combo") {
        if (!upperClothImageFiles || !upperClothImageFiles[0]) {
          return res.status(400).json({ error: "Upper cloth image is required for combo" });
        }
        if (!lowerClothImageFiles || !lowerClothImageFiles[0]) {
          return res.status(400).json({ error: "Lower cloth image is required for combo" });
        }
        clothImageBuffer = upperClothImageFiles[0].buffer;
      } else {
        if (!clothImageFiles || !clothImageFiles[0]) {
          return res.status(400).json({ error: "Cloth image is required" });
        }
        clothImageBuffer = clothImageFiles[0].buffer;
      }
      
      // Create temp directory for processing
      tempDir = path.join("/tmp", `tryon-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`);
      fs.mkdirSync(tempDir, { recursive: true });
      console.log(`[Try-On Upload] Created temp directory: ${tempDir}`);
      
      // Process and save model image
      const modelPath = path.join(tempDir, "model.jpg");
      const processedModelBuffer = await sharp(modelImageBuffer)
        .jpeg({ quality: 95, progressive: true })
        .toBuffer();
      fs.writeFileSync(modelPath, processedModelBuffer);
      console.log(`[Try-On Upload] Saved model temp file: ${modelPath}`);
      
      // Process and save cloth image
      const clothPath = path.join(tempDir, "cloth.jpg");
      const processedClothBuffer = await sharp(clothImageBuffer)
        .jpeg({ quality: 95, progressive: true })
        .toBuffer();
      fs.writeFileSync(clothPath, processedClothBuffer);
      console.log(`[Try-On Upload] Saved cloth temp file: ${clothPath}`);
      
      // Process and save lower cloth image if provided
      let lowerClothPath: string | undefined = undefined;
      if (lowerClothImageFiles && lowerClothImageFiles[0]) {
        lowerClothPath = path.join(tempDir, "lower-cloth.jpg");
        const processedLowerClothBuffer = await sharp(lowerClothImageFiles[0].buffer)
          .jpeg({ quality: 95, progressive: true })
          .toBuffer();
        fs.writeFileSync(lowerClothPath, processedLowerClothBuffer);
        console.log(`[Try-On Upload] Saved lower cloth temp file: ${lowerClothPath}`);
      }
      
      // For single garments (upper/lower), don't use lower cloth image
      // For combo mode, use both upper and lower cloth images
      let fitroomLowerClothPath: string | undefined = undefined;
      if (clothType === "combo") {
        fitroomLowerClothPath = lowerClothPath;
      }
      
      // Create try-on task with Fitroom using multipart form data (like the website)
      const fitroomClient = getFitroomClient();
      if (!fitroomClient) {
        console.error('[Try-On Upload] Fitroom API key not configured');
        return res.status(503).json({ error: "Fitroom service is not available. Please try again later." });
      }
      console.log('[Try-On Upload] Sending to Fitroom API using multipart form data');
      const taskResult = await fitroomClient.createTryOn({
        modelImagePath: modelPath,
        clothImagePath: clothPath,
        clothType: clothType as "upper" | "lower" | "combo",
        lowerClothImagePath: fitroomLowerClothPath,
        hdMode: true,
      });
      
      // Clean up temp files
      try {
        fs.rmSync(tempDir, { recursive: true, force: true });
        console.log('[Try-On Upload] Cleaned up temp files');
      } catch (e) {
        console.warn('[Try-On Upload] Failed to clean temp files:', e);
      }

      console.log('[Try-On Upload] Fitroom response:', JSON.stringify(taskResult));
      
      if (!taskResult.success || !taskResult.taskId) {
        console.error('[Try-On Upload] Fitroom failed:', taskResult.error);
        let errorMsg = taskResult.error || "Failed to create try-on task";
        if (typeof errorMsg === 'boolean') {
          errorMsg = "Try-on generation failed. Please check your images and try again.";
        }
        return res.status(500).json({ error: String(errorMsg) });
      }

      // Deduct credit after successful task creation (skip in test mode)
      if (!testMode) {
        await deductCredits(userId, 1);
      } else {
        console.log("[Try-On Upload] Test mode - skipping credit deduction");
      }

      console.log(`[Try-On Upload] Task created successfully: ${taskResult.taskId}`);
      
      return res.status(200).json({
        success: true,
        taskId: taskResult.taskId,
        status: taskResult.status || "CREATED",
      });
    } catch (error) {
      console.error("[Try-On Upload] Error:", error);
      return res.status(500).json({ error: error instanceof Error ? error.message : "Failed to process try-on upload" });
    }
  });
  
  // Client error logging endpoint
  app.post("/api/client-error", express.json(), (req, res) => {
    try {
      const { context, message, stack, componentStack, url, timestamp } = req.body;
      console.error(`[Client Error] ${context}:`, {
        message,
        url,
        timestamp,
        stack: stack ? stack.substring(0, 500) : 'N/A',
        componentStack: componentStack ? componentStack.substring(0, 500) : 'N/A',
      });
      res.json({ success: true });
    } catch (error) {
      console.error('[Client Error] Failed to log error:', error);
      res.status(500).json({ error: 'Failed to log error' });
    }
  });
  console.log("[Server] Client error logging endpoint registered:");
  console.log("  - POST /api/client-error");
  
  // Webhook endpoints
  app.post("/api/yoco/webhook", handleYokoWebhook);
  app.post("/api/yoco-boutique/webhook", handleYocoBoutiqueWebhook);
  app.post("/api/test-webhook", testYocoBoutiqueWebhook);
  app.use("/api/webhooks", yocoPayoutsRouter);
  
  console.log("[Server] Webhook endpoints registered:");
  console.log("  - POST /api/yoco/webhook");
  console.log("  - POST /api/yoco-boutique/webhook");
  console.log("  - POST /api/test-webhook");
  console.log("  - POST /api/webhooks/yoco-payouts");
  
  // tRPC API
  app.use(
    "/api/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext,
    })
  );
  console.log("[Server] tRPC API configured");
  
  // Setup static files and Vite AFTER API routes
  // This ensures that API routes take precedence over static file serving
  console.log("[Server] NODE_ENV:", process.env.NODE_ENV);
  if (process.env.NODE_ENV === "development") {
    console.log("[Server] Setting up Vite for development...");
    await setupVite(app, server);
    console.log("[Server] Vite setup completed");
  } else {
    console.log("[Server] Setting up static file serving for production...");
    serveStatic(app);
    console.log("[Server] Static file serving configured");
  }

  const preferredPort = parseInt(process.env.PORT || "3000");
  console.log("[Server] Finding available port starting from:", preferredPort);
  const port = await findAvailablePort(preferredPort);

  server.listen(port, "0.0.0.0", () => {
    console.log(`[Server] Server listening on port ${port}`);
  });

  // Initialize webhook retry service
  console.log("[Server] Initializing webhook retry service...");
  initializeWebhookJobs();
  console.log("[Server] Webhook retry service initialized");

  console.log("[Server] Server initialization complete");
  return { app, server, port };
}

async function findAvailablePort(preferredPort: number): Promise<number> {
  return new Promise((resolve) => {
    const server = net.createServer();
    server.listen(preferredPort, "0.0.0.0", () => {
      const port = (server.address() as net.AddressInfo).port;
      server.close(() => resolve(port));
    });
    server.on("error", () => {
      resolve(findAvailablePort(preferredPort + 1));
    });
  });
}

// Start the server
console.log("[Server] Attempting to start server...");
startServer()
  .then(({ port }) => {
    console.log("[Server] Server started successfully on port", port);
  })
  .catch((error) => {
    console.error("[Server] Failed to start server:", error);
    process.exit(1);
  });
