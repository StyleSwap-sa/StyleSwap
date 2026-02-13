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
      const packageId = getPackageId(tryOns);
      const returnUrl = `/checkout?package=${packageId}`;
      localStorage.setItem('oauth_return_url', returnUrl);
      window.location.href = getLoginUrl();
      return;
    }
    const packageId = getPackageId(tryOns);
    setLocation(`/checkout?package=${packageId}`);
  };

  // Yoco payment links for business plans
  const getYocoCheckoutLink = (packageName: string, price: number): string => {
    // Map package names to Yoco checkout links
    // In production, these would be actual Yoco checkout links
    const yocoLinks: Record<string, string> = {
      "Boutique Starter": `https://checkout.yoco.com/pay?amount=${price * 100}&description=Boutique+Starter+Plan+-+100+Try-ons`,
      "Boutique Growth": `https://checkout.yoco.com/pay?amount=${price * 100}&description=Boutique+Growth+Plan+-+200+Try-ons`,
      "Store Pro": `https://checkout.yoco.com/pay?amount=${price * 100}&description=Store+Pro+Plan+-+500+Try-ons`,
      "Store Scale": `https://checkout.yoco.com/pay?amount=${price * 100}&description=Store+Scale+Plan+-+1000+Try-ons`,
      "Retailer Pro": `https://checkout.yoco.com/pay?amount=${price * 100}&description=Retailer+Pro+Plan+-+5000+Try-ons`,
      "Enterprise Retail": `https://checkout.yoco.com/pay?amount=${price * 100}&description=Enterprise+Retail+Plan+-+20000+Try-ons`,
    };
    return yocoLinks[packageName] || "#";
  };

  const handleSubscribe = (packageName: string, price: number) => {
    const yocoLink = getYocoCheckoutLink(packageName, price);
    window.open(yocoLink, '_blank');
  };

  // Individual Plans
  const individualPlans = [
    { tryOns: 10, price: 45, costPerTryOn: 4.50 },
    { tryOns: 20, price: 80, costPerTryOn: 4.00 },
    { tryOns: 50, price: 150, costPerTryOn: 3.00 },
  ];

  // Business Plans with exact wording from API Docs
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
    <div className="min-h-screen bg-background py-12">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="mb-12 text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">StyleSwap Retailer Pricing Packages</h1>
          <p className="text-xl text-muted-foreground">Reduce Returns. Increase Conversions. Let customers try before they buy.</p>
        </div>

        {/* Individual Plans Section */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold mb-8 text-center">Individual Try-On Credits</h2>
          <div className="grid md:grid-cols-3 gap-6 mb-8">
            {individualPlans.map((plan) => (
              <Card key={plan.tryOns} className="flex flex-col">
                <CardHeader>
                  <h3 className="text-2xl font-bold">{plan.tryOns} Try-Ons</h3>
                  <p className="text-3xl font-bold text-primary mt-2">R{plan.price}</p>
                  <p className="text-sm text-muted-foreground">R{plan.costPerTryOn} per try-on</p>
                </CardHeader>
                <CardContent className="flex-grow flex flex-col justify-between">
                  <Button 
                    onClick={() => handleBuyNow(plan.tryOns)}
                    className="w-full bg-primary hover:bg-primary/90"
                  >
                    Buy Now
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Business Plans Section */}
        <div>
          <h2 className="text-3xl font-bold mb-8 text-center">Business Plans (Monthly Subscription)</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {businessPlans.map((plan) => (
              <Card key={plan.name} className="flex flex-col border-0 shadow-lg overflow-hidden">
                {/* Orange Header */}
                <div className="bg-orange-600 text-white p-6">
                  <p className="text-4xl font-bold">R{plan.price.toLocaleString()}</p>
                  <p className="text-sm mt-1 opacity-90">/month</p>
                </div>
                <CardContent className="flex-grow flex flex-col justify-between p-6">
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
                    className="w-full bg-orange-600 hover:bg-orange-700 text-white font-semibold py-3"
                  >
                    Subscribe Now
                  </Button>
                </CardContent>
              </Card>
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
      </div>
    </div>
  );
}
