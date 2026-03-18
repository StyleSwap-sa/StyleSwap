import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Check, Zap, ArrowLeft } from "lucide-react";

export default function Pricing() {
  const { isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();

  const getPackageId = (tryOns: number): string => {
    switch (tryOns) {
      case 10:
        return "pkg_10_credits";
      case 20:
        return "pkg_20_credits";
      case 50:
        return "pkg_50_credits";
      case 100:
        return "pkg_100_credits";
      case 200:
        return "pkg_200_credits";
      case 500:
        return "pkg_500_credits";
      case 1000:
        return "pkg_1000_credits";
      case 5000:
        return "pkg_5000_credits";
      case 20000:
        return "pkg_20000_credits";
      default:
        return "pkg_50_credits";
    }
  };

  const handleBuyNow = (tryOns: number) => {
    if (!isAuthenticated) {
      window.location.href = getLoginUrl();
      return;
    }
    const packageId = getPackageId(tryOns);
    setLocation(`/checkout?package=${packageId}`);
  };

  // Individual Plans
  const individualPlans = [
    { tryOns: 10, price: 45, costPerTryOn: 4.50 },
    { tryOns: 20, price: 80, costPerTryOn: 4.00 },
    { tryOns: 50, price: 150, costPerTryOn: 3.00 },
  ];

  // Business Plans
  const businessPlans = [
    { tryOns: 100, price: 385, costPerTryOn: 3.85 },
    { tryOns: 200, price: 750, costPerTryOn: 3.75 },
    { tryOns: 500, price: 1350, costPerTryOn: 2.70 },
    { tryOns: 1000, price: 2200, costPerTryOn: 2.20 },
    { tryOns: 5000, price: 6250, costPerTryOn: 1.25 },
    { tryOns: 20000, price: 18600, costPerTryOn: 0.93 },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <div className="border-b border-border/20 py-6">
        <div className="container mx-auto flex items-center justify-between">
          <button
            onClick={() => setLocation("/")}
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            Back to Home
          </button>
          <h1 className="text-3xl font-bold">Pricing Plans</h1>
          <div className="w-20" />
        </div>
      </div>

      {/* Pricing Content */}
      <div className="container mx-auto py-12 space-y-12">
        {/* Individual Plans */}
        <div className="space-y-6">
          <div>
            <h2 className="text-3xl font-bold mb-2">Individual</h2>
            <p className="text-muted-foreground">
              Pay-as-you-go plans for personal use
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {individualPlans.map((plan) => (
              <Card key={`individual-${plan.tryOns}`}>
                <CardHeader>
                  <div className="space-y-3">
                    <div className="text-4xl font-bold">R{plan.price}</div>
                    <div className="text-lg font-medium text-muted-foreground">
                      {plan.tryOns} try-ons
                    </div>
                    <div className="text-sm font-semibold text-primary">
                      R{plan.costPerTryOn.toFixed(2)}/try-on
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  <ul className="space-y-3">
                    <li className="flex items-center gap-3">
                      <Check className="w-5 h-5 text-primary flex-shrink-0" />
                      <span className="text-sm">{plan.tryOns} virtual try-ons</span>
                    </li>
                    <li className="flex items-center gap-3">
                      <Check className="w-5 h-5 text-primary flex-shrink-0" />
                      <span className="text-sm">30-day validity</span>
                    </li>
                    <li className="flex items-center gap-3">
                      <Check className="w-5 h-5 text-primary flex-shrink-0" />
                      <span className="text-sm">Email support</span>
                    </li>
                  </ul>
                  <Button
                    onClick={() => handleBuyNow(plan.tryOns)}
                    className="w-full"
                  >
                    Buy Now
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Business Plans */}
        <div className="space-y-6">
          <div>
            <h2 className="text-3xl font-bold mb-2">Business</h2>
            <p className="text-muted-foreground">
              Subscription plans for businesses and retailers
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {businessPlans.map((plan) => (
              <Card key={`business-${plan.tryOns}`}>
                <CardHeader>
                  <div className="space-y-3">
                    <div className="text-4xl font-bold">R{plan.price}</div>
                    <div className="text-lg font-medium text-muted-foreground">
                      {plan.tryOns} try-ons
                    </div>
                    <div className="text-sm font-semibold text-primary">
                      R{plan.costPerTryOn.toFixed(2)}/try-on
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  <ul className="space-y-3">
                    <li className="flex items-center gap-3">
                      <Check className="w-5 h-5 text-primary flex-shrink-0" />
                      <span className="text-sm">{plan.tryOns} virtual try-ons</span>
                    </li>
                    <li className="flex items-center gap-3">
                      <Check className="w-5 h-5 text-primary flex-shrink-0" />
                      <span className="text-sm">30-day validity</span>
                    </li>
                    <li className="flex items-center gap-3">
                      <Check className="w-5 h-5 text-primary flex-shrink-0" />
                      <span className="text-sm">Priority support</span>
                    </li>
                  </ul>
                  <Button
                    onClick={() => handleBuyNow(plan.tryOns)}
                    className="w-full"
                  >
                    Subscribe Now
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* FAQ Section */}
        <div className="space-y-6 pt-12 border-t border-border/20">
          <div>
            <h2 className="text-3xl font-bold mb-2">Frequently Asked Questions</h2>
            <p className="text-muted-foreground">
              Have questions about our pricing? We're here to help.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-3">
              <h3 className="font-semibold flex items-center gap-2">
                <Zap className="w-5 h-5 text-primary" />
                How long are credits valid?
              </h3>
              <p className="text-sm text-muted-foreground">
                All credits are valid for 30 days from the date of purchase. Unused credits will expire after this period.
              </p>
            </div>
            <div className="space-y-3">
              <h3 className="font-semibold flex items-center gap-2">
                <Zap className="w-5 h-5 text-primary" />
                Can I upgrade my plan?
              </h3>
              <p className="text-sm text-muted-foreground">
                Yes, you can purchase additional credits at any time. Your existing credits will not expire when you upgrade.
              </p>
            </div>
            <div className="space-y-3">
              <h3 className="font-semibold flex items-center gap-2">
                <Zap className="w-5 h-5 text-primary" />
                What payment methods do you accept?
              </h3>
              <p className="text-sm text-muted-foreground">
                We accept all major credit cards, debit cards, and digital payment methods through our secure Yoko payment gateway.
              </p>
            </div>
            <div className="space-y-3">
              <h3 className="font-semibold flex items-center gap-2">
                <Zap className="w-5 h-5 text-primary" />
                Is there a refund policy?
              </h3>
              <p className="text-sm text-muted-foreground">
                Refunds are available within 7 days of purchase if you haven't used your credits. Contact support for assistance.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
