import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Upload, Loader2, Check, AlertCircle, Download, Share2, Info, Sparkles } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { getImageDimensions } from "@/lib/imageUtils";

interface TryOnResult {
  taskId: string;
  resultImageUrl: string;
  createdAt: Date;
}

interface BoutiqueTryOnProps {
  boutiqueId: number;
}

export function BoutiqueTryOn({ boutiqueId }: BoutiqueTryOnProps) {
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
  
  // State for test mode
  const [testMode, setTestMode] = useState(false);
  
  // Refs
  const modelPhotoInputRef = useRef<HTMLInputElement>(null);
  const clothImageInputRef = useRef<HTMLInputElement>(null);
  const lowerClothImageInputRef = useRef<HTMLInputElement>(null);
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const pollingStartTimeRef = useRef<number | null>(null);
  const POLLING_TIMEOUT_MS = 150000; // 2.5 minutes max

  // Fetch boutique credits
  const { data: credits, refetch: refetchCredits } = trpc.boutiques.getCredits.useQuery(
    { boutiqueId },
    { enabled: !!boutiqueId }
  );

  // Refetch credits on component mount
  useEffect(() => {
    refetchCredits();
  }, [refetchCredits]);

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

    setClothImage(file);
    setLowerClothImage(null);
    setLowerClothImagePreview("");

    // Try to get dimensions
    try {
      const dimensions = await getImageDimensions(file);
      setClothImageDimensions(dimensions);
    } catch (err) {
      console.error("Failed to get image dimensions:", err);
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
      console.error("Error reading file:", err);
    }
  };

  // Handle lower clothing image upload (combo mode)
  const handleLowerClothImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLowerClothImage(file);

    // Try to get dimensions
    try {
      const dimensions = await getImageDimensions(file);
    } catch (err) {
      console.error("Failed to get image dimensions:", err);
    }

    // Create preview
    try {
      const reader = new FileReader();
      reader.onload = (e) => {
        setLowerClothImagePreview(e.target?.result as string);
      };
      reader.onerror = () => {
        console.error("Failed to read lower clothing image");
      };
      reader.readAsDataURL(file);
    } catch (err) {
      console.error("Error reading file:", err);
    }
  };

  // Handle try-on submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!modelPhoto || !clothImage) {
      setError("Please upload both body photo and clothing image");
      return;
    }

    setIsLoading(true);
    setError("");
    setWarning("");

    try {
      // Convert files to base64
      const modelBase64 = await fileToBase64(modelPhoto);
      let clothBase64 = await fileToBase64(clothImage);
      let lowerClothBase64 = null;

      if (clothType === "combo" && lowerClothImage) {
        lowerClothBase64 = await fileToBase64(lowerClothImage);
      }

      // Create try-on
      const response = await createTryOnMutation.mutateAsync({
        modelImage: modelBase64,
        clothImage: clothBase64,
        lowerClothImage: lowerClothBase64 || undefined,
        clothType,
        boutiqueId,
        testMode,
      });

      setCurrentTaskId(response.taskId);
      setIsPolling(true);
      setProcessingProgress(0);
      pollingStartTimeRef.current = Date.now();

    } catch (err: any) {
      setError(err.message || "Failed to create try-on");
      setIsLoading(false);
    }
  };

  // Handle polling
  useEffect(() => {
    if (!getTryOnStatusQuery.data || !isPolling) return;

    const status = getTryOnStatusQuery.data;

    if (status.status === "COMPLETED") {
      setResult({
        taskId: currentTaskId || "",
        resultImageUrl: status.resultUrl,
        createdAt: new Date(),
      });
      setIsPolling(false);
      setIsLoading(false);
      setProcessingProgress(100);

      // Clear form
      setModelPhoto(null);
      setModelPhotoPreview("");
      setClothImage(null);
      setClothImagePreview("");
      setLowerClothImage(null);
      setLowerClothImagePreview("");

      // Refetch credits
      refetchCredits();

      // Clear polling
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }
    } else if (status.status === "FAILED") {
      setError("Try-on generation failed. Credits have been refunded.");
      setIsPolling(false);
      setIsLoading(false);

      // Refund credits
      if (currentTaskId) {
        refundCreditsMutation.mutate({ taskId: currentTaskId });
      }

      // Refetch credits
      refetchCredits();
    } else if (status.status === "PROCESSING") {
      setProcessingProgress(Math.min(status.progress || 0, 95));
    }

    // Check timeout
    if (pollingStartTimeRef.current) {
      const elapsedTime = Date.now() - pollingStartTimeRef.current;
      if (elapsedTime > POLLING_TIMEOUT_MS) {
        setError("Try-on generation timed out. Credits have been refunded.");
        setIsPolling(false);
        setIsLoading(false);

        // Refund credits
        if (currentTaskId) {
          refundCreditsMutation.mutate({ taskId: currentTaskId });
        }

        // Refetch credits
        refetchCredits();
      }
    }
  }, [getTryOnStatusQuery.data, isPolling]);

  // Helper function to convert file to base64
  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        const result = reader.result as string;
        resolve(result);
      };
      reader.onerror = reject;
    });
  };

  // Handle download
  const handleDownload = async () => {
    if (!result) return;

    try {
      const response = await fetch(result.resultImageUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `try-on-${result.taskId}.png`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      setError("Failed to download image");
    }
  };

  // Handle reset
  const handleReset = () => {
    setResult(null);
    setModelPhoto(null);
    setModelPhotoPreview("");
    setClothImage(null);
    setClothImagePreview("");
    setLowerClothImage(null);
    setLowerClothImagePreview("");
    setError("");
    setWarning("");
    setCurrentTaskId(null);
    setProcessingProgress(0);
  };

  return (
    <div className="space-y-6">
      {/* Credits Display */}
      <Card className="bg-primary/5 border-primary/30">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Available Credits</p>
              <p className="text-3xl font-bold">{credits || 0}</p>
            </div>
            <Sparkles className="w-8 h-8 text-primary" />
          </div>
        </CardContent>
      </Card>

      {/* Result Display */}
      {result && (
        <Card className="border-primary/30">
          <CardHeader>
            <CardTitle>Try-On Result</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <img
              src={result.resultImageUrl}
              alt="Try-on result"
              className="w-full rounded-lg border border-border"
            />
            <div className="flex gap-3">
              <Button onClick={handleDownload} className="flex-1">
                <Download className="w-4 h-4 mr-2" />
                Download
              </Button>
              <Button onClick={handleReset} variant="outline" className="flex-1">
                Try Another
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Processing State */}
      {isLoading && (
        <Card className="border-primary/30">
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
              {processingProgress}% complete
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
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Clothing Type Selector */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Select Clothing Type</CardTitle>
              <p className="text-sm text-muted-foreground mt-2">
                Choose which type of garment you're testing
              </p>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setClothType("upper")}
                  className={`p-4 rounded-lg border-2 transition-all ${clothType === "upper" ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"}`}
                >
                  <div className="font-semibold text-sm">Top</div>
                  <div className="text-xs text-muted-foreground mt-1">Shirt, jacket, etc</div>
                </button>
                <button
                  type="button"
                  onClick={() => setClothType("lower")}
                  className={`p-4 rounded-lg border-2 transition-all ${clothType === "lower" ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"}`}
                >
                  <div className="font-semibold text-sm">Bottom</div>
                  <div className="text-xs text-muted-foreground mt-1">Pants, skirt, etc</div>
                </button>
                <button
                  type="button"
                  onClick={() => setClothType("full")}
                  className={`p-4 rounded-lg border-2 transition-all ${clothType === "full" ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"}`}
                >
                  <div className="font-semibold text-sm">Full Dress</div>
                  <div className="text-xs text-muted-foreground mt-1">One piece</div>
                </button>
                <button
                  type="button"
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
              <CardTitle className="text-lg">1. Upload Model Photo</CardTitle>
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
                  <div className="font-medium">Click to upload model photo</div>
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
              <CardTitle className="text-lg">
                {clothType === "combo" ? "2. Upload Top Image" : "2. Upload Clothing Image"}
              </CardTitle>
              <p className="text-sm text-muted-foreground mt-2">
                {clothType === "combo" ? "Top/shirt image" : "Dress, top, or bottom - clear front view on solid background"}
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
                    onChange={handleLowerClothImageUpload}
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

          {/* Test Mode Toggle */}
          <Card className="bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800">
            <CardHeader>
              <CardTitle className="text-base">Test Mode</CardTitle>
              <p className="text-sm text-muted-foreground mt-2">
                Generate try-ons without using credits
              </p>
            </CardHeader>
            <CardContent>
              <Button
                type="button"
                onClick={() => setTestMode(!testMode)}
                variant={testMode ? "default" : "outline"}
                className="w-full"
              >
                <p className="font-semibold text-blue-900">{testMode ? "✓ Enabled" : "Disabled"}</p>
              </Button>
            </CardContent>
          </Card>

          {/* Test Mode Active Notice */}
          {testMode && (
            <Card className="bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800">
              <CardContent className="pt-6">
                <p className="text-green-900 font-semibold">✓ Test Mode Active - Credits will not be deducted</p>
              </CardContent>
            </Card>
          )}

          {/* Submit Button */}
          <Button
            type="submit"
            disabled={!modelPhoto || !clothImage || isLoading}
            className="w-full h-12 text-lg"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 mr-2" />
                Generate Try-On
              </>
            )}
          </Button>
        </form>
      )}
    </div>
  );
}
