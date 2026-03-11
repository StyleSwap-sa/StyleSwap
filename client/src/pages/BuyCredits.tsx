import { useAuth } from "@/_core/hooks/useAuth";
import { CreditTopup } from "@/components/CreditTopup";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertCircle, ArrowLeft } from "lucide-react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";

export default function BuyCredits() {
  const { user, isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();
  const { data: boutique } = trpc.boutiques.getBoutiqueByUserId.useQuery(undefined, {
    enabled: !!user?.id,
  });

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardHeader>
            <CardTitle>Authentication Required</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Please log in to purchase credits for your boutique.
            </p>
            <Button onClick={() => setLocation("/")} className="w-full">
              Go to Home
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!boutique) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-amber-600" />
              No Boutique Found
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              You need to create a boutique first before purchasing credits.
            </p>
            <Button onClick={() => setLocation("/boutiques")} className="w-full">
              Create Boutique
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container max-w-2xl mx-auto py-8 px-4">
        {/* Header */}
        <div className="mb-8">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setLocation("/boutiques")}
            className="mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Boutique
          </Button>
          <h1 className="text-3xl font-bold">Buy Credits</h1>
          <p className="text-muted-foreground mt-2">
            Purchase credits for <strong>{boutique.name}</strong>
          </p>
        </div>

        {/* Credit Top-up Component */}
        <CreditTopup
          boutiqueId={boutique.id}
          currentCredits={boutique.credits || 0}
          onSuccess={() => {
            // Refresh boutique data
            window.location.reload();
          }}
        />

        {/* FAQ Section */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle className="text-lg">Frequently Asked Questions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="font-semibold text-sm mb-1">How are credits used?</h3>
              <p className="text-sm text-muted-foreground">
                Each virtual try-on deducts 1 credit from your account. You can use credits anytime without expiration.
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-sm mb-1">Can I get a refund?</h3>
              <p className="text-sm text-muted-foreground">
                Credit purchases are non-refundable. However, unused credits never expire and can be used anytime.
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-sm mb-1">What payment methods do you accept?</h3>
              <p className="text-sm text-muted-foreground">
                We accept all major credit and debit cards through our secure payment processor.
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-sm mb-1">Are there volume discounts?</h3>
              <p className="text-sm text-muted-foreground">
                Yes! Larger credit packages offer better rates. Contact our sales team for enterprise pricing.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
