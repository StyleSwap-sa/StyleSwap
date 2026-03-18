import { useAuth } from "@/_core/hooks/useAuth";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Check } from "lucide-react";
import { getLoginUrl } from "@/const";
import Navigation from "@/components/Navigation";

const PRICING_TIERS = [
  // Individual Plans
  {
    id: "pkg_10_credits",
    name: "10 Try-Ons",
    price: 45,
    credits: 10,
    costPerTryOn: 4.50,
    category: "Individual",
    features: ["10 virtual try-ons", "30-day validity", "Email support"],
    buttonText: "Buy Now",
  },
  {
    id: "pkg_20_credits",
    name: "20 Try-Ons",
    price: 80,
    credits: 20,
    costPerTryOn: 4.00,
    category: "Individual",
    features: ["20 virtual try-ons", "30-day validity", "Email support"],
    buttonText: "Buy Now",
  },
  {
    id: "pkg_50_credits",
    name: "50 Try-Ons",
    price: 150,
    credits: 50,
    costPerTryOn: 3.00,
    category: "Individual",
    features: ["50 virtual try-ons", "30-day validity", "Email support"],
    buttonText: "Buy Now",
  },
  // Business Plans
  {
    id: "pkg_100_credits",
    name: "100 Try-Ons",
    price: 385,
    credits: 100,
    costPerTryOn: 3.85,
    category: "Business",
    features: ["100 virtual try-ons", "30-day validity", "Priority support"],
    buttonText: "Subscribe Now",
  },
  {
    id: "pkg_200_credits",
    name: "200 Try-Ons",
    price: 750,
    credits: 200,
    costPerTryOn: 3.75,
    category: "Business",
    features: ["200 virtual try-ons", "30-day validity", "Priority support"],
    buttonText: "Subscribe Now",
  },
  {
    id: "pkg_500_credits",
    name: "500 Try-Ons",
    price: 1350,
    credits: 500,
    costPerTryOn: 2.70,
    category: "Business",
    features: ["500 virtual try-ons", "30-day validity", "Priority support"],
    buttonText: "Subscribe Now",
  },
  {
    id: "pkg_1000_credits",
    name: "1000 Try-Ons",
    price: 2200,
    credits: 1000,
    costPerTryOn: 2.20,
    category: "Business",
    features: ["1000 virtual try-ons", "30-day validity", "Priority support"],
    buttonText: "Subscribe Now",
  },
  {
    id: "pkg_5000_credits",
    name: "5000 Try-Ons",
    price: 6250,
    credits: 5000,
    costPerTryOn: 1.25,
    category: "Business",
    features: ["5000 virtual try-ons", "30-day validity", "Priority support"],
    buttonText: "Subscribe Now",
  },
  {
    id: "pkg_20000_credits",
    name: "20000 Try-Ons",
    price: 18600,
    credits: 20000,
    costPerTryOn: 0.93,
    category: "Business",
    features: ["20000 virtual try-ons", "30-day validity", "Priority support"],
    buttonText: "Subscribe Now",
  },
];

export default function PricingPage() {
  const { isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();

  const handlePurchase = (packageId: string) => {
    if (!isAuthenticated) {
      window.location.href = getLoginUrl();
      return;
    }
    setLocation(`/checkout?package=${packageId}`);
  };

  const individualPlans = PRICING_TIERS.filter(p => p.category === "Individual");
  const businessPlans = PRICING_TIERS.filter(p => p.category === "Business");

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navigation />
      <section className="py-20 container mx-auto">
        <h2 className="text-5xl md:text-6xl font-bold mb-16 text-center">PRICING PLANS</h2>

        {/* Individual Plans */}
        <div className="mb-20">
          <h3 className="text-3xl font-bold mb-4">Individual</h3>
          <p className="text-muted-foreground mb-12">Pay-as-you-go plans for personal use</p>
          <div className="grid md:grid-cols-3 gap-8">
            {individualPlans.map((plan) => (
              <Card key={plan.id} className="premium-card hover:shadow-2xl transition-all duration-300 flex flex-col">
                <CardHeader>
                  <div className="text-4xl font-bold text-primary mb-2">R{plan.price}</div>
                  <div className="text-muted-foreground mb-2">{plan.credits} try-ons</div>
                  <div className="text-primary font-semibold">R{plan.costPerTryOn.toFixed(2)}/try-on</div>
                </CardHeader>
                <CardContent className="flex-1 flex flex-col">
                  <ul className="space-y-3 mb-8 flex-1">
                    {plan.features.map((feature, i) => (
                      <li key={i} className="flex items-center gap-3">
                        <Check className="w-4 h-4 text-primary" />
                        <span className="text-sm text-muted-foreground">{feature}</span>
                      </li>
                    ))}
                  </ul>
                  <Button 
                    onClick={() => handlePurchase(plan.id)}
                    className="w-full premium-button bg-primary text-primary-foreground hover:bg-primary/90"
                  >
                    {plan.buttonText}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Business Plans */}
        <div className="mb-20">
          <h3 className="text-3xl font-bold mb-4">Business</h3>
          <p className="text-muted-foreground mb-12">Subscription plans for businesses and retailers</p>
          <div className="grid md:grid-cols-3 gap-8">
            {businessPlans.map((plan) => (
              <Card key={plan.id} className="premium-card hover:shadow-2xl transition-all duration-300 flex flex-col">
                <CardHeader>
                  <div className="text-4xl font-bold text-primary mb-2">R{plan.price.toLocaleString()}</div>
                  <div className="text-muted-foreground mb-2">{plan.credits.toLocaleString()} try-ons</div>
                  <div className="text-primary font-semibold">R{plan.costPerTryOn.toFixed(2)}/try-on</div>
                </CardHeader>
                <CardContent className="flex-1 flex flex-col">
                  <ul className="space-y-3 mb-8 flex-1">
                    {plan.features.map((feature, i) => (
                      <li key={i} className="flex items-center gap-3">
                        <Check className="w-4 h-4 text-primary" />
                        <span className="text-sm text-muted-foreground">{feature}</span>
                      </li>
                    ))}
                  </ul>
                  <Button 
                    onClick={() => handlePurchase(plan.id)}
                    className="w-full premium-button bg-primary text-primary-foreground hover:bg-primary/90"
                  >
                    {plan.buttonText}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* FAQ */}
        <div className="mt-20">
          <h3 className="text-3xl font-bold mb-12 text-center">Frequently Asked Questions</h3>
          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {[
              {
                q: "How long are credits valid?",
                a: "All credits are valid for 30 days from the date of purchase. Unused credits will expire after this period."
              },
              {
                q: "Can I upgrade my plan?",
                a: "Yes, you can purchase additional credits at any time. Your existing credits will not expire when you upgrade."
              },
              {
                q: "What payment methods do you accept?",
                a: "We accept all major credit cards, debit cards, and digital payment methods through our secure Yoko payment gateway."
              },
              {
                q: "Is there a refund policy?",
                a: "Refunds are available within 7 days of purchase if you haven't used your credits. Contact support for assistance."
              }
            ].map((item, i) => (
              <div key={i} className="premium-card p-6 rounded-lg">
                <h4 className="font-bold mb-3 text-primary">{item.q}</h4>
                <p className="text-sm text-muted-foreground">{item.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
