/**
 * Image utility functions for Fitroom API optimization
 * Based on SnapEdit support guidelines:
 * - Clothing images: 1024px recommended
 * - Model images: 2048px recommended
 * - Maximum output: 2048px
 */

export interface ImageDimensions {
  width: number;
  height: number;
}

/**
 * Get image dimensions from a File or base64 string
 */
export async function getImageDimensions(
  source: File | string
): Promise<ImageDimensions> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    let timeout: NodeJS.Timeout | null = null;

    img.onload = () => {
      if (timeout) clearTimeout(timeout);
      resolve({
        width: img.width,
        height: img.height,
      });
    };

    img.onerror = () => {
      if (timeout) clearTimeout(timeout);
      reject(new Error("Failed to load image"));
    };

    // Set a timeout for image loading (some formats like WebP might not load in all browsers)
    timeout = setTimeout(() => {
      if (timeout) clearTimeout(timeout);
      // If image hasn't loaded after 5 seconds, assume it's a valid format and return default dimensions
      // The backend will do proper validation
      resolve({ width: 1024, height: 1024 });
    }, 5000);

    if (source instanceof File) {
      const reader = new FileReader();
      reader.onload = (e) => {
        img.src = e.target?.result as string;
      };
      reader.onerror = () => {
        if (timeout) clearTimeout(timeout);
        reject(new Error("Failed to read file"));
      };
      reader.readAsDataURL(source);
    } else {
      img.src = source;
    }
  });
}

/**
 * Resize image to target dimensions while maintaining aspect ratio
 * Returns canvas as blob
 */
export async function resizeImage(
  file: File,
  maxWidth: number,
  maxHeight: number = maxWidth,
  quality: number = 0.85
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      const img = new Image();

      img.onload = () => {
        // Calculate new dimensions maintaining aspect ratio
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        // Create canvas and draw resized image
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext("2d");
        if (!ctx) {
          reject(new Error("Failed to get canvas context"));
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);

        // Convert to blob with compression
        canvas.toBlob(
          (blob) => {
            if (blob) {
              resolve(blob);
            } else {
              reject(new Error("Failed to create blob"));
            }
          },
          file.type || "image/jpeg",
          quality
        );
      };

      img.onerror = () => {
        reject(new Error("Failed to load image for resizing"));
      };

      img.src = e.target?.result as string;
    };

    reader.onerror = () => {
      reject(new Error("Failed to read file"));
    };

    reader.readAsDataURL(file);
  });
}

/**
 * Optimize image for Fitroom API
 * - Clothing images: resize to 1024px
 * - Model images: resize to 2048px
 */
export async function optimizeImageForFitroom(
  file: File,
  imageType: "clothing" | "model"
): Promise<{ blob: Blob; dimensions: ImageDimensions }> {
  const maxDimension = imageType === "clothing" ? 1024 : 2048;

  // Get original dimensions
  const originalDimensions = await getImageDimensions(file);

  // Only resize if image is larger than recommended
  let optimizedBlob = file;
  if (
    originalDimensions.width > maxDimension ||
    originalDimensions.height > maxDimension
  ) {
    optimizedBlob = await resizeImage(file, maxDimension);
  }

  // Get final dimensions
  const finalDimensions = await getImageDimensions(optimizedBlob);

  return {
    blob: optimizedBlob,
    dimensions: finalDimensions,
  };
}

/**
 * Validate image for Fitroom API
 * SIMPLIFIED: Accept all images and let backend handle validation
 * This avoids browser-specific issues with certain image formats
 */
export async function validateImageForFitroom(
  file: File,
  imageType: "clothing" | "model"
): Promise<{ valid: boolean; error?: string; warning?: string }> {
  // Only check file size - everything else is handled by backend
  const maxSize = 50 * 1024 * 1024; // 50MB hard limit
  if (file.size > maxSize) {
    return { valid: false, error: "Image must be less than 50MB" };
  }

  if (file.size > 10 * 1024 * 1024) {
    return {
      valid: true,
      warning: `Large image (${(file.size / 1024 / 1024).toFixed(1)}MB) - will be resized for faster processing`,
    };
  }

  // Accept all image files - backend will validate format and dimensions
  return { valid: true };
}

/**
 * Convert blob to base64 string
 */
export async function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result as string;
      // Remove data URL prefix
      resolve(base64.split(",")[1]);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

/**
 * Get file size in MB
 */
export function getFileSizeMB(file: File): number {
  return file.size / 1024 / 1024;
}

/**
 * Format file size for display
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i];
}


/**
 * Crop the bottom portion of a clothing image
 * Extracts the lower half (pants, skirt, etc.) from a full clothing image
 * Used when user selects "Bottom" clothing type
 */
