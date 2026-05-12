import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Upload, Loader2, Check, AlertCircle, Download, Share2, Info, Sparkles, Globe } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { resizeImage, validateImageForFitroom, formatFileSize, getImageDimensions, optimizeImageForFitroom, splitDressImage, cropBottomClothing, cropTopClothing } from "@/lib/imageUtils";
import { useAuth } from "@/_core/hooks/useAuth";
import { SizeSelector } from "@/components/SizeSelector";
import { SaveToGalleryButton } from "@/components/SaveToGalleryButton";
import { toast } from "./ui/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

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
  const [selectedSize, setSelectedSize] = useState<"XS" | "S" | "M" | "L" | "XL" | "XXL" | "XXXL" | undefined>("M");
  const [hdMode, setHdMode] = useState(false);

  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [saveTitle, setSaveTitle] = useState("");
  const [saveStyle, setSaveStyle] = useState("Casual");
  const [isSaving, setIsSaving] = useState(false);

  const styleOptions = ["Casual", "Formal", "Sports", "Business", "Party", "Beach", "Streetwear"];
    
  // State for processing
  const [isLoading, setIsLoading] = useState(false);
  const [isPolling, setIsPolling] = useState(false);
  const [currentTaskId, setCurrentTaskId] = useState<string | null>(null);
  const [processingProgress, setProcessingProgress] = useState(0);
  
  // State for results
  const [result, setResult] = useState<TryOnResult | null>(null);
  const [error, setError] = useState<string>("");
  const [warning, setWarning] = useState<string>("");
  
  // State for test mode
  const [testMode, setTestMode] = useState(false);
  
  // Refs
  const modelPhotoInputRef = useRef<HTMLInputElement>(null);
  const clothImageInputRef = useRef<HTMLInputElement>(null);
  const lowerClothImageInputRef = useRef<HTMLInputElement>(null);
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const pollingStartTimeRef = useRef<number | null>(null);
  const POLLING_TIMEOUT_MS = 300000; // 5 minutes max (Fitroom API can take up to 120 seconds, plus polling time)

  // Fetch user info
  const { user, isAuthenticated } = useAuth();
  const isAdmin = user?.role === "admin";

  // Fetch credits
  const { data: credits, refetch: refetchCredits } = trpc.tryon.getCredits.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  
  
  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        const result = reader.result as string;
        // Remove the data:image/...;base64, prefix
        const base64 = result.split(',')[1];
        resolve(base64);
      };
      reader.onerror = reject;
    });
  };

  // Fetch try-on status
  const getTryOnStatusQuery = trpc.tryon.getTryOnStatus.useQuery(
    { taskId: currentTaskId || "" },
    { enabled: !!currentTaskId && isPolling, refetchInterval: 2000 }
  );

  // Refund credits mutation
  const refundCreditsMutation = trpc.tryon.refundTryOnCredits.useMutation();
  const saveToFeedMutation = trpc.tryon.saveTryOnResult.useMutation();
  // Determine which mutation to use based on user type
  
  const isMerchant = user?.userType === 'merchant' || user?.role === 'merchant';

  const createTryOnMutation = isMerchant 
    ? trpc.tryon.boutiqueCreateTryOn.useMutation()
    : trpc.tryon.customerCreateTryOn.useMutation();

  const handleSaveToFeed = () => {
  setSaveTitle("My Summer Look");
  setSaveStyle("Casual");
  setShowSaveDialog(true);
};

