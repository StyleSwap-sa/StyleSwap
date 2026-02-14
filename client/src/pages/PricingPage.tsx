import { useAuth } from "@/_core/hooks/useAuth";
import Navigation from "@/components/Navigation";
import { BusinessPricingComponent } from "@/components/BusinessPricingComponent";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Check } from "lucide-react";
import { useLocation } from "wouter";
import { getLoginUrl } from "@/const";

const INDIVIDUAL_PLANS = [
  {
    id: "pkg_10_credits",
    name: "10 Try-Ons",
    price: 45,
    credits: 10,
    costPerTryOn: 4.50,
    features: ["10 virtual try-ons", "30-day validity", "Email support"],
  },
  {
    id: "pkg_20_credits",
    name: "20 Try-Ons",
    price: 80,
    credits: 20,
    costPerTryOn: 4.00,
    features: ["20 virtual try-ons", "30-day validity", "Email support"],
  },
  {
    id: "pkg_50_credits",
    name: "50 Try-Ons",
    price: 150,
    credits: 50,
    costPerTryOn: 3.00,
    features: ["50 virtual try-ons", "30-day validity", "Email support"],
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
            {INDIVIDUAL_PLANS.map((plan) => (
              <Card key={plan.id} className="premium-card hover:shadow-2xl transition-all duration-300 flex flex-col">
                <CardHeader className="bg-primary text-white pb-4">
                  <div className="text-4xl font-bold mb-2">R{plan.price}</div>
                  <div className="text-sm opacity-90 mb-2">{plan.credits} try-ons</div>
                  <div className="text-sm opacity-90 font-semibold">R{plan.costPerTryOn.toFixed(2)}/try-on</div>
                </CardHeader>
                <CardContent className="flex-1 flex flex-col pt-6 pb-6">
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
                    className="w-full bg-primary text-white hover:bg-primary/90 font-semibold"
                  >
                    Buy Now
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Business Plans - Using BusinessPricingComponent */}
        <div className="mb-20">
          <h3 className="text-3xl font-bold mb-4">Business</h3>
          <p className="text-muted-foreground mb-12">Subscription plans for businesses and retailers</p>
          <BusinessPricingComponent />
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
                a: "We accept all major credit cards, debit cards, and digital payment methods through our secure Yoco payment gateway."
              },
              {
                q: "What is your refund policy?",
                a: "All credit purchases are final and non-refundable. Credits are issued immediately upon successful payment and cannot be returned or exchanged for cash or other services."
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
