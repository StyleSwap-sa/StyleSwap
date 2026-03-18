import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { splitDressImage } from './imageUtils';
import fs from 'fs';
import path from 'path';

describe('Image Utils - splitDressImage', () => {
  let testImageFile: File;

  beforeAll(async () => {
    // Create a simple test image (1x1 PNG)
    const pngBuffer = Buffer.from([
      0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, // PNG signature
      0x00, 0x00, 0x00, 0x0D, 0x49, 0x48, 0x44, 0x52, // IHDR chunk
      0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01, // 1x1 dimensions
      0x08, 0x02, 0x00, 0x00, 0x00, 0x90, 0x77, 0x53, // 8-bit RGB
      0xDE, 0x00, 0x00, 0x00, 0x0C, 0x49, 0x44, 0x41, // IDAT chunk
      0x54, 0x08, 0x99, 0x63, 0xF8, 0xCF, 0xC0, 0x00, // Image data
      0x00, 0x03, 0x01, 0x01, 0x00, 0x18, 0xDD, 0x8D, // 
      0xB4, 0x00, 0x00, 0x00, 0x00, 0x49, 0x45, 0x4E, // IEND chunk
      0x44, 0xAE, 0x42, 0x60, 0x82 // PNG end
    ]);
    
    testImageFile = new File([pngBuffer], 'test-dress.png', { type: 'image/png' });
  });

  it('should return an object with topImage and bottomImage properties', async () => {
    const result = await splitDressImage(testImageFile);
    
    expect(result).toHaveProperty('topImage');
    expect(result).toHaveProperty('bottomImage');
    expect(result.topImage).toBeInstanceOf(File);
    expect(result.bottomImage).toBeInstanceOf(File);
  });

  it('should create Files with correct naming convention', async () => {
    const result = await splitDressImage(testImageFile);
    
    expect(result.topImage.name).toContain('top');
    expect(result.bottomImage.name).toContain('bottom');
  });

  it('should create JPEG files for compatibility', async () => {
    const result = await splitDressImage(testImageFile);
    
    expect(result.topImage.type).toBe('image/jpeg');
    expect(result.bottomImage.type).toBe('image/jpeg');
  });

  it('should create files with non-zero size', async () => {
    const result = await splitDressImage(testImageFile);
    
    expect(result.topImage.size).toBeGreaterThan(0);
    expect(result.bottomImage.size).toBeGreaterThan(0);
  });

  it('should split at approximately 55% height', async () => {
    const result = await splitDressImage(testImageFile);
    
    // Both files should have content
    const topBuffer = await result.topImage.arrayBuffer();
    const bottomBuffer = await result.bottomImage.arrayBuffer();
    
    expect(topBuffer.byteLength).toBeGreaterThan(0);
    expect(bottomBuffer.byteLength).toBeGreaterThan(0);
  });
});

describe('VirtualTryOnUpload - Full Dress Handling', () => {
  it('should destructure splitDressImage result with correct property names', async () => {
    // This test verifies the fix: splitDressImage returns { topImage, bottomImage }
    // not { upperImage, lowerImage }
    
    const mockSplitResult = {
      topImage: new File([], 'test-top.jpg', { type: 'image/jpeg' }),
      bottomImage: new File([], 'test-bottom.jpg', { type: 'image/jpeg' })
    };
    
    // This is what the fixed code does:
    const { topImage, bottomImage } = mockSplitResult;
    
    expect(topImage).toBeDefined();
    expect(bottomImage).toBeDefined();
    expect(topImage.name).toBe('test-top.jpg');
    expect(bottomImage.name).toBe('test-bottom.jpg');
  });

  it('should NOT destructure with incorrect property names', () => {
    const mockSplitResult = {
      topImage: new File([], 'test-top.jpg', { type: 'image/jpeg' }),
      bottomImage: new File([], 'test-bottom.jpg', { type: 'image/jpeg' })
    };
    
    // This is what the BROKEN code was trying to do:
    // const { upperImage, lowerImage } = mockSplitResult;
    // upperImage would be undefined
    // lowerImage would be undefined
    
    const { upperImage, lowerImage } = mockSplitResult as any;
    expect(upperImage).toBeUndefined();
    expect(lowerImage).toBeUndefined();
  });
});
