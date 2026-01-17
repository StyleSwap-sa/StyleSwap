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
      name: "Individual",
      tryOns: 10,
      price: 45,
      costPerTryOn: 4.50,
      description: "Perfect for trying out StyleSwap",
      features: [
        "10 virtual try-ons",
        "Access to garment catalog",
        "Basic sharing features",
        "Email support",
        "30-day validity",
      ],
    },
    {
      name: "Individual",
      tryOns: 20,
      price: 80,
      costPerTryOn: 4.00,
      description: "For casual users",
      features: [
        "20 virtual try-ons",
        "Access to garment catalog",
        "Basic sharing features",
        "Email support",
        "30-day validity",
      ],
    },
    {
      name: "Individual",
      tryOns: 50,
      price: 150,
      costPerTryOn: 3.00,
      description: "Best for regular users",
      features: [
        "50 virtual try-ons",
        "Priority access to new garments",
        "Advanced sharing analytics",
        "Priority email support",
        "30-day validity",
      ],
      highlighted: true,
    },
  ];

  // Business Plans - Subscription model
  const businessPlans = [
    {
      name: "Business",
      tryOns: 100,
      price: 385,
      period: "monthly",
      costPerTryOn: 3.85,
      description: "For small fashion retailers",
      features: [
        "100 virtual try-ons/month",
        "API access for integration",
        "Custom garment uploads",
        "Email support",
        "30-day validity",
        "Monthly billing",
      ],
    },
    {
      name: "Business",
      tryOns: 200,
      price: 750,
      period: "monthly",
      costPerTryOn: 3.75,
      description: "For growing fashion brands",
      features: [
        "200 virtual try-ons/month",
        "API access for integration",
        "Custom garment uploads",
        "Priority support",
        "30-day validity",
        "Monthly billing",
      ],
    },
    {
      name: "Business",
      tryOns: 500,
      price: 1350,
      period: "monthly",
      costPerTryOn: 2.70,
      description: "For established retailers",
      features: [
        "500 virtual try-ons/month",
        "API access for integration",
        "Custom garment uploads",
        "Priority support",
        "30-day validity",
        "Monthly billing",
        "Advanced analytics dashboard",
      ],
    },
    {
      name: "Business",
      tryOns: 1000,
      price: 2200,
      period: "monthly",
      costPerTryOn: 2.20,
      description: "For large fashion retailers",
      features: [
        "1000 virtual try-ons/month",
        "API access for integration",
        "Custom garment uploads",
        "24/7 priority support",
        "30-day validity",
        "Monthly billing",
        "Advanced analytics dashboard",
      ],
      highlighted: true,
    },
    {
      name: "Business",
      tryOns: 5000,
      price: 6250,
      period: "monthly",
      costPerTryOn: 1.25,
      description: "For enterprise retailers",
      features: [
        "5000 virtual try-ons/month",
        "API access for integration",
        "Custom garment uploads",
        "24/7 priority support",
        "30-day validity",
        "Monthly billing",
        "Advanced analytics dashboard",
        "Dedicated account manager",
      ],
    },
    {
      name: "Business",
      tryOns: 20000,
      price: 18600,
      period: "monthly",
      costPerTryOn: 0.91,
      description: "For large-scale operations",
      features: [
        "20000 virtual try-ons/month",
        "API access for integration",
        "Custom garment uploads",
        "24/7 priority support",
        "30-day validity",
        "Monthly billing",
        "Advanced analytics dashboard",
        "Dedicated account manager",
        "Custom integrations",
      ],
    },
  ];

  return (
    <section className="py-20 container mx-auto">
      <div className="text-center mb-16">
        <h2 className="text-5xl md:text-6xl font-bold mb-6">SIMPLE PRICING</h2>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
          Flexible pricing for individuals and businesses. All prices in South African Rands (ZAR). All try-ons valid for 30 days.
        </p>
      </div>

      {/* Individual Plans Section */}
      <div className="mb-24">
        <div className="flex items-center justify-center gap-3 mb-12">
          <Zap className="w-6 h-6 text-primary" />
          <h3 className="text-3xl font-bold text-center">INDIVIDUAL</h3>
          <p className="text-muted-foreground ml-4">Pay-as-you-go • No subscription required</p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {individualPlans.map((plan, idx) => (
            <Card
              key={idx}
              className={`premium-card rounded-2xl overflow-hidden transition-all duration-300 ${
                plan.highlighted
                  ? "ring-2 ring-primary shadow-2xl scale-105 md:scale-100"
                  : ""
              }`}
            >
              {plan.highlighted && (
                <div className="bg-primary text-primary-foreground py-2 text-center font-bold text-sm">
                  MOST POPULAR
                </div>
              )}
              <CardHeader>
                <CardTitle className="text-2xl">{plan.tryOns} Try-ons</CardTitle>
                <p className="text-sm text-muted-foreground mt-2">{plan.description}</p>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <div className="text-5xl font-bold text-primary">R{plan.price}</div>
                  <div className="text-sm text-muted-foreground mt-2">
                    R{plan.costPerTryOn}/try-on • 30-day validity
                  </div>
                </div>

                <ul className="space-y-3">
                  {plan.features.map((feature, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <Check className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                      <span className="text-muted-foreground">{feature}</span>
                    </li>
                  ))}
                </ul>

                <Button
                  onClick={() => handleBuyNow(plan.tryOns)}
                  className={`w-full h-12 font-bold text-lg premium-button ${
                    plan.highlighted
                      ? "bg-primary text-primary-foreground hover:bg-primary/90"
                      : "bg-secondary text-secondary-foreground hover:bg-secondary/90"
                  }`}
                >
                  Buy Now
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Business Plans Section */}
      <div className="mb-20">
        <div className="flex items-center justify-center gap-3 mb-12">
          <Zap className="w-6 h-6 text-secondary" />
          <h3 className="text-3xl font-bold text-center">BUSINESS</h3>
          <p className="text-muted-foreground ml-4">Monthly subscription • API access included</p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {businessPlans.map((plan, idx) => (
            <Card
              key={idx}
              className={`premium-card rounded-2xl overflow-hidden transition-all duration-300 ${
                plan.highlighted
                  ? "ring-2 ring-secondary shadow-2xl scale-105 md:scale-100"
                  : ""
              }`}
            >
              {plan.highlighted && (
                <div className="bg-secondary text-secondary-foreground py-2 text-center font-bold text-sm">
                  RECOMMENDED
                </div>
              )}
              <CardHeader>
                <CardTitle className="text-2xl">{plan.tryOns} Try-ons</CardTitle>
                <p className="text-sm text-muted-foreground mt-2">{plan.description}</p>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <div className="text-5xl font-bold text-secondary">R{plan.price}</div>
                  <div className="text-sm text-muted-foreground mt-2">
                    R{plan.costPerTryOn}/try-on • {plan.period} • 30-day validity
                  </div>
                </div>

                <ul className="space-y-3">
                  {plan.features.map((feature, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <Check className="w-5 h-5 text-secondary flex-shrink-0 mt-0.5" />
                      <span className="text-muted-foreground text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>

                <Button
                  onClick={() => handleBuyNow(plan.tryOns)}
                  className={`w-full h-12 font-bold text-lg premium-button ${
                    plan.highlighted
                      ? "bg-secondary text-secondary-foreground hover:bg-secondary/90"
                      : "bg-foreground/10 text-foreground hover:bg-foreground/20"
                  }`}
                >
                  Subscribe Now
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* FAQ Section */}
      <div className="mt-20 max-w-3xl mx-auto">
        <h3 className="text-3xl font-bold text-center mb-12">FREQUENTLY ASKED QUESTIONS</h3>
        <div className="space-y-6">
          <div className="premium-card p-6 rounded-lg">
            <h4 className="font-bold text-lg mb-2">How long are my try-ons valid?</h4>
            <p className="text-muted-foreground">
              All try-ons, whether Individual or Business plans, are valid for 30 days from purchase.
            </p>
          </div>
          <div className="premium-card p-6 rounded-lg">
            <h4 className="font-bold text-lg mb-2">Can I switch between plans?</h4>
            <p className="text-muted-foreground">
              Yes! Individual plans are one-time purchases. Business plans can be upgraded or downgraded anytime.
            </p>
          </div>
          <div className="premium-card p-6 rounded-lg">
            <h4 className="font-bold text-lg mb-2">Do you offer custom enterprise plans?</h4>
            <p className="text-muted-foreground">
              Yes! Contact our sales team at info@styleswap.co.za for custom enterprise solutions.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
