import { storagePut } from './storage';
import crypto from 'crypto';
import { ENV } from './_core/env';

/**
 * Generate a unique filename for product image
 */
function generateImageFilename(boutiqueId: number, productName: string, originalFilename: string): string {
  const timestamp = Date.now();
  const random = crypto.randomBytes(4).toString('hex');
  const ext = originalFilename.split('.').pop() || 'jpg';
  const sanitizedName = productName.toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 20);
  return `products/${boutiqueId}/${sanitizedName}-${timestamp}-${random}.${ext}`;
}

/**
 * Upload product image to S3
 */
export async function uploadProductImage(options: {
  boutiqueId: number;
  productName: string;
  fileBuffer: Buffer;
  filename: string;
  mimeType: string;
}): Promise<{ success: boolean; url?: string; error?: string }> {
  try {
    console.log("[Product Upload] Starting upload, checking ENV:");
    console.log("  - ENV.awsAccessKeyId exists:", !!ENV.awsAccessKeyId);
    
    const fileKey = generateImageFilename(options.boutiqueId, options.productName, options.filename);
    
    const result = await storagePut(fileKey, options.fileBuffer, options.mimeType);
    
    if (result.url) {
      return { success: true, url: result.url };
    } else {
      return { success: false, error: 'Failed to upload image' };
    }
  } catch (error: any) {
    console.error('[Product Upload] Error uploading image:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Validate image file
 */
export function validateImageFile(file: {
  size: number;
  type: string;
  name: string;
}): { valid: boolean; error?: string } {
  const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
  const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

  if (file.size > MAX_FILE_SIZE) {
    return { valid: false, error: 'File size exceeds 5MB limit' };
  }

  if (!ALLOWED_TYPES.includes(file.type)) {
    return { valid: false, error: 'Only JPEG, PNG, WebP, and GIF images are allowed' };
  }

  if (!file.name) {
    return { valid: false, error: 'Filename is required' };
  }

  return { valid: true };
}
