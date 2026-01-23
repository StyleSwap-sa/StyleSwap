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

    img.onload = () => {
      resolve({
        width: img.width,
        height: img.height,
      });
    };

    img.onerror = () => {
      reject(new Error("Failed to load image"));
    };

    if (source instanceof File) {
      const reader = new FileReader();
      reader.onload = (e) => {
        img.src = e.target?.result as string;
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
 */
export async function validateImageForFitroom(
  file: File,
  imageType: "clothing" | "model"
): Promise<{ valid: boolean; error?: string; warning?: string }> {
  // Check file type - only JPEG and PNG supported by Fitroom
  const supportedFormats = ["image/jpeg", "image/png", "image/jpg"];
  if (!supportedFormats.includes(file.type)) {
    return { valid: false, error: `Unsupported image format: ${file.type}. Please use JPEG or PNG.` };
  }
  
  if (!file.type.startsWith("image/")) {
    return { valid: false, error: "Please upload an image file" };
  }

  // Check file size (warn if > 10MB)
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

  // Check dimensions
  try {
    const dimensions = await getImageDimensions(file);
    const maxDimension = imageType === "clothing" ? 1024 : 2048;

    if (dimensions.width < 100 || dimensions.height < 100) {
      return {
        valid: false,
        error: "Image is too small (minimum 100x100px)",
      };
    }

    // Allow oversized images - they will be auto-resized
    if (
      dimensions.width > maxDimension ||
      dimensions.height > maxDimension
    ) {
      return {
        valid: true,
        warning: `Image will be automatically resized to fit ${maxDimension}px limit`,
      };
    }

    return { valid: true };
  } catch (error) {
    return { valid: false, error: "Failed to validate image dimensions" };
  }
}

/**
 * Convert image to JPEG format if needed
 */
export async function convertToJpeg(file: File): Promise<File> {
  if (file.type === "image/jpeg" || file.type === "image/png") {
    return file;
  }

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          reject(new Error("Failed to get canvas context"));
          return;
        }
        ctx.drawImage(img, 0, 0);
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(new Error("Failed to convert image"));
              return;
            }
            const newName = file.name.replace(/\.[^/.]+$/, ".jpg");
            const jpegFile = new File([blob], newName, { type: "image/jpeg" });
            resolve(jpegFile);
          },
          "image/jpeg",
          0.85
        );
      };
      img.onerror = () => reject(new Error("Failed to load image"));
      img.src = e.target?.result as string;
    };
    reader.onerror = () => reject(new Error("Failed to read file"));
    reader.readAsDataURL(file);
  });
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
