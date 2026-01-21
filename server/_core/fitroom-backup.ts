import axios, { AxiosInstance } from "axios";
import FormData from "form-data";
import fs from "fs";
import path from "path";
import https from "https";
import { ENV } from "./env";

/**
 * Fitroom API Client
 * Handles all communication with Fitroom's virtual try-on rendering engine
 * API Docs: https://developer.fitroom.app/
 */

interface FitroomTryOnRequest {
  modelImagePath: string; // Path to customer's body photo
  clothImagePath: string; // Path to garment image
  clothType: "single" | "combo"; // Type of clothing ("single" for one garment, "combo" for top+bottom)
  lowerClothImagePath?: string; // For combo try-ons
  hdMode?: boolean; // Optional: true for HD quality (~30s), false for normal (~9s)
}

interface FitroomTryOnResponse {
  success: boolean;
  taskId?: string; // Task ID to poll for results
  status?: string; // Initial status (usually "CREATED")
  error?: string;
}

interface FitroomTaskStatusResponse {
  success: boolean;
  status?: string; // CREATED, PROCESSING, COMPLETED, FAILED
  resultImage?: string; // URL to result image when completed
  progress?: number; // Progress percentage (0-100)
  error?: string;
  errorCode?: string;
}

class FitroomClient {
  private client: AxiosInstance;
  private apiKey: string;
  private baseURL: string = "https://platform.fitroom.app";

  constructor(apiKey: string) {
    this.apiKey = apiKey;
    this.client = axios.create({
      baseURL: this.baseURL,
      timeout: 60000, // Increased timeout for processing
      headers: {
        "X-API-KEY": apiKey,
      },
      httpsAgent: new https.Agent({
        rejectUnauthorized: false, // Allow self-signed certificates for development
      }),
    });
  }

  /**
   * Create a virtual try-on task
   * Sends customer's body photo and garment image to Fitroom for processing
   * 
   * @param request - Try-on request with image paths and clothing type
   * @returns Task ID and initial status
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

      // Create form data
      const formData = new FormData();
      formData.append("model_image", fs.createReadStream(request.modelImagePath));
      formData.append("cloth_image", fs.createReadStream(request.clothImagePath));
      formData.append("cloth_type", request.clothType);

      // For combo try-ons, add lower clothing image
      if (request.clothType === "combo" && request.lowerClothImagePath) {
        if (!fs.existsSync(request.lowerClothImagePath)) {
          return {
            success: false,
            error: `Lower cloth image not found: ${request.lowerClothImagePath}`,
          };
        }
        formData.append("lower_cloth_image", fs.createReadStream(request.lowerClothImagePath));
      }

      // Add HD mode if specified
      if (request.hdMode) {
        formData.append("hd_mode", "true");
      }

      // Create try-on task
      console.log("[Fitroom] Sending request to /api/tryon/v2/tasks");
      const response = await this.client.post("/api/tryon/v2/tasks", formData, {
        headers: formData.getHeaders(),
      });

      console.log("[Fitroom] Create task response status:", response.status);
      console.log("[Fitroom] Create task response:", JSON.stringify(response.data));

      const taskId = response.data.task_id || response.data.taskId || response.data.id;
      const status = response.data.status || "CREATED";

      if (!taskId) {
        console.error("[Fitroom] No task ID in response:", response.data);
        return {
          success: false,
          error: "No task ID returned from Fitroom API",
        };
      }

      return {
        success: true,
        taskId,
        status,
      };
    } catch (error: any) {
      const errorDetails = {
        status: error.response?.status,
        data: error.response?.data,
        message: error.message,
        headers: error.response?.headers,
      };
      console.error("[Fitroom API Error - Create Try-On]", JSON.stringify(errorDetails, null, 2));
      if (error.response?.data) {
        console.error("[Fitroom API Error - Raw Response Data]:", error.response.data);
      }
      const errorMessage = error.response?.data?.error || error.response?.data?.message || error.response?.data?.detail || error.message || "Unknown error";
      const statusCode = error.response?.status || "unknown";
      const detailedError = `[${statusCode}] ${errorMessage}`;
      console.log(`[Fitroom] Detailed error: ${detailedError}`);
      
      // Write error to file for debugging
      try {
        const logPath = '/tmp/fitroom-errors.log';
        const logEntry = `${new Date().toISOString()} - Status: ${statusCode}, Message: ${errorMessage}, Full Response: ${JSON.stringify(error.response?.data)}\n`;
        fs.appendFileSync(logPath, logEntry);
      } catch (e) {
        console.error('[Fitroom] Failed to write error log:', e);
      }
      return {
        success: false,
        error: detailedError,
      };
    }
  }

  /**
   * Get the status of a try-on task
   * Poll this endpoint to check if processing is complete
   * 
   * @param taskId - Task ID returned from createTryOn
   * @returns Task status and result image URL when completed
   */
  async getTaskStatus(taskId: string): Promise<FitroomTaskStatusResponse> {
    try {
      const response = await this.client.get(`/api/tryon/v2/tasks/${taskId}`);

      console.log(`[Fitroom] Task status for ${taskId}:`, JSON.stringify(response.data));

      return {
        success: true,
        status: response.data.status,
        resultImage: response.data.download_signed_url || response.data.result_image,
        progress: response.data.progress,
        error: response.data.error,
        errorCode: response.data.error_code,
      };
    } catch (error: any) {
      console.error("[Fitroom API Error - Get Status]", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
        errorCode: error.response?.data?.error_code,
      };
    }
  }

