import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Upload, Loader2, Check, AlertCircle } from "lucide-react";
import { trpc } from "@/lib/trpc";

interface TryOnResult {
  id: number;
  resultImageUrl: string;
  garmentName: string;
  createdAt: Date;
}

export function VirtualTryOnUpload() {
  const [userPhoto, setUserPhoto] = useState<File | null>(null);
  const [userPhotoPreview, setUserPhotoPreview] = useState<string>("");
  const [selectedGarmentId, setSelectedGarmentId] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<TryOnResult | null>(null);
  const [error, setError] = useState<string>("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fetch garments
  const { data: garments = [] } = trpc.garments.getAll.useQuery();

  // Fetch user credits
  const { data: credits } = trpc.tryon.getCredits.useQuery();

  // Create try-on mutation
  const createTryOnMutation = trpc.tryon.createTryOn.useMutation();

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      setError("File size must be less than 10MB");
      return;
    }

    // Validate file type
    if (!file.type.startsWith("image/")) {
      setError("Please upload an image file");
      return;
    }

    setUserPhoto(file);
    setError("");

    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setUserPhotoPreview(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleCreateTryOn = async () => {
    if (!userPhoto || !selectedGarmentId) {
      setError("Please select both a photo and a garment");
      return;
    }

    if (!credits || credits.remainingCredits < 1) {
      setError("Insufficient credits. Please purchase more credits.");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      const selectedGarment = garments.find(g => g.id === selectedGarmentId);
      if (!selectedGarment) {
        setError("Selected garment not found");
        setIsLoading(false);
        return;
      }

      // Convert user photo to base64
      const userPhotoBase64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target?.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(userPhoto);
      });

      // Fetch garment image and convert to base64
      const garmentResponse = await fetch(selectedGarment.imageUrl);
      const garmentBlob = await garmentResponse.blob();
      const garmentBase64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target?.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(garmentBlob);
      });

      // Call the create try-on mutation
      const response = await createTryOnMutation.mutateAsync({
        userImage: userPhotoBase64,
        garmentImage: garmentBase64,
        garmentDescription: selectedGarment.description || undefined,
      });

      if (response.success && response.resultImage) {
        setResult({
          id: Math.floor(Math.random() * 10000),
          resultImageUrl: response.resultImage,
          garmentName: selectedGarment.name,
          createdAt: new Date(),
        });
        setUserPhoto(null);
        setUserPhotoPreview("");
        setSelectedGarmentId(null);
      } else if (!response.success) {
        setError("Failed to create try-on");
      } else {
        setError("No result image returned");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Upload Section */}
      <Card className="premium-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="w-5 h-5 text-primary" />
            Upload Your Photo
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Photo Upload Area */}
          <div
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-border/40 rounded-lg p-8 text-center cursor-pointer hover:border-primary/50 transition-colors"
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handlePhotoUpload}
              className="hidden"
            />
            {userPhotoPreview ? (
              <div className="space-y-4">
                <img
                  src={userPhotoPreview}
                  alt="User photo preview"
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
                  PNG, JPG or GIF (max 10MB)
                </p>
              </div>
            )}
          </div>

          {/* Garment Selection */}
          <div className="space-y-3">
            <label className="block font-medium">Select a Garment</label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 max-h-64 overflow-y-auto">
              {garments.map((garment) => (
                <button
                  key={garment.id}
                  onClick={() => setSelectedGarmentId(garment.id)}
                  className={`p-3 rounded-lg border-2 transition-all ${
                    selectedGarmentId === garment.id
                      ? "border-primary bg-primary/10"
                      : "border-border/40 hover:border-primary/50"
                  }`}
                >
                  <img
                    src={garment.imageUrl}
                    alt={garment.name}
                    className="w-full h-24 object-cover rounded mb-2"
                  />
                  <p className="text-xs font-medium truncate">{garment.name}</p>
                  <p className="text-xs text-muted-foreground">{garment.price}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Credits Info */}
          <div className="bg-secondary/10 border border-secondary/20 rounded-lg p-4">
            <p className="text-sm font-medium">
              Credits Available: <span className="text-primary font-bold">{credits?.remainingCredits || 0}</span>
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Each try-on uses 1 credit
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
              <p className="text-sm text-destructive">{error}</p>
            </div>
          )}

          {/* Create Button */}
          <Button
            onClick={handleCreateTryOn}
            disabled={!userPhoto || !selectedGarmentId || isLoading}
            className="w-full h-12 premium-button bg-primary text-primary-foreground hover:bg-primary/90"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
                Creating Try-On...
              </>
            ) : (
              <>
                <Check className="w-4 h-4 mr-2" />
                Create Virtual Try-On
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
                You tried on: <span className="font-bold text-foreground">{result.garmentName}</span>
              </p>
              <img
                src={result.resultImageUrl}
                alt="Try-on result"
                className="w-full rounded-lg shadow-lg"
              />
            </div>
            <div className="flex gap-3">
              <Button
                onClick={() => {
                  setResult(null);
                  setUserPhotoPreview("");
                }}
                variant="outline"
                className="flex-1"
              >
                Try Another
              </Button>
              <Button
                onClick={() => {
                  // Navigate to share page
                  window.location.href = `/share/${result.id}`;
                }}
                className="flex-1 premium-button bg-primary text-primary-foreground hover:bg-primary/90"
              >
                Share Result
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
