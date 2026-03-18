import { Button } from "@/components/ui/button";
import { Check, Loader2 } from "lucide-react";
import { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { getLoginUrl } from "@/const";

interface BusinessPricingSectionProps {
  title?: string;
  subtitle?: string;
}

export function BusinessPricingSection({
  title = "Business Plans (Monthly Subscription)",
  subtitle = "Reduce Returns. Increase Conversions. Let customers try before they buy."
}: BusinessPricingSectionProps) {
  const { isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();
  const [loadingPackage, setLoadingPackage] = useState<string | null>(null);
  const createCheckout = trpc.payment.createCheckout.useMutation();

  const packageNameToId: Record<string, string> = {
    "Boutique Starter": "pkg_100_credits",
    "Boutique Growth": "pkg_200_credits",
    "Store Pro": "pkg_500_credits",
    "Store Scale": "pkg_1000_credits",
    "Retailer Pro": "pkg_5000_credits",
    "Enterprise Retail": "pkg_20000_credits",
  };

  const handleSubscribe = async (packageName: string, price: number) => {
    if (!isAuthenticated) {
      const returnUrl = `/pricing`;
      localStorage.setItem('oauth_return_url', returnUrl);
      window.location.href = getLoginUrl();
      return;
    }

    try {
      setLoadingPackage(packageName);
      const packageId = packageNameToId[packageName];
      
      const result = await createCheckout.mutateAsync({
        packageId,
        successUrl: `${window.location.origin}/pricing?success=true`,
        cancelUrl: `${window.location.origin}/pricing?cancelled=true`,
      });

      if (result && result.checkoutUrl) {
        window.location.href = result.checkoutUrl;
      } else {
        alert('Failed to create checkout session. Please try again.');
      }
    } catch (error: any) {
      alert('Error: ' + (error.message || 'Failed to create checkout'));
    } finally {
      setLoadingPackage(null);
    }
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
    }
  ];

  return (
    <section className="py-16 bg-background">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="mb-12 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">{title}</h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">{subtitle}</p>
        </div>

        {/* Pricing Cards Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {businessPlans.map((plan) => (
            <div key={plan.name} className="flex flex-col border-0 shadow-lg overflow-hidden rounded-lg bg-white">
              {/* Orange Header with Title and Price */}
              <div className="bg-orange-600 text-white p-6">
                <h3 className="text-lg font-bold mb-2">{plan.name}</h3>
                <p className="text-3xl font-bold">R{plan.price.toLocaleString()}</p>
                <p className="text-sm mt-1 opacity-90">/month</p>
              </div>
              <div className="flex-grow flex flex-col justify-between p-6">
                {/* All features list */}
                <ul className="space-y-2 mb-6">
                  {plan.features.map((feature, idx) => (
                    <li key={idx} className="flex items-start gap-3">
                      <Check className="w-5 h-5 text-orange-600 flex-shrink-0 mt-0.5" />
                      <span className="text-sm text-slate-700">{feature}</span>
                    </li>
                  ))}
                </ul>
                <Button 
                  onClick={() => handleSubscribe(plan.name, plan.price)}
                  disabled={loadingPackage === plan.name}
                  className="w-full bg-orange-600 hover:bg-orange-700 text-white font-semibold py-3 disabled:opacity-50"
                >
                  {loadingPackage === plan.name ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    'Subscribe Now'
                  )}
                </Button>
              </div>
            </div>
          ))}
        </div>

        {/* Additional Info */}
        <div className="mt-12 bg-slate-50 border border-slate-200 p-6 rounded-lg">
          <p className="text-center text-sm text-slate-700 mb-3 font-semibold">
            Additional simulations billed at plan rate.
          </p>
          <p className="text-center text-sm text-slate-700 font-semibold">
            Seamless integration via widget, API, or social selling landing page.
          </p>
        </div>
      </div>
    </section>
  );
}
