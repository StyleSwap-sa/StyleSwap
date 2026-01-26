import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface SizeVariant {
  id: number;
  size: number;
  stock: number;
  isAvailable: number;
  fitAdjustment: 'tight' | 'perfect' | 'loose';
}

interface SizeSelectorProps {
  sizes: SizeVariant[];
  selectedSize?: number;
  onSizeSelect: (size: number, fitAdjustment: string) => void;
  loading?: boolean;
}

export function SizeSelector({
  sizes,
  selectedSize,
  onSizeSelect,
  loading = false,
}: SizeSelectorProps) {
  const [hoveredSize, setHoveredSize] = useState<number | null>(null);

  if (!sizes || sizes.length === 0) {
    return null;
  }

  const getFitColor = (fit: string) => {
    switch (fit) {
      case 'tight':
        return 'bg-red-100 text-red-800 border-red-300';
      case 'perfect':
        return 'bg-green-100 text-green-800 border-green-300';
      case 'loose':
        return 'bg-blue-100 text-blue-800 border-blue-300';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getFitLabel = (fit: string) => {
    switch (fit) {
      case 'tight':
        return '👕 Tight Fit';
      case 'perfect':
        return '✓ Perfect Fit';
      case 'loose':
        return '📏 Loose Fit';
      default:
        return fit;
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-lg">Select Your Size</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
          {sizes
            .sort((a, b) => a.size - b.size)
            .map((size) => (
              <div key={size.id} className="relative">
                <Button
                  variant={selectedSize === size.size ? 'default' : 'outline'}
                  className={`w-full ${
                    size.isAvailable === 0
                      ? 'opacity-50 cursor-not-allowed'
                      : ''
                  }`}
                  onClick={() => {
                    if (size.isAvailable) {
                      onSizeSelect(size.size, size.fitAdjustment);
                    }
                  }}
                  disabled={size.isAvailable === 0 || loading}
                  onMouseEnter={() => setHoveredSize(size.id)}
                  onMouseLeave={() => setHoveredSize(null)}
                >
                  {size.size}
                </Button>

                {/* Tooltip showing fit adjustment */}
                {hoveredSize === size.id && size.isAvailable && (
                  <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-800 text-white text-xs rounded whitespace-nowrap z-10">
                    {getFitLabel(size.fitAdjustment)}
                  </div>
                )}

                {/* Out of stock badge */}
                {size.isAvailable === 0 && (
                  <Badge
                    variant="secondary"
                    className="absolute -top-2 -right-2 text-xs"
                  >
                    Out
                  </Badge>
                )}

                {/* Stock indicator */}
                {size.isAvailable && size.stock < 5 && size.stock > 0 && (
                  <Badge
                    variant="outline"
                    className="absolute -top-2 -right-2 text-xs bg-yellow-50"
                  >
                    {size.stock} left
                  </Badge>
                )}
              </div>
            ))}
        </div>

        {/* Fit adjustment legend */}
        {selectedSize && (
          <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm font-semibold mb-2">Size {selectedSize} Fit:</p>
            {sizes.find((s) => s.size === selectedSize) && (
              <div className="flex items-center gap-2">
                <span
                  className={`px-3 py-1 rounded-full text-sm font-medium ${getFitColor(
                    sizes.find((s) => s.size === selectedSize)?.fitAdjustment || ''
                  )}`}
                >
                  {getFitLabel(
                    sizes.find((s) => s.size === selectedSize)?.fitAdjustment || ''
                  )}
                </span>
                <span className="text-xs text-gray-600">
                  {sizes.find((s) => s.size === selectedSize)?.fitAdjustment ===
                  'tight'
                    ? 'This size may fit snugly'
                    : sizes.find((s) => s.size === selectedSize)?.fitAdjustment ===
                        'loose'
                      ? 'This size may fit loosely'
                      : 'This size should fit perfectly'}
                </span>
              </div>
            )}
          </div>
        )}

        {/* Info text */}
        <p className="text-xs text-gray-500">
          💡 Tip: Try multiple sizes to find the perfect fit for you
        </p>
      </CardContent>
    </Card>
  );
}
