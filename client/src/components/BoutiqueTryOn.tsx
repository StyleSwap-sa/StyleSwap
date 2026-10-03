import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Upload, Loader2, Check, AlertCircle, Download, Sparkles, Globe } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { getImageDimensions, resizeImage } from "@/lib/imageUtils";
import { CreditPurchaseModal } from "@/components/CreditPurchaseModal";
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

interface BoutiqueTryOnProps {
  boutiqueId: number;
}

export function BoutiqueTryOn({ boutiqueId }: BoutiqueTryOnProps) {
  // State for uploads
  const [modelPhoto, setModelPhoto] = useState<File | null>(null);
  const [modelPhotoPreview, setModelPhotoPreview] = useState<string>("");
  const [clothImage, setClothImage] = useState<File | null>(null);
  const [clothImagePreview, setClothImagePreview] = useState<string>("");
  const [clothType, setClothType] = useState<"upper" | "lower" | "combo" | "full">("upper");
  const [lowerClothImage, setLowerClothImage] = useState<File | null>(null);
  const [lowerClothImagePreview, setLowerClothImagePreview] = useState<string>("");

  const [isCreditModalOpen, setIsCreditModalOpen] = useState(false);

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
  
  // Refs
  const modelPhotoInputRef = useRef<HTMLInputElement>(null);
  const clothImageInputRef = useRef<HTMLInputElement>(null);
  const lowerClothImageInputRef = useRef<HTMLInputElement>(null);
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const pollingStartTimeRef = useRef<number | null>(null);
  const POLLING_TIMEOUT_MS = 150000; // 2.5 minutes max

  // Fetch boutique credits
  const { data: credits, refetch: refetchCredits } = trpc.tryon.getCredits.useQuery();

  useEffect(() => {
    refetchCredits();
  }, [refetchCredits]);

  const createTryOnMutation = trpc.tryon.boutiqueCreateTryOn.useMutation();
  const refundCreditsMutation = trpc.tryon.refundTryOnCredits.useMutation();
  const saveToFeedMutation = trpc.tryon.saveTryOnResult.useMutation();

  const getTryOnStatusQuery = trpc.tryon.pollTryOnStatus.useQuery(
    { taskId: currentTaskId || "" },
    { enabled: !!currentTaskId && isPolling, refetchInterval: 2000 }
  );

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

  const handleModelPhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError("");
    setWarning("");

    setModelPhoto(file);
    const reader = new FileReader();
    reader.onload = (e) => {
      setModelPhotoPreview(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleClothImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError("");
    setWarning("");

    setClothImage(file);
    setLowerClothImage(null);
    setLowerClothImagePreview("");

    const reader = new FileReader();
    reader.onload = (e) => {
      setClothImagePreview(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleLowerClothImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLowerClothImage(file);
    const reader = new FileReader();
    reader.onload = (e) => {
      setLowerClothImagePreview(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const validateAndResizeImage = async (file: File, maxDimension: number = 2048): Promise<File> => {
    if (file.size > 5 * 1024 * 1024) {
      throw new Error(`Image too large. Max 5MB. Your image is ${(file.size / (1024 * 1024)).toFixed(2)}MB`);
    }
    
    const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      throw new Error(`Invalid format: ${file.type}. Use JPEG, PNG, or WebP`);
    }
    
    const dimensions = await getImageDimensions(file);
    if (dimensions.width > maxDimension || dimensions.height > maxDimension) {
      const resizedBlob = await resizeImage(file, maxDimension);
      return new File([resizedBlob], file.name, { type: 'image/jpeg' });
    }
    
    return file;
  };

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
      setProcessingProgress(10);
      const validatedModelPhoto = await validateAndResizeImage(modelPhoto, 2048);
      
      setProcessingProgress(20);
      const validatedClothImage = await validateAndResizeImage(clothImage, 1024);
      
      let validatedLowerClothImage = null;
      if (clothType === "combo" && lowerClothImage) {
        setProcessingProgress(30);
        validatedLowerClothImage = await validateAndResizeImage(lowerClothImage, 1024);
      }
      
      setProcessingProgress(40);
      const modelBase64 = await fileToBase64(validatedModelPhoto);
      const clothBase64 = await fileToBase64(validatedClothImage);
      let lowerClothBase64 = null;

      if (clothType === "combo" && validatedLowerClothImage) {
        lowerClothBase64 = await fileToBase64(validatedLowerClothImage);
      }

      setProcessingProgress(50);

      const response = await createTryOnMutation.mutateAsync({
        modelImageBase64: modelBase64,
        clothImageBase64: clothBase64,
        lowerClothImageBase64: lowerClothBase64 || undefined,
        clothType,
        boutiqueId,
      });

      setCurrentTaskId(response.taskId);
      setIsPolling(true);
      setProcessingProgress(0);
      pollingStartTimeRef.current = Date.now();

    } catch (err: any) {
      console.error("[Try-On] Error:", err);
      setError(err.message || "Failed to create try-on");
      setIsLoading(false);
      setProcessingProgress(0);
    }
  };

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

      setModelPhoto(null);
      setModelPhotoPreview("");
      setClothImage(null);
      setClothImagePreview("");
      setLowerClothImage(null);
      setLowerClothImagePreview("");

      refetchCredits();

      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }
    } else if (status.status === "FAILED") {
      setError("Try-on generation failed. Credits have been refunded.");
      setIsPolling(false);
      setIsLoading(false);

      if (currentTaskId) {
        refundCreditsMutation.mutate({ taskId: currentTaskId });
      }

      refetchCredits();
    } else if (status.status === "PROCESSING") {
      setProcessingProgress(Math.min(status.progress || 0, 95));
    }

    if (pollingStartTimeRef.current) {
      const elapsedTime = Date.now() - pollingStartTimeRef.current;
      if (elapsedTime > POLLING_TIMEOUT_MS) {
        setError("Try-on generation timed out. Credits have been refunded.");
        setIsPolling(false);
        setIsLoading(false);

        if (currentTaskId) {
          refundCreditsMutation.mutate({ taskId: currentTaskId });
        }

        refetchCredits();
      }
    }
  }, [getTryOnStatusQuery.data, isPolling]);

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        const result = reader.result as string;
        const base64 = result.split(',')[1];
        resolve(base64);
      };
      reader.onerror = reject;
    });
  };

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
    <div className="w-full max-w-4xl mx-auto p-4 space-y-6">
      {/* Credits Banner */}
      <Card className="bg-primary/5 border-primary/30">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Available Credits</p>
              <p className="text-3xl font-bold">{credits?.remainingCredits ?? 0}</p>
            </div>
            <Sparkles className="w-8 h-8 text-primary" />
          </div>
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
            <div className="flex gap-3 flex-col sm:flex-row">
              <Button onClick={handleDownload} className="flex-1">
                <Download className="w-4 h-4 mr-2" />
                Download
              </Button>
              <Button onClick={handleReset} variant="outline" className="flex-1">
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

      {/* Share Dialog */}
      <Dialog open={showSaveDialog} onOpenChange={setShowSaveDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Share to Global Feed</DialogTitle>
            <DialogDescription>
              Share your try-on result with the ThatOne community
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
      {isLoading && (
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
        <form onSubmit={handleSubmit} className="space-y-6">
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
                Full-body photo, front view
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
      {credits && (
              <Card className="bg-muted/50">
                <CardContent className="pt-6">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-sm text-muted-foreground">Remaining Credits</p>
                      <p className="text-2xl font-bold">{credits.remainingCredits}</p>
                    </div>
                    <Button 
                      variant="outline" 
                      onClick={() => setIsCreditModalOpen(true)}>
      
                      Buy More Credits
      
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
      <CreditPurchaseModal
              isOpen={isCreditModalOpen}
              onClose={() => setIsCreditModalOpen(false)}
              onPurchaseSuccess={() => {
                refetchCredits();
                setIsCreditModalOpen(false);
              }}
            />  
    </div>
  );
}