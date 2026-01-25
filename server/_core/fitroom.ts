import axios, { type AxiosInstance } from "axios";
import FormData from "form-data";
import fs from "fs";
import path from "path";
import https from "https";

export interface FitroomTryOnRequest {
  modelImagePath: string;
  clothImagePath: string;
  clothType: "single" | "combo" | "upper" | "lower" | "dress";
  lowerClothImagePath?: string;
  hdMode?: boolean;
}

export interface FitroomTryOnBase64Request {
  modelImageBase64: string;
  clothImageBase64: string;
  clothType: "single" | "combo" | "upper" | "lower" | "dress";
  lowerClothImageBase64?: string;
  hdMode?: boolean;
}

export interface FitroomTryOnResponse {
  success: boolean;
  taskId?: string;
  status?: string;
  error?: string;
}

export interface FitroomTaskStatusResponse {
  success: boolean;
  status?: string;
  resultImage?: string;
  downloadSignedUrl?: string;
  progress?: number;
  error?: string;
  errorCode?: string;
}

export class FitroomClient {
  private client: AxiosInstance;
  private apiKey: string;

  constructor(apiKey: string, baseURL: string = "https://platform.fitroom.app") {
    this.apiKey = apiKey;

    // Create axios instance with custom HTTPS agent for self-signed certificates
    const httpsAgent = new https.Agent({
      rejectUnauthorized: false,
    });

    this.client = axios.create({
      baseURL,
      headers: {
        "X-API-KEY": apiKey,
      },
      httpAgent: undefined,
      httpsAgent,
      timeout: 30000,
    });
  }

  /**
   * Get MIME type based on file extension
   */
  private getMimeType(filePath: string): string {
    const ext = path.extname(filePath).toLowerCase();
    const mimeTypes: { [key: string]: string } = {
      '.png': 'image/png',
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.gif': 'image/gif',
      '.webp': 'image/webp',
    };
    return mimeTypes[ext] || 'application/octet-stream';
  }