const handleSaveConfirm = async () => {
   if (!result) {
      setError("No try-on result available to save.");
      return;
    }
  if (!saveTitle.trim()) {
    toast({ title: "Please enter a title", variant: "destructive" });
    return;
  }
  
  setIsSaving(true);
  try {
    await saveToFeedMutation.mutateAsync({
      resultImageUrl: result.resultImageUrl,
      title: saveTitle,
      style: saveStyle,
    });
    toast({ title: "Saved to Global Feed!" });
    setShowSaveDialog(false);
  } catch (error) {
    console.error("Save error:", error);
    toast({ title: "Failed to save to feed", variant: "destructive" });
  } finally {
    setIsSaving(false);
  }
};

 const handleCreateTryOn = async () => {
  if (!modelPhoto || !clothImage) {
    setError("Please upload both a body photo and a clothing image");
    return;
  }

  if (!selectedSize) {
    setError("Please select a size before generating the try-on.");
    return;
  }

  const creditsNeeded = hdMode ? 2 : 1;
  if (!testMode && (!credits || credits.remainingCredits < creditsNeeded)) {
    setError(`Insufficient credits. You need ${creditsNeeded} credits for ${hdMode ? "HD" : "standard"} try-on, but only have ${credits?.remainingCredits || 0} remaining.`);
    return;
  }

  setIsLoading(true);
  setError("");
  setWarning("");
  setProcessingProgress(0);
  
  console.log(`[VirtualTryOn] Selected size: ${selectedSize}`);

  try {
    setProcessingProgress(10);
    
    // Process clothing image based on type
    let finalClothImage = clothImage;
    let finalLowerClothImage: File | null = null;
    let finalClothTypeForBackend = clothType;
    
    try {
      if (clothType === "upper") {
        console.log("[VirtualTryOn] Using upper clothing");
      } else if (clothType === "lower") {
        console.log("[VirtualTryOn] Using lower clothing");
      } else if (clothType === "full") {
        console.log("[VirtualTryOn] Using full dress");
      } else if (clothType === "combo") {
        console.log("[VirtualTryOn] Using combo mode (top + bottom)");
        if (!lowerClothImage) {
          setError("Please upload a bottom image for combo try-on");
          setIsLoading(false);
          return;
        }
        finalLowerClothImage = lowerClothImage;
      }
    } catch (cropError) {
      console.error("[VirtualTryOn] Error processing image:", cropError);
      setWarning("Could not optimize clothing image, using original");
    }
    
    setProcessingProgress(30);
    console.log("[VirtualTryOn] Converting images to base64...");
    
    // Convert files to base64
    const modelBase64 = await fileToBase64(modelPhoto);
    const clothBase64 = await fileToBase64(finalClothImage);
    let lowerClothBase64: string | null = null;
    
    if (clothType === "combo" && finalLowerClothImage) {
      lowerClothBase64 = await fileToBase64(finalLowerClothImage);
    }
    
    setProcessingProgress(50);
    console.log("[VirtualTryOn] Sending to Fitroom API via tRPC...");

    // 🔥 Use tRPC mutation instead of fetch
    const response = await createTryOnMutation.mutateAsync({
      modelImageBase64: modelBase64,
      clothImageBase64: clothBase64,
      lowerClothImageBase64: lowerClothBase64 || undefined,
      clothType: finalClothTypeForBackend,
      selectedSize: selectedSize,
      hdMode: hdMode,
      testMode: testMode,
    });

    if (response.success && response.taskId) {
      setCurrentTaskId(response.taskId);
      setIsPolling(true);
      setProcessingProgress(60);
      
      if (!testMode) {
        refetchCredits();
      }
    } else {
      setError("Failed to create try-on task");
      setIsLoading(false);
    }
  } catch (err: any) {
    console.error("[VirtualTryOn] Error:", err);
    setError(err.message || "Failed to create try-on");
    setIsLoading(false);
    setProcessingProgress(0);
  }
};
// monitor tryon status 
useEffect(() => {
  if (!isPolling || !getTryOnStatusQuery.data) return;

  if (!pollingStartTimeRef.current) {
    pollingStartTimeRef.current = Date.now();
  }

  const elapsedTime = Date.now() - (pollingStartTimeRef.current || Date.now());
  if (elapsedTime > POLLING_TIMEOUT_MS) {
    console.log("[VirtualTryOn] Polling timeout after", elapsedTime, "ms");
    setError("Try-on generation timed out. Please try again.");
    setIsPolling(false);
    pollingStartTimeRef.current = null;
    setProcessingProgress(100);
    
    if (currentTaskId && !testMode) {
      refundCreditsMutation.mutate({ taskId: currentTaskId });
    }
    return;
  }

  const status = getTryOnStatusQuery.data;
  
  if (status.status === "COMPLETED") {
    console.log("[VirtualTryOn] Try-on completed successfully!");
    const imageUrl = status.resultImageUrl || status.resultImage;
    if (!imageUrl) {
      setError("No result image URL found");
      setIsPolling(false);
      pollingStartTimeRef.current = null;
      return;
    }
    setResult({
      taskId: status.taskId,
      resultImageUrl: imageUrl,
      createdAt: new Date(),
    });
    setIsPolling(false);
    setProcessingProgress(100);
    pollingStartTimeRef.current = null;
  } else if (status.status === "PROCESSING") {
    setProcessingProgress(Math.min(60 + (status.progress || 0) * 0.35, 95));
  } else if (status.status === "FAILED") {
    const errorMsg = status.error || "Try-on generation failed";
    console.log("[VirtualTryOn] Try-on failed:", errorMsg);
    setError(errorMsg);
    setIsPolling(false);
    pollingStartTimeRef.current = null;
    setProcessingProgress(100);
    
    if (currentTaskId && !testMode) {
      refundCreditsMutation.mutate({ taskId: currentTaskId });
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
    setLowerClothImage(null);
    setLowerClothImagePreview("");
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
      <Card className="bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Info className="w-5 h-5" />
            Image Guidelines for Best Results:
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <p><strong>Body Photo:</strong> Full-body shot, standing straight, facing forward, simple background (recommended: 2048px)</p>
          <p><strong>Clothing:</strong> Clear front view on white/solid background, well-lit, entire item visible (recommended: 1024px)</p>
          <p><strong>Auto-optimization:</strong> Images larger than recommended will automatically be resized for faster processing</p>
          <p><strong>Quality:</strong> Ensure images are not heavily compressed and have good lighting</p>
        </CardContent>
      </Card>

      {/* Result Display */}
      {result && (
        <Card className="border-green-500/30 bg-green-50 dark:bg-green-950/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Check className="w-5 h-5 text-green-600" />
              Try-On Complete!
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <img
              src={result.resultImageUrl}
              alt="Try-on result"
              className="w-full rounded-lg border border-border shadow-lg"
            />
            {/* Size Comparison Feature */}
            <div className="pt-4 border-t border-green-200 dark:border-green-800">
              <p className="text-sm font-medium text-green-900 dark:text-green-100 mb-3">
                Want to compare sizes? Try another size to see the difference.
              </p>
              <div className="grid grid-cols-4 gap-2 sm:grid-cols-7">
                {["XS", "S", "M", "L", "XL", "XXL", "XXXL"].map((size) => (
                  <button
                    key={size}
                    onClick={() => {
                      setSelectedSize(size);
                      setResult(null);
                      handleCreateTryOn();
                    }}
                    disabled={isLoading || isPolling}
                    className={`py-2 px-1 sm:px-2 rounded text-xs sm:text-sm font-semibold border-2 transition-all ${
                      selectedSize === size
                        ? "border-green-600 bg-green-600 text-white"
                        : "border-green-200 dark:border-green-700 bg-white dark:bg-green-900/20 text-green-900 dark:text-green-100 hover:border-green-400"
                    } ${isLoading || isPolling ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
                  >
                    {size}
                  </button>
                ))}
              </div>
            </div>
            
            <div className="flex gap-3 flex-col sm:flex-row">
              <SaveToGalleryButton
                imageUrl={result.resultImageUrl}
                variant="default"
                className="flex-1"
              />
              <Button onClick={handleReset} className="flex-1">
                <Sparkles className="w-4 h-4 mr-2" />
                Try Another
              </Button>
              <Button onClick={handleSaveToFeed} variant="outline">
                <Globe className="w-4 h-4 mr-2" />
                Share to Global Feed
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
       <Dialog open={showSaveDialog} onOpenChange={setShowSaveDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Share to Global Feed</DialogTitle>
            <DialogDescription>
              Share your try-on result with the StyleSwap community
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                value={saveTitle}
                onChange={(e) => setSaveTitle(e.target.value)}
                placeholder="My Summer Look"
                className="w-full"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="style">Style Category</Label>
              <select
                id="style"
                value={saveStyle}
                onChange={(e) => setSaveStyle(e.target.value)}
                className="w-full px-3 py-2 border border-input rounded-md bg-background"
              >
                {styleOptions.map((style) => (
                  <option key={style} value={style}>
                    {style}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <DialogFooter className="flex gap-2 sm:justify-end">
            <Button variant="outline" onClick={() => setShowSaveDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveConfirm} disabled={isSaving}>
              {isSaving ? "Saving..." : "Share to Feed"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Processing State */}
      {isLoading && isPolling && (
        <Card className="border-primary/30 bg-primary/5">
          <CardContent className="pt-6 space-y-4">
            <div className="flex items-center justify-center gap-3">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
              <span className="text-lg font-medium">Generating try-on...</span>
            </div>
            <div className="w-full bg-muted rounded-full h-2">
              <div
                className="bg-primary h-2 rounded-full transition-all duration-300"
                style={{ width: `${processingProgress}%` }}
              />
            </div>
            <p className="text-sm text-muted-foreground text-center">
              {Math.round(processingProgress)}% complete
            </p>
          </CardContent>
        </Card>
      )}

      {/* Error Display */}
      {error && (
        <Card className="border-red-500/30 bg-red-50 dark:bg-red-950/20">
          <CardContent className="pt-6">
            <div className="flex gap-3">
              <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-red-900 dark:text-red-100">{error}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Warning Display */}
      {warning && (
        <Card className="border-yellow-500/30 bg-yellow-50 dark:bg-yellow-950/20">
          <CardContent className="pt-6">
            <div className="flex gap-3">
              <AlertCircle className="w-5 h-5 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-yellow-800 dark:text-yellow-200">{warning}</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Form */}
      {!result && (
        <div className="space-y-6">
          {/* Clothing Type Selector */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Select Clothes</CardTitle>
              <p className="text-sm text-muted-foreground mt-2">
                Select the type of clothing you want to try on
              </p>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => setClothType("upper")}
                  className={`p-4 rounded-lg border-2 transition-all ${clothType === "upper" ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"}`}
                >
                  <div className="font-semibold text-sm">Top</div>
                  <div className="text-xs text-muted-foreground mt-1">Shirt, jacket, etc</div>
                </button>
                <button
                  onClick={() => setClothType("lower")}
                  className={`p-4 rounded-lg border-2 transition-all ${clothType === "lower" ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"}`}
                >
                  <div className="font-semibold text-sm">Bottom</div>
                  <div className="text-xs text-muted-foreground mt-1">Pants, skirt, etc</div>
                </button>
                <button
                  onClick={() => setClothType("full")}
                  className={`p-4 rounded-lg border-2 transition-all ${clothType === "full" ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"}`}
                >
                  <div className="font-semibold text-sm">Full Dress</div>
                  <div className="text-xs text-muted-foreground mt-1">One piece</div>
                </button>
                <button
                  onClick={() => setClothType("combo")}
                  className={`p-4 rounded-lg border-2 transition-all ${clothType === "combo" ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"}`}
                >
                  <div className="font-semibold text-sm">Top & Bottom</div>
                  <div className="text-xs text-muted-foreground mt-1">Two pieces</div>
                </button>
              </div>
            </CardContent>
          </Card>

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
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      setModelPhoto(file);
                      const reader = new FileReader();
                      reader.onload = (e) => {
                        setModelPhotoPreview(e.target?.result as string);
                      };
                      reader.readAsDataURL(file);
                    }
                  }}
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
                    alt="Model preview"
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
                Dress, top, or bottom - clear front view on solid background
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
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      setClothImage(file);
                      const reader = new FileReader();
                      reader.onload = (e) => {
                        setClothImagePreview(e.target?.result as string);
                      };
                      reader.readAsDataURL(file);
                    }
                  }}
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

          {/* Lower Clothing Image Upload (Combo Mode Only) */}
          {clothType === "combo" && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">3. Upload Bottom Image</CardTitle>
                <p className="text-sm text-muted-foreground mt-2">
                  Bottom/pants image - clear front view on solid background
                </p>
              </CardHeader>
              <CardContent className="space-y-4">
                <div
                  onClick={() => lowerClothImageInputRef.current?.click()}
                  className="border-2 border-dashed border-primary/30 rounded-lg p-8 text-center cursor-pointer hover:border-primary/50 transition-colors"
                >
                  <input
                    ref={lowerClothImageInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        setLowerClothImage(file);
                        const reader = new FileReader();
                        reader.onload = (e) => {
                          setLowerClothImagePreview(e.target?.result as string);
                        };
                        reader.readAsDataURL(file);
                      }
                    }}
                    className="hidden"
                  />
                  <div className="space-y-2">
                    <Upload className="w-8 h-8 mx-auto text-muted-foreground" />
                    <div className="font-medium">Click to upload bottom image</div>
                    <div className="text-sm text-muted-foreground">PNG, JPG, or WebP</div>
                  </div>
                </div>

                {lowerClothImagePreview && (
                  <div className="space-y-2">
                    <img
                      src={lowerClothImagePreview}
                      alt="Bottom preview"
                      className="w-full rounded-lg border border-border"
                    />
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Size Selector */}
          <SizeSelector
            selectedSize={selectedSize}
            onSizeChange={setSelectedSize}
            disabled={isLoading || isPolling}
            showDisclaimer={true}
          />

          {/* HD Mode Toggle */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Quality Options</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-4 border border-border rounded-lg">
                <div>
                  <p className="font-medium">HD Quality Try-On</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    {hdMode ? "2 credits - Higher quality, ~30s processing" : "1 credit - Standard quality, ~9s processing"}
                  </p>
                </div>
                <Button
                  onClick={() => setHdMode(!hdMode)}
                  variant={hdMode ? "default" : "outline"}
                  className="ml-4"
                >
                  {hdMode ? "HD" : "Standard"}
                </Button>
              </div>
              <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
                <p className="text-sm text-blue-900 dark:text-blue-100">
                  <strong>Standard (1 credit):</strong> Fast processing with good quality<br/>
                  <strong>HD (2 credits):</strong> Premium quality with better details and accuracy
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Submit Button */}
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

      {/* Test Mode Toggle */}
      {isAdmin && user && (
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-semibold text-blue-900">Test Mode</p>
                <p className="text-sm text-blue-800">Generate try-ons without using credits</p>
              </div>
              <Button
                onClick={() => setTestMode(!testMode)}
                variant={testMode ? "default" : "outline"}
              >
                {testMode ? "Enabled" : "Disabled"}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Credits Info */}
      {credits && !testMode && (
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

      {/* Test Mode Active Notice */}
      {testMode && isAdmin && (
        <Card className="bg-green-50 border-green-200">
          <CardContent className="pt-6">
            <p className="text-green-900 font-semibold">✓ Test Mode Active - Credits will not be deducted</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
