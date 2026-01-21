import axios, { AxiosInstance } from "axios";
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
      
      // Calculate base64 sizes for logging
      const modelBase64Size = Buffer.byteLength(request.modelImageBase64, 'utf8');
      const clothBase64Size = Buffer.byteLength(request.clothImageBase64, 'utf8');
      
      console.log("[Fitroom] Model image base64 size:", modelBase64Size, "bytes");
      console.log("[Fitroom] Cloth image base64 size:", clothBase64Size, "bytes");

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

      // Add HD mode if specified
      if (request.hdMode) {
        (payload as any).hd_mode = true;
      }

      console.log("[Fitroom] Sending POST to /api/tryon/v2/tasks with base64 JSON payload");
      console.log("[Fitroom] Payload keys:", Object.keys(payload));
      
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
      const errorMessage = error.response?.data?.reason || error.response?.data?.error || error.message || "Unknown error";
      console.error("[Fitroom] ERROR - Response data:", error.response?.data);
      return {
        success: false,
        error: errorMessage,
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

      // Create form data with buffers instead of streams
      const formData = new FormData();
      const modelBuffer = fs.readFileSync(request.modelImagePath);
      const clothBuffer = fs.readFileSync(request.clothImagePath);
      
      // Append as buffers with proper file names and MIME types
      formData.append("model_image", modelBuffer, {
        filename: path.basename(request.modelImagePath),
        contentType: this.getMimeType(request.modelImagePath),
      });
      formData.append("cloth_image", clothBuffer, {
        filename: path.basename(request.clothImagePath),
        contentType: this.getMimeType(request.clothImagePath),
      });
      formData.append("cloth_type", request.clothType);

      console.log("[Fitroom] FormData fields: cloth_type=" + request.clothType);

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
      console.log("[Fitroom] Sending POST to /api/tryon/v2/tasks");
      const response = await this.client.post("/api/tryon/v2/tasks", formData, {
        headers: formData.getHeaders(),
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
      console.error("[Fitroom] ERROR - API call failed");
      
      // Log detailed error information
      const errorDetails = {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        message: error.message,
        code: error.code,
      };
      
      console.error("[Fitroom] ERROR - Full details:", JSON.stringify(errorDetails, null, 2));
      
      if (error.response?.data) {
        console.error("[Fitroom] ERROR - Response body:", error.response.data);
        if (typeof error.response.data === 'object') {
          Object.entries(error.response.data).forEach(([key, value]) => {
            console.error(`[Fitroom] ERROR - ${key}:`, value);
          });
        }
      }
      
      const errorMessage = error.response?.data?.error || error.response?.data?.message || error.response?.data?.detail || error.message || "Unknown error";
      const statusCode = error.response?.status || "unknown";
      const detailedError = `[${statusCode}] ${errorMessage}`;
      
      console.error(`[Fitroom] ERROR - Detailed: ${detailedError}`);
      console.error(`[Fitroom] ERROR - Code: ${error.code}`);
      
      // Write error to file
      try {
        const logPath = '/tmp/fitroom-errors.log';
        const timestamp = new Date().toISOString();
        const logEntry = `\n=== Fitroom API Error [${timestamp}] ===\nStatus: ${statusCode}\nMessage: ${errorMessage}\nCode: ${error.code}\nFull Response: ${JSON.stringify(error.response?.data, null, 2)}\n`;
        fs.appendFileSync(logPath, logEntry);
        console.log('[Fitroom] Error logged to /tmp/fitroom-errors.log');
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
      console.log(`[Fitroom] Polling task status: ${taskId}`);
      const response = await this.client.get(`/api/tryon/v2/tasks/${taskId}`);

      console.log(`[Fitroom] Task status response:`, JSON.stringify(response.data));

      return {
        success: true,
        status: response.data.status,
        resultImage: response.data.download_signed_url || response.data.result_image,
        progress: response.data.progress,
        error: response.data.error,
        errorCode: response.data.error_code,
      };
    } catch (error: any) {
      console.error("[Fitroom] ERROR - Get Status failed:", error.message);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
        errorCode: error.response?.data?.error_code,
      };
    }
  }

  /**
   * Check model image suitability before try-on
   */
  async validateModelImage(modelImagePath: string): Promise<{ valid: boolean; error?: string; errorCode?: string; userMessage?: string }> {
    try {
      if (!fs.existsSync(modelImagePath)) {
        return { valid: false, error: `Model image not found: ${modelImagePath}` };
      }

      console.log("[Fitroom] Validating model image:", modelImagePath);
      const formData = new FormData();
      formData.append("input_image", fs.createReadStream(modelImagePath));

      const response = await this.client.post("/api/tryon/input_check/v1/model", formData, {
        headers: formData.getHeaders(),
      });

      console.log("[Fitroom] Model validation response:", JSON.stringify(response.data));

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
      console.error("[Fitroom] ERROR - Model validation failed:", error.message);
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
   */
  async validateClothImage(clothImagePath: string): Promise<{ valid: boolean; error?: string; errorCode?: string; userMessage?: string }> {
    try {
      if (!fs.existsSync(clothImagePath)) {
        return { valid: false, error: `Cloth image not found: ${clothImagePath}` };
      }

      console.log("[Fitroom] Validating clothing image:", clothImagePath);
      const formData = new FormData();
      formData.append("input_image", fs.createReadStream(clothImagePath));

      const response = await this.client.post("/api/tryon/input_check/v1/clothes", formData, {
        headers: formData.getHeaders(),
      });

      console.log("[Fitroom] Clothing validation response:", JSON.stringify(response.data));

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
      console.error("[Fitroom] ERROR - Clothing validation failed:", error.message);
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
   * Convert Fitroom error codes to user-friendly messages
   */
  private getErrorMessage(errorCode: string | number): string {
    const codeStr = String(errorCode);
    
    // Model validation errors (400xxx)
    const modelErrors: { [key: string]: string } = {
      "400001": "No person detected in the image. Please upload a clear photo with a person visible.",
      "400002": "Multiple people detected. Please upload a photo with only one person.",
      "400003": "Person not facing forward. Please upload a photo where the person is facing the camera.",
      "400004": "Person too small in the image. Please upload a photo where the person takes up more of the frame.",
      "400005": "Person partially cut off. Please upload a full-body photo.",
      "400006": "Image quality too low. Please upload a clearer image.",
      "400007": "Background too complex. Please use a simple, plain background.",
      "400008": "Clothing obscuring body. Please wear fitted clothing.",
      "400009": "Body pose not suitable. Please stand straight and face the camera.",
      "400010": "Image resolution too low. Please upload a higher resolution image.",
      "400011": "Image too dark or too bright. Please ensure proper lighting.",
      "400012": "Person wearing accessories blocking body. Please remove large accessories.",
      "400013": "Image format not supported. Please use PNG, JPG, or GIF.",
      "400014": "Image file too large. Please compress the image.",
    };

    // Clothing validation errors (400xxx)
    const clothErrors: { [key: string]: string } = {
      "400101": "No clothing detected. Please upload a clear image of the garment.",
      "400102": "Multiple clothing items detected. Please upload a single garment.",
      "400103": "Clothing partially cut off. Please upload a complete view of the garment.",
      "400104": "Clothing quality too low. Please upload a clearer image.",
      "400105": "Background too complex. Please use a simple, plain background.",
      "400106": "Clothing wrinkled or folded. Please use a smooth, flat image.",
      "400107": "Clothing color not visible. Please ensure good lighting.",
      "400108": "Image resolution too low. Please upload a higher resolution image.",
      "400109": "Image too dark or too bright. Please ensure proper lighting.",
      "400110": "Clothing with patterns hard to process. Please try a simpler design.",
      "400111": "Image format not supported. Please use PNG, JPG, or GIF.",
      "400112": "Image file too large. Please compress the image.",
    };

    // Warnings (410xxx)
    const warnings: { [key: string]: string } = {
      "410001": "Image quality is acceptable but could be improved for better results.",
      "410002": "Clothing may not process optimally. Consider using a clearer image.",
      "410003": "Body photo quality is acceptable but could be improved.",
    };

    return modelErrors[codeStr] || clothErrors[codeStr] || warnings[codeStr] || `Error code: ${codeStr}`;
  }
}


// Singleton instance
let fitroomClient: FitroomClient | null = null;

/**
 * Get or create the Fitroom API client singleton
 * Ensures only one client instance is used throughout the application
 */
export function getFitroomClient(): FitroomClient {
  if (!fitroomClient) {
    // Get API key from environment
    const apiKey = process.env.FITROOM_API_KEY;
    if (!apiKey) {
      throw new Error("FITROOM_API_KEY is not configured");
    }
    fitroomClient = new FitroomClient(apiKey);
  }
  return fitroomClient;
}


