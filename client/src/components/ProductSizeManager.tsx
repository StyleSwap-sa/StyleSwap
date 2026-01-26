import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Trash2, Plus } from 'lucide-react';

interface SizeVariant {
  size: number;
  stock: number;
  isAvailable: boolean;
  fitAdjustment: 'tight' | 'perfect' | 'loose';
}

interface ProductSizeManagerProps {
  productName: string;
  onSizesSaved?: (sizes: SizeVariant[]) => void;
}

export function ProductSizeManager({
  productName,
  onSizesSaved,
}: ProductSizeManagerProps) {
  const [sizes, setSizes] = useState<SizeVariant[]>([
    { size: 28, stock: 5, isAvailable: true, fitAdjustment: 'tight' },
    { size: 30, stock: 10, isAvailable: true, fitAdjustment: 'perfect' },
    { size: 32, stock: 8, isAvailable: true, fitAdjustment: 'perfect' },
    { size: 34, stock: 3, isAvailable: true, fitAdjustment: 'loose' },
  ]);

  const [newSize, setNewSize] = useState('');

  const addSize = () => {
    const size = parseInt(newSize);
    if (size && !sizes.find((s) => s.size === size)) {
      setSizes([
        ...sizes,
        {
          size,
          stock: 0,
          isAvailable: true,
          fitAdjustment: 'perfect',
        },
      ]);
      setNewSize('');
    }
  };

  const removeSize = (size: number) => {
    setSizes(sizes.filter((s) => s.size !== size));
  };

  const updateSize = (
    size: number,
    field: keyof SizeVariant,
    value: any
  ) => {
    setSizes(
      sizes.map((s) =>
        s.size === size ? { ...s, [field]: value } : s
      )
    );
  };

  const handleSave = () => {
    onSizesSaved?.(sizes);
  };

  const getFitColor = (fit: string) => {
    switch (fit) {
      case 'tight':
        return 'bg-red-100 text-red-800';
      case 'perfect':
        return 'bg-green-100 text-green-800';
      case 'loose':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Manage Sizes for {productName}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Add new size */}
        <div className="flex gap-2">
          <Input
            type="number"
            placeholder="Enter size (e.g., 28, 30, 32)"
            value={newSize}
            onChange={(e) => setNewSize(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && addSize()}
            min="0"
            max="100"
          />
          <Button onClick={addSize} variant="outline">
            <Plus className="w-4 h-4 mr-2" />
            Add Size
          </Button>
        </div>

        {/* Size list */}
        <div className="space-y-2">
          {sizes
            .sort((a, b) => a.size - b.size)
            .map((size) => (
              <div
                key={size.size}
                className="flex items-center gap-3 p-3 border rounded-lg"
              >
                {/* Size number */}
                <div className="font-bold text-lg w-12">Size {size.size}</div>

                {/* Stock input */}
                <div className="flex-1">
                  <label className="text-xs text-gray-600">Stock</label>
                  <Input
                    type="number"
                    value={size.stock}
                    onChange={(e) =>
                      updateSize(size.size, 'stock', parseInt(e.target.value) || 0)
                    }
                    min="0"
                    className="h-8"
                  />
                </div>

                {/* Fit adjustment */}
                <div className="flex-1">
                  <label className="text-xs text-gray-600">Fit</label>
                  <select
                    value={size.fitAdjustment}
                    onChange={(e) =>
                      updateSize(
                        size.size,
                        'fitAdjustment',
                        e.target.value as 'tight' | 'perfect' | 'loose'
                      )
                    }
                    className="w-full h-8 px-2 border rounded text-sm"
                  >
                    <option value="tight">Tight</option>
                    <option value="perfect">Perfect</option>
                    <option value="loose">Loose</option>
                  </select>
                </div>

                {/* Availability toggle */}
                <div className="flex-1">
                  <label className="text-xs text-gray-600">Available</label>
                  <div className="h-8 flex items-center">
                    <input
                      type="checkbox"
                      checked={size.isAvailable}
                      onChange={(e) =>
                        updateSize(size.size, 'isAvailable', e.target.checked)
                      }
                      className="w-4 h-4"
                    />
                  </div>
                </div>

                {/* Status badge */}
                <div>
                  <Badge
                    className={`${getFitColor(size.fitAdjustment)} text-xs`}
                  >
                    {size.fitAdjustment}
                  </Badge>
                </div>

                {/* Delete button */}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeSize(size.size)}
                  className="text-red-500 hover:text-red-700"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            ))}
        </div>

        {/* Save button */}
        <Button onClick={handleSave} className="w-full">
          Save Sizes
        </Button>

        {/* Info */}
        <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-sm">
          <p className="font-semibold mb-1">💡 Fit Adjustment Guide:</p>
          <ul className="text-xs space-y-1">
            <li>
              <strong>Tight:</strong> Size may fit snugly (good for stretchy fabrics)
            </li>
            <li>
              <strong>Perfect:</strong> Size should fit as expected
            </li>
            <li>
              <strong>Loose:</strong> Size may fit loosely (good for relaxed fits)
            </li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}
