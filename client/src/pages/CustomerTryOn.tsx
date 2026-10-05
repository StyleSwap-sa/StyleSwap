import { VirtualTryOnUpload } from "@/components/VirtualTryOnUpload";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

/**
 * Customer Try-On Dashboard
 * Supports pre-fill from the boutique shop via:
 *   /customer-try-on?boutique=<id>&product=<id>
 */
export default function CustomerTryOn() {
  const { isAuthenticated, loading } = useAuth();

  // Read query params for prefill
  const params =
    typeof window !== "undefined"
      ? new URLSearchParams(window.location.search)
      : new URLSearchParams();
  const productIdParam = params.get("product");
  const boutiqueIdParam = params.get("boutique");

  const prefillProductId = productIdParam ? parseInt(productIdParam, 10) : null;
  const prefillBoutiqueId = boutiqueIdParam ? parseInt(boutiqueIdParam, 10) : null;

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
          <div className="mb-8">
            <h1 className="text-4xl font-bold mb-2">Virtual Try-On</h1>
            <p className="text-muted-foreground">
              Upload your body photo and a clothing image to see how the garment looks on you
            </p>
          </div>

          <VirtualTryOnUpload
            prefillProductId={prefillProductId}
            prefillBoutiqueId={prefillBoutiqueId}
          />
        </div>
      </div>
    </div>
  );
}