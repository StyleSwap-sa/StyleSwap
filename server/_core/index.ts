import "dotenv/config";
import express from "express";
import { createServer } from "http";
import net from "net";
import multer from "multer";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { registerOAuthRoutes } from "./oauth";
import { appRouter } from "../routers";
import { createContext } from "./context";
import { serveStatic, setupVite } from "./vite";
import { handleYokoWebhook } from "../webhooks/yoco";
import { handleYocoBoutiqueWebhook } from "../webhooks/yoco-boutique";
import { testYocoBoutiqueWebhook } from "../webhooks/test-webhook";
import { getFitroomClient } from "./fitroom";
import { deductCredits, getUserCredits, refundCredits } from "../db.credits";
import { sdk } from "./sdk";
import crypto from "crypto";
import path from "path";
import fs from "fs";

// Configure multer for file uploads
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 50 * 1024 * 1024 } });

function isPortAvailable(port: number): Promise<boolean> {
  return new Promise(resolve => {
    const server = net.createServer();
    server.listen(port, () => {
      server.close(() => resolve(true));
    });
    server.on("error", () => resolve(false));
  });
}

async function findAvailablePort(startPort: number = 3000): Promise<number> {
  for (let port = startPort; port < startPort + 20; port++) {
    if (await isPortAvailable(port)) {
      return port;
    }
  }
  throw new Error(`No available port found starting from ${startPort}`);
}

async function startServer() {
  const app = express();
  const server = createServer(app);
  // Configure body parser with larger size limit for file uploads
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));
  
  // OAuth callback under /api/oauth/callback
  registerOAuthRoutes(app);
  
  // Yoco webhook endpoints
  app.post("/api/webhooks/yoco", handleYokoWebhook);
  app.post("/api/webhooks/yoco/boutique", handleYocoBoutiqueWebhook);
  
  // Yoco charge creation endpoint
  app.post("/api/yoco/charge", async (req, res) => {
    try {
      const { amount, currency } = req.body;
      if (!amount || !currency) {
        return res.status(400).json({ error: "Amount and currency required" });
      }
      const token = crypto.randomBytes(32).toString("hex");
      res.json({ token, amount, currency });
    } catch (error) {
      console.error("Yoco Charge Error:", error);
      res.status(500).json({ error: "Failed to create charge" });
    }
  });
  
  // Try-on file upload endpoint (handles multipart/form-data)
  // This endpoint receives files directly and forwards to Fitroom without base64 encoding
  app.post("/api/tryon/upload", upload.fields([
    { name: "modelImage", maxCount: 1 },
    { name: "clothImage", maxCount: 1 }
  ]), async (req, res) => {
    let tempDir: string | null = null;
    try {
      console.log("[Try-On Upload] Received request");
      
      // Authenticate the user using the same method as tRPC
      let user;
      try {
        user = await sdk.authenticateRequest(req);
      } catch (authError) {
        console.log("[Try-On Upload] Authentication failed:", authError);
        return res.status(401).json({ error: "Unauthorized" });
      }
      
      const userId = user.id;
      
      const modelImageFiles = (req.files as any)?.modelImage;
      const clothImageFiles = (req.files as any)?.clothImage;

      if (!modelImageFiles || !modelImageFiles[0] || !clothImageFiles || !clothImageFiles[0]) {
        return res.status(400).json({ error: "Both model image and cloth image are required" });
      }

      const modelImageBuffer = modelImageFiles[0].buffer;
      const clothImageBuffer = clothImageFiles[0].buffer;
      const clothType = req.body.clothType || "single";

      console.log(`[Try-On Upload] Model image size: ${modelImageBuffer.length} bytes`);
      console.log(`[Try-On Upload] Cloth image size: ${clothImageBuffer.length} bytes`);

      // Create temp directory for image files
      tempDir = path.join("/tmp", `fitroom-${crypto.randomBytes(8).toString("hex")}`);
      fs.mkdirSync(tempDir, { recursive: true });

      // Get MIME type extensions
      const getExtension = (mimeType: string): string => {
        if (mimeType.includes("jpeg") || mimeType.includes("jpg")) return "jpg";
        if (mimeType.includes("png")) return "png";
        if (mimeType.includes("gif")) return "gif";
        if (mimeType.includes("webp")) return "webp";
        return "jpg";
      };

      const modelExt = getExtension(modelImageFiles[0].mimetype);
      const clothExt = getExtension(clothImageFiles[0].mimetype);

      const modelImagePath = path.join(tempDir, `model.${modelExt}`);
      const clothImagePath = path.join(tempDir, `cloth.${clothExt}`);

      // Write files directly (no base64 conversion)
      fs.writeFileSync(modelImagePath, modelImageBuffer);
      fs.writeFileSync(clothImagePath, clothImageBuffer);

      console.log(`[Try-On Upload] Saved model image: ${modelImagePath}`);
      console.log(`[Try-On Upload] Saved cloth image: ${clothImagePath}`);

      // Check credits
      const credits = await getUserCredits(userId);
      if (credits.remainingCredits < 1) {
        return res.status(402).json({ error: "Insufficient credits" });
      }

      // Create try-on task with Fitroom
      const fitroomClient = getFitroomClient();
      const taskResult = await fitroomClient.createTryOn({
        modelImagePath,
        clothImagePath,
        clothType: clothType as "single" | "combo",
        hdMode: false,
      });

      if (!taskResult.success || !taskResult.taskId) {
        return res.status(500).json({ error: taskResult.error || "Failed to create try-on task" });
      }

      // Deduct credit after successful task creation
      await deductCredits(userId, 1);

      console.log(`[Try-On Upload] Task created successfully: ${taskResult.taskId}`);
      
      return res.status(200).json({
        success: true,
        taskId: taskResult.taskId,
        status: taskResult.status || "CREATED",
      });
    } catch (error) {
      console.error("[Try-On Upload] Error:", error);
      
      // Cleanup on error
      if (tempDir && fs.existsSync(tempDir)) {
        fs.rmSync(tempDir, { recursive: true, force: true });
      }
      
      return res.status(500).json({ error: error instanceof Error ? error.message : "Failed to process try-on upload" });
    }
  });
  
  // tRPC API
  app.use(
    "/api/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext,
    })
  );
  
  // development mode uses Vite, production mode uses static files
  if (process.env.NODE_ENV === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  const preferredPort = parseInt(process.env.PORT || "3000");
  const port = await findAvailablePort(preferredPort);

  if (port !== preferredPort) {
    console.log(`Port ${preferredPort} is busy, using port ${port} instead`);
  }

  server.listen(port, () => {
    console.log(`Server running on http://localhost:${port}/`);
  });
}

startServer().catch(console.error);
