import { useState, useCallback } from 'react';
import {
  saveCanvasToGallery,
  saveImageToGallery,
  saveElementToGallery,
  generateFilename,
  SaveOptions,
} from '@/lib/saveToGallery';

export interface UseSaveToGalleryState {
  isSaving: boolean;
  isSuccess: boolean;
  error: string | null;
}

export interface UseSaveToGalleryReturn extends UseSaveToGalleryState {
  saveCanvas: (canvas: HTMLCanvasElement, options?: SaveOptions) => Promise<void>;
  saveImage: (imageUrl: string, options?: SaveOptions) => Promise<void>;
  saveElement: (element: HTMLElement, options?: SaveOptions) => Promise<void>;
  reset: () => void;
}

/**
 * Custom hook for saving try-on results to gallery
 * Handles loading states, errors, and success feedback
 */
export function useSaveToGallery(): UseSaveToGalleryReturn {
  const [isSaving, setIsSaving] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reset = useCallback(() => {
    setIsSaving(false);
    setIsSuccess(false);
    setError(null);
  }, []);

  const saveCanvas = useCallback(
    async (canvas: HTMLCanvasElement, options?: SaveOptions) => {
      try {
        setIsSaving(true);
        setError(null);
        setIsSuccess(false);

        const filename = options?.filename || generateFilename('StyleSwap-TryOn', options?.format);
        await saveCanvasToGallery(canvas, { ...options, filename });

        setIsSuccess(true);
        setIsSaving(false);

        // Auto-reset success message after 3 seconds
        setTimeout(() => setIsSuccess(false), 3000);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to save image';
        setError(errorMessage);
        setIsSaving(false);
      }
    },
    []
  );

  const saveImage = useCallback(
    async (imageUrl: string, options?: SaveOptions) => {
      try {
        setIsSaving(true);
        setError(null);
        setIsSuccess(false);

        const filename = options?.filename || generateFilename('StyleSwap-TryOn', options?.format);
        await saveImageToGallery(imageUrl, { ...options, filename });

        setIsSuccess(true);
        setIsSaving(false);

        // Auto-reset success message after 3 seconds
        setTimeout(() => setIsSuccess(false), 3000);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to save image';
        setError(errorMessage);
        setIsSaving(false);
      }
    },
    []
  );

  const saveElement = useCallback(
    async (element: HTMLElement, options?: SaveOptions) => {
      try {
        setIsSaving(true);
        setError(null);
        setIsSuccess(false);

        const filename = options?.filename || generateFilename('StyleSwap-TryOn', options?.format);
        await saveElementToGallery(element, { ...options, filename });

        setIsSuccess(true);
        setIsSaving(false);

        // Auto-reset success message after 3 seconds
        setTimeout(() => setIsSuccess(false), 3000);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to save image';
        setError(errorMessage);
        setIsSaving(false);
      }
    },
    []
  );

  return {
    isSaving,
    isSuccess,
    error,
    saveCanvas,
    saveImage,
    saveElement,
    reset,
  };
}
