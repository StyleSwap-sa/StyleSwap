import express from "express";
const app = express();
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
  const app = express();
  const server = createServer(app);

  // Middleware
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));

  // Register OAuth routes
  registerOAuthRoutes(app);

  // Health check
  app.get("/health", (req, res) => {
    res.json({ status: "ok" });
  });

  // Model image validation endpoint
  app.post("/api/tryon/validate/model", createUploadRateLimiter(), upload.single("modelImage"), async (req, res) => {
    try {
      console.log("[Model Validation] Received request");
      const testMode = req.body?.testMode === 'true' || req.query?.testMode === 'true';
      console.log("[Model Validation] Test mode:", testMode);
      
      if (!req.file) {
        return res.status(400).json({ valid: false, error: "No model image provided" });
      }

      const tempDir = path.join('/tmp', `validate-${Date.now()}`);
      if (!fs.existsSync(tempDir)) {
        fs.mkdirSync(tempDir, { recursive: true });
      }

      const modelPath = path.join(tempDir, 'model.jpg');
      let modelBuffer = req.file.buffer;

      // Convert to JPEG if needed
      const ext = path.extname(req.file.originalname || '').toLowerCase();
      if (!['.jpg', '.jpeg'].includes(ext)) {
        console.log("[Model Validation] Converting to JPEG");
        modelBuffer = await sharp(modelBuffer).jpeg({ quality: 95 }).toBuffer();
      }

      fs.writeFileSync(modelPath, modelBuffer);

      const fitroomClient = getFitroomClient();
      const validation = await fitroomClient.validateModelImage(modelPath, testMode);

      // Cleanup
      try {
        fs.rmSync(tempDir, { recursive: true, force: true });
      } catch (e) {
        console.warn('[Model Validation] Failed to cleanup:', e);
      }

      return res.status(200).json({
        valid: validation.valid,
        message: validation.message,
        error: validation.error,
      });
    } catch (error) {
      console.error("[Model Validation] Error:", error);
      return res.status(500).json({
        valid: false,
        error: error instanceof Error ? error.message : "Model validation failed",
      });
    }
  });

  // Clothes image validation endpoint
  app.post("/api/tryon/validate/clothes", createUploadRateLimiter(), upload.single("clothImage"), async (req, res) => {
    try {
      console.log("[Clothes Validation] Received request");
      const testMode = req.body?.testMode === 'true' || req.query?.testMode === 'true';
      console.log("[Clothes Validation] Test mode:", testMode);
      
      if (!req.file) {
        return res.status(400).json({ valid: false, error: "No clothes image provided" });
      }

      const tempDir = path.join('/tmp', `validate-${Date.now()}`);
      if (!fs.existsSync(tempDir)) {
        fs.mkdirSync(tempDir, { recursive: true });
      }

      const clothPath = path.join(tempDir, 'cloth.jpg');
      let clothBuffer = req.file.buffer;

      // Convert to JPEG if needed
      const ext = path.extname(req.file.originalname || '').toLowerCase();
      if (!['.jpg', '.jpeg'].includes(ext)) {
        console.log("[Clothes Validation] Converting to JPEG");
        clothBuffer = await sharp(clothBuffer).jpeg({ quality: 95 }).toBuffer();
      }

      fs.writeFileSync(clothPath, clothBuffer);

      const fitroomClient = getFitroomClient();
      const validation = await fitroomClient.validateClothesImage(clothPath, testMode);

      // Cleanup
      try {
        fs.rmSync(tempDir, { recursive: true, force: true });
      } catch (e) {
        console.warn('[Clothes Validation] Failed to cleanup:', e);
      }

      return res.status(200).json({
        valid: validation.valid,
        message: validation.message,
        error: validation.error,
      });
    } catch (error) {
      console.error("[Clothes Validation] Error:", error);
      return res.status(500).json({
        valid: false,
        error: error instanceof Error ? error.message : "Clothes validation failed",
      });
    }
  });

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
      
      // Authenticate the user using the same method as tRPC
      let user;
      try {
        user = await sdk.authenticateRequest(req);
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
      const clothType = req.body.clothType || "upper";

      console.log("[Try-On Upload] Files received:", Object.keys(req.files || {}));
      console.log("[Try-On Upload] clothType:", clothType);
      if (!modelImageFiles || !modelImageFiles[0]) {
        return res.status(400).json({ error: "Model image is required" });
      }

      const modelImageBuffer = modelImageFiles[0].buffer;
      let clothImageBuffer: Buffer;
      let lowerClothImageBuffer: Buffer | null = null;
      
      if ((clothType === "combo" || clothType === "upper") && upperClothImageFiles && upperClothImageFiles[0]) {
        clothImageBuffer = upperClothImageFiles[0].buffer;
        if (lowerClothImageFiles && lowerClothImageFiles[0]) {
          lowerClothImageBuffer = lowerClothImageFiles[0].buffer;
        } else {
          lowerClothImageBuffer = clothImageBuffer;
        }
      } else if (clothImageFiles && clothImageFiles[0]) {
        clothImageBuffer = clothImageFiles[0].buffer;
      } else {
        return res.status(400).json({ error: "Clothing image is required" });
      }

      console.log(`[Try-On Upload] Model image size: ${modelImageBuffer.length} bytes`);
      console.log(`[Try-On Upload] Cloth image size: ${clothImageBuffer.length} bytes`);

      // Validate image types using magic bytes (file signatures)
      const validateImageType = (buffer: Buffer): { valid: boolean; format?: string; error?: string } => {
        // Check for JPEG (FFD8FF)
        if (buffer[0] === 0xFF && buffer[1] === 0xD8 && buffer[2] === 0xFF) {
          return { valid: true, format: 'JPEG' };
        }
        // Check for PNG (89504E47)
        if (buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4E && buffer[3] === 0x47) {
          return { valid: true, format: 'PNG' };
        }
        // Check for WebP (RIFF...WEBP)
        if (buffer[0] === 0x52 && buffer[1] === 0x49 && buffer[2] === 0x46 && buffer[3] === 0x46 &&
            buffer[8] === 0x57 && buffer[9] === 0x45 && buffer[10] === 0x42 && buffer[11] === 0x50) {
          return { valid: true, format: 'WebP' };
        }
        return { valid: false, error: 'Unsupported image format. Please use JPEG, PNG, or WebP.' };
      };

      const modelValidation = validateImageType(modelImageBuffer);
      if (!modelValidation.valid) {
        return res.status(400).json({ error: `Model image: ${modelValidation.error}` });
      }
      console.log(`[Try-On Upload] Model image format: ${modelValidation.format}`);

      const clothValidation = validateImageType(clothImageBuffer);
      if (!clothValidation.valid) {
        return res.status(400).json({ error: `Clothing image: ${clothValidation.error}` });
      }
      console.log(`[Try-On Upload] Clothing image format: ${clothValidation.format}`);

      // Convert WebP to JPEG if needed (Fitroom only supports JPEG and PNG)
      let finalModelBuffer = modelImageBuffer;
      let finalClothBuffer = clothImageBuffer;

      // Convert all images to JPEG for Fitroom compatibility
      if (modelValidation.format !== 'JPEG') {
        console.log(`[Try-On Upload] Converting model from ${modelValidation.format} to JPEG`);
        finalModelBuffer = await sharp(modelImageBuffer).jpeg({ quality: 95 }).toBuffer();
      }

      if (clothValidation.format !== 'JPEG') {
        console.log(`[Try-On Upload] Converting cloth from ${clothValidation.format} to JPEG`);
        finalClothBuffer = await sharp(clothImageBuffer).jpeg({ quality: 95 }).toBuffer();
      }

      // Convert buffers to base64
      const modelImageBase64 = finalModelBuffer.toString('base64');
      const clothImageBase64 = finalClothBuffer.toString('base64');
      
      console.log(`[Try-On Upload] Model image base64 size: ${modelImageBase64.length} bytes`);
      console.log(`[Try-On Upload] Cloth image base64 size: ${clothImageBase64.length} bytes`);

      // Check credits (skip in test mode)
      if (!testMode) {
        const credits = await getUserCredits(userId);
        if (credits.remainingCredits < 1) {
          return res.status(402).json({ error: "Insufficient credits" });
        }
      }

      // Save buffers to temporary files for multipart upload
      const tempDir = path.join('/tmp', `tryon-${Date.now()}`);
      if (!fs.existsSync(tempDir)) {
        fs.mkdirSync(tempDir, { recursive: true });
      }
      
      const modelPath = path.join(tempDir, 'model.jpg');
      const clothPath = path.join(tempDir, 'cloth.jpg');
      
      fs.writeFileSync(modelPath, finalModelBuffer);
      fs.writeFileSync(clothPath, finalClothBuffer);
      console.log(`[Try-On Upload] Saved temp files: ${modelPath}, ${clothPath}`);
      
      let lowerClothPath: string | undefined;
      if ((clothType === "combo" || clothType === "upper") && lowerClothImageBuffer) {
        lowerClothPath = path.join(tempDir, 'lower_cloth.jpg');
        let finalLowerClothBuffer = lowerClothImageBuffer;
        const lowerClothValidation = validateImageType(lowerClothImageBuffer);
        if (lowerClothValidation.format !== 'JPEG') {
          console.log(`[Try-On Upload] Converting lower cloth to JPEG`);
          finalLowerClothBuffer = await sharp(lowerClothImageBuffer).jpeg({ quality: 95 }).toBuffer();
        }
        fs.writeFileSync(lowerClothPath, finalLowerClothBuffer);
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
  
  // Webhook endpoints
  app.post("/api/yoco/webhook", handleYokoWebhook);
  app.post("/api/yoco-boutique/webhook", handleYocoBoutiqueWebhook);
  app.post("/api/test-webhook", testYocoBoutiqueWebhook);
  
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

  server.listen(port, "0.0.0.0", () => {
    console.log(`[Server] Listening on port ${port}`);
  });

  // Initialize webhook retry service
  initializeWebhookJobs();

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
startServer().catch((err) => {
  console.error("Failed to start server:", err);
  process.exit(1);
});
