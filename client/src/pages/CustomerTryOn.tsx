import { VirtualTryOnUpload } from "@/components/VirtualTryOnUpload";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { Button } from "@/components/ui/button";
import { Loader2, Zap } from "lucide-react";
import React from "react";

/**
 * Customer Try-On Dashboard
 * Simple interface for customers to upload body and clothing images
 * No garment catalog - direct upload only
 */
export default function CustomerTryOn() {
  const { isAuthenticated, user, loading } = useAuth();
  const [testMode, setTestMode] = React.useState(true); // Default to true for Try Customer Dashboard

  React.useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    // If test parameter is explicitly set, use it; otherwise default to true
    const testParam = params.get('test');
    setTestMode(testParam === null ? true : testParam === 'true');
  }, []);

  const toggleTestMode = () => {
    const newTestMode = !testMode;
    setTestMode(newTestMode);
    // Update URL without reloading
    const url = new URL(window.location);
    if (newTestMode) {
      url.searchParams.set('test', 'true');
    } else {
      url.searchParams.delete('test');
    }
    window.history.replaceState({}, '', url);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="animate-spin w-8 h-8" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <div className="text-center">
          <h1 className="text-3xl font-bold mb-2">Virtual Try-On</h1>
          <p className="text-muted-foreground mb-6">
            Please log in to test our virtual try-on feature
          </p>
          <Button
            onClick={() => (window.location.href = getLoginUrl())}
            className="bg-primary text-primary-foreground hover:bg-primary/90"
          >
            Login to Continue
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto py-8 px-4">
        <div className="max-w-2xl mx-auto">
          {/* Header with Test Mode Toggle */}
          <div className="mb-8">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
              <div className="flex-1">
                <h1 className="text-3xl sm:text-4xl font-bold mb-2">Virtual Try-On</h1>
                <p className="text-muted-foreground text-sm sm:text-base">
                  Upload your body photo and a clothing image to see how the garment looks on you
                </p>
              </div>
              
              {/* Test Mode Toggle Button - Prominent on both mobile and desktop */}
              <Button
                onClick={toggleTestMode}
                variant={testMode ? "default" : "outline"}
                className={`w-full sm:w-auto flex items-center gap-2 whitespace-nowrap ${
                  testMode 
                    ? "bg-primary text-primary-foreground hover:bg-primary/90" 
                    : "border-primary text-primary hover:bg-primary/10"
                }`}
              >
                <Zap className="w-4 h-4" />
                {testMode ? "Test Mode ON" : "Test Mode OFF"}
              </Button>
            </div>

            {/* Test Mode Info Banner */}
            {testMode && (
              <div className="bg-primary/10 border border-primary/30 rounded-lg p-4 mb-6">
                <div className="flex items-start gap-3">
                  <Zap className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <h3 className="font-semibold text-primary mb-1">Test Mode Active</h3>
                    <p className="text-sm text-primary/80">
                      You can generate unlimited try-ons without using credits. Perfect for testing!
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Virtual Try-On Upload Component */}
          <VirtualTryOnUpload />
        </div>
      </div>
    </div>
  );
}
