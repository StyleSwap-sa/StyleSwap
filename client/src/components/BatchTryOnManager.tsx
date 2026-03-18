import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Trash2, Play, Pause, X } from "lucide-react";

export interface BatchItem {
  id: string;
  clothType: "upper" | "lower" | "combo" | "full";
  clothImageName: string;
  status: "pending" | "processing" | "completed" | "failed";
  resultImageUrl?: string;
  error?: string;
}

interface BatchTryOnManagerProps {
  items: BatchItem[];
  onAddItem: (clothType: "upper" | "lower" | "combo" | "full", clothImageName: string) => void;
  onRemoveItem: (id: string) => void;
  onStartBatch: () => void;
  onPauseBatch: () => void;
  isProcessing: boolean;
  currentItemId?: string;
}

export function BatchTryOnManager({
  items,
  onAddItem,
  onRemoveItem,
  onStartBatch,
  onPauseBatch,
  isProcessing,
  currentItemId,
}: BatchTryOnManagerProps) {
  const [showForm, setShowForm] = useState(false);
  const [selectedType, setSelectedType] = useState<"upper" | "lower" | "combo" | "full">("upper");

  const completedCount = items.filter((i) => i.status === "completed").length;
  const failedCount = items.filter((i) => i.status === "failed").length;
  const pendingCount = items.filter((i) => i.status === "pending").length;

  const clothTypeLabels = {
    upper: "Top/Shirt",
    lower: "Bottom/Pants",
    combo: "Top & Bottom",
    full: "Full Dress",
  };

  const getStatusColor = (status: BatchItem["status"]) => {
    switch (status) {
      case "completed":
        return "bg-green-50 border-green-200";
      case "processing":
        return "bg-blue-50 border-blue-200";
      case "failed":
        return "bg-red-50 border-red-200";
      default:
        return "bg-gray-50 border-gray-200";
    }
  };

  const getStatusBadge = (status: BatchItem["status"]) => {
    switch (status) {
      case "completed":
        return <span className="px-2 py-1 bg-green-200 text-green-800 text-xs rounded font-medium">✓ Done</span>;
      case "processing":
        return <span className="px-2 py-1 bg-blue-200 text-blue-800 text-xs rounded font-medium animate-pulse">⟳ Processing</span>;
      case "failed":
        return <span className="px-2 py-1 bg-red-200 text-red-800 text-xs rounded font-medium">✗ Failed</span>;
      default:
        return <span className="px-2 py-1 bg-gray-200 text-gray-800 text-xs rounded font-medium">○ Pending</span>;
    }
  };

  return (
    <Card className="border-2 border-purple-200 bg-gradient-to-r from-purple-50 to-pink-50">
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle className="flex items-center gap-2">
            <span>🔄 Batch Try-On Mode</span>
          </CardTitle>
          <div className="text-sm text-gray-600">
            {completedCount}/{items.length} completed
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Stats */}
        {items.length > 0 && (
          <div className="grid grid-cols-4 gap-2 text-center text-sm">
            <div className="bg-white rounded p-2 border border-gray-200">
              <div className="font-bold text-gray-900">{items.length}</div>
              <div className="text-gray-600">Total</div>
            </div>
            <div className="bg-blue-50 rounded p-2 border border-blue-200">
              <div className="font-bold text-blue-900">{items.filter((i) => i.status === "processing").length}</div>
              <div className="text-blue-700">Processing</div>
            </div>
            <div className="bg-green-50 rounded p-2 border border-green-200">
              <div className="font-bold text-green-900">{completedCount}</div>
              <div className="text-green-700">Completed</div>
            </div>
            <div className="bg-red-50 rounded p-2 border border-red-200">
              <div className="font-bold text-red-900">{failedCount}</div>
              <div className="text-red-700">Failed</div>
            </div>
          </div>
        )}

        {/* Queue Items */}
        <div className="space-y-2 max-h-64 overflow-y-auto">
          {items.length === 0 ? (
            <div className="text-center py-6 text-gray-500">
              <p>No items in batch queue</p>
              <p className="text-sm">Add clothing items to get started</p>
            </div>
          ) : (
            items.map((item, index) => (
              <div
                key={item.id}
                className={`flex items-center gap-3 p-3 rounded-lg border transition-all ${getStatusColor(item.status)} ${
                  currentItemId === item.id ? "ring-2 ring-orange-500" : ""
                }`}
              >
                <div className="flex-shrink-0 font-bold text-gray-600 w-6">{index + 1}</div>
                <div className="flex-grow">
                  <div className="flex justify-between items-center">
                    <span className="font-medium text-gray-900">{clothTypeLabels[item.clothType]}</span>
                    {getStatusBadge(item.status)}
                  </div>
                  <div className="text-xs text-gray-600 truncate">{item.clothImageName}</div>
                  {item.error && <div className="text-xs text-red-600 mt-1">{item.error}</div>}
                </div>
                {item.status === "pending" && (
                  <button
                    onClick={() => onRemoveItem(item.id)}
                    className="flex-shrink-0 p-1 hover:bg-red-100 rounded transition"
                  >
                    <Trash2 className="w-4 h-4 text-red-600" />
                  </button>
                )}
              </div>
            ))
          )}
        </div>

        {/* Add Item Form */}
        {showForm ? (
          <div className="bg-white rounded-lg p-3 border border-gray-200 space-y-3">
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-2">Clothing Type</label>
              <div className="grid grid-cols-2 gap-2">
                {(["upper", "lower", "combo", "full"] as const).map((type) => (
                  <button
                    key={type}
                    onClick={() => setSelectedType(type)}
                    className={`p-2 rounded text-sm font-medium transition ${
                      selectedType === type
                        ? "bg-orange-500 text-white"
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    }`}
                  >
                    {clothTypeLabels[type]}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                onClick={() => {
                  onAddItem(selectedType, `${clothTypeLabels[selectedType]} - Item`);
                  setShowForm(false);
                }}
                className="flex-1 bg-orange-500 hover:bg-orange-600"
              >
                Add to Queue
              </Button>
              <Button
                onClick={() => setShowForm(false)}
                variant="outline"
                className="flex-1"
              >
                Cancel
              </Button>
            </div>
          </div>
        ) : (
          <Button
            onClick={() => setShowForm(true)}
            variant="outline"
            className="w-full border-dashed border-2"
            disabled={isProcessing}
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Clothing Item
          </Button>
        )}

        {/* Controls */}
        {items.length > 0 && (
          <div className="flex gap-2">
            {!isProcessing ? (
              <Button
                onClick={onStartBatch}
                className="flex-1 bg-green-600 hover:bg-green-700"
                disabled={pendingCount === 0}
              >
                <Play className="w-4 h-4 mr-2" />
                Start Batch
              </Button>
            ) : (
              <Button
                onClick={onPauseBatch}
                className="flex-1 bg-yellow-600 hover:bg-yellow-700"
              >
                <Pause className="w-4 h-4 mr-2" />
                Pause
              </Button>
            )}
          </div>
        )}

        {/* Info */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-blue-800">
          <p className="font-medium mb-1">💡 Batch Mode Tips:</p>
          <ul className="text-xs space-y-1 text-blue-700">
            <li>• Add multiple clothing items to the queue</li>
            <li>• Click "Start Batch" to process all items sequentially</li>
            <li>• Each item uses 1 credit (or test mode)</li>
            <li>• Results are saved after each generation</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}
