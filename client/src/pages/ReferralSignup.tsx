import { useEffect, useState } from "react";
import { useParams, useLocation } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, ArrowRight, Gift } from "lucide-react";
import { getLoginUrl } from "@/const";

export default function ReferralSignup() {
  const { referralCode } = useParams();
  const [, setLocation] = useLocation();
  const { user, isAuthenticated, loading } = useAuth();
  const [outfitData, setOutfitData] = useState<any>(null);
  const [referrerData, setReferrerData] = useState<any>(null);
  const [isLoadingData, setIsLoadingData] = useState(true);

  // Get referral info
  const { data: referralInfo, isLoading: infoLoading } =
    trpc.referrals.getPublicReferralInfo.useQuery(
      { referralCode: referralCode || "" },
      { enabled: !!referralCode }
    );

  // Track referral click
  const trackClickMutation = trpc.referrals.trackReferralClick.useMutation();

  useEffect(() => {
    if (referralInfo) {
      setOutfitData(referralInfo.outfit);
      setReferrerData(referralInfo.referrer);
      setIsLoadingData(false);

      // Track the click
      trackClickMutation.mutate({
        referralCode: referralCode || "",
        platform: new URLSearchParams(window.location.search).get("platform") || undefined,
        ipAddress: undefined,
        userAgent: navigator.userAgent,
      });
    }
  }, [referralInfo, referralCode]);

  // If user is already authenticated, redirect to closet
  useEffect(() => {
    if (isAuthenticated && user && !loading) {
      // Track signup if coming from referral
      if (referralCode) {
        trpc.referrals.trackReferralSignup.mutate({
          referralCode,
          newUserId: user.id,
        });
      }
      setLocation("/closet");
    }
  }, [isAuthenticated, user, loading, referralCode, setLocation]);

  if (loading || infoLoading || isLoadingData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/10 to-secondary/10">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  if (!outfitData || !referrerData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="pt-8 text-center">
            <p className="text-muted-foreground mb-4">
              Invalid referral link. Please try again.
            </p>
            <Button onClick={() => setLocation("/")} variant="outline">
              Go Home
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/10 to-secondary/10 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-2">
            Join StyleSwap Today!
          </h1>
          <p className="text-lg text-muted-foreground">
            {referrerData.name} invited you to check out an amazing outfit
          </p>
        </div>

        {/* Outfit Preview */}
        <Card className="mb-8 overflow-hidden">
          <div className="grid md:grid-cols-2 gap-6 p-6">
            {/* Outfit Image */}
            <div className="flex items-center justify-center bg-muted rounded-lg overflow-hidden">
              <img
                src={outfitData.watermarkedImageUrl}
                alt={outfitData.title}
                className="w-full h-full object-cover"
              />
            </div>

            {/* Outfit Details */}
            <div className="flex flex-col justify-center space-y-4">
              <div>
                <h2 className="text-2xl font-bold mb-2">{outfitData.title}</h2>
                <p className="text-muted-foreground">
                  {outfitData.description}
                </p>
              </div>

              {outfitData.tags && outfitData.tags !== "[]" && (
                <div className="flex flex-wrap gap-2">
                  {JSON.parse(outfitData.tags).map((tag: string) => (
                    <span
                      key={tag}
                      className="text-xs bg-secondary text-secondary-foreground px-3 py-1 rounded-full"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}

              <div className="pt-4 border-t">
                <p className="text-sm text-muted-foreground mb-2">
                  Shared by
                </p>
                <p className="font-semibold">{referrerData.name}</p>
              </div>
            </div>
          </div>
        </Card>

        {/* Benefits */}
        <Card className="mb-8 bg-blue-50 border-blue-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-blue-900">
              <Gift className="w-5 h-5" />
              What You Get
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-blue-900">
            <div className="flex gap-3">
              <div className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-200 flex items-center justify-center text-sm font-bold">
                ✓
              </div>
              <div>
                <p className="font-medium">Create Your Own Profile</p>
                <p className="text-sm text-blue-800">
                  Save and share your favorite outfits
                </p>
              </div>
            </div>

            <div className="flex gap-3">
              <div className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-200 flex items-center justify-center text-sm font-bold">
                ✓
              </div>
              <div>
                <p className="font-medium">Virtual Try-On</p>
                <p className="text-sm text-blue-800">
                  See how clothes look on you before buying
                </p>
              </div>
            </div>

            <div className="flex gap-3">
              <div className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-200 flex items-center justify-center text-sm font-bold">
                ✓
              </div>
              <div>
                <p className="font-medium">Connect with Friends</p>
                <p className="text-sm text-blue-800">
                  Follow friends and discover new styles
                </p>
              </div>
            </div>

            <div className="flex gap-3">
              <div className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-200 flex items-center justify-center text-sm font-bold">
                ✓
              </div>
              <div>
                <p className="font-medium">Bonus Credits</p>
                <p className="text-sm text-blue-800">
                  Get free try-on credits when you sign up
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* CTA */}
        <div className="space-y-3">
          <Button
            onClick={() => (window.location.href = getLoginUrl())}
            size="lg"
            className="w-full gap-2 h-12 text-base"
          >
            Sign Up Now
            <ArrowRight className="w-5 h-5" />
          </Button>

          <p className="text-center text-sm text-muted-foreground">
            Already have an account?{" "}
            <a
              href={getLoginUrl()}
              className="text-primary hover:underline font-medium"
            >
              Log in
            </a>
          </p>
        </div>

        {/* Social Proof */}
        <Card className="mt-8 bg-muted/50">
          <CardContent className="pt-6">
            <p className="text-center text-sm text-muted-foreground">
              Join thousands of fashion enthusiasts discovering new styles with StyleSwap
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