  /**
   * Check model image suitability before try-on
   * Validates if the model image is suitable for virtual try-on
   * Uses official Fitroom API endpoint: /api/tryon/input_check/v1/model
   * 
   * @param modelImagePath - Path to model image
   * @returns Validation result with error code and user-friendly message
   */
  async validateModelImage(modelImagePath: string): Promise<{ valid: boolean; error?: string; errorCode?: string; userMessage?: string }> {
    try {
      if (!fs.existsSync(modelImagePath)) {
        return { valid: false, error: `Model image not found: ${modelImagePath}` };
      }

      const formData = new FormData();
      formData.append("input_image", fs.createReadStream(modelImagePath));

      const response = await this.client.post("/api/tryon/input_check/v1/model", formData, {
        headers: formData.getHeaders(),
      });

      console.log("[Fitroom] Model validation response:", JSON.stringify(response.data));

      // Parse error codes and provide user-friendly messages
      const errorCode = response.data.error_code || response.data.code;
      let userMessage = "";
      
      if (errorCode) {
        userMessage = this.getErrorMessage(errorCode);
      }

      return {
        valid: response.data.is_valid === true || response.data.valid === true,
        error: response.data.error || response.data.message,
        errorCode: errorCode,
        userMessage: userMessage,
      };
    } catch (error: any) {
      console.error("[Fitroom API Error - Validate Model]", error);
      const errorCode = error.response?.data?.error_code || error.response?.data?.code;
      return {
        valid: false,
        error: error instanceof Error ? error.message : "Unknown error",
        errorCode: errorCode,
        userMessage: errorCode ? this.getErrorMessage(errorCode) : "Failed to validate body photo. Please try again.",
      };
    }
  }

