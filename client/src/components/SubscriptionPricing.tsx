import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Check } from "lucide-react";

export function SubscriptionPricing() {
  const plans = [
    {
      tryOns: 100,
      price: 385,
      period: "monthly",
      costPerTryOn: 3.85,
    },
    {
      tryOns: 200,
      price: 750,
      period: "monthly",
      costPerTryOn: 3.75,
    },
    {
      tryOns: 500,
      price: 1350,
      period: "monthly",
      costPerTryOn: 2.70,
    },
    {
      tryOns: 1000,
      price: 2200,
      period: "monthly",
      costPerTryOn: 2.20,
      highlighted: true,
    },
    {
      tryOns: 5000,
      price: 6250,
      period: "monthly",
      costPerTryOn: 1.25,
    },
    {
      tryOns: 20000,
      price: 17000,
      period: "monthly",
      costPerTryOn: 0.85,
    },
  ];

  return (
    <section className="py-20 container mx-auto">
      <div className="text-center mb-16">
        <h2 className="text-5xl md:text-6xl font-bold mb-6">SIMPLE PRICING</h2>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
          Flexible subscription plans based on your monthly try-on volume. All prices in South African Rands (ZAR).
        </p>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
        {plans.map((plan, index) => (
          <Card 
            key={index} 
            className={`premium-card rounded-2xl overflow-hidden transition-all duration-300 flex flex-col ${
              plan.highlighted 
                ? 'ring-2 ring-primary shadow-2xl' 
                : 'hover:shadow-xl'
            }`}
          >
            {plan.highlighted && (
              <div className="bg-primary text-primary-foreground py-2 text-center font-bold uppercase text-sm tracking-wider">
                Most Popular
              </div>
            )}
            <CardHeader>
              <CardTitle className="text-3xl font-bold">
                {plan.tryOns.toLocaleString()}
              </CardTitle>
              <p className="text-sm text-muted-foreground mt-2">Try-ons per month</p>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col">
              {/* Price */}
              <div className="mb-6">
                <div className="text-5xl font-bold text-primary mb-1">
                  R{plan.price.toLocaleString()}
                </div>
                <div className="text-sm text-muted-foreground">
                  R{plan.costPerTryOn.toFixed(2)} per try-on
                </div>
              </div>

              {/* Features */}
              <div className="mb-6 flex-1">
                <ul className="space-y-3">
                  <li className="flex items-center gap-3">
                    <Check className="w-5 h-5 text-primary flex-shrink-0" />
                    <span className="text-sm text-muted-foreground">
                      {plan.tryOns.toLocaleString()} virtual try-ons/month
                    </span>
                  </li>
                  <li className="flex items-center gap-3">
                    <Check className="w-5 h-5 text-primary flex-shrink-0" />
                    <span className="text-sm text-muted-foreground">
                      API access & integrations
                    </span>
                  </li>
                  <li className="flex items-center gap-3">
                    <Check className="w-5 h-5 text-primary flex-shrink-0" />
                    <span className="text-sm text-muted-foreground">
                      Analytics dashboard
                    </span>
                  </li>
                  <li className="flex items-center gap-3">
                    <Check className="w-5 h-5 text-primary flex-shrink-0" />
                    <span className="text-sm text-muted-foreground">
                      Email support
                    </span>
                  </li>
                </ul>
              </div>

              <Button 
                className={`w-full h-12 font-bold text-lg ${
                  plan.highlighted
                    ? 'premium-button bg-primary text-primary-foreground hover:bg-primary/90'
                    : 'premium-button bg-foreground/10 text-foreground hover:bg-foreground/20'
                }`}
              >
                Subscribe Now
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Pricing Info */}
      <Card className="premium-card bg-secondary/5 rounded-2xl border-secondary/30">
        <CardHeader>
          <CardTitle>Flexible Billing</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-8">
            <div>
              <h4 className="font-bold mb-2">Monthly Billing</h4>
              <p className="text-sm text-muted-foreground">
                Pay monthly and cancel anytime. Perfect for testing and small-scale operations.
              </p>
            </div>
            <div>
              <h4 className="font-bold mb-2">Annual Discounts</h4>
              <p className="text-sm text-muted-foreground">
                Contact us for annual billing options and volume discounts for enterprise customers.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </section>
  );
}
