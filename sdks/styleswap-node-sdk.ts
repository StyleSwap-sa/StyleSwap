/**
 * StyleSwap Node.js SDK
 * 
 * Official SDK for integrating StyleSwap virtual try-on API into Node.js applications
 * 
 * Installation:
 * npm install styleswap-sdk
 * 
 * Usage:
 * const StyleSwap = require('styleswap-sdk');
 * const client = new StyleSwap.Client({
 *   clientId: 'your_client_id',
 *   clientSecret: 'your_client_secret'
 * });
 */

import axios, { AxiosInstance } from 'axios';

interface ClientConfig {
  clientId: string;
  clientSecret: string;
  baseUrl?: string;
  timeout?: number;
}

interface TokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  scope: string;
}

interface Product {
  id: string;
  external_id: string;
  name: string;
  description?: string;
  category: string;
  price: number;
  currency: string;
  image_url: string;
  image_urls?: string[];
  sizes: string[];
  colors: string[];
  gender: string;
  garment_type: string;
  material?: string;
  is_active: boolean;
  metadata?: Record<string, any>;
}

interface TryOnResult {
  id: string;
  status: 'processing' | 'completed' | 'failed';
  photo_id: string;
  product_id: string;
  result_url?: string;
  result_thumbnail_url?: string;
  confidence_score?: number;
  size: string;
  color: string;
  garment_part: 'top' | 'bottom';
  customer_id?: string;
  credits_used: number;
  generated_at: string;
  expires_at: string;
  error_message?: string;
}

interface Customer {
  id: string;
  external_id: string;
  email: string;
  first_name: string;
  last_name: string;
  phone?: string;
  gender?: string;
  country?: string;
  tryons_count: number;
  total_credits_used: number;
  last_tryon_at?: string;
  created_at: string;
  updated_at: string;
}

interface Analytics {
  period: {
    from: string;
    to: string;
  };
  summary: {
    total_tryons: number;
    total_customers: number;
    total_credits_used: number;
    average_confidence_score: number;
    total_shares: number;
    total_saves: number;
  };
  daily_data: Array<{
    date: string;
    tryons: number;
    new_customers: number;
    credits_used: number;
    shares: number;
    saves: number;
  }>;
}

/**
 * StyleSwap API Client
 * 
 * Main client class for interacting with the StyleSwap API
 */
export class StyleSwapClient {
  private config: ClientConfig;
  private client: AxiosInstance;
  private accessToken: string | null = null;
  private tokenExpiry: number | null = null;

  constructor(config: ClientConfig) {
    this.config = {
      baseUrl: 'https://api.styleswap.com/v1',
      timeout: 30000,
      ...config,
    };

    this.client = axios.create({
      baseURL: this.config.baseUrl,
      timeout: this.config.timeout,
    });

    // Add request interceptor for authentication
    this.client.interceptors.request.use(async (config) => {
      const token = await this.getAccessToken();
      config.headers.Authorization = `Bearer ${token}`;
      return config;
    });
  }

  /**
   * Get or refresh access token
   */
  private async getAccessToken(): Promise<string> {
    // Return cached token if still valid
    if (this.accessToken && this.tokenExpiry && Date.now() < this.tokenExpiry) {
      return this.accessToken;
    }

    const response = await this.client.post<TokenResponse>('/auth/token', {
      client_id: this.config.clientId,
      client_secret: this.config.clientSecret,
      grant_type: 'client_credentials',
    });

    this.accessToken = response.data.access_token;
    this.tokenExpiry = Date.now() + response.data.expires_in * 1000;

    return this.accessToken;
  }

  /**
   * Check API health
   */
  async health() {
    const response = await this.client.get('/auth/health');
    return response.data;
  }

  // ========================================================================
  // PRODUCT MANAGEMENT
  // ========================================================================

  /**
   * Create a new product
   */
  async createProduct(product: Omit<Product, 'id'>) {
    const response = await this.client.post('/products', product);
    return response.data;
  }

  /**
   * Get a product by ID
   */
  async getProduct(productId: string) {
    const response = await this.client.get(`/products/${productId}`);
    return response.data as Product;
  }

  /**
   * Update a product
   */
  async updateProduct(
    productId: string,
    updates: Partial<Product>
  ) {
    const response = await this.client.put(`/products/${productId}`, updates);
    return response.data;
  }

  /**
   * List products with pagination and filtering
   */
  async listProducts(options?: {
    page?: number;
    limit?: number;
    category?: string;
    is_active?: boolean;
    search?: string;
  }) {
    const response = await this.client.get('/products', { params: options });
    return response.data;
  }

  /**
   * Bulk upload products via CSV
   */
  async bulkUploadProducts(csvData: string, updateExisting: boolean = false) {
    const response = await this.client.post('/products/bulk-upload', {
      csv_data: csvData,
      update_existing: updateExisting,
    });
    return response.data;
  }

  /**
   * Check bulk upload status
   */
  async getBulkUploadStatus(jobId: string) {
    const response = await this.client.get(`/products/bulk-upload/${jobId}`);
    return response.data;
  }

