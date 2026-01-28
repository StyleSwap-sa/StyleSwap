import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Upload, Loader2, Check, AlertCircle, Download, Info, Sparkles, Zap } from "lucide-react";
import { resizeImage, validateImageForFitroom, getImageDimensions, cropBottomClothing, cropTopClothing } from "@/lib/imageUtils";

interface TryOnResult {
  taskId: string;
  resultImageUrl: string;
  createdAt: Date;
}

export function TestBoutiqueTryOn() {
  // State for uploads
  const [modelPhoto, setModelPhoto] = useState<File | null>(null);
  const [modelPhotoPreview, setModelPhotoPreview] = useState<string>("");
  const [modelPhotoDimensions, setModelPhotoDimensions] = useState<{ width: number; height: number } | null>(null);
  const [clothImage, setClothImage] = useState<File | null>(null);
  const [clothImagePreview, setClothImagePreview] = useState<string>("");
  const [clothImageDimensions, setClothImageDimensions] = useState<{ width: number; height: number } | null>(null);
  const [clothType, setClothType] = useState<"upper" | "lower" | "combo" | "full">("upper");
  const [lowerClothImage, setLowerClothImage] = useState<File | null>(null);
  const [lowerClothImagePreview, setLowerClothImagePreview] = useState<string>("");
  
  // State for processing
  const [isLoading, setIsLoading] = useState(false);
  const [isPolling, setIsPolling] = useState(false);
  const [currentTaskId, setCurrentTaskId] = useState<string | null>(null);
  const [processingProgress, setProcessingProgress] = useState(0);
  
  // State for results
  const [result, setResult] = useState<TryOnResult | null>(null);
  const [error, setError] = useState<string>("");
  const [warning, setWarning] = useState<string>("");
  
  // Refs
  const modelPhotoInputRef = useRef<HTMLInputElement>(null);
  const clothImageInputRef = useRef<HTMLInputElement>(null);
  const lowerClothImageInputRef = useRef<HTMLInputElement>(null);
  const pollingStartTimeRef = useRef<number | null>(null);
  const POLLING_TIMEOUT_MS = 300000; // 5 minutes max

  const handleCreateTryOn = async () => {
    if (!modelPhoto || !clothImage) {
      setError("Please upload both a model photo and a clothing image");
      return;
    }

    setIsLoading(true);
    setError("");
    setWarning("");
    setProcessingProgress(0);

    try {
      // Auto-resize images if they exceed Fitroom limits
      setProcessingProgress(5);
      
      let finalModelPhoto = modelPhoto;
      let finalClothImage = clothImage;
      
      // Check and resize model photo if needed
      const modelDimensions = await getImageDimensions(modelPhoto);
      if (modelDimensions.width > 1024 || modelDimensions.height > 1024) {
        console.log("[TestBoutiqueTryOn] Model photo exceeds 1024px, auto-resizing...");
        const resizedBlob = await resizeImage(modelPhoto, 1024);
        finalModelPhoto = new File([resizedBlob], modelPhoto.name, { type: "image/jpeg" });
        setWarning(`Model photo auto-resized from ${modelDimensions.width}x${modelDimensions.height}px`);
      }
      
      setProcessingProgress(10);
      
      // Crop clothing image based on selected type
      console.log("[TestBoutiqueTryOn] Processing clothing image for type:", clothType);
      
      try {
        if (clothType === "upper") {
          console.log("[TestBoutiqueTryOn] Cropping top portion of clothing image");
          finalClothImage = await cropTopClothing(finalClothImage);
          setWarning("Clothing image cropped to top portion for better fitting");
        } else if (clothType === "lower") {
          console.log("[TestBoutiqueTryOn] Cropping bottom portion of clothing image");
          finalClothImage = await cropBottomClothing(finalClothImage);
          setWarning("Clothing image cropped to bottom portion for better fitting");
        }
      } catch (cropError) {
        console.error("[TestBoutiqueTryOn] Error cropping image:", cropError);
        // Continue with original image if cropping fails
        setWarning("Could not optimize clothing image, using original");
      }
      
      setProcessingProgress(15);
      console.log("[TestBoutiqueTryOn] Ready to send images to backend");

      // Send resized files using FormData
      const formData = new FormData();
      formData.append("modelImage", finalModelPhoto);
      
      // For combo, send as upper+lower. For single garments, send only cloth image
      if (clothType === "combo") {
        formData.append("upperClothImage", finalClothImage);
        if (lowerClothImage) {
          formData.append("lowerClothImage", lowerClothImage);
        }
      } else {
        // For single garments (upper/lower), send only the cloth image
        formData.append("clothImage", finalClothImage);
      }
      
      // Use selected cloth type (Fitroom API expects: upper, lower, or combo)
      formData.append("clothType", clothType);
      formData.append("testMode", "true"); // Test mode - no credits used
      console.log("[TestBoutiqueTryOn] FormData clothType:", clothType);
      console.log("[TestBoutiqueTryOn] FormData modelImage:", finalModelPhoto?.name, finalModelPhoto?.size);
      console.log("[TestBoutiqueTryOn] FormData clothImage:", finalClothImage?.name, finalClothImage?.size);
      setProcessingProgress(20);

      // Call the dedicated file upload endpoint with testMode=true
      const response = await fetch("/api/tryon/upload?testMode=true", {
        method: "POST",
        body: formData,
        credentials: "include", // Include session cookie
      });

      if (!response.ok) {
        let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
        try {
          const errorData = await response.json();
          if (errorData.error && typeof errorData.error === 'string') {
            errorMessage = errorData.error;
          }
        } catch (e) {
          // If response is not JSON, use default error message
        }
        throw new Error(errorMessage);
      }

      const data = await response.json();

      if (data.success && data.taskId) {
        setCurrentTaskId(data.taskId);
        setIsPolling(true);
        setProcessingProgress(20);
      } else {
        let errorMsg = "Failed to create try-on task";
        if (data.error) {
          if (typeof data.error === 'string') {
            errorMsg = data.error;
          } else if (typeof data.error === 'object' && data.error.message) {
            errorMsg = data.error.message;
          } else {
            errorMsg = String(data.error);
          }
        }
        setError(errorMsg);
        setIsLoading(false);
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "An error occurred";
      setError(errorMsg);
      setIsLoading(false);
    }
  };

  // Monitor polling status with timeout protection
  useEffect(() => {
    if (!isPolling || !currentTaskId) return;

    // Initialize polling start time on first poll
    if (!pollingStartTimeRef.current) {
      pollingStartTimeRef.current = Date.now();
    }

    // Check if polling has exceeded timeout
    const elapsedTime = Date.now() - (pollingStartTimeRef.current || Date.now());
    if (elapsedTime > POLLING_TIMEOUT_MS) {
      console.log("[TestBoutiqueTryOn] Polling timeout after", elapsedTime, "ms");
      setError("Try-on generation timed out. Please try again.");
      setIsPolling(false);
      pollingStartTimeRef.current = null;
      setProcessingProgress(100);
      return;
    }

    // Poll for status
    const pollStatus = async () => {
      try {
        const response = await fetch(`/api/tryon/status?taskId=${currentTaskId}`);
        if (!response.ok) throw new Error("Failed to fetch status");
        
        const data = await response.json();
        const progress = data.progress || 0;
        const displayProgress = Math.min(20 + (progress * 0.75), 95);
        setProcessingProgress(displayProgress);

        if (data.status?.toUpperCase() === "COMPLETED") {
          console.log("[TestBoutiqueTryOn] Try-on completed successfully!");
          setResult({
            taskId: data.taskId,
            resultImageUrl: data.resultImage || data.resultImageUrl,
            createdAt: new Date(),
          });
          setIsPolling(false);
          setProcessingProgress(100);
          pollingStartTimeRef.current = null;
        } else if (data.status?.toUpperCase() === "FAILED") {
          const errorMsg = data.error || "Try-on generation failed";
          console.log("[TestBoutiqueTryOn] Try-on failed:", errorMsg);
          setError(errorMsg);
          setIsPolling(false);
          pollingStartTimeRef.current = null;
          setProcessingProgress(100);
        }
      } catch (err) {
        console.error("[TestBoutiqueTryOn] Polling error:", err);
      }
    };

    const interval = setInterval(pollStatus, 2000);
    return () => clearInterval(interval);
  }, [isPolling, currentTaskId]);

  // Handle model photo selection
  const handleModelPhotoSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const validation = await validateImageForFitroom(file);
      if (!validation.isValid) {
        setError(validation.error || "Invalid image");
        return;
      }

      setModelPhoto(file);
      const reader = new FileReader();
      reader.onload = (event) => {
        setModelPhotoPreview(event.target?.result as string);
      };
      reader.readAsDataURL(file);

      const dimensions = await getImageDimensions(file);
      setModelPhotoDimensions(dimensions);
      setError("");
    } catch (err) {
      setError("Failed to process model photo");
    }
  };

  // Handle cloth image selection
  const handleClothImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const validation = await validateImageForFitroom(file);
      if (!validation.isValid) {
        setError(validation.error || "Invalid image");
        return;
      }

      setClothImage(file);
      const reader = new FileReader();
      reader.onload = (event) => {
        setClothImagePreview(event.target?.result as string);
      };
      reader.readAsDataURL(file);

      const dimensions = await getImageDimensions(file);
      setClothImageDimensions(dimensions);
      setError("");
    } catch (err) {
      setError("Failed to process clothing image");
    }
  };

  // Handle lower cloth image selection (for combo)
  const handleLowerClothImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const validation = await validateImageForFitroom(file);
      if (!validation.isValid) {
        setError(validation.error || "Invalid image");
        return;
      }

      setLowerClothImage(file);
      const reader = new FileReader();
      reader.onload = (event) => {
        setLowerClothImagePreview(event.target?.result as string);
      };
      reader.readAsDataURL(file);
      setError("");
    } catch (err) {
      setError("Failed to process lower clothing image");
    }
  };

  // Download result image
  const handleDownloadResult = async () => {
    if (!result?.resultImageUrl) return;
    try {
      const response = await fetch(result.resultImageUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `test-tryon-result-${result.taskId}.jpg`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      console.error("Failed to download result:", err);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground p-4 md:p-8">
      <div className="max-w-2xl mx-auto space-y-8">
        {/* Header */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Sparkles className="w-8 h-8 text-primary" />
            <h1 className="text-4xl font-bold">Test Boutique Try-On</h1>
          </div>
          <p className="text-muted-foreground">
            Test all clothing types in test mode (no credits used)
          </p>
        </div>

        {/* Test Mode Badge */}
        <Card className="bg-green-50 border-green-200">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
              <div>
                <p className="font-semibold text-green-900">Test Mode Active</p>
                <p className="text-sm text-green-800">Try-ons are generated for free in test mode</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Image Guidelines */}
        <Card className="bg-blue-50 border-blue-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Info className="w-5 h-5" />
              Image Guidelines for Best Results:
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div>
              <strong>Model Photo:</strong> Full-body shot, standing straight, facing forward, simple background (recommended: 2048px)
            </div>
            <div>
              <strong>Clothing:</strong> Clear front view on white/solid background, well-lit, entire item visible (recommended: 1024px)
            </div>
            <div>
              <strong>Auto-optimization:</strong> Images larger than recommended will automatically be resized for faster processing
            </div>
            <div>
              <strong>Quality:</strong> Ensure images are not heavily compressed and have good lighting
            </div>
          </CardContent>
        </Card>

        {/* Clothing Type Selection */}
        <Card>
          <CardHeader>
            <CardTitle>Select Clothes</CardTitle>
            <p className="text-sm text-muted-foreground">Select the type of clothing you want to try on</p>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <Button
                onClick={() => setClothType("upper")}
                variant={clothType === "upper" ? "default" : "outline"}
                className="h-24 flex flex-col items-center justify-center gap-2"
              >
                <span className="text-lg font-semibold">Top</span>
                <span className="text-xs text-muted-foreground">Shirt, jacket, etc</span>
              </Button>
              <Button
                onClick={() => setClothType("lower")}
                variant={clothType === "lower" ? "default" : "outline"}
                className="h-24 flex flex-col items-center justify-center gap-2"
              >
                <span className="text-lg font-semibold">Bottom</span>
                <span className="text-xs text-muted-foreground">Pants, skirt, etc</span>
              </Button>
              <Button
                onClick={() => setClothType("full")}
                variant={clothType === "full" ? "default" : "outline"}
                className="h-24 flex flex-col items-center justify-center gap-2"
              >
                <span className="text-lg font-semibold">Full Dress</span>
                <span className="text-xs text-muted-foreground">One piece</span>
              </Button>
              <Button
                onClick={() => setClothType("combo")}
                variant={clothType === "combo" ? "default" : "outline"}
                className="h-24 flex flex-col items-center justify-center gap-2"
              >
                <span className="text-lg font-semibold">Top & Bottom</span>
                <span className="text-xs text-muted-foreground">Two pieces</span>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Model Photo Upload */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">1. Upload Model Photo</CardTitle>
            <p className="text-sm text-muted-foreground">Full-body photo, front view (recommended: 2048px height)</p>
          </CardHeader>
          <CardContent className="space-y-4">
            {modelPhotoPreview && (
              <div className="relative w-full h-64 bg-muted rounded-lg overflow-hidden">
                <img src={modelPhotoPreview} alt="Model preview" className="w-full h-full object-cover" />
                <Button
                  onClick={() => {
                    setModelPhoto(null);
                    setModelPhotoPreview("");
                  }}
                  variant="destructive"
                  size="sm"
                  className="absolute top-2 right-2"
                >
                  Remove
                </Button>
              </div>
            )}
            <div
              onClick={() => modelPhotoInputRef.current?.click()}
              className="border-2 border-dashed border-border rounded-lg p-8 text-center cursor-pointer hover:bg-muted/50 transition"
            >
              <Upload className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
              <p className="font-medium">Click to upload model photo</p>
              <p className="text-sm text-muted-foreground">PNG, JPG, or WebP</p>
            </div>
            <input
              ref={modelPhotoInputRef}
              type="file"
              accept="image/*"
              onChange={handleModelPhotoSelect}
              className="hidden"
            />
            {modelPhotoDimensions && (
              <p className="text-xs text-muted-foreground">
                Dimensions: {modelPhotoDimensions.width}x{modelPhotoDimensions.height}px
              </p>
            )}
          </CardContent>
        </Card>

        {/* Clothing Image Upload */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">2. Upload Clothing Image</CardTitle>
            <p className="text-sm text-muted-foreground">Dress, top, or bottom - clear front view on solid background</p>
          </CardHeader>
          <CardContent className="space-y-4">
            {clothImagePreview && (
              <div className="relative w-full h-64 bg-muted rounded-lg overflow-hidden">
                <img src={clothImagePreview} alt="Clothing preview" className="w-full h-full object-cover" />
                <Button
                  onClick={() => {
                    setClothImage(null);
                    setClothImagePreview("");
                  }}
                  variant="destructive"
                  size="sm"
                  className="absolute top-2 right-2"
                >
                  Remove
                </Button>
              </div>
            )}
            <div
              onClick={() => clothImageInputRef.current?.click()}
              className="border-2 border-dashed border-border rounded-lg p-8 text-center cursor-pointer hover:bg-muted/50 transition"
            >
              <Upload className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
              <p className="font-medium">Click to upload clothing image</p>
              <p className="text-sm text-muted-foreground">PNG, JPG, or WebP</p>
            </div>
            <input
              ref={clothImageInputRef}
              type="file"
              accept="image/*"
              onChange={handleClothImageSelect}
              className="hidden"
            />
            {clothImageDimensions && (
              <p className="text-xs text-muted-foreground">
                Dimensions: {clothImageDimensions.width}x{clothImageDimensions.height}px
              </p>
            )}
          </CardContent>
        </Card>

        {/* Lower Clothing Image Upload (for combo) */}
        {clothType === "combo" && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">3. Upload Bottom Clothing Image</CardTitle>
              <p className="text-sm text-muted-foreground">Pants, skirt, or bottom wear</p>
            </CardHeader>
            <CardContent className="space-y-4">
              {lowerClothImagePreview && (
                <div className="relative w-full h-64 bg-muted rounded-lg overflow-hidden">
                  <img src={lowerClothImagePreview} alt="Lower clothing preview" className="w-full h-full object-cover" />
                  <Button
                    onClick={() => {
                      setLowerClothImage(null);
                      setLowerClothImagePreview("");
                    }}
                    variant="destructive"
                    size="sm"
                    className="absolute top-2 right-2"
                  >
                    Remove
                  </Button>
                </div>
              )}
              <div
                onClick={() => lowerClothImageInputRef.current?.click()}
                className="border-2 border-dashed border-border rounded-lg p-8 text-center cursor-pointer hover:bg-muted/50 transition"
              >
                <Upload className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                <p className="font-medium">Click to upload bottom clothing image</p>
                <p className="text-sm text-muted-foreground">PNG, JPG, or WebP</p>
              </div>
              <input
                ref={lowerClothImageInputRef}
                type="file"
                accept="image/*"
                onChange={handleLowerClothImageSelect}
                className="hidden"
              />
            </CardContent>
          </Card>
        )}

        {/* Error Message */}
        {error && (
          <Card className="bg-red-50 border-red-200">
            <CardContent className="flex items-start gap-3 pt-6">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-red-900">Error</p>
                <p className="text-sm text-red-800">{error}</p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Warning Message */}
        {warning && (
          <Card className="bg-yellow-50 border-yellow-200">
            <CardContent className="flex items-start gap-3 pt-6">
              <Info className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-yellow-800">{warning}</p>
            </CardContent>
          </Card>
        )}

        {/* Processing Progress */}
        {isLoading || isPolling ? (
          <Card className="bg-orange-50 border-orange-200">
            <CardContent className="pt-6 space-y-4">
              <div className="flex items-center gap-3">
                <Loader2 className="w-5 h-5 text-orange-600 animate-spin" />
                <span className="font-medium text-orange-900">Generating try-on...</span>
              </div>
              <div className="w-full bg-orange-200 rounded-full h-2 overflow-hidden">
                <div
                  className="bg-orange-600 h-full transition-all duration-300"
                  style={{ width: `${processingProgress}%` }}
                />
              </div>
              <p className="text-sm text-orange-800 text-center">{Math.round(processingProgress)}% complete</p>
            </CardContent>
          </Card>
        ) : null}

        {/* Generate Button */}
        {!isLoading && !isPolling && !result && (
          <Button
            onClick={handleCreateTryOn}
            disabled={!modelPhoto || !clothImage || isLoading}
            className="w-full h-12 text-lg font-semibold"
          >
            <Zap className="w-5 h-5 mr-2" />
            Generate Try-On (Test Mode)
          </Button>
        )}

        {/* Result */}
        {result && (
          <Card className="bg-green-50 border-green-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-green-900">
                <Check className="w-5 h-5" />
                Try-On Generated Successfully!
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="relative w-full h-96 bg-muted rounded-lg overflow-hidden">
                <img src={result.resultImageUrl} alt="Try-on result" className="w-full h-full object-cover" />
              </div>
              <div className="flex gap-3">
                <Button onClick={handleDownloadResult} variant="default" className="flex-1">
                  <Download className="w-4 h-4 mr-2" />
                  Download
                </Button>
                <Button onClick={() => setResult(null)} variant="outline" className="flex-1">
                  Try Another
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
