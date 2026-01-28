"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Upload, Loader2, Check, AlertCircle, Download, Share2, Info, Sparkles } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { resizeImage, validateImageForFitroom, formatFileSize, getImageDimensions, optimizeImageForFitroom } from "@/lib/imageUtils";
import { ReviewSubmissionForm } from "./ReviewSubmissionForm";
import { SizeReviewsDisplay } from "./SizeReviewsDisplay";

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
  const [clothType, setClothType] = useState<"upper" | "lower" | "combo" | "full">("upper");
  const [lowerClothImage, setLowerClothImage] = useState<File | null>(null);
  const [lowerClothImagePreview, setLowerClothImagePreview] = useState<string>("");
  const [testMode, setTestMode] = useState(false);
  
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
  const POLLING_TIMEOUT_MS = 150000; // 2.5 minutes max (HD mode can take up to 30 seconds)

  // Check if test mode is enabled (from URL params)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setTestMode(params.get('test') === 'true');
  }, []);

  // Fetch user credits
  const { data: credits, refetch: refetchCredits } = trpc.tryon.getCredits.useQuery();

  // Create try-on mutation
  const createTryOnMutation = trpc.tryon.createTryOn.useMutation();
  
  // Refund credits mutation
  const refundCreditsMutation = trpc.tryon.refundTryOnCredits.useMutation();
  
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

    // Validate original file first
    const validation = await validateImageForFitroom(file, "model");
    if (!validation.valid) {
      setError(validation.error || "Invalid image");
      return;
    }

    if (validation.warning) {
      setWarning(validation.warning);
    }

    // Use original file as-is (no optimization needed)
    let finalFile = file;

    setModelPhoto(finalFile);

    // Get dimensions
    try {
      const dimensions = await getImageDimensions(finalFile);
      setModelPhotoDimensions(dimensions);
    } catch (err) {
      console.error("Failed to get image dimensions:", err);
    }

    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setModelPhotoPreview(e.target?.result as string);
    };
    reader.readAsDataURL(finalFile);
  };

  // Handle clothing image upload
  const handleClothImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError("");
    setWarning("");

    // Skip all validation - let backend handle it
    // This avoids browser-specific issues with certain image formats
    setClothImage(file);

    // Try to get dimensions but don't fail if it doesn't work
    try {
      const dimensions = await getImageDimensions(file);
      setClothImageDimensions(dimensions);
    } catch (err) {
      console.error("Failed to get image dimensions:", err);
      // Don't set error - just continue
    }

    // Create preview
    try {
      const reader = new FileReader();
      reader.onload = (e) => {
        setClothImagePreview(e.target?.result as string);
      };
      reader.onerror = () => {
        console.error("Failed to read clothing image");
      };
      reader.readAsDataURL(file);
    } catch (err) {
      console.error("Error creating preview:", err);
    }
  };

  // Handle try-on creation
  const handleCreateTryOn = async () => {
    if (!modelPhoto || !clothImage) {
      setError("Please upload both a body photo and a clothing image");
      return;
    }

    if (!testMode && (!credits || credits.remainingCredits < 1)) {
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
      
      // Skip dimension check for clothing images (backend will handle resizing)
      // This avoids issues with WebP images not loading in browser Image API
      console.log("[VirtualTryOn] Clothing image will be processed by backend");
      
      setProcessingProgress(15);
      console.log("[VirtualTryOn] Ready to send images to backend");

      // Send resized files using FormData
      const formData = new FormData();
      formData.append("modelImage", finalModelPhoto);
      formData.append("clothImage", finalClothImage);
      // Use 'upper' for single clothing items (Fitroom API expects: upper, lower, or combo)
      formData.append("clothType", "upper");
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
      console.log("[VirtualTryOn] Polling timeout after", elapsedTime, "ms");
      setError("Try-on generation timed out. Please try again. Credit has been refunded.");
      setIsPolling(false);
      pollingStartTimeRef.current = null;
      setProcessingProgress(100);
      
      if (currentTaskId) {
        console.log("[VirtualTryOn] Refunding credit due to timeout", currentTaskId);
        refundCreditsMutation.mutate(
          { taskId: currentTaskId },
          {
            onSuccess: () => {
              console.log("[VirtualTryOn] Credit refunded successfully after timeout");
              refetchCredits();
            },
            onError: (err) => {
              console.error("[VirtualTryOn] Failed to refund credit after timeout:", err);
            },
          }
        );
      }
      return;
    }

    const status = getTryOnStatusQuery.data.status;
    const progress = getTryOnStatusQuery.data.progress || 0;
    
    // Update progress bar with API progress (cap at 95% until complete)
    const displayProgress = Math.min(20 + (progress * 0.75), 95);
    setProcessingProgress(displayProgress);

    if (status?.toUpperCase() === "COMPLETED") {
      console.log("[VirtualTryOn] Try-on completed successfully!");
      setResult({
        taskId: getTryOnStatusQuery.data.taskId,
        resultImageUrl: getTryOnStatusQuery.data.resultImage || getTryOnStatusQuery.data.resultImageUrl,
        createdAt: new Date(),
      });
      setIsPolling(false);
      setProcessingProgress(100);
      pollingStartTimeRef.current = null;
    } else if (status?.toUpperCase() === "FAILED") {
      const errorMsg = getTryOnStatusQuery.data.error || "Try-on generation failed";
      console.log("[VirtualTryOn] Try-on failed:", errorMsg);
      setError(errorMsg);
      setIsPolling(false);
      pollingStartTimeRef.current = null;
      setProcessingProgress(100);
      
      if (currentTaskId) {
        console.log("[VirtualTryOn] Refunding credit for failed try-on", currentTaskId);
        refundCreditsMutation.mutate(
          { taskId: currentTaskId },
          {
            onSuccess: () => {
              console.log("[VirtualTryOn] Credit refunded successfully");
              refetchCredits();
              setError(`${errorMsg} - Credit refunded.`);
            },
            onError: (err) => {
              console.error("[VirtualTryOn] Failed to refund credit:", err);
              setError(`${errorMsg} - Failed to refund credit. Please contact support.`);
            },
          }
        );
      }
    }
  }, [getTryOnStatusQuery.data, isPolling]);

  const handleReset = () => {
    setModelPhoto(null);
    setModelPhotoPreview("");
    setModelPhotoDimensions(null);
    setClothImage(null);
    setClothImagePreview("");
    setClothImageDimensions(null);
    setResult(null);
    setError("");
    setWarning("");
    setCurrentTaskId(null);
    setIsPolling(false);
    setProcessingProgress(0);
    pollingStartTimeRef.current = null;
    if (modelPhotoInputRef.current) modelPhotoInputRef.current.value = "";
    if (clothImageInputRef.current) clothImageInputRef.current.value = "";
  };

  return (
    <div className="w-full max-w-4xl mx-auto p-4 space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Sparkles className="w-6 h-6 text-primary" />
          <h2 className="text-3xl font-bold">Personal Virtual Try-On</h2>
        </div>
        <p className="text-muted-foreground">
          Upload your body photo and clothing image to see how the garment looks on you
        </p>
      </div>

      {/* Image Guidelines */}
      <Card className="bg-blue-50 border-blue-200">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Info className="w-5 h-5 text-blue-600" />
            Image Guidelines for Best Results:
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-blue-900">
          <p><strong>Body Photo:</strong> Full-body shot, standing straight, facing forward, simple background (recommended: 2048px)</p>
          <p><strong>Clothing:</strong> Clear front view on white/solid background, well-lit, entire item visible (recommended: 1024px)</p>
          <p><strong>Auto-optimization:</strong> Images larger than recommended will automatically be resized for faster processing</p>
          <p><strong>Quality:</strong> Ensure images are not heavily compressed and have good lighting</p>
        </CardContent>
      </Card>

      {/* Error Message */}
      {error && (
        <Card className="bg-red-50 border-red-200">
          <CardContent className="pt-6 flex gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div className="text-red-900">{error}</div>
          </CardContent>
        </Card>
      )}

      {/* Warning Message */}
      {warning && (
        <Card className="bg-yellow-50 border-yellow-200">
          <CardContent className="pt-6 flex gap-3">
            <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
            <div className="text-yellow-900">{warning}</div>
          </CardContent>
        </Card>
      )}

      {/* Result Display */}
      {result && (
        <Card className="bg-green-50 border-green-200">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2 text-green-900">
              <Check className="w-5 h-5" />
              Try-On Generated Successfully!
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <img 
              src={result.resultImageUrl} 
              alt="Try-on result" 
              className="w-full rounded-lg border border-green-200"
            />
            <div className="flex gap-2">
              <Button 
                onClick={() => {
                  const link = document.createElement("a");
                  link.href = result.resultImageUrl;
                  link.download = `tryon-${Date.now()}.jpg`;
                  link.click();
                }}
                className="flex-1"
              >
                <Download className="w-4 h-4 mr-2" />
                Download
              </Button>
              <Button 
                onClick={() => {
                  // Share functionality
                  if (navigator.share) {
                    navigator.share({
                      title: "StyleSwap Try-On",
                      text: "Check out my virtual try-on!",
                      url: result.resultImageUrl,
                    });
                  }
                }}
                variant="outline"
                className="flex-1"
              >
                <Share2 className="w-4 h-4 mr-2" />
                Share
              </Button>
              <Button 
                onClick={handleReset}
                variant="outline"
              >
                Try Again
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Upload Sections */}
      {!result && (
        <div className="space-y-6">
          {/* Model Photo Upload */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">1. Upload Your Body Photo</CardTitle>
              <p className="text-sm text-muted-foreground mt-2">
                Full-body photo, front view (recommended: 2048px height)
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div
                onClick={() => modelPhotoInputRef.current?.click()}
                className="border-2 border-dashed border-primary/30 rounded-lg p-8 text-center cursor-pointer hover:border-primary/50 transition-colors"
              >
                <input
                  ref={modelPhotoInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={handleModelPhotoUpload}
                  className="hidden"
                />
                <div className="space-y-2">
                  <Upload className="w-8 h-8 mx-auto text-muted-foreground" />
                  <div className="font-medium">Click to upload body photo</div>
                  <div className="text-sm text-muted-foreground">PNG, JPG, or WebP</div>
                </div>
              </div>

              {modelPhotoPreview && (
                <div className="space-y-2">
                  <img 
                    src={modelPhotoPreview} 
                    alt="Body photo preview" 
                    className="w-full rounded-lg border border-border"
                  />
                  {modelPhotoDimensions && (
                    <p className="text-sm text-muted-foreground">
                      Dimensions: {modelPhotoDimensions.width} × {modelPhotoDimensions.height}px
                    </p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Clothing Image Upload */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">2. Upload Clothing Image</CardTitle>
              <p className="text-sm text-muted-foreground mt-2">
                Clear front view on solid background (recommended: 1024px width)
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div
                onClick={() => clothImageInputRef.current?.click()}
                className="border-2 border-dashed border-primary/30 rounded-lg p-8 text-center cursor-pointer hover:border-primary/50 transition-colors"
              >
                <input
                  ref={clothImageInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={handleClothImageUpload}
                  className="hidden"
                />
                <div className="space-y-2">
                  <Upload className="w-8 h-8 mx-auto text-muted-foreground" />
                  <div className="font-medium">Click to upload clothing image</div>
                  <div className="text-sm text-muted-foreground">PNG, JPG, or WebP</div>
                </div>
              </div>

              {clothImagePreview && (
                <div className="space-y-2">
                  <img 
                    src={clothImagePreview} 
                    alt="Clothing preview" 
                    className="w-full rounded-lg border border-border"
                  />
                  {clothImageDimensions && (
                    <p className="text-sm text-muted-foreground">
                      Dimensions: {clothImageDimensions.width} × {clothImageDimensions.height}px
                    </p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Generate Button */}
          {modelPhoto && clothImage && (
            <div className="space-y-4">
              {isPolling && (
                <Card className="bg-blue-50 border-blue-200">
                  <CardContent className="pt-6">
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
                        <span className="text-blue-900">Generating your try-on...</span>
                      </div>
                      <div className="w-full bg-blue-200 rounded-full h-2">
                        <div 
                          className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${processingProgress}%` }}
                        />
                      </div>
                      <p className="text-sm text-blue-900">
                        This may take up to 2 minutes. Please don't close this page.
                      </p>
                    </div>
                  </CardContent>
                </Card>
              )}

              <Button 
                onClick={handleCreateTryOn}
                disabled={isLoading || isPolling}
                className="w-full h-12 text-lg"
              >
                {isLoading || isPolling ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    {isPolling ? "Generating..." : "Uploading..."}
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 mr-2" />
                    Generate Try-On
                  </>
                )}
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Credits Info */}
      {credits && (
        <Card className="bg-muted/50">
          <CardContent className="pt-6">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm text-muted-foreground">Remaining Credits</p>
                <p className="text-2xl font-bold">{credits.remainingCredits}</p>
              </div>
              <Button variant="outline">Buy More Credits</Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
