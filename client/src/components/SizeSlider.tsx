import React, { useState, useRef, useEffect } from 'react';
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
  const [currentSize, setCurrentSize] = useState(selectedSize || 32);
  const sliderRef = useRef<HTMLDivElement>(null);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (selectedSize !== null) {
      setCurrentSize(selectedSize);
    }
  }, [selectedSize]);

  const handleSizeChangeWithDebounce = (size: number) => {
    setCurrentSize(size);
    onSizeChange(size);

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = setTimeout(() => {
      if (onSizeChangeDebounced) {
        onSizeChangeDebounced(size);
      }
    }, 500);
  };

  const percentage = ((currentSize - minSize) / (maxSize - minSize)) * 100;

  return (
    <div className="space-y-4">
      <Card className="p-6 bg-gradient-to-br from-blue-50 to-green-50 dark:from-blue-950/30 dark:to-green-950/30">
        {/* Interactive Slider */}
        <div className="space-y-4">
          <div
            ref={sliderRef}
            className="relative h-12 bg-gray-200 dark:bg-gray-700 rounded-lg cursor-pointer overflow-hidden"
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
          <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400">
            <span>Size {minSize}</span>
            <span>Size {maxSize}</span>
          </div>
        </div>

        {/* Quick Size Buttons */}
        <div className="space-y-2 mt-4">
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