  /**
   * Check clothing image suitability before try-on
   * Validates if the clothing image is suitable for virtual try-on
   * Uses official Fitroom API endpoint: /api/tryon/input_check/v1/clothes
   * 
   * @param clothImagePath - Path to clothing image
   * @returns Validation result with error code and user-friendly message
   */
  async validateClothImage(clothImagePath: string): Promise<{ valid: boolean; error?: string; errorCode?: string; userMessage?: string }> {
    try {
      if (!fs.existsSync(clothImagePath)) {
        return { valid: false, error: `Cloth image not found: ${clothImagePath}` };
      }

      const formData = new FormData();
      formData.append("input_image", fs.createReadStream(clothImagePath));

      const response = await this.client.post("/api/tryon/input_check/v1/clothes", formData, {
        headers: formData.getHeaders(),
      });

      console.log("[Fitroom] Clothing validation response:", JSON.stringify(response.data));

      // Parse error codes and provide user-friendly messages
      const errorCode = response.data.error_code || response.data.code;
      let userMessage = "";
      
      if (errorCode) {
        userMessage = this.getErrorMessage(errorCode);
      }

      return {
        valid: response.data.is_valid === true || response.data.valid === true,
        error: response.data.error || response.data.message,
        errorCode: errorCode,
        userMessage: userMessage,
      };
    } catch (error: any) {
      console.error("[Fitroom API Error - Validate Cloth]", error);
      const errorCode = error.response?.data?.error_code || error.response?.data?.code;
      return {
        valid: false,
        error: error instanceof Error ? error.message : "Unknown error",
        errorCode: errorCode,
        userMessage: errorCode ? this.getErrorMessage(errorCode) : "Failed to validate clothing image. Please try again.",
      };
    }
  }

  /**
   * Map Fitroom error codes to user-friendly messages
   */
  private getErrorMessage(errorCode: string): string {
    const errorMessages: Record<string, string> = {
      // Model image errors (400xxx)
      "400001": "No person detected in the body photo. Please ensure your full body is visible in the image.",
      "400002": "Multiple people detected. Please upload a photo with only one person.",
      "400003": "Person is not facing forward. Please face the camera directly.",
      "400004": "Person is too small in the image. Please take a closer photo where your body fills most of the frame.",
      "400005": "Poor lighting detected. Please use better lighting or try a different photo.",
      "400006": "Background is too complex. Please use a simple, solid-colored background.",
      
      // Clothing image errors (400xxx)
      "400010": "No clothing detected in the image. Please ensure the clothing is clearly visible.",
      "400011": "Multiple clothing items detected. Please upload a photo with only one clothing item.",
      "400012": "Clothing is not clearly visible. Please ensure the clothing edges are distinct.",
      "400013": "Clothing is wrinkled or poorly positioned. Please use a flat, well-spread clothing image.",
      "400014": "Background is not suitable. Please use a white or solid-colored background for clothing images.",
      
      // Warnings (410xxx - processing may continue)
      "410001": "Body photo quality is lower than optimal. Try-on may still work but quality might be reduced.",
      "410002": "Clothing image quality is lower than optimal. Try-on may still work but quality might be reduced.",
      "410003": "Image resolution is low. For better results, use higher resolution images.",
    };
    
    return errorMessages[errorCode] || `Image validation failed (Code: ${errorCode}). Please try a different image.`;
  }

  /**
   * Check API connectivity and validate credentials
   */
  async validateCredentials(): Promise<boolean> {
    try {
      // Try to make a simple request to verify API key
      const response = await this.client.get("/api/tryon/v2/tasks");
      return true;
    } catch (error: any) {
      // 401 or 403 means auth failed, but endpoint exists
      if (error.response?.status === 401 || error.response?.status === 403) {
        console.error("[Fitroom] Invalid API key");
        return false;
      }
      // Other errors might mean endpoint doesn't exist
      console.error("[Fitroom Validation Error]", error.message);
      return false;
    }
  }
}

// Singleton instance
let fitroomClient: FitroomClient | null = null;

export function getFitroomClient(): FitroomClient {
  if (!fitroomClient) {
    if (!ENV.fitroomApiKey) {
      throw new Error("FITROOM_API_KEY is not configured");
    }
    fitroomClient = new FitroomClient(ENV.fitroomApiKey);
  }
  return fitroomClient;
}

export type { FitroomTryOnRequest, FitroomTryOnResponse, FitroomTaskStatusResponse };
