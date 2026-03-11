import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Check, Loader2 } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { useLocation } from "wouter";

interface BusinessPricingComponentProps {
  compact?: boolean; // For hamburger menu display
}

export function BusinessPricingComponent({ compact = false }: BusinessPricingComponentProps) {
  const { isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();
  const [loadingPackage, setLoadingPackage] = useState<string | null>(null);
  const [billingPeriod, setBillingPeriod] = useState<'monthly' | 'annual'>('monthly');
  const createCheckout = trpc.payment.createCheckout.useMutation();

  // Calculate discounted price for annual billing (10% off)
  const getAnnualPrice = (monthlyPrice: number) => {
    return Math.round(monthlyPrice * 12 * 0.9); // 12 months with 10% discount
  };

  const businessPlans = [
    { 
      name: "Boutique Starter",
      price: 385,
      features: [
        "100 Virtual Try-Ons",
        "Widget integration",
        "Social media landing page",
        "Basic dashboard access",
        "Effective rate: R3.85 per simulation"
      ]
    },
    { 
      name: "Boutique Growth",
      price: 750,
      features: [
        "200 Virtual Try-Ons",
        "Widget + API access",
        "Social media landing page",
        "Usage analytics",
        "Effective rate: R3.75 per simulation"
      ]
    },
    { 
      name: "Store Pro",
      price: 1350,
      features: [
        "500 Virtual Try-Ons",
        "Full API access/widget integration",
        "Branded try-on experience",
        "Conversion tracking",
        "Effective rate: R2.70 per simulation"
      ]
    },
    { 
      name: "Store Scale",
      price: 2200,
      features: [
        "1,000 Virtual Try-Ons",
        "Advanced analytics",
        "Full API access",
        "Priority support",
        "Branded try-on experience",
        "Lower per-use rate",
        "Effective rate: R2.20 per simulation"
      ]
    },
    { 
      name: "Retailer Pro",
      price: 6250,
      features: [
        "5,000 Virtual Try-Ons",
        "API + Custom integration",
        "Dedicated onboarding",
        "Performance reporting",
        "White label option",
        "Effective rate: R1.25 per simulation"
      ]
    },
    { 
      name: "Enterprise Retail",
      price: 18600,
      features: [
        "20,000 Virtual Try-Ons",
        "Full API integration",
        "White-label option",
        "Dedicated support",
        "Custom SLA",
        "Effective rate: R0.93 per simulation"
      ]
    },
    { 
      name: "Enterprise Retail Pro",
      price: null, // Custom pricing
      features: [
        "20,000+ Virtual Try-Ons",
        "Unlimited custom credits",
        "Full API integration",
        "White-label option",
        "Dedicated account manager",
        "Custom SLA & support",
        "Priority feature requests",
        "Custom integrations available"
      ],
      isEnterprise: true
    }
  ];

  const packageNameToId: Record<string, string> = {
    "Boutique Starter": "pkg_100_credits",
    "Boutique Growth": "pkg_200_credits",
    "Store Pro": "pkg_500_credits",
    "Store Scale": "pkg_1000_credits",
    "Retailer Pro": "pkg_5000_credits",
    "Enterprise Retail": "pkg_20000_credits",
    "Enterprise Retail Pro": "enterprise_custom",
  };

  const handleSubscribe = async (packageName: string, monthlyPrice: number | null) => {
    if (packageName === "Enterprise Retail Pro") {
      // For enterprise, open email link
      window.location.href = 'mailto:sales@styleswap.co.za?subject=Enterprise%20Retail%20Pro%20Inquiry&body=I%20am%20interested%20in%20the%20Enterprise%20Retail%20Pro%20package%20with%20more%20than%2020,000%20credits.';
      return;
    }

    if (!isAuthenticated) {
      const returnUrl = `/pricing`;
      localStorage.setItem('oauth_return_url', returnUrl);
      window.location.href = getLoginUrl();
      return;
    }

    try {
      setLoadingPackage(packageName);
      const packageId = packageNameToId[packageName];
      const finalPrice = monthlyPrice ? (billingPeriod === 'annual' ? getAnnualPrice(monthlyPrice) : monthlyPrice) : 0;
      const billingLabel = billingPeriod === 'annual' ? 'annual' : 'monthly';
      
      const result = await createCheckout.mutateAsync({
        packageId,
        successUrl: `${window.location.origin}/pricing?success=true`,
        cancelUrl: `${window.location.origin}/pricing?cancelled=true`,
        amount: finalPrice,
        billingPeriod: billingLabel,
      });

      if (result && result.checkoutUrl) {
        window.location.href = result.checkoutUrl;
      }
    } catch (error) {
      console.error('Checkout error:', error);
    } finally {
      setLoadingPackage(null);
    }
  }

  const displayPlans = businessPlans; // Always show all plans

  return (
    <div className="w-full">
      {/* Billing Toggle */}
      {true && (
        <div className="flex justify-center items-center gap-4 mb-12">
          <span className={`font-medium ${billingPeriod === 'monthly' ? 'text-foreground' : 'text-muted-foreground'}`}>
            Monthly
          </span>
          <button
            onClick={() => setBillingPeriod(billingPeriod === 'monthly' ? 'annual' : 'monthly')}
            className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors ${
              billingPeriod === 'annual' ? 'bg-primary' : 'bg-gray-300'
            }`}
          >
            <span
              className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform ${
                billingPeriod === 'annual' ? 'translate-x-7' : 'translate-x-1'
              }`}
            />
          </button>
          <span className={`font-medium ${billingPeriod === 'annual' ? 'text-foreground' : 'text-muted-foreground'}`}>
            Annual
          </span>
          {billingPeriod === 'annual' && (
            <span className="ml-2 inline-block bg-green-100 text-green-800 text-xs font-bold px-3 py-1 rounded-full">
              Save 10%
            </span>
          )}
        </div>
      )}

      {/* Pricing Cards Grid */}
      <div className={`grid gap-6 ${compact ? 'grid-cols-1 sm:grid-cols-2' : 'md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'}`}>
        {displayPlans.map((plan) => {
          const monthlyPrice = plan.price;
          const annualPrice = monthlyPrice ? getAnnualPrice(monthlyPrice) : null;
          const displayPrice = monthlyPrice ? (billingPeriod === 'annual' ? annualPrice : monthlyPrice) : null;
          const savings = monthlyPrice && billingPeriod === 'annual' ? monthlyPrice * 12 - (annualPrice || 0) : 0;
          const isEnterprise = (plan as any).isEnterprise;

          return (
            <Card key={plan.name} className={`flex flex-col overflow-hidden hover:shadow-lg transition-shadow ${isEnterprise ? 'border-2 border-primary' : ''}`}>
              {/* Header with Orange Background */}
              <CardHeader className={`${isEnterprise ? 'bg-gradient-to-r from-primary to-orange-600' : 'bg-primary'} text-white pb-4`}>
                <div className="flex items-start justify-between">
                  <h3 className="text-xl font-bold">{plan.name}</h3>
                  {isEnterprise && <span className="text-xs font-bold bg-white text-primary px-2 py-1 rounded">CUSTOM</span>}
                </div>
                <div className="mt-2">
                  {displayPrice !== null ? (
                    <>
                      <div className="text-3xl font-bold">R{displayPrice.toLocaleString()}</div>
                      <div className="text-sm opacity-90">/{billingPeriod === 'annual' ? 'year' : 'month'}</div>
                      {savings > 0 && (
                        <div className="text-sm mt-2 font-semibold">Save R{savings.toLocaleString()}/year</div>
                      )}
                    </>
                  ) : (
                    <>
                      <div className="text-3xl font-bold">Custom Pricing</div>
                      <div className="text-sm opacity-90">Contact for quote</div>
                    </>
                  )}
                </div>
              </CardHeader>

              {/* Features */}
              <CardContent className="flex-1 pt-6 pb-6">
                <ul className="space-y-3">
                  {plan.features.map((feature, idx) => (
                    <li key={idx} className="flex items-start gap-3">
                      <Check className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                      <span className="text-sm text-muted-foreground">{feature}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>

              {/* Subscribe Button */}
              <div className="px-6 pb-6">
                <Button
                  onClick={() => handleSubscribe(plan.name, monthlyPrice)}
                  disabled={loadingPackage === plan.name}
                  className={`w-full ${isEnterprise ? 'bg-orange-600 hover:bg-orange-700' : 'bg-primary hover:bg-primary/90'} text-white font-semibold text-sm`}>
                  {loadingPackage === plan.name ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Processing...
                    </>
                  ) : isEnterprise ? (
                    'Contact Sales'
                  ) : (
                    `Subscribe (${billingPeriod === 'annual' ? 'Annual' : 'Monthly'})`
                  )}
                </Button>
              </div>
            </Card>
          );
        })}
      </div>

      {compact && (
        <div className="mt-6 text-center">
          <Button variant="outline" onClick={() => setLocation('/pricing')} className="w-full">
            View All Plans on Pricing Page
          </Button>
        </div>
      )}
    </div>
  );
}
