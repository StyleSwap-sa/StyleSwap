/**
 * Save Try-On Results to Phone Gallery
 * Supports both mobile and desktop platforms
 */

import type { WatermarkPosition } from './watermarkUtils';

export interface WatermarkConfig {
  position: WatermarkPosition;
  opacity: number;
}

export interface SaveOptions {
  filename?: string;
  format?: 'png' | 'jpeg';
  quality?: number; // 0-1, only for JPEG
  watermark?: WatermarkConfig;
}

/**
 * Convert canvas or image element to blob
 */
export async function canvasToBlob(
  canvas: HTMLCanvasElement,
  format: 'png' | 'jpeg' = 'png',
  quality: number = 0.95
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const mimeType = format === 'png' ? 'image/png' : 'image/jpeg';
    canvas.toBlob(
      (blob) => {
        if (blob) {
          resolve(blob);
        } else {
          reject(new Error('Failed to convert canvas to blob'));
        }
      },
      mimeType,
      quality
    );
  });
}

/**
 * Convert image URL to blob
 */
export async function imageUrlToBlob(imageUrl: string): Promise<Blob> {
  try {
    const response = await fetch(imageUrl);
    if (!response.ok) {
      throw new Error(`Failed to fetch image: ${response.statusText}`);
    }
    return await response.blob();
  } catch (error) {
    throw new Error(`Failed to convert image URL to blob: ${error}`);
  }
}

/**
 * Download image to device (desktop and mobile)
 * Works on all modern browsers
 */
export async function downloadImage(
  blob: Blob,
  filename: string
): Promise<void> {
  try {
    // Create object URL
    const url = URL.createObjectURL(blob);

    // Create temporary anchor element
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;

    // Trigger download
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    // Cleanup
    URL.revokeObjectURL(url);
  } catch (error) {
    throw new Error(`Failed to download image: ${error}`);
  }
}

/**
 * Save canvas to gallery (desktop download)
 */
export async function saveCanvasToGallery(
  canvas: HTMLCanvasElement,
  options: SaveOptions = {}
): Promise<void> {
  const {
    filename = `StyleSwap-${new Date().getTime()}.png`,
    format = 'png',
    quality = 0.95,
    watermark,
  } = options;

  try {
    let finalCanvas = canvas;

    // Apply watermark if requested
    if (watermark) {
      const { addWatermarkToCanvas } = await import('./watermarkUtils');
      finalCanvas = addWatermarkToCanvas(canvas, {
        position: watermark.position,
        opacity: watermark.opacity,
      });
    }

    const blob = await canvasToBlob(finalCanvas, format, quality);
    await downloadImage(blob, filename);
  } catch (error) {
    throw new Error(`Failed to save canvas to gallery: ${error}`);
  }
}

/**
 * Save image URL to gallery with proper format conversion
 */
export async function saveImageToGallery(
  imageUrl: string,
  options: SaveOptions = {}
): Promise<void> {
  const {
    filename = `StyleSwap-${new Date().getTime()}.png`,
    format = 'png',
    quality = 0.95,
    watermark,
  } = options;

  try {
    // Fetch the image
    const response = await fetch(imageUrl);
    if (!response.ok) {
      throw new Error(`Failed to fetch image: ${response.statusText}`);
    }
    
    const blob = await response.blob();
    const img = new Image();
    const url = URL.createObjectURL(blob);
    
    // Wait for image to load
    await new Promise((resolve, reject) => {
      img.onload = resolve;
      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = url;
    });
    
    // Create canvas and draw image
    const canvas = document.createElement('canvas');
    canvas.width = img.width;
    canvas.height = img.height;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Failed to get canvas context');
    ctx.drawImage(img, 0, 0);
    
    // Clean up
    URL.revokeObjectURL(url);
    
    // Apply watermark if requested
    let finalCanvas = canvas;
    if (watermark) {
      const { addWatermarkToCanvas } = await import('./watermarkUtils');
      finalCanvas = addWatermarkToCanvas(canvas, {
        position: watermark.position,
        opacity: watermark.opacity,
      });
    }
    
    // Convert to desired format
    const outputBlob = await canvasToBlob(finalCanvas, format, quality);
    await downloadImage(outputBlob, filename);
  } catch (error) {
    throw new Error(`Failed to save image to gallery: ${error}`);
  }
}

