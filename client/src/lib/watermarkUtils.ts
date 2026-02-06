/**
 * Watermark utilities for adding branding to saved images
 */

export type WatermarkPosition = 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'center';

export interface WatermarkOptions {
  text: string;
  position: WatermarkPosition;
  opacity: number; // 0-1
  fontSize: number;
  fontFamily: string;
  color: string;
  padding: number;
}

export const DEFAULT_WATERMARK_OPTIONS: WatermarkOptions = {
  text: 'StyleSwap',
  position: 'bottom-right',
  opacity: 0.7,
  fontSize: 24,
  fontFamily: 'Arial, sans-serif',
  color: '#FFFFFF',
  padding: 20,
};

/**
 * Calculate watermark position coordinates
 */
function getWatermarkCoordinates(
  position: WatermarkPosition,
  canvasWidth: number,
  canvasHeight: number,
  textWidth: number,
  textHeight: number,
  padding: number
): { x: number; y: number } {
  switch (position) {
    case 'top-left':
      return { x: padding, y: padding + textHeight };
    case 'top-right':
      return { x: canvasWidth - textWidth - padding, y: padding + textHeight };
    case 'bottom-left':
      return { x: padding, y: canvasHeight - padding };
    case 'bottom-right':
      return { x: canvasWidth - textWidth - padding, y: canvasHeight - padding };
    case 'center':
      return {
        x: (canvasWidth - textWidth) / 2,
        y: (canvasHeight - textHeight) / 2 + textHeight,
      };
    default:
      return { x: canvasWidth - textWidth - padding, y: canvasHeight - padding };
  }
}

/**
 * Add watermark to canvas
 */
export function addWatermarkToCanvas(
  canvas: HTMLCanvasElement,
  options: Partial<WatermarkOptions> = {}
): HTMLCanvasElement {
  const opts = { ...DEFAULT_WATERMARK_OPTIONS, ...options };

  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Failed to get canvas context');

  // Set font
  ctx.font = `${opts.fontSize}px ${opts.fontFamily}`;

  // Measure text
  const metrics = ctx.measureText(opts.text);
  const textWidth = metrics.width;
  const textHeight = opts.fontSize;

  // Get position
  const { x, y } = getWatermarkCoordinates(
    opts.position,
    canvas.width,
    canvas.height,
    textWidth,
    textHeight,
    opts.padding
  );

  // Save context state
  ctx.save();

  // Set opacity
  ctx.globalAlpha = opts.opacity;

  // Draw text
  ctx.fillStyle = opts.color;
  ctx.textBaseline = 'bottom';
  ctx.fillText(opts.text, x, y);

  // Optional: Add subtle shadow for better visibility
  ctx.globalAlpha = opts.opacity * 0.5;
  ctx.fillStyle = '#000000';
  ctx.fillText(opts.text, x + 1, y + 1);

  // Restore context state
  ctx.restore();

  return canvas;
}

/**
 * Add watermark to image URL
 */
export async function addWatermarkToImage(
  imageUrl: string,
  options: Partial<WatermarkOptions> = {}
): Promise<Blob> {
  // Fetch and load image
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

  // Create canvas
  const canvas = document.createElement('canvas');
  canvas.width = img.width;
  canvas.height = img.height;

  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Failed to get canvas context');

  // Draw image
  ctx.drawImage(img, 0, 0);

  // Clean up
  URL.revokeObjectURL(url);

  // Add watermark
  addWatermarkToCanvas(canvas, options);

  // Convert to blob
  return new Promise((resolve, reject) => {
    const opts = { ...DEFAULT_WATERMARK_OPTIONS, ...options };
    const mimeType = 'image/png';
    canvas.toBlob(
      (resultBlob) => {
        if (resultBlob) {
          resolve(resultBlob);
        } else {
          reject(new Error('Failed to convert canvas to blob'));
        }
      },
      mimeType,
      0.95
    );
  });
}

/**
 * Add watermark to canvas element
 */
export async function addWatermarkToCanvasElement(
  sourceCanvas: HTMLCanvasElement,
  options: Partial<WatermarkOptions> = {}
): Promise<Blob> {
  // Create a copy of the canvas
  const canvas = document.createElement('canvas');
  canvas.width = sourceCanvas.width;
  canvas.height = sourceCanvas.height;

  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Failed to get canvas context');

  // Draw source canvas
  ctx.drawImage(sourceCanvas, 0, 0);

  // Add watermark
  addWatermarkToCanvas(canvas, options);

  // Convert to blob
  return new Promise((resolve, reject) => {
    const mimeType = 'image/png';
    canvas.toBlob(
      (resultBlob) => {
        if (resultBlob) {
          resolve(resultBlob);
        } else {
          reject(new Error('Failed to convert canvas to blob'));
        }
      },
      mimeType,
      0.95
    );
  });
}

/**
 * Create a preview canvas with watermark
 */
export function createWatermarkPreview(
  sourceCanvas: HTMLCanvasElement,
  options: Partial<WatermarkOptions> = {}
): HTMLCanvasElement {
  // Create a copy of the canvas
  const canvas = document.createElement('canvas');
  canvas.width = sourceCanvas.width;
  canvas.height = sourceCanvas.height;

  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Failed to get canvas context');

  // Draw source canvas
  ctx.drawImage(sourceCanvas, 0, 0);

  // Add watermark
  addWatermarkToCanvas(canvas, options);

  return canvas;
}