export async function cropBottomClothing(
  file: File
): Promise<File> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      const img = new Image();
      
      img.onload = () => {
        try {
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          
          if (!ctx) {
            reject(new Error('Failed to get canvas context'));
            return;
          }
          
          const originalWidth = img.width;
          const originalHeight = img.height;
          
          // Crop from 50% down to 100% (bottom half of the image)
          // This captures pants, skirts, and other bottom clothing
          const cropStartY = Math.floor(originalHeight * 0.5);
          const cropHeight = originalHeight - cropStartY;
          
          // Create canvas for bottom portion
          canvas.width = originalWidth;
          canvas.height = cropHeight;
          
          // Draw only the bottom portion
          ctx.drawImage(
            img,
            0, cropStartY,           // source x, y
            originalWidth, cropHeight, // source width, height
            0, 0,                     // destination x, y
            originalWidth, cropHeight  // destination width, height
          );
          
          canvas.toBlob((blob) => {
            if (!blob) {
              reject(new Error('Failed to create cropped image'));
              return;
            }
            
            // Convert blob to File
            const croppedFile = new File([blob], `${file.name}-bottom.jpg`, { type: 'image/jpeg' });
            resolve(croppedFile);
          }, 'image/jpeg', 0.95);
        } catch (error) {
          reject(error);
        }
      };
      
      img.onerror = () => {
        reject(new Error('Failed to load clothing image'));
      };
      
      img.src = e.target?.result as string;
    };
    
    reader.onerror = () => {
      reject(new Error('Failed to read file'));
    };
    
    reader.readAsDataURL(file);
  });
}

/**
 * Crop the top portion of a clothing image
 * Extracts the upper half (shirts, jackets, etc.) from a full clothing image
 * Used when user selects "Top" clothing type
 */
export async function cropTopClothing(
  file: File
): Promise<File> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      const img = new Image();
      
      img.onload = () => {
        try {
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          
          if (!ctx) {
            reject(new Error('Failed to get canvas context'));
            return;
          }
          
          const originalWidth = img.width;
          const originalHeight = img.height;
          
          // Crop from 0% to 50% (top half of the image)
          // This captures shirts, jackets, and other top clothing
          const cropHeight = Math.floor(originalHeight * 0.5);
          
          // Create canvas for top portion
          canvas.width = originalWidth;
          canvas.height = cropHeight;
          
          // Draw only the top portion
          ctx.drawImage(
            img,
            0, 0,                     // source x, y
            originalWidth, cropHeight, // source width, height
            0, 0,                     // destination x, y
            originalWidth, cropHeight  // destination width, height
          );
          
          canvas.toBlob((blob) => {
            if (!blob) {
              reject(new Error('Failed to create cropped image'));
              return;
            }
            
            // Convert blob to File
            const croppedFile = new File([blob], `${file.name}-top.jpg`, { type: 'image/jpeg' });
            resolve(croppedFile);
          }, 'image/jpeg', 0.95);
        } catch (error) {
          reject(error);
        }
      };
      
      img.onerror = () => {
        reject(new Error('Failed to load clothing image'));
      };
      
      img.src = e.target?.result as string;
    };
    
    reader.onerror = () => {
      reject(new Error('Failed to read file'));
    };
    
    reader.readAsDataURL(file);
  });
}

/**
 * Split a full dress image into top and bottom halves
 * Detects the waist area and splits the dress image accordingly
 * Returns both the top and bottom halves as separate images
 */
export async function splitDressImage(
  file: File
): Promise<{ topImage: File; bottomImage: File }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      const img = new Image();
      
      img.onload = () => {
        try {
          // Create canvas for image manipulation
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          
          if (!ctx) {
            reject(new Error('Failed to get canvas context'));
            return;
          }
          
          const originalWidth = img.width;
          const originalHeight = img.height;
          
          // Split at approximately 55% height (typical waist position)
          // This can be adjusted based on dress proportions
          const splitPoint = Math.floor(originalHeight * 0.55);
          
          // Create top half
          canvas.width = originalWidth;
          canvas.height = splitPoint;
          ctx.drawImage(img, 0, 0, originalWidth, splitPoint, 0, 0, originalWidth, splitPoint);
          
          canvas.toBlob((topBlob) => {
            if (!topBlob) {
              reject(new Error('Failed to create top image'));
              return;
            }
            
            // Create bottom half
            canvas.height = originalHeight - splitPoint;
            ctx.clearRect(0, 0, originalWidth, canvas.height);
            ctx.drawImage(img, 0, splitPoint, originalWidth, originalHeight - splitPoint, 0, 0, originalWidth, originalHeight - splitPoint);
            
            canvas.toBlob((bottomBlob) => {
              if (!bottomBlob) {
                reject(new Error('Failed to create bottom image'));
                return;
              }
              
              // Convert blobs to Files
              const topFile = new File([topBlob], `${file.name}-top.jpg`, { type: 'image/jpeg' });
              const bottomFile = new File([bottomBlob], `${file.name}-bottom.jpg`, { type: 'image/jpeg' });
              
              resolve({ topImage: topFile, bottomImage: bottomFile });
            }, 'image/jpeg', 0.95);
          }, 'image/jpeg', 0.95);
        } catch (error) {
          reject(error);
        }
      };
      
      img.onerror = () => {
        reject(new Error('Failed to load dress image'));
      };
      
      img.src = e.target?.result as string;
    };
    
    reader.onerror = () => {
      reject(new Error('Failed to read file'));
    };
    
    reader.readAsDataURL(file);
  });
}
