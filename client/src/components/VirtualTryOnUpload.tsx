"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Upload, Loader2, Check, AlertCircle, Download, Share2 } from "lucide-react";
import { trpc } from "@/lib/trpc";

interface TryOnResult {
  taskId: string;
  resultImageUrl: string;
  createdAt: Date;
}

export function VirtualTryOnUpload() {
  // State for uploads
  const [modelPhoto, setModelPhoto] = useState<File | null>(null);
  const [modelPhotoPreview, setModelPhotoPreview] = useState<string>("");
  const [clothImage, setClothImage] = useState<File | null>(null);
  const [clothImagePreview, setClothImagePreview] = useState<string>("");
  
  // State for processing
  const [isLoading, setIsLoading] = useState(false);
  const [isPolling, setIsPolling] = useState(false);
  const [currentTaskId, setCurrentTaskId] = useState<string | null>(null);
  const [processingProgress, setProcessingProgress] = useState(0);
  
  // State for results
  const [result, setResult] = useState<TryOnResult | null>(null);
  const [error, setError] = useState<string>("");
  
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
  const handleModelPhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 50 * 1024 * 1024) {
      setError("Model photo must be less than 50MB");
      return;
    }

    if (!file.type.startsWith("image/")) {
      setError("Please upload an image file");
      return;
    }

    setModelPhoto(file);
    setError("");

    const reader = new FileReader();
    reader.onload = (e) => {
      setModelPhotoPreview(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  // Handle clothing image upload
  const handleClothImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 50 * 1024 * 1024) {
      setError("Clothing image must be less than 50MB");
      return;
    }

    if (!file.type.startsWith("image/")) {
      setError("Please upload an image file");
      return;
    }

    setClothImage(file);
    setError("");

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
    setProcessingProgress(0);

    try {
      // Send files directly using FormData (no base64 encoding)
      const formData = new FormData();
      formData.append("modelImage", modelPhoto);
      formData.append("clothImage", clothImage);
      formData.append("clothType", "single");

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
        setProcessingProgress(10);
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
      setError("Try-on generation timed out (exceeded 60 seconds). Please try again with a different image.");
      setIsPolling(false);
      setCurrentTaskId(null);
      pollingStartTimeRef.current = null;
      return;
    }

    const status = getTryOnStatusQuery.data.status;
    
    if (status === "PROCESSING") {
      const progress = Math.min(10 + (elapsedTime / POLLING_TIMEOUT_MS) * 80, 90);
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
      setError("Try-on generation failed. Please try again with a different image.");
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
          <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <p className="text-xs font-semibold text-blue-900 mb-2">📸 Image Guidelines for Best Results:</p>
            <ul className="text-xs text-blue-800 space-y-1">
              <li><strong>Body Photo:</strong> Full-body shot, standing straight, facing forward, simple background</li>
              <li><strong>Clothing:</strong> Clear front view on white/solid background, well-lit, entire item visible</li>
              <li><strong>Recommended sizes:</strong> Body 2048px, Clothing 1024px (will auto-resize if larger)</li>
            </ul>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
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
                  <p className="text-sm text-muted-foreground">
                    Click to change photo
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  <Upload className="w-12 h-12 text-muted-foreground mx-auto" />
                  <p className="font-medium">Click to upload or drag and drop</p>
                  <p className="text-sm text-muted-foreground">
                    PNG, JPG or GIF (max 50MB)
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Clothing Image Upload */}
          <div className="space-y-3">
            <label className="block font-medium">2. Upload Clothing Image</label>
            <p className="text-sm text-muted-foreground">
              Front view of the garment (recommended: 1024px width)
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
                  <p className="text-sm text-muted-foreground">
                    Click to change image
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  <Upload className="w-12 h-12 text-muted-foreground mx-auto" />
                  <p className="font-medium">Click to upload or drag and drop</p>
                  <p className="text-sm text-muted-foreground">
                    PNG, JPG or GIF (max 50MB)
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Credits Info */}
          <div className="bg-secondary/10 border border-secondary/20 rounded-lg p-4">
            <p className="text-sm font-medium">
              Credits Available: <span className="text-primary font-bold">{credits?.remainingCredits || 0}</span>
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Each try-on uses 1 credit (valid for 30 days)
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
              <p className="text-sm text-destructive">{error}</p>
            </div>
          )}

          {/* Processing Progress */}
          {(isLoading || isPolling) && (
            <div className="bg-primary/10 border border-primary/20 rounded-lg p-4 space-y-3">
              <div className="flex items-center gap-3">
                <Loader2 className="w-5 h-5 text-primary animate-spin" />
                <div className="flex-1">
                  <p className="text-sm font-medium">
                    {isLoading ? "Creating try-on task..." : "Generating your try-on..."}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {isPolling ? "This usually takes 9-30 seconds" : "Uploading images..."}
                  </p>
                </div>
              </div>
              <div className="w-full bg-primary/20 rounded-full h-2">
                <div
                  className="bg-primary h-2 rounded-full transition-all duration-300"
                  style={{ width: `${processingProgress}%` }}
                />
              </div>
            </div>
          )}

          {/* Create Button */}
          <Button
            onClick={handleCreateTryOn}
            disabled={!isReadyToGenerate || isLoading || isPolling}
            className="w-full h-12 premium-button bg-primary text-primary-foreground hover:bg-primary/90"
          >
            {isLoading || isPolling ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
                {isLoading ? "Creating Task..." : "Generating..."}
              </>
            ) : (
              <>
                <Check className="w-4 h-4 mr-2" />
                Generate Virtual Try-On
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Result Section */}
      {result && (
        <Card className="premium-card border-primary/30 bg-primary/5">
          <CardHeader>
            <CardTitle className="text-primary flex items-center gap-2">
              <Check className="w-5 h-5" />
              Try-On Complete!
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground mb-2">
                Generated: {result.createdAt.toLocaleString()}
              </p>
              <img
                src={result.resultImageUrl}
                alt="Try-on result"
                className="w-full rounded-lg shadow-lg"
              />
            </div>

            {/* Action Buttons */}
            <div className="grid grid-cols-2 gap-3">
              <Button
                variant="outline"
                className="premium-button"
                onClick={() => {
                  const link = document.createElement("a");
                  link.href = result.resultImageUrl;
                  link.download = `styleswap-tryon-${Date.now()}.jpg`;
                  link.click();
                }}
              >
                <Download className="w-4 h-4 mr-2" />
                Download
              </Button>
              <Button
                variant="outline"
                className="premium-button"
                onClick={() => {
                  if (navigator.share) {
                    navigator.share({
                      title: "StyleSwap Virtual Try-On",
                      text: "Check out my virtual try-on!",
                      url: window.location.href,
                    });
                  }
                }}
              >
                <Share2 className="w-4 h-4 mr-2" />
                Share
              </Button>
            </div>

            {/* Try Another Button */}
            <Button
              onClick={() => {
                setResult(null);
                setModelPhoto(null);
                setModelPhotoPreview("");
                setClothImage(null);
                setClothImagePreview("");
                setError("");
              }}
              className="w-full premium-button bg-primary text-primary-foreground hover:bg-primary/90"
            >
              Try Another Outfit
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
