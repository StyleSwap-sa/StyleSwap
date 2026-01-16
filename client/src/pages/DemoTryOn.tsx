import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import {
  Upload,
  Loader2,
  Check,
  AlertCircle,
  ArrowRight,
  Sparkles,
} from "lucide-react";

export default function DemoTryOn() {
  const { isAuthenticated, user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [demoCount, setDemoCount] = useState(0);
  const [tryOnResult, setTryOnResult] = useState<string | null>(null);

  const { data: garments } = trpc.garments.getAll.useQuery();
  const [selectedGarment, setSelectedGarment] = useState<string | null>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file");
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image must be less than 5MB");
      return;
    }

    setSelectedFile(file);

    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setPreview(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleGenerateTryOn = async () => {
    if (!selectedFile || !selectedGarment) {
      toast.error("Please select both a photo and a garment");
      return;
    }

    if (demoCount >= 2) {
      toast.info("You've used your 2 free demo try-ons. Sign up to create more!");
      return;
    }

    setIsProcessing(true);

    try {
      // Simulate try-on generation
      await new Promise((resolve) => setTimeout(resolve, 3000));

      // Generate mock result
      const mockResult = `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='600'%3E%3Crect fill='%23f0f0f0' width='400' height='600'/%3E%3Ctext x='200' y='300' text-anchor='middle' font-size='24' fill='%23666'%3EVirtual Try-On Result%3C/text%3E%3C/svg%3E`;

      setTryOnResult(mockResult);
      setDemoCount((prev) => prev + 1);
      toast.success("Try-on generated successfully!");
    } catch (error) {
      toast.error("Failed to generate try-on. Please try again.");
      console.error("[Demo Try-On] Error:", error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleContinue = () => {
    if (isAuthenticated) {
      window.location.href = "/dashboard?tab=try-on";
    } else {
      window.location.href = getLoginUrl();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-foreground/5 py-12">
      <div className="container mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-block mb-4 px-4 py-2 bg-primary/10 border border-primary/30 rounded-full">
            <p className="text-sm font-bold text-primary uppercase tracking-wider">
              ✨ Try It Free
            </p>
          </div>
          <h1 className="text-5xl md:text-6xl font-bold mb-4">
            See StyleSwap in Action
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            Upload your photo and try on any garment from our catalog instantly.
            Experience the power of AI-powered virtual try-ons with 2 free demos.
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8 max-w-6xl mx-auto">
          {/* Left: Upload Section */}
          <div className="space-y-6">
            <Card className="premium-card rounded-2xl overflow-hidden">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Upload className="w-5 h-5" />
                  Step 1: Upload Your Photo
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Upload a clear, full-body photo of yourself for best results.
                </p>

                {/* File Upload Area */}
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-border/50 rounded-lg p-8 text-center cursor-pointer hover:border-primary/50 transition-colors"
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                  {preview ? (
                    <div className="space-y-3">
                      <img
                        src={preview}
                        alt="Preview"
                        className="w-full h-48 object-cover rounded-lg"
                      />
                      <p className="text-sm font-bold text-primary">
                        Photo selected ✓
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <Upload className="w-8 h-8 mx-auto text-muted-foreground" />
                      <p className="font-bold">Click to upload or drag and drop</p>
                      <p className="text-sm text-muted-foreground">
                        PNG, JPG, GIF up to 5MB
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Garment Selection */}
            <Card className="premium-card rounded-2xl overflow-hidden">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5" />
                  Step 2: Choose a Garment
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Select from our collection of trendy garments.
                </p>

                <div className="grid grid-cols-2 gap-3 max-h-64 overflow-y-auto">
                  {garments?.slice(0, 6).map((garment) => (
                    <button
                      key={garment.id}
                      onClick={() => setSelectedGarment(garment.id.toString())}
                      className={`p-3 rounded-lg border-2 transition-all text-left ${
                        selectedGarment === garment.id.toString()
                          ? "border-primary bg-primary/10"
                          : "border-border/50 hover:border-primary/50"
                      }`}
                    >
                      <p className="font-bold text-sm">{garment.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {garment.category}
                      </p>
                      {selectedGarment === garment.id.toString() && (
                        <Check className="w-4 h-4 text-primary mt-1" />
                      )}
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Generate Button */}
            <Button
              onClick={handleGenerateTryOn}
              disabled={!selectedFile || !selectedGarment || isProcessing}
              className="w-full h-12 font-bold text-lg premium-button bg-primary text-primary-foreground hover:bg-primary/90 gap-2"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  Generate Try-On
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </Button>

            {/* Demo Counter */}
            <div className="p-4 bg-foreground/5 rounded-lg border border-border/20">
              <p className="text-sm font-bold mb-2">Free Demos Used</p>
              <div className="flex gap-2">
                {[0, 1].map((i) => (
                  <div
                    key={i}
                    className={`flex-1 h-2 rounded-full ${
                      i < demoCount ? "bg-primary" : "bg-border/20"
                    }`}
                  />
                ))}
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                {demoCount}/2 free try-ons used
              </p>
            </div>
          </div>

          {/* Right: Result Section */}
          <div className="space-y-6">
            {tryOnResult ? (
              <>
                <Card className="premium-card rounded-2xl overflow-hidden">
                  <CardHeader>
                    <CardTitle>Your Virtual Try-On</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <img
                      src={tryOnResult}
                      alt="Try-on result"
                      className="w-full rounded-lg"
                    />
                  </CardContent>
                </Card>

                <Card className="premium-card bg-gradient-to-br from-green-50 to-green-50/50 border-green-200 rounded-2xl">
                  <CardContent className="pt-6">
                    <div className="flex items-start gap-3">
                      <Check className="w-6 h-6 text-green-600 flex-shrink-0 mt-1" />
                      <div>
                        <p className="font-bold text-green-900">
                          Try-on generated successfully!
                        </p>
                        <p className="text-sm text-green-800 mt-1">
                          {demoCount < 2
                            ? `You have ${2 - demoCount} more free demo${2 - demoCount === 1 ? "" : "s"} remaining.`
                            : "You've used all your free demos."}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {demoCount >= 2 && (
                  <Card className="premium-card bg-gradient-to-br from-primary/10 to-primary/5 border-primary/30 rounded-2xl">
                    <CardContent className="pt-6">
                      <div className="space-y-4">
                        <h3 className="font-bold text-lg">
                          Ready to create unlimited try-ons?
                        </h3>
                        <p className="text-muted-foreground">
                          Sign up now to unlock unlimited virtual try-ons, save
                          your favorites, and share with friends.
                        </p>
                        <Button
                          onClick={handleContinue}
                          className="w-full bg-primary text-primary-foreground hover:bg-primary/90 gap-2"
                        >
                          {isAuthenticated ? "Go to Dashboard" : "Sign Up Free"}
                          <ArrowRight className="w-4 h-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </>
            ) : (
              <Card className="premium-card rounded-2xl overflow-hidden h-full flex items-center justify-center min-h-96">
                <CardContent className="text-center">
                  <Sparkles className="w-12 h-12 text-muted-foreground/50 mx-auto mb-4" />
                  <p className="text-muted-foreground">
                    Your virtual try-on will appear here
                  </p>
                </CardContent>
              </Card>
            )}

            {/* Info Box */}
            <Card className="premium-card rounded-2xl">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <AlertCircle className="w-5 h-5" />
                  Tips for Best Results
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <p>
                  <span className="font-bold">📸 Clear photo:</span> Use a
                  well-lit, full-body photo
                </p>
                <p>
                  <span className="font-bold">👕 Fitted clothing:</span> Wear
                  fitted clothes to see accurate fit
                </p>
                <p>
                  <span className="font-bold">🎯 Face visible:</span> Include
                  your face for better results
                </p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* CTA Section */}
        <div className="mt-16 text-center">
          <Card className="premium-card bg-gradient-to-r from-primary/10 to-secondary/10 border-primary/30 rounded-2xl max-w-2xl mx-auto">
            <CardContent className="pt-8">
              <h2 className="text-3xl font-bold mb-4">
                Love the Results? Get More!
              </h2>
              <p className="text-muted-foreground mb-6 leading-relaxed">
                Upgrade to unlimited try-ons and unlock exclusive features like
                sharing, favorites, and detailed analytics.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button
                  onClick={handleContinue}
                  className="premium-button bg-primary text-primary-foreground hover:bg-primary/90 gap-2"
                >
                  {isAuthenticated ? "Go to Dashboard" : "Sign Up Free"}
                  <ArrowRight className="w-4 h-4" />
                </Button>
                <Button variant="outline" className="premium-button">
                  Learn More
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
