import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Check, Zap } from "lucide-react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";

export function SubscriptionPricing() {
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

  // Individual Plans - Pay-as-you-go model
  const individualPlans = [
    {
      tryOns: 10,
      price: 45,
      costPerTryOn: 4.50,
    },
    {
      tryOns: 20,
      price: 80,
      costPerTryOn: 4.00,
    },
    {
      tryOns: 50,
      price: 150,
      costPerTryOn: 3.00,
    },
  ];

  // Business Plans - Subscription model
  const businessPlans = [
    {
      tryOns: 100,
      price: 385,
      costPerTryOn: 3.85,
    },
    {
      tryOns: 200,
      price: 750,
      costPerTryOn: 3.75,
    },
    {
      tryOns: 500,
      price: 1350,
      costPerTryOn: 2.70,
    },
    {
      tryOns: 1000,
      price: 2200,
      costPerTryOn: 2.20,
    },
    {
      tryOns: 5000,
      price: 6250,
      costPerTryOn: 1.25,
    },
    {
      tryOns: 20000,
      price: 18600,
      costPerTryOn: 0.93,
    },
  ];

  return (
    <div className="w-full space-y-8">
      {/* Individual Plans */}
      <div className="space-y-4">
        <h3 className="text-2xl font-bold">Individual</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {individualPlans.map((plan) => (
            <Card key={`individual-${plan.tryOns}`} className="flex flex-col">
              <CardHeader>
                <div className="space-y-2">
                  <div className="text-3xl font-bold">R{plan.price}</div>
                  <div className="text-sm text-muted-foreground">
                    {plan.tryOns} try-ons
                  </div>
                  <div className="text-sm font-medium text-primary">
                    R{plan.costPerTryOn.toFixed(2)}/try-on
                  </div>
                </div>
              </CardHeader>
              <CardContent className="flex-1 flex flex-col justify-between">
                <ul className="space-y-2 mb-4">
                  <li className="flex items-center gap-2 text-sm">
                    <Check className="w-4 h-4 text-primary" />
                    {plan.tryOns} virtual try-ons
                  </li>
                  <li className="flex items-center gap-2 text-sm">
                    <Check className="w-4 h-4 text-primary" />
                    30-day validity
                  </li>
                  <li className="flex items-center gap-2 text-sm">
                    <Check className="w-4 h-4 text-primary" />
                    Email support
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
      <div className="space-y-4">
        <h3 className="text-2xl font-bold">Business</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {businessPlans.map((plan) => (
            <Card key={`business-${plan.tryOns}`} className="flex flex-col">
              <CardHeader>
                <div className="space-y-2">
                  <div className="text-3xl font-bold">R{plan.price}</div>
                  <div className="text-sm text-muted-foreground">
                    {plan.tryOns} try-ons
                  </div>
                  <div className="text-sm font-medium text-primary">
                    R{plan.costPerTryOn.toFixed(2)}/try-on
                  </div>
                </div>
              </CardHeader>
              <CardContent className="flex-1 flex flex-col justify-between">
                <ul className="space-y-2 mb-4">
                  <li className="flex items-center gap-2 text-sm">
                    <Check className="w-4 h-4 text-primary" />
                    {plan.tryOns} virtual try-ons
                  </li>
                  <li className="flex items-center gap-2 text-sm">
                    <Check className="w-4 h-4 text-primary" />
                    30-day validity
                  </li>
                  <li className="flex items-center gap-2 text-sm">
                    <Check className="w-4 h-4 text-primary" />
                    Priority support
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

      {/* FAQ */}
      <div className="space-y-4 pt-8 border-t">
        <h3 className="text-2xl font-bold">Frequently Asked Questions</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <h4 className="font-semibold flex items-center gap-2">
              <Zap className="w-4 h-4 text-primary" />
              How long are credits valid?
            </h4>
            <p className="text-sm text-muted-foreground">
              All credits are valid for 30 days from the date of purchase. Unused credits will expire after this period.
            </p>
          </div>
          <div className="space-y-2">
            <h4 className="font-semibold flex items-center gap-2">
              <Zap className="w-4 h-4 text-primary" />
              Can I upgrade my plan?
            </h4>
            <p className="text-sm text-muted-foreground">
              Yes, you can purchase additional credits at any time. Your existing credits will not expire when you upgrade.
            </p>
          </div>
          <div className="space-y-2">
            <h4 className="font-semibold flex items-center gap-2">
              <Zap className="w-4 h-4 text-primary" />
              What payment methods do you accept?
            </h4>
            <p className="text-sm text-muted-foreground">
              We accept all major credit cards, debit cards, and digital payment methods through our secure Yoko payment gateway.
            </p>
          </div>
          <div className="space-y-2">
            <h4 className="font-semibold flex items-center gap-2">
              <Zap className="w-4 h-4 text-primary" />
              Is there a refund policy?
            </h4>
            <p className="text-sm text-muted-foreground">
              Refunds are available within 7 days of purchase if you haven't used your credits. Contact support for assistance.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