/**
 * Save HTML element (containing image) to gallery
 */
export async function saveElementToGallery(
  element: HTMLElement,
  options: SaveOptions = {}
): Promise<void> {
  try {
    // Try to find image in element
    const img = element.querySelector('img') as HTMLImageElement;
    if (img && img.src) {
      await saveImageToGallery(img.src, options);
      return;
    }

    // Try to find canvas in element
    const canvas = element.querySelector('canvas') as HTMLCanvasElement;
    if (canvas) {
      await saveCanvasToGallery(canvas, options);
      return;
    }

    throw new Error('No image or canvas found in element');
  } catch (error) {
    throw new Error(`Failed to save element to gallery: ${error}`);
  }
}

/**
 * Generate filename with timestamp
 */
export function generateFilename(
  prefix: string = 'StyleSwap',
  format: 'png' | 'jpeg' = 'png'
): string {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
  const extension = format === 'png' ? 'png' : 'jpg';
  return `${prefix}-${timestamp}.${extension}`;
}

/**
 * Check if browser supports file download
 */
export function isDownloadSupported(): boolean {
  const link = document.createElement('a');
  return typeof link.download !== 'undefined';
}

/**
 * Check if browser supports File System Access API (advanced)
 */
export async function isFileSystemAccessSupported(): Promise<boolean> {
  try {
    return 'showSaveFilePicker' in window;
  } catch {
    return false;
  }
}

/**
 * Save using File System Access API (desktop only, more control)
 */
export async function saveUsingFileSystemAPI(
  blob: Blob,
  filename: string
): Promise<void> {
  try {
    if (!('showSaveFilePicker' in window)) {
      throw new Error('File System Access API not supported');
    }

    const handle = await (window as any).showSaveFilePicker({
      suggestedName: filename,
      types: [
        {
          description: 'Images',
          accept: {
            'image/png': ['.png'],
            'image/jpeg': ['.jpg', '.jpeg'],
          },
        },
      ],
    });

    const writable = await handle.createWritable();
    await writable.write(blob);
    await writable.close();
  } catch (error) {
    if ((error as Error).name === 'AbortError') {
      throw new Error('Save cancelled by user');
    }
    throw new Error(`Failed to save using File System API: ${error}`);
  }
}

/**
 * Copy image to clipboard (for sharing)
 */
export async function copyImageToClipboard(blob: Blob): Promise<void> {
  try {
    if (!navigator.clipboard) {
      throw new Error('Clipboard API not supported');
    }

    await navigator.clipboard.write([
      new ClipboardItem({
        [blob.type]: blob,
      }),
    ]);
  } catch (error) {
    throw new Error(`Failed to copy image to clipboard: ${error}`);
  }
}

/**
 * Share image (using Web Share API if available)
 */
export async function shareImage(
  blob: Blob,
  filename: string,
  title: string = 'My StyleSwap Try-On'
): Promise<void> {
  try {
    if (!navigator.share) {
      throw new Error('Web Share API not supported');
    }

    const file = new File([blob], filename, { type: blob.type });

    await navigator.share({
      files: [file],
      title,
      text: 'Check out my virtual try-on with StyleSwap!',
    });
  } catch (error) {
    if ((error as Error).name === 'AbortError') {
      throw new Error('Share cancelled by user');
    }
    throw new Error(`Failed to share image: ${error}`);
  }
}

/**
 * Get file size in MB
 */
export function getFileSizeInMB(blob: Blob): number {
  return blob.size / (1024 * 1024);
}

/**
 * Validate image blob
 */
export function validateImageBlob(blob: Blob): { valid: boolean; error?: string } {
  const maxSizeMB = 10;
  const validTypes = ['image/png', 'image/jpeg', 'image/webp'];

  if (!validTypes.includes(blob.type)) {
    return {
      valid: false,
      error: `Invalid image type. Supported: PNG, JPEG, WebP`,
    };
  }

  const sizeMB = getFileSizeInMB(blob);
  if (sizeMB > maxSizeMB) {
    return {
      valid: false,
      error: `Image size (${sizeMB.toFixed(2)}MB) exceeds maximum (${maxSizeMB}MB)`,
    };
  }

  return { valid: true };
}
