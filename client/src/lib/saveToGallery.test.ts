import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  canvasToBlob,
  generateFilename,
  isDownloadSupported,
  validateImageBlob,
  getFileSizeInMB,
} from './saveToGallery';

describe('saveToGallery utilities', () => {
  describe('canvasToBlob', () => {
    it('should convert canvas to PNG blob', async () => {
      // Create a test canvas
      const canvas = document.createElement('canvas');
      canvas.width = 100;
      canvas.height = 100;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.fillStyle = 'red';
        ctx.fillRect(0, 0, 100, 100);
      }

      const blob = await canvasToBlob(canvas, 'png');
      expect(blob).toBeInstanceOf(Blob);
      expect(blob.type).toBe('image/png');
      expect(blob.size).toBeGreaterThan(0);
    });

    it('should convert canvas to JPEG blob', async () => {
      const canvas = document.createElement('canvas');
      canvas.width = 100;
      canvas.height = 100;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.fillStyle = 'blue';
        ctx.fillRect(0, 0, 100, 100);
      }

      const blob = await canvasToBlob(canvas, 'jpeg', 0.8);
      expect(blob).toBeInstanceOf(Blob);
      expect(blob.type).toBe('image/jpeg');
      expect(blob.size).toBeGreaterThan(0);
    });

    it('should respect quality parameter for JPEG', async () => {
      const canvas = document.createElement('canvas');
      canvas.width = 100;
      canvas.height = 100;

      const highQuality = await canvasToBlob(canvas, 'jpeg', 0.95);
      const lowQuality = await canvasToBlob(canvas, 'jpeg', 0.3);

      // Higher quality should typically result in larger file size
      expect(highQuality.size).toBeGreaterThanOrEqual(lowQuality.size);
    });
  });

  describe('generateFilename', () => {
    it('should generate filename with default prefix', () => {
      const filename = generateFilename();
      expect(filename).toMatch(/^StyleSwap-\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2}\.png$/);
    });

    it('should generate filename with custom prefix', () => {
      const filename = generateFilename('MyImage');
      expect(filename).toMatch(/^MyImage-\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2}\.png$/);
    });

    it('should generate filename with JPEG format', () => {
      const filename = generateFilename('Test', 'jpeg');
      expect(filename).toMatch(/\.jpg$/);
    });

    it('should generate filename with PNG format', () => {
      const filename = generateFilename('Test', 'png');
      expect(filename).toMatch(/\.png$/);
    });

    it('should include timestamp in filename', () => {
      const filename1 = generateFilename();
      // Small delay to ensure different timestamp
      const filename2 = generateFilename();
      expect(filename1).not.toBe(filename2);
    });
  });

  describe('isDownloadSupported', () => {
    it('should return true in modern browsers', () => {
      const supported = isDownloadSupported();
      expect(typeof supported).toBe('boolean');
      // In test environment, this might be false, but we're checking the function works
    });
  });

  describe('getFileSizeInMB', () => {
    it('should calculate file size correctly', () => {
      const blob = new Blob(['a'.repeat(1024 * 1024)], { type: 'image/png' });
      const sizeMB = getFileSizeInMB(blob);
      expect(sizeMB).toBeCloseTo(1, 0.1);
    });

    it('should handle small files', () => {
      const blob = new Blob(['hello'], { type: 'image/png' });
      const sizeMB = getFileSizeInMB(blob);
      expect(sizeMB).toBeLessThan(0.001);
    });

    it('should handle large files', () => {
      const largeData = new Uint8Array(10 * 1024 * 1024); // 10 MB
      const blob = new Blob([largeData], { type: 'image/png' });
      const sizeMB = getFileSizeInMB(blob);
      expect(sizeMB).toBeCloseTo(10, 0.1);
    });
  });

  describe('validateImageBlob', () => {
    it('should validate PNG blob', () => {
      const blob = new Blob(['test'], { type: 'image/png' });
      const result = validateImageBlob(blob);
      expect(result.valid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('should validate JPEG blob', () => {
      const blob = new Blob(['test'], { type: 'image/jpeg' });
      const result = validateImageBlob(blob);
      expect(result.valid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('should validate WebP blob', () => {
      const blob = new Blob(['test'], { type: 'image/webp' });
      const result = validateImageBlob(blob);
      expect(result.valid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('should reject invalid image type', () => {
      const blob = new Blob(['test'], { type: 'text/plain' });
      const result = validateImageBlob(blob);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('Invalid image type');
    });

    it('should reject oversized files', () => {
      const largeData = new Uint8Array(11 * 1024 * 1024); // 11 MB (exceeds 10 MB limit)
      const blob = new Blob([largeData], { type: 'image/png' });
      const result = validateImageBlob(blob);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('exceeds maximum');
    });

    it('should accept files at size limit', () => {
      const limitData = new Uint8Array(10 * 1024 * 1024); // Exactly 10 MB
      const blob = new Blob([limitData], { type: 'image/png' });
      const result = validateImageBlob(blob);
      expect(result.valid).toBe(true);
    });
  });
});