  /**
   * Create a virtual try-on task with base64 encoded images
   * This method sends base64 images directly in JSON body to avoid BytesIO issues
   */
  async createTryOnWithBase64(request: FitroomTryOnBase64Request): Promise<FitroomTryOnResponse> {
    try {
      console.log("[Fitroom] Creating try-on with base64 encoded images");
      console.log("[Fitroom] Cloth type:", request.clothType);
      console.log("[Fitroom] HD mode:", request.hdMode !== false ? "enabled" : "disabled");
      
      // Calculate base64 sizes for logging
      const modelBase64Size = Buffer.byteLength(request.modelImageBase64, 'utf8');
      const clothBase64Size = Buffer.byteLength(request.clothImageBase64, 'utf8');
      
      console.log("[Fitroom] Model image base64 size:", modelBase64Size, "bytes");
      console.log("[Fitroom] Cloth image base64 size:", clothBase64Size, "bytes");
      
      // Debug: Check base64 format
      console.log("[Fitroom] Model base64 first 50 chars:", request.modelImageBase64.substring(0, 50));
      console.log("[Fitroom] Cloth base64 first 50 chars:", request.clothImageBase64.substring(0, 50));

      // Send base64 images directly in JSON body instead of multipart form data
      const payload = {
        model_image: request.modelImageBase64,
        cloth_image: request.clothImageBase64,
        cloth_type: request.clothType,
      };

      // For combo try-ons, add lower clothing image
      if (request.clothType === "combo" && request.lowerClothImageBase64) {
        (payload as any).lower_cloth_image = request.lowerClothImageBase64;
      }

      // Enable HD mode by default for better quality (30s vs 9s processing)
      // HD mode provides higher quality output at the cost of longer processing time
      (payload as any).hd_mode = true;

      console.log("[Fitroom] Sending POST to /api/tryon/v2/tasks with base64 JSON payload");
      console.log("[Fitroom] Payload keys:", Object.keys(payload));
      console.log("[Fitroom] Payload:", { ...payload, model_image: payload.model_image.substring(0, 50) + "...", cloth_image: payload.cloth_image.substring(0, 50) + "..." });
      
      const response = await this.client.post("/api/tryon/v2/tasks", payload, {
        headers: {
          "Content-Type": "application/json",
        },
      });

      console.log("[Fitroom] SUCCESS - Response status:", response.status);
      console.log("[Fitroom] SUCCESS - Response data:", JSON.stringify(response.data));

      const taskId = response.data.task_id || response.data.taskId || response.data.id;
      const status = response.data.status || "CREATED";

      if (!taskId) {
        console.error("[Fitroom] ERROR - No task ID in response:", response.data);
        return {
          success: false,
          error: "No task ID returned from Fitroom API",
        };
      }

      console.log("[Fitroom] SUCCESS - Task created:", { taskId, status });
      return {
        success: true,
        taskId,
        status,
      };
    } catch (error: any) {
      console.error("[Fitroom] ERROR - Base64 try-on failed:", error.message);
      console.error("[Fitroom] ERROR - Full error object:", error);
      console.error("[Fitroom] ERROR - Response status:", error.response?.status);
      console.error("[Fitroom] ERROR - Response data:", error.response?.data);
      
      let errorMessage = "Unknown error";
      
      if (error.response?.data) {
        const responseData = error.response.data;
        
        if (typeof responseData === 'string') {
          errorMessage = responseData;
        } else if (responseData.reason) {
          errorMessage = responseData.reason;
        } else if (responseData.error !== undefined) {
          // Handle boolean error responses from Fitroom API
          if (responseData.error === true) {
            // Provide meaningful error based on HTTP status
            if (error.response.status === 400) {
              errorMessage = "Invalid image format or size. Please ensure images are valid and meet requirements.";
            } else if (error.response.status === 401) {
              errorMessage = "Authentication failed. Please check API key.";
            } else if (error.response.status === 429) {
              errorMessage = "Too many requests. Please wait and try again.";
            } else {
              errorMessage = "Try-on generation failed. Please check your images and try again.";
            }
          } else if (typeof responseData.error === 'string') {
            errorMessage = responseData.error;
          } else {
            errorMessage = "Try-on generation failed.";
          }
        } else if (responseData.message) {
          errorMessage = responseData.message;
        } else {
          errorMessage = JSON.stringify(responseData);
        }
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      console.error("[Fitroom] ERROR - Extracted message:", errorMessage);
      return {
        success: false,
        error: String(errorMessage),
      };
    }
  }

  /**
   * Create a virtual try-on task
   * Sends model image and clothing image to Fitroom API
   * 
   * @param request - Try-on request with image paths and clothing type
   * @returns Task ID and status if successful
   */
  async createTryOn(request: FitroomTryOnRequest): Promise<FitroomTryOnResponse> {
    try {
      // Validate files exist
      if (!fs.existsSync(request.modelImagePath)) {
        return {
          success: false,
          error: `Model image not found: ${request.modelImagePath}`,
        };
      }
      if (!fs.existsSync(request.clothImagePath)) {
        return {
          success: false,
          error: `Cloth image not found: ${request.clothImagePath}`,
        };
      }

      // Log file details
      const modelStats = fs.statSync(request.modelImagePath);
      const clothStats = fs.statSync(request.clothImagePath);
      console.log("[Fitroom] Model image:", { 
        path: request.modelImagePath, 
        size: modelStats.size,
        ext: path.extname(request.modelImagePath)
      });
      console.log("[Fitroom] Clothing image:", { 
        path: request.clothImagePath, 
        size: clothStats.size,
        ext: path.extname(request.clothImagePath)
      });

      // Create FormData
      const form = new FormData();
      form.append("model_image", fs.createReadStream(request.modelImagePath), {
        filename: path.basename(request.modelImagePath),
        contentType: this.getMimeType(request.modelImagePath),
      });
      form.append("cloth_image", fs.createReadStream(request.clothImagePath), {
        filename: path.basename(request.clothImagePath),
        contentType: this.getMimeType(request.clothImagePath),
      });
      form.append("cloth_type", request.clothType);

      if (request.clothType === "combo" && request.lowerClothImagePath) {
        form.append("lower_cloth_image", fs.createReadStream(request.lowerClothImagePath), {
          filename: path.basename(request.lowerClothImagePath),
          contentType: this.getMimeType(request.lowerClothImagePath),
        });
      }

      // Enable HD mode by default for better quality (30s vs 9s processing)
      // HD mode provides higher quality output at the cost of longer processing time
      form.append("hd_mode", "true");

      console.log("[Fitroom] Sending POST to /api/tryon/v2/tasks with multipart form data");
      console.log("[Fitroom] Form fields: model_image, cloth_image, cloth_type, hd_mode");

      const response = await this.client.post("/api/tryon/v2/tasks", form, {
        headers: form.getHeaders(),
      });

      console.log("[Fitroom] SUCCESS - Response status:", response.status);
      console.log("[Fitroom] SUCCESS - Response data:", JSON.stringify(response.data));

      const taskId = response.data.task_id || response.data.taskId || response.data.id;
      const status = response.data.status || "CREATED";

      if (!taskId) {
        console.error("[Fitroom] ERROR - No task ID in response:", response.data);
        return {
          success: false,
          error: "No task ID returned from Fitroom API",
        };
      }

      console.log("[Fitroom] SUCCESS - Task created:", { taskId, status });
      return {
        success: true,
        taskId,
        status,
      };
    } catch (error: any) {
      console.error("[Fitroom] ERROR - Try-on creation failed:", error.message);
      const errorMessage = error.response?.data?.reason || error.response?.data?.error || error.message || "Unknown error";
      console.error("[Fitroom] ERROR - Response data:", error.response?.data);
      return {
        success: false,
        error: String(errorMessage),
      };
    }
  }

  /**
   * Get the status of a try-on task
   * 
   * @param taskId - The task ID to check
   * @returns Task status and result image if completed
   */
  async getTryOnStatus(taskId: string): Promise<FitroomTaskStatusResponse> {
    try {
      console.log("[Fitroom] Getting status for task:", taskId);
      console.log("[Fitroom] Polling endpoint: /api/tryon/v2/tasks/" + taskId);

      const response = await this.client.get(`/api/tryon/v2/tasks/${taskId}`);

      console.log("[Fitroom] Status response:", { status: response.data.status, progress: response.data.progress, hasUrl: !!response.data.download_signed_url });

      const status = response.data.status || "UNKNOWN";
      // Fitroom API returns download_signed_url for completed tasks
      const resultImage = response.data.download_signed_url || response.data.result_image || response.data.resultImage;
      const progress = response.data.progress;

      // If task is completed, log the result URL
      if (status === "COMPLETED" && resultImage) {
        console.log("[Fitroom] Task completed! Result URL available.");
      }

      return {
        success: true,
        status,
        resultImage,
        downloadSignedUrl: resultImage,
        progress,
      };
    } catch (error: any) {
      console.error("[Fitroom] ERROR - Status check failed:", error.message);
      const errorMessage = error.response?.data?.reason || error.response?.data?.error || error.message || "Unknown error";
      return {
        success: false,
        error: String(errorMessage),
      };
    }
  }
}

export function getFitroomClient(): FitroomClient {
  const apiKey = process.env.FITROOM_API_KEY;
  if (!apiKey) {
    throw new Error("FITROOM_API_KEY environment variable is not set");
  }
  return new FitroomClient(apiKey);
}
