import axios, { AxiosInstance } from "axios";
import FormData from "form-data";
import fs from "fs";
import path from "path";
import { ENV } from "./env";

/**
 * Fitroom API Client
 * Handles all communication with Fitroom's virtual try-on rendering engine
 * API Docs: https://developer.fitroom.app/
 */

interface FitroomTryOnRequest {
  modelImagePath: string; // Path to customer's body photo
  clothImagePath: string; // Path to garment image
  clothType: "upper" | "lower" | "full_set" | "combo"; // Type of clothing
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
  error?: string;
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
      const response = await this.client.post("/api/tryon/v2/tasks", formData, {
        headers: formData.getHeaders(),
      });

      return {
        success: true,
        taskId: response.data.task_id,
        status: response.data.status,
      };
    } catch (error) {
      console.error("[Fitroom API Error - Create Try-On]", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
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

      return {
        success: true,
        status: response.data.status,
        resultImage: response.data.result_image,
      };
    } catch (error) {
      console.error("[Fitroom API Error - Get Status]", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  /**
   * Check model image suitability before try-on
   * Validates if the model image is suitable for virtual try-on
   * Uses official Fitroom API endpoint: /api/tryon/input_check/v1/model
   * 
   * @param modelImagePath - Path to model image
   * @returns Validation result
   */
  async validateModelImage(modelImagePath: string): Promise<{ valid: boolean; error?: string }> {
    try {
      if (!fs.existsSync(modelImagePath)) {
        return { valid: false, error: `Model image not found: ${modelImagePath}` };
      }

      const formData = new FormData();
      formData.append("input_image", fs.createReadStream(modelImagePath));

      const response = await this.client.post("/api/tryon/input_check/v1/model", formData, {
        headers: formData.getHeaders(),
      });

      return {
        valid: response.data.valid === true,
        error: response.data.error,
      };
    } catch (error) {
      console.error("[Fitroom API Error - Validate Model]", error);
      return {
        valid: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  /**
   * Check clothing image suitability before try-on
   * Validates if the clothing image is suitable for virtual try-on
   * Uses official Fitroom API endpoint: /api/tryon/input_check/v1/clothes
   * 
   * @param clothImagePath - Path to clothing image
   * @returns Validation result
   */
  async validateClothImage(clothImagePath: string): Promise<{ valid: boolean; error?: string }> {
    try {
      if (!fs.existsSync(clothImagePath)) {
        return { valid: false, error: `Cloth image not found: ${clothImagePath}` };
      }

      const formData = new FormData();
      formData.append("input_image", fs.createReadStream(clothImagePath));

      const response = await this.client.post("/api/tryon/input_check/v1/clothes", formData, {
        headers: formData.getHeaders(),
      });

      return {
        valid: response.data.valid === true,
        error: response.data.error,
      };
    } catch (error) {
      console.error("[Fitroom API Error - Validate Cloth]", error);
      return {
        valid: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
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
