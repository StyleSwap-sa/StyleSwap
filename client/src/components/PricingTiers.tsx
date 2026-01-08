import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Check, TrendingUp } from "lucide-react";

export function PricingTiers() {
  const tiers = [
    {
      name: "Starter",
      description: "Perfect for boutiques and small retailers",
      monthlyTryOns: 1000,
      fitRoomCost: 35, // R0.035 per try-on × 1000
      yourPrice: 50, // R0.05 per try-on
      yourProfit: 15,
      profitMargin: 42.9,
      features: [
        "Up to 1,000 virtual try-ons/month",
        "Basic analytics dashboard",
        "Email support",
        "Standard API access",
        "Monthly billing"
      ],
      highlighted: false
    },
    {
      name: "Growth",
      description: "For growing fashion e-commerce businesses",
      monthlyTryOns: 5000,
      fitRoomCost: 150, // R0.03 per try-on × 5000 (volume discount)
      yourPrice: 225, // R0.045 per try-on
      yourProfit: 75,
      profitMargin: 50,
      features: [
        "Up to 5,000 virtual try-ons/month",
        "Advanced analytics & insights",
        "Priority email & chat support",
        "Custom branding options",
        "API webhooks & integrations",
        "Monthly or annual billing"
      ],
      highlighted: true
    },
    {
      name: "Enterprise",
      description: "For luxury brands and high-volume retailers",
      monthlyTryOns: 20000,
      fitRoomCost: 500, // R0.025 per try-on × 20000 (volume discount)
      yourPrice: 900, // R0.045 per try-on
      yourProfit: 400,
      profitMargin: 44.4,
      features: [
        "Up to 20,000 virtual try-ons/month",
        "Custom analytics & reporting",
        "24/7 dedicated support",
        "White-label solutions",
        "Advanced API features",
        "Custom integrations",
        "Annual billing with discount"
      ],
      highlighted: false
    }
  ];

  return (
    <section className="py-20 container mx-auto">
      <div className="text-center mb-16">
        <h2 className="text-5xl md:text-6xl font-bold mb-6">PRICING TIERS</h2>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
          Flexible pricing based on your try-on volume. All prices in South African Rands (ZAR). Includes your profit margin.
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-8 mb-12">
        {tiers.map((tier, index) => (
          <Card 
            key={index} 
            className={`premium-card rounded-2xl overflow-hidden transition-all duration-300 flex flex-col ${
              tier.highlighted 
                ? 'ring-2 ring-primary shadow-2xl scale-105 md:scale-100' 
                : 'hover:shadow-xl'
            }`}
          >
            {tier.highlighted && (
              <div className="bg-primary text-primary-foreground py-2 text-center font-bold uppercase text-sm tracking-wider">
                Most Popular
              </div>
            )}
            <CardHeader>
              <CardTitle className="text-3xl">{tier.name}</CardTitle>
              <p className="text-sm text-muted-foreground mt-2">{tier.description}</p>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col">
              {/* Volume */}
              <div className="mb-6 p-4 bg-secondary/10 rounded-lg border border-secondary/20">
                <div className="text-sm text-muted-foreground mb-1">Monthly Try-Ons</div>
                <div className="text-3xl font-bold text-secondary">{tier.monthlyTryOns.toLocaleString()}</div>
              </div>

              {/* Cost Breakdown */}
              <div className="mb-6 space-y-3">
                <div className="flex justify-between items-center pb-3 border-b border-border/20">
                  <span className="text-muted-foreground">Fitroom AI Cost</span>
                  <span className="font-bold">R{tier.fitRoomCost.toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center pb-3 border-b border-border/20">
                  <span className="text-muted-foreground">Your Revenue</span>
                  <span className="font-bold">R{tier.yourPrice.toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center pt-2 bg-primary/10 p-3 rounded-lg">
                  <span className="font-bold">Your Profit</span>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-primary">R{tier.yourProfit.toLocaleString()}</div>
                    <div className="text-xs text-primary/80">{tier.profitMargin.toFixed(1)}% margin</div>
                  </div>
                </div>
              </div>

              {/* Features */}
              <div className="mb-6 flex-1">
                <h4 className="font-bold text-sm uppercase tracking-wide mb-4">Includes</h4>
                <ul className="space-y-3">
                  {tier.features.map((feature, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <Check className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                      <span className="text-sm text-muted-foreground">{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <Button 
                className={`w-full h-12 font-bold text-lg ${
                  tier.highlighted
                    ? 'premium-button bg-primary text-primary-foreground hover:bg-primary/90'
                    : 'premium-button bg-foreground/10 text-foreground hover:bg-foreground/20'
                }`}
              >
                Get Started
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Pricing Notes */}
      <Card className="premium-card bg-secondary/5 rounded-2xl border-secondary/30">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-primary" />
            How It Works
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-3 gap-8">
            <div>
              <h4 className="font-bold mb-2">1. Volume Pricing</h4>
              <p className="text-sm text-muted-foreground">
                The more try-ons you process, the lower your per-unit cost from Fitroom AI due to volume discounts.
              </p>
            </div>
            <div>
              <h4 className="font-bold mb-2">2. Your Markup</h4>
              <p className="text-sm text-muted-foreground">
                Set your own pricing and keep the difference as profit. Typical margins range from 40-50%.
              </p>
            </div>
            <div>
              <h4 className="font-bold mb-2">3. Scale Earnings</h4>
              <p className="text-sm text-muted-foreground">
                As your customer base grows, your profit per try-on increases while maintaining competitive pricing.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </section>
  );
}
