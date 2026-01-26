import React, { useState, useRef, useEffect } from 'react';
import { Slider } from '@/components/ui/slider';
import { Card } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';

interface SizeSliderProps {
  selectedSize: number | null;
  onSizeChange: (size: number) => void;
  resultImageUrl: string;
  minSize?: number;
  maxSize?: number;
  isLoading?: boolean;
  onSizeChangeDebounced?: (size: number) => void;
}

// Helper function to determine fit adjustment based on size
// Used for feedback messages and color coding, not for visual scaling
function getFitAdjustment(size: number): 'tight' | 'perfect' | 'loose' {
  const tightRange = [20, 26]; // XS sizes
  const perfectRange = [28, 34]; // S-M sizes (standard)
  const looseRange = [36, 50]; // L+ sizes
  
  if (size >= tightRange[0] && size <= tightRange[1]) return 'tight';
  if (size >= perfectRange[0] && size <= perfectRange[1]) return 'perfect';
  if (size >= looseRange[0] && size <= looseRange[1]) return 'loose';
  return 'perfect';
}

export function SizeSlider({
  selectedSize,
  onSizeChange,
  resultImageUrl,
  minSize = 24,
  maxSize = 50,
  isLoading = false,
  onSizeChangeDebounced,
}: SizeSliderProps) {
  const [isDragging, setIsDragging] = useState(false);
  const sliderRef = useRef<HTMLDivElement>(null);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Debounced size change handler
  const handleSizeChangeWithDebounce = (size: number) => {
    onSizeChange(size);
    
    // Clear existing timer
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    
    // Set new timer for debounced callback (500ms delay)
    debounceTimerRef.current = setTimeout(() => {
      if (onSizeChangeDebounced) {
        onSizeChangeDebounced(size);
      }
    }, 500);
  };

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  const currentSize = selectedSize || minSize;
  const fit = getFitAdjustment(currentSize);

  // Fit colors for feedback badges (not for image scaling)
  const fitColors = {
    tight: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
    perfect: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
    loose: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
  };

  const fitLabels = {
    tight: 'Snug Fit',
    perfect: 'Perfect Fit',
    loose: 'Relaxed Fit',
  };

  const feedbackMessages = {
    tight: `Size ${currentSize} will fit snugly. Consider sizing up for a more relaxed fit.`,
    perfect: `Size ${currentSize} is our recommended size. This should fit as expected.`,
    loose: `Size ${currentSize} will fit with extra room. Consider sizing down for a snugger fit.`,
  };

  const feedbackColors = {
    tight: 'bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800',
    perfect: 'bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800',
    loose: 'bg-orange-50 dark:bg-orange-950/20 border-orange-200 dark:border-orange-800',
  };

  // Calculate percentage for visual slider position
  const percentage = ((currentSize - minSize) / (maxSize - minSize)) * 100;

  return (
    <div className="space-y-6">
      {/* Size Preview with Live Scaling */}
      <div className="flex flex-col items-center space-y-4">
        <div className="flex items-center justify-between w-full">
          <h3 className="text-lg font-semibold">Size Preview</h3>
          <div className="flex items-center gap-2">
            <span className="text-2xl font-bold text-primary">{currentSize}</span>
            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${fitColors[fit]}`}>
              {fitLabels[fit]}
            </span>
            {isLoading && <Loader2 className="w-4 h-4 animate-spin text-primary" />}
          </div>
        </div>

        {/* Image Preview with Loading State */}
        <div className="flex justify-center items-center w-full overflow-hidden rounded-lg border border-border bg-white dark:bg-slate-900 p-4 min-h-[300px] relative">
          {isLoading && (
            <div className="absolute inset-0 bg-white/50 dark:bg-slate-900/50 flex items-center justify-center rounded-lg z-10">
              <div className="flex flex-col items-center gap-2">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Generating size {currentSize}...
                </p>
              </div>
            </div>
          )}
          <img
            src={resultImageUrl}
            alt={`Size ${currentSize} preview`}
            className="rounded-lg shadow-lg max-w-sm"
            style={{
              opacity: isLoading ? 0.5 : 1,
            }}
          />
        </div>

        {/* Fit Feedback Message */}
        <div className={`w-full p-3 rounded-lg border ${feedbackColors[fit]}`}>
          <p className="text-sm text-gray-700 dark:text-gray-300">
            {feedbackMessages[fit]}
          </p>
        </div>
      </div>

      {/* Interactive Size Slider */}
      <Card className="p-6 space-y-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">Drag to try different sizes</label>
          
          {/* Custom Slider with Visual Track */}
          <div
            ref={sliderRef}
            className="relative h-12 bg-gray-100 dark:bg-gray-800 rounded-lg cursor-pointer flex items-center"
            onMouseDown={() => setIsDragging(true)}
            onMouseUp={() => setIsDragging(false)}
            onMouseLeave={() => setIsDragging(false)}
            onClick={(e) => {
              if (!sliderRef.current) return;
              const rect = sliderRef.current.getBoundingClientRect();
              const x = e.clientX - rect.left;
              const percentage = x / rect.width;
              const newSize = Math.round(minSize + percentage * (maxSize - minSize));
              const clampedSize = Math.max(minSize, Math.min(maxSize, newSize));
              handleSizeChangeWithDebounce(clampedSize);
            }}
          >
            {/* Filled Track */}
            <div
              className="absolute left-0 top-0 h-full bg-gradient-to-r from-blue-400 via-green-400 to-orange-400 rounded-lg transition-all"
              style={{ width: `${percentage}%` }}
            />

            {/* Size Labels */}
            <div className="absolute left-0 right-0 top-0 bottom-0 flex items-center justify-between px-4 pointer-events-none">
              <span className="text-xs font-semibold text-gray-600 dark:text-gray-400">XS (24)</span>
              <span className="text-xs font-semibold text-gray-600 dark:text-gray-400">S-M (28-34)</span>
              <span className="text-xs font-semibold text-gray-600 dark:text-gray-400">L+ (50)</span>
            </div>

            {/* Draggable Thumb */}
            <div
              className="absolute top-1/2 -translate-y-1/2 w-10 h-10 bg-white dark:bg-slate-900 border-2 border-primary rounded-full shadow-lg cursor-grab active:cursor-grabbing flex items-center justify-center transition-all"
              style={{ left: `calc(${percentage}% - 20px)` }}
              onMouseDown={(e) => {
                e.preventDefault();
                setIsDragging(true);
                
                const handleMouseMove = (moveEvent: MouseEvent) => {
                  if (!sliderRef.current) return;
                  const rect = sliderRef.current.getBoundingClientRect();
                  const x = moveEvent.clientX - rect.left;
                  const percentage = Math.max(0, Math.min(1, x / rect.width));
                  const newSize = Math.round(minSize + percentage * (maxSize - minSize));
                  onSizeChange(newSize);
                };

                const handleMouseUp = () => {
                  setIsDragging(false);
                  // Trigger debounced regeneration on mouse up
                  if (onSizeChangeDebounced) {
                    onSizeChangeDebounced(currentSize);
                  }
                  document.removeEventListener('mousemove', handleMouseMove);
                  document.removeEventListener('mouseup', handleMouseUp);
                };

                document.addEventListener('mousemove', handleMouseMove);
                document.addEventListener('mouseup', handleMouseUp);
              }}
            >
              <span className="text-xs font-bold text-primary">{currentSize}</span>
            </div>
          </div>

          {/* Size Range Labels */}
          <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-2">
            <span>Size {minSize}</span>
            <span>Size {maxSize}</span>
          </div>
        </div>

        {/* Quick Size Buttons */}
        <div className="space-y-2">
          <p className="text-xs font-medium text-gray-600 dark:text-gray-400">Quick select:</p>
          <div className="grid grid-cols-6 gap-2">
            {[24, 28, 30, 32, 34, 38, 40, 42, 44, 46, 48, 50].map((size) => (
              <button
                key={size}
                onClick={() => handleSizeChangeWithDebounce(size)}
                disabled={isLoading}
                className={`py-2 px-2 rounded text-xs font-semibold transition-all ${
                  currentSize === size
                    ? 'bg-primary text-primary-foreground shadow-lg scale-105'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 disabled:opacity-50'
                }`}
              >
                {size}
              </button>
            ))}
          </div>
        </div>
      </Card>

      {/* Size Information */}
      <Card className="p-4 bg-gray-50 dark:bg-gray-900/50">
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Tight Fit</p>
            <p className="text-sm font-semibold text-blue-600 dark:text-blue-400">Sizes 24-26</p>
          </div>
          <div>
            <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Perfect Fit</p>
            <p className="text-sm font-semibold text-green-600 dark:text-green-400">Sizes 28-34</p>
          </div>
          <div>
            <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Relaxed Fit</p>
            <p className="text-sm font-semibold text-orange-600 dark:text-orange-400">Sizes 36-50</p>
          </div>
        </div>
      </Card>
    </div>
  );
}
