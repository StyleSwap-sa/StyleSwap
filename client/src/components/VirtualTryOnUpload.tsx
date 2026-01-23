"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Upload, Loader2, Check, AlertCircle, Download, Share2, Info, Sparkles } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { resizeImage, validateImageForFitroom, formatFileSize, getImageDimensions } from "@/lib/imageUtils";

interface TryOnResult {
  taskId: string;
  resultImageUrl: string;
  createdAt: Date;
}

export function VirtualTryOnUpload() {
  // State for uploads
  const [modelPhoto, setModelPhoto] = useState<File | null>(null);
  const [modelPhotoPreview, setModelPhotoPreview] = useState<string>("");
  const [modelPhotoDimensions, setModelPhotoDimensions] = useState<{ width: number; height: number } | null>(null);
  const [clothImage, setClothImage] = useState<File | null>(null);
  const [clothImagePreview, setClothImagePreview] = useState<string>("");
  const [clothImageDimensions, setClothImageDimensions] = useState<{ width: number; height: number } | null>(null);
  
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
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const pollingStartTimeRef = useRef<number | null>(null);
  const POLLING_TIMEOUT_MS = 180000; // 3 minutes max (Fitroom can take up to 2+ minutes)

  // Fetch user credits
  const { data: credits, refetch: refetchCredits } = trpc.tryon.getCredits.useQuery();

  // Create try-on mutation
  const createTryOnMutation = trpc.tryon.createTryOn.useMutation();
  
  // Get try-on status query
  const getTryOnStatusQuery = trpc.tryon.pollTryOnStatus.useQuery(
    { taskId: currentTaskId || "" },
    { enabled: !!currentTaskId && isPolling, refetchInterval: 2000 }
  );

  // Handle model photo upload
  const handleModelPhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError("");
    setWarning("");

    // Validate image
    const validation = await validateImageForFitroom(file, "model");
    if (!validation.valid) {
      setError(validation.error || "Invalid image");
      return;
    }

    if (validation.warning) {
      setWarning(validation.warning);
    }

    setModelPhoto(file);

    // Get dimensions
    try {
      const dimensions = await getImageDimensions(file);
      setModelPhotoDimensions(dimensions);
    } catch (err) {
      console.error("Failed to get image dimensions:", err);
    }

    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setModelPhotoPreview(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  // Handle clothing image upload
  const handleClothImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError("");
    setWarning("");

    // Validate image
    const validation = await validateImageForFitroom(file, "clothing");
    if (!validation.valid) {
      setError(validation.error || "Invalid image");
      return;
    }

    if (validation.warning) {
      setWarning(validation.warning);
    }

    setClothImage(file);

    // Get dimensions
    try {
      const dimensions = await getImageDimensions(file);
      setClothImageDimensions(dimensions);
    } catch (err) {
      console.error("Failed to get image dimensions:", err);
    }

    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setClothImagePreview(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  // Handle try-on creation
  const handleCreateTryOn = async () => {
    if (!modelPhoto || !clothImage) {
      setError("Please upload both a body photo and a clothing image");
      return;
    }

    if (!credits || credits.remainingCredits < 1) {
      setError("Insufficient credits. Please purchase more try-ons.");
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
        console.log("[VirtualTryOn] Model photo exceeds 1024px, auto-resizing...");
        const resizedBlob = await resizeImage(modelPhoto, 1024);
        finalModelPhoto = new File([resizedBlob], modelPhoto.name, { type: "image/jpeg" });
        setWarning(`Model photo auto-resized from ${modelDimensions.width}x${modelDimensions.height}px`);
      }
      
      setProcessingProgress(10);
      
      // Check and resize clothing image if needed
      const clothDimensions = await getImageDimensions(clothImage);
      if (clothDimensions.width > 1024 || clothDimensions.height > 1024) {
        console.log("[VirtualTryOn] Cloth image exceeds 1024px, auto-resizing...");
        const resizedBlob = await resizeImage(clothImage, 1024);
        finalClothImage = new File([resizedBlob], clothImage.name, { type: "image/jpeg" });
        setWarning(`Clothing image auto-resized from ${clothDimensions.width}x${clothDimensions.height}px`);
      }
      
      setProcessingProgress(15);

      // Send resized files using FormData
      const formData = new FormData();
      formData.append("modelImage", finalModelPhoto);
      formData.append("clothImage", finalClothImage);
      formData.append("clothType", "single");
      setProcessingProgress(20);

      // Call the dedicated file upload endpoint
      const response = await fetch("/api/tryon/upload", {
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
        setIsLoading(false);
        
        // Refetch credits to show updated balance
        refetchCredits();
      } else {
        // Ensure error is always a string, not a boolean
        console.log('[VirtualTryOn] Response not successful:', { success: data.success, taskId: data.taskId, error: data.error, errorType: typeof data.error });
        let errorMsg = "Failed to create try-on task";
        if (data.error) {
          console.log('[VirtualTryOn] data.error exists:', data.error, 'type:', typeof data.error);
          if (typeof data.error === 'string') {
            errorMsg = data.error;
          } else if (typeof data.error === 'object' && data.error.message) {
            errorMsg = data.error.message;
          } else if (typeof data.error === 'boolean') {
            errorMsg = "Try-on generation failed. Please check your images and try again.";
          } else {
            errorMsg = String(data.error);
          }
        }
        console.log('[VirtualTryOn] Final error message:', errorMsg);
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
    if (!isPolling || !getTryOnStatusQuery.data) return;

    // Initialize polling start time on first poll
    if (!pollingStartTimeRef.current) {
      pollingStartTimeRef.current = Date.now();
    }

    // Check if polling has exceeded timeout
    const elapsedTime = Date.now() - (pollingStartTimeRef.current || Date.now());
    if (elapsedTime > POLLING_TIMEOUT_MS) {
      setError("Try-on generation timed out (exceeded 3 minutes). Please try again with a different image.");
      setIsPolling(false);
      setCurrentTaskId(null);
      pollingStartTimeRef.current = null;
      return;
    }

    const status = getTryOnStatusQuery.data.status;
    
    if (status === "PROCESSING") {
      const progress = Math.min(20 + (elapsedTime / POLLING_TIMEOUT_MS) * 70, 90);
      setProcessingProgress(progress);
    } else if (status === "COMPLETED") {
      if (getTryOnStatusQuery.data.resultImage) {
        setResult({
          taskId: currentTaskId || "",
          resultImageUrl: getTryOnStatusQuery.data.resultImage,
          createdAt: new Date(),
        });
        setIsPolling(false);
        setProcessingProgress(100);
        setModelPhoto(null);
        setModelPhotoPreview("");
        setClothImage(null);
        setClothImagePreview("");
        setCurrentTaskId(null);
        pollingStartTimeRef.current = null;
      }
    } else if (status === "FAILED") {
      setError("Try-on generation failed. Please try again with a different image. Tip: Ensure images are well-lit and clear.");
      setIsPolling(false);
      setCurrentTaskId(null);
      pollingStartTimeRef.current = null;
    }
  }, [getTryOnStatusQuery.data, isPolling, currentTaskId]);

  const isReadyToGenerate = modelPhoto && clothImage && credits && credits.remainingCredits >= 1;

  return (
    <div className="space-y-6">
      {/* Upload Section */}
      <Card className="premium-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="w-5 h-5 text-primary" />
            Personal Virtual Try-On
          </CardTitle>
          <p className="text-sm text-muted-foreground mt-2">
            Upload your body photo and clothing image to see how the garment looks on you
          </p>
          <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-950 rounded-lg border border-blue-200 dark:border-blue-800">
            <p className="text-xs font-semibold text-blue-900 dark:text-blue-100 mb-2 flex items-center gap-1">
              <Info className="w-4 h-4" /> Image Guidelines for Best Results:
            </p>
            <ul className="text-xs text-blue-800 dark:text-blue-200 space-y-1">
              <li><strong>Body Photo:</strong> Full-body shot, standing straight, facing forward, simple background (recommended: 2048px)</li>
              <li><strong>Clothing:</strong> Clear front view on white/solid background, well-lit, entire item visible (recommended: 1024px)</li>
              <li><strong>Auto-Optimization:</strong> Images larger than recommended will automatically be resized for faster processing</li>
              <li><strong>Quality:</strong> Ensure images are not heavily compressed and have good lighting</li>
            </ul>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Error Message */}
          {error && (
            <div className="p-4 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-lg flex gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-red-900 dark:text-red-100">{error}</p>
              </div>
            </div>
          )}

          {/* Warning Message */}
          {warning && (
            <div className="p-4 bg-yellow-50 dark:bg-yellow-950 border border-yellow-200 dark:border-yellow-800 rounded-lg flex gap-3">
              <AlertCircle className="w-5 h-5 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-yellow-900 dark:text-yellow-100">{warning}</p>
              </div>
            </div>
          )}

          {/* Model Photo Upload */}
          <div className="space-y-3">
            <label className="block font-medium">1. Upload Your Body Photo</label>
            <p className="text-sm text-muted-foreground">
              Full-body photo, front view (recommended: 2048px height)
            </p>
            <div
              onClick={() => modelPhotoInputRef.current?.click()}
              className="border-2 border-dashed border-border/40 rounded-lg p-8 text-center cursor-pointer hover:border-primary/50 transition-colors"
            >
              <input
                ref={modelPhotoInputRef}
                type="file"
                accept="image/*"
                onChange={handleModelPhotoUpload}
                className="hidden"
              />
              {modelPhotoPreview ? (
                <div className="space-y-4">
                  <img
                    src={modelPhotoPreview}
                    alt="Body photo preview"
                    className="w-full max-h-64 object-cover rounded-lg"
                  />
                  {modelPhotoDimensions && (
                    <p className="text-xs text-muted-foreground">
                      {modelPhotoDimensions.width} × {modelPhotoDimensions.height}px • {modelPhoto && formatFileSize(modelPhoto.size)}
                    </p>
                  )}
                  <p className="text-sm text-muted-foreground">
                    Click to change photo
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  <Upload className="w-12 h-12 text-muted-foreground mx-auto" />
                  <p className="text-sm font-medium">Click to upload body photo</p>
                  <p className="text-xs text-muted-foreground">PNG, JPG, or WebP</p>
                </div>
              )}
            </div>
          </div>

          {/* Clothing Image Upload */}
          <div className="space-y-3">
            <label className="block font-medium">2. Upload Clothing Image</label>
            <p className="text-sm text-muted-foreground">
              Clear front view on solid background (recommended: 1024px width)
            </p>
            <div
              onClick={() => clothImageInputRef.current?.click()}
              className="border-2 border-dashed border-border/40 rounded-lg p-8 text-center cursor-pointer hover:border-primary/50 transition-colors"
            >
              <input
                ref={clothImageInputRef}
                type="file"
                accept="image/*"
                onChange={handleClothImageUpload}
                className="hidden"
              />
              {clothImagePreview ? (
                <div className="space-y-4">
                  <img
                    src={clothImagePreview}
                    alt="Clothing preview"
                    className="w-full max-h-64 object-cover rounded-lg"
                  />
                  {clothImageDimensions && (
                    <p className="text-xs text-muted-foreground">
                      {clothImageDimensions.width} × {clothImageDimensions.height}px • {clothImage && formatFileSize(clothImage.size)}
                    </p>
                  )}
                  <p className="text-sm text-muted-foreground">
                    Click to change clothing
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  <Upload className="w-12 h-12 text-muted-foreground mx-auto" />
                  <p className="text-sm font-medium">Click to upload clothing image</p>
                  <p className="text-xs text-muted-foreground">PNG, JPG, or WebP</p>
                </div>
              )}
            </div>
          </div>

          {/* Credits Info */}
          {credits && (
            <div className="p-4 bg-primary/5 rounded-lg">
              <p className="text-sm">
                <strong>Remaining Credits:</strong> {credits.remainingCredits} try-ons
              </p>
            </div>
          )}

          {/* Generate Button */}
          <Button
            onClick={handleCreateTryOn}
            disabled={!isReadyToGenerate || isLoading || isPolling}
            className="w-full h-12 text-lg"
            size="lg"
          >
            {isLoading || isPolling ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                {isLoading ? "Optimizing Images..." : `Processing... ${Math.round(processingProgress)}%`}
              </>
            ) : (
              <>
                <Sparkles className="w-5 h-5 mr-2" />
                Generate Try-On
              </>
            )}
          </Button>

          {/* Progress Bar */}
          {(isLoading || isPolling) && (
            <div className="space-y-2">
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-primary h-2 rounded-full transition-all duration-300"
                  style={{ width: `${processingProgress}%` }}
                />
              </div>
              <p className="text-xs text-muted-foreground text-center">
                {processingProgress < 20 ? "Optimizing images..." : processingProgress < 100 ? "Generating try-on..." : "Complete!"}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Result Section */}
      {result && (
        <Card className="premium-card border-green-200 bg-green-50 dark:bg-green-950 dark:border-green-800">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-green-900 dark:text-green-100">
              <Check className="w-5 h-5 text-green-600 dark:text-green-400" />
              Try-On Generated Successfully!
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <img
              src={result.resultImageUrl}
              alt="Try-on result"
              className="w-full rounded-lg"
            />
            <div className="flex gap-3">
              <Button
                onClick={() => {
                  const link = document.createElement("a");
                  link.href = result.resultImageUrl;
                  link.download = `tryon-${Date.now()}.png`;
                  link.click();
                }}
                variant="outline"
                className="flex-1"
              >
                <Download className="w-4 h-4 mr-2" />
                Download
              </Button>
              <Button
                onClick={() => {
                  navigator.share({
                    title: "Check out my virtual try-on!",
                    text: "I tried this on using StyleSwap",
                    url: result.resultImageUrl,
                  }).catch(() => {
                    // Fallback if share not supported
                    const url = result.resultImageUrl;
                    navigator.clipboard.writeText(url);
                    alert("Link copied to clipboard!");
                  });
                }}
                variant="outline"
                className="flex-1"
              >
                <Share2 className="w-4 h-4 mr-2" />
                Share
              </Button>
            </div>
            <Button
              onClick={() => {
                setResult(null);
                setModelPhoto(null);
                setModelPhotoPreview("");
                setClothImage(null);
                setClothImagePreview("");
                setProcessingProgress(0);
              }}
              className="w-full"
            >
              Try Another
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}


