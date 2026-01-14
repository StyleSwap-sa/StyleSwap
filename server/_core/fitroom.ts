import axios, { AxiosInstance } from "axios";
import { ENV } from "./env";

/**
 * Fitroom API Client
 * Handles all communication with Fitroom's virtual try-on rendering engine
 */

interface FitroomTryOnRequest {
  userImage: string; // Base64 encoded user image
  garmentImage: string; // Base64 encoded garment image
  garmentDescription?: string;
}

interface FitroomTryOnResponse {
  success: boolean;
  resultImage?: string; // Base64 encoded result image
  error?: string;
  requestId?: string;
}

class FitroomClient {
  private client: AxiosInstance;
  private apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
    this.client = axios.create({
      baseURL: "https://api.fitroom.app/v1",
      timeout: 30000,
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
    });
  }

  /**
   * Create a virtual try-on request
   * Sends user image and garment image to Fitroom for rendering
   */
  async createTryOn(request: FitroomTryOnRequest): Promise<FitroomTryOnResponse> {
    try {
      const response = await this.client.post("/try-on", {
        userImage: request.userImage,
        garmentImage: request.garmentImage,
        garmentDescription: request.garmentDescription,
      });

      return {
        success: true,
        resultImage: response.data.resultImage,
        requestId: response.data.requestId,
      };
    } catch (error) {
      console.error("[Fitroom API Error]", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  /**
   * Check API connectivity and validate credentials
   */
  async validateCredentials(): Promise<boolean> {
    try {
      const response = await this.client.get("/health");
      return response.status === 200;
    } catch (error) {
      console.error("[Fitroom Validation Error]", error);
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

export type { FitroomTryOnRequest, FitroomTryOnResponse };
