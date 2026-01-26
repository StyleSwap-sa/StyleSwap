import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Upload, Trash2, Download, Zap, AlertCircle } from "lucide-react";
import { cropTopClothing, cropBottomClothing } from "@/lib/imageUtils";

interface ClothingItem {
  id: string;
  clothingFile: File | null;
  clothType: "upper" | "lower" | "combo" | "full";
  clothingPreview: string | null;
  status: "pending" | "processing" | "completed" | "error";
  resultImageUrl: string | null;
  errorMessage: string | null;
  progress: number;
}

export function BulkBatchTryOn() {
  const [bodyFile, setBodyFile] = useState<File | null>(null);
  const [bodyPreview, setBodyPreview] = useState<string | null>(null);
  const [clothingItems, setClothingItems] = useState<ClothingItem[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [testMode, setTestMode] = useState(true);
  const bodyInputRef = useRef<HTMLInputElement>(null);
  const clothingInputRef = useRef<HTMLInputElement>(null);

  const handleBodyUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setBodyFile(file);
      const reader = new FileReader();
      reader.onload = (event) => {
        setBodyPreview(event.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleClothingUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      Array.from(files).forEach((file) => {
        const reader = new FileReader();
        reader.onload = (event) => {
          const newItem: ClothingItem = {
            id: `item-${Date.now()}-${Math.random()}`,
            clothingFile: file,
            clothType: "upper",
            clothingPreview: event.target?.result as string,
            status: "pending",
            resultImageUrl: null,
            errorMessage: null,
            progress: 0,
          };
          setClothingItems((prev) => [...prev, newItem]);
        };
        reader.readAsDataURL(file);
      });
    }
  };

  const updateItemClothType = (id: string, clothType: "upper" | "lower" | "combo" | "full") => {
    setClothingItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, clothType } : item))
    );
  };

  const removeItem = (id: string) => {
    setClothingItems((prev) => prev.filter((item) => item.id !== id));
  };

  const downloadResult = (url: string, filename: string) => {
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    link.click();
  };

  const downloadAllResults = () => {
    clothingItems.forEach((item, index) => {
      if (item.resultImageUrl) {
        downloadResult(item.resultImageUrl, `try-on-${index + 1}.png`);
      }
    });
  };

  const processBatch = async () => {
    if (!bodyFile || clothingItems.length === 0) {
      alert("Please upload a body photo and at least one clothing item");
      return;
    }

    setIsProcessing(true);

    // Process all items in parallel
    const promises = clothingItems.map(async (item) => {
      try {
        setClothingItems((prev) =>
          prev.map((i) => (i.id === item.id ? { ...i, status: "processing", progress: 10 } : i))
        );

        // Prepare clothing image with cropping if needed
        let clothingToUse = item.clothingFile;
        if (item.clothType === "upper") {
          clothingToUse = await cropTopClothing(item.clothingFile!);
        } else if (item.clothType === "lower") {
          clothingToUse = await cropBottomClothing(item.clothingFile!);
        }

        // Create FormData
        const formData = new FormData();
        formData.append("bodyImage", bodyFile);
        formData.append("clothingImage", clothingToUse);
        formData.append("clothType", item.clothType);
        formData.append("testMode", testMode.toString());

        // Upload and generate try-on
        const uploadResponse = await fetch("/api/tryon/upload", {
          method: "POST",
          body: formData,
        });

        if (!uploadResponse.ok) {
          throw new Error("Upload failed");
        }

        const uploadData = await uploadResponse.json();
        const taskId = uploadData.taskId;

        // Poll for status
        let completed = false;
        let attempts = 0;
        const maxAttempts = 300; // 5 minutes with 1-second polling

        while (!completed && attempts < maxAttempts) {
          attempts++;

          const statusResponse = await fetch(`/api/tryon/status/${taskId}`);
          if (!statusResponse.ok) {
            throw new Error("Status check failed");
          }

          const statusData = await statusResponse.json();

          setClothingItems((prev) =>
            prev.map((i) =>
              i.id === item.id
                ? { ...i, progress: Math.min(statusData.progress || 0, 95) }
                : i
            )
          );

          if (statusData.status === "completed") {
            setClothingItems((prev) =>
              prev.map((i) =>
                i.id === item.id
                  ? {
                      ...i,
                      status: "completed",
                      resultImageUrl: statusData.resultImageUrl,
                      progress: 100,
                    }
                  : i
              )
            );
            completed = true;
          } else if (statusData.status === "failed") {
            throw new Error(statusData.error || "Try-on generation failed");
          }

          if (!completed) {
            await new Promise((resolve) => setTimeout(resolve, 1000));
          }
        }

        if (!completed) {
          throw new Error("Try-on generation timeout");
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Unknown error";
        setClothingItems((prev) =>
          prev.map((i) =>
            i.id === item.id
              ? { ...i, status: "error", errorMessage, progress: 0 }
              : i
          )
        );
      }
    });

    await Promise.all(promises);
    setIsProcessing(false);
  };

  const completedCount = clothingItems.filter((i) => i.status === "completed").length;
  const errorCount = clothingItems.filter((i) => i.status === "error").length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-secondary/5 p-4 md:p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="flex items-center justify-center gap-2">
            <Zap className="w-8 h-8 text-primary" />
            <h1 className="text-4xl font-bold">Bulk Batch Try-On Processing</h1>
          </div>
          <p className="text-muted-foreground text-lg">
            Upload multiple clothing items and generate try-ons in parallel
          </p>
        </div>

        {/* Body Photo Section */}
        <Card className="border-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <span className="bg-primary text-primary-foreground rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold">
                1
              </span>
              Upload Body Photo (Required)
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {bodyPreview ? (
              <div className="space-y-4">
                <img
                  src={bodyPreview}
                  alt="Body preview"
                  className="max-h-64 mx-auto rounded-lg border border-border"
                />
                <Button
                  variant="outline"
                  onClick={() => bodyInputRef.current?.click()}
                  className="w-full"
                >
                  Change Body Photo
                </Button>
              </div>
            ) : (
              <div
                className="border-2 border-dashed border-primary rounded-lg p-8 text-center cursor-pointer hover:bg-primary/5 transition"
                onClick={() => bodyInputRef.current?.click()}
              >
                <Upload className="w-12 h-12 text-primary mx-auto mb-2" />
                <p className="font-medium">Click to upload body photo</p>
                <p className="text-sm text-muted-foreground">PNG, JPG, or WebP</p>
              </div>
            )}
            <input
              ref={bodyInputRef}
              type="file"
              accept="image/png,image/jpeg,image/webp"
              onChange={handleBodyUpload}
              className="hidden"
            />
          </CardContent>
        </Card>

        {/* Clothing Items Section */}
        <Card className="border-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <span className="bg-primary text-primary-foreground rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold">
                2
              </span>
              Upload Clothing Items ({clothingItems.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div
              className="border-2 border-dashed border-primary rounded-lg p-8 text-center cursor-pointer hover:bg-primary/5 transition"
              onClick={() => clothingInputRef.current?.click()}
            >
              <Upload className="w-12 h-12 text-primary mx-auto mb-2" />
              <p className="font-medium">Click to upload clothing items</p>
              <p className="text-sm text-muted-foreground">
                Select multiple images (PNG, JPG, or WebP)
              </p>
            </div>
            <input
              ref={clothingInputRef}
              type="file"
              accept="image/png,image/jpeg,image/webp"
              multiple
              onChange={handleClothingUpload}
              className="hidden"
            />

            {/* Clothing Items Grid */}
            {clothingItems.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {clothingItems.map((item) => (
                  <Card key={item.id} className="overflow-hidden">
                    <CardContent className="p-4 space-y-3">
                      {item.clothingPreview && (
                        <img
                          src={item.clothingPreview}
                          alt="Clothing preview"
                          className="w-full h-40 object-cover rounded border border-border"
                        />
                      )}

                      {/* Clothing Type Selector */}
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Clothing Type</label>
                        <div className="grid grid-cols-2 gap-2">
                          {[
                            { value: "upper", label: "Top" },
                            { value: "lower", label: "Bottom" },
                            { value: "full", label: "Dress" },
                            { value: "combo", label: "Top & Bottom" },
                          ].map((type) => (
                            <button
                              key={type.value}
                              onClick={() =>
                                updateItemClothType(
                                  item.id,
                                  type.value as "upper" | "lower" | "combo" | "full"
                                )
                              }
                              className={`px-2 py-1 rounded text-xs font-medium transition ${
                                item.clothType === type.value
                                  ? "bg-primary text-primary-foreground"
                                  : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
                              }`}
                            >
                              {type.label}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Status */}
                      {item.status !== "pending" && (
                        <div className="space-y-2">
                          {item.status === "processing" && (
                            <>
                              <div className="flex items-center gap-2 text-sm">
                                <div className="animate-spin">⚡</div>
                                <span>Processing: {item.progress}%</span>
                              </div>
                              <div className="w-full bg-secondary rounded-full h-2">
                                <div
                                  className="bg-primary h-2 rounded-full transition-all"
                                  style={{ width: `${item.progress}%` }}
                                />
                              </div>
                            </>
                          )}
                          {item.status === "completed" && item.resultImageUrl && (
                            <>
                              <div className="text-sm text-green-600 font-medium flex items-center gap-1">
                                ✓ Completed
                              </div>
                              <img
                                src={item.resultImageUrl}
                                alt="Try-on result"
                                className="w-full h-40 object-cover rounded border border-border"
                              />
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() =>
                                  downloadResult(
                                    item.resultImageUrl!,
                                    `try-on-${clothingItems.indexOf(item) + 1}.png`
                                  )
                                }
                                className="w-full"
                              >
                                <Download className="w-4 h-4 mr-1" />
                                Download
                              </Button>
                            </>
                          )}
                          {item.status === "error" && (
                            <div className="text-sm text-red-600 flex items-start gap-2">
                              <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                              <span>{item.errorMessage}</span>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Remove Button */}
                      {item.status === "pending" && (
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => removeItem(item.id)}
                          className="w-full"
                        >
                          <Trash2 className="w-4 h-4 mr-1" />
                          Remove
                        </Button>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Test Mode Toggle */}
        <Card>
          <CardContent className="pt-6">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={testMode}
                onChange={(e) => setTestMode(e.target.checked)}
                disabled={isProcessing}
                className="w-4 h-4"
              />
              <span className="font-medium">
                Test Mode (Generate try-ons without using credits)
              </span>
            </label>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="flex gap-4 flex-col sm:flex-row">
          <Button
            onClick={processBatch}
            disabled={!bodyFile || clothingItems.length === 0 || isProcessing}
            size="lg"
            className="flex-1"
          >
            {isProcessing ? (
              <>
                <span className="animate-spin mr-2">⚡</span>
                Processing {completedCount}/{clothingItems.length}...
              </>
            ) : (
              <>
                <Zap className="w-5 h-5 mr-2" />
                Generate All Try-Ons
              </>
            )}
          </Button>

          {completedCount > 0 && (
            <Button
              onClick={downloadAllResults}
              variant="outline"
              size="lg"
              className="flex-1"
            >
              <Download className="w-5 h-5 mr-2" />
              Download All Results
            </Button>
          )}
        </div>

        {/* Summary */}
        {clothingItems.length > 0 && (
          <Card className="bg-secondary/50">
            <CardContent className="pt-6">
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <p className="text-2xl font-bold text-primary">{clothingItems.length}</p>
                  <p className="text-sm text-muted-foreground">Total Items</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-green-600">{completedCount}</p>
                  <p className="text-sm text-muted-foreground">Completed</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-red-600">{errorCount}</p>
                  <p className="text-sm text-muted-foreground">Errors</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