  /**
   * Delete a product
   */
  async deleteProduct(productId: string) {
    const response = await this.client.delete(`/products/${productId}`);
    return response.data;
  }

  // ========================================================================
  // TRY-ON GENERATION
  // ========================================================================

  /**
   * Upload a customer photo
   */
  async uploadPhoto(
    photoBase64: string,
    customerId?: string,
    metadata?: Record<string, any>
  ) {
    const response = await this.client.post('/tryons/upload-photo', {
      photo_base64: photoBase64,
      customer_id: customerId,
      metadata,
    });
    return response.data;
  }

  /**
   * Generate a virtual try-on
   */
  async generateTryOn(options: {
    photo_id: string;
    product_id: string;
    size: string;
    color: string;
    garment_part: 'top' | 'bottom';
    customer_id?: string;
    session_id?: string;
    metadata?: Record<string, any>;
  }) {
    const response = await this.client.post('/tryons/generate', options);
    return response.data;
  }

  /**
   * Get try-on result
   */
  async getTryOnResult(tryonId: string): Promise<TryOnResult> {
    const response = await this.client.get(`/tryons/${tryonId}`);
    return response.data;
  }

  /**
   * Poll for try-on completion
   */
  async waitForTryOn(
    tryonId: string,
    maxWaitTime: number = 300000,
    pollInterval: number = 2000
  ): Promise<TryOnResult> {
    const startTime = Date.now();

    while (Date.now() - startTime < maxWaitTime) {
      const result = await this.getTryOnResult(tryonId);

      if (result.status === 'completed') {
        return result;
      } else if (result.status === 'failed') {
        throw new Error(`Try-on failed: ${result.error_message}`);
      }

      await new Promise((resolve) => setTimeout(resolve, pollInterval));
    }

    throw new Error(`Try-on generation timed out after ${maxWaitTime}ms`);
  }

  /**
   * List try-ons with filtering
   */
  async listTryOns(options?: {
    customer_id?: string;
    product_id?: string;
    status?: 'processing' | 'completed' | 'failed';
    page?: number;
    limit?: number;
  }) {
    const response = await this.client.get('/tryons', { params: options });
    return response.data;
  }

  /**
   * Save a try-on
   */
  async saveTryOn(
    tryonId: string,
    customerId: string,
    collectionName?: string,
    notes?: string
  ) {
    const response = await this.client.post(`/tryons/${tryonId}/save`, {
      customer_id: customerId,
      collection_name: collectionName,
      notes,
    });
    return response.data;
  }

  /**
   * Share a try-on
   */
  async shareTryOn(
    tryonId: string,
    expirationDays: number = 7,
    allowDownload: boolean = true,
    message?: string
  ) {
    const response = await this.client.post(`/tryons/${tryonId}/share`, {
      expiration_days: expirationDays,
      allow_download: allowDownload,
      message,
    });
    return response.data;
  }

  /**
   * Delete a try-on
   */
  async deleteTryOn(tryonId: string) {
    const response = await this.client.delete(`/tryons/${tryonId}`);
    return response.data;
  }

  // ========================================================================
  // CUSTOMER MANAGEMENT
  // ========================================================================

  /**
   * Create a new customer
   */
  async createCustomer(customer: Omit<Customer, 'id' | 'created_at' | 'updated_at' | 'tryons_count' | 'total_credits_used'>) {
    const response = await this.client.post('/customers', customer);
    return response.data;
  }

  /**
   * Get customer details
   */
  async getCustomer(customerId: string): Promise<Customer> {
    const response = await this.client.get(`/customers/${customerId}`);
    return response.data;
  }

  /**
   * Update customer information
   */
  async updateCustomer(
    customerId: string,
    updates: Partial<Omit<Customer, 'id' | 'created_at' | 'updated_at'>>
  ) {
    const response = await this.client.put(`/customers/${customerId}`, updates);
    return response.data;
  }

  /**
   * List customers with pagination
   */
  async listCustomers(options?: {
    page?: number;
    limit?: number;
    country?: string;
    search?: string;
  }) {
    const response = await this.client.get('/customers', { params: options });
    return response.data;
  }

  // ========================================================================
  // ANALYTICS
  // ========================================================================

  /**
   * Get account-level analytics
   */
  async getAccountAnalytics(
    dateFrom: string,
    dateTo: string,
    granularity: 'daily' | 'weekly' | 'monthly' = 'daily'
  ): Promise<Analytics> {
    const response = await this.client.get('/analytics/account', {
      params: {
        date_from: dateFrom,
        date_to: dateTo,
        granularity,
      },
    });
    return response.data;
  }

  /**
   * Get product-level analytics
   */
  async getProductAnalytics(
    productId: string,
    dateFrom: string,
    dateTo: string
  ) {
    const response = await this.client.get(`/analytics/products/${productId}`, {
      params: {
        date_from: dateFrom,
        date_to: dateTo,
      },
    });
    return response.data;
  }

  /**
   * Get customer-level analytics
   */
  async getCustomerAnalytics(customerId: string) {
    const response = await this.client.get(`/analytics/customers/${customerId}`);
    return response.data;
  }
}

/**
 * Export for CommonJS and ES modules
 */
export default StyleSwapClient;
