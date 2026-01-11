import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Check } from "lucide-react";
import { useState } from "react";

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
      price: 18600,
      period: "monthly",
      costPerTryOn: 0.93,
    },
  ];

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

  return (
    <section className="py-20 container mx-auto">
      <div className="text-center mb-16">
        <h2 className="text-5xl md:text-6xl font-bold mb-6">SIMPLE PRICING</h2>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
          Flexible subscription plans for both businesses and individuals. All prices in South African Rands (ZAR).
        </p>
      </div>

      {/* Individual Consumer Plans */}
      <div className="mb-20">
        <div className="flex items-center justify-center gap-3 mb-8">
          <h3 className="text-3xl font-bold text-center">FOR INDIVIDUALS</h3>
          <span className="inline-block px-4 py-2 bg-primary/10 text-primary text-sm font-bold rounded-full border border-primary/30">
            Valid for 30 Days
          </span>
        </div>
        <p className="text-center text-muted-foreground mb-8 max-w-2xl mx-auto">
          Try on clothes virtually without owning a business. Cancel anytime and keep your unused try-ons. Perfect for personal shopping and fashion discovery.
        </p>
        <div className="grid md:grid-cols-3 gap-6">
          {individualPlans.map((plan, index) => (
            <Card 
              key={index} 
              className="premium-card rounded-2xl overflow-hidden transition-all duration-300 flex flex-col hover:shadow-xl"
            >
              <CardHeader>
                <CardTitle className="text-3xl font-bold">
                  {plan.tryOns}
                </CardTitle>
                <p className="text-sm text-muted-foreground mt-2">Try-ons</p>
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
                        {plan.tryOns} virtual try-ons
                      </span>
                    </li>
                    <li className="flex items-center gap-3">
                      <Check className="w-5 h-5 text-primary flex-shrink-0" />
                      <span className="text-sm text-muted-foreground">
                        Cancel anytime
                      </span>
                    </li>

                    <li className="flex items-center gap-3">
                      <Check className="w-5 h-5 text-primary flex-shrink-0" />
                      <span className="text-sm text-muted-foreground">
                        Save favorites
                      </span>
                    </li>
                  </ul>
                </div>

                <Button 
                  className="w-full h-12 font-bold text-lg premium-button bg-secondary text-secondary-foreground hover:bg-secondary/90"
                >
                  Buy Now
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Business Plans Divider */}
      <div className="my-16 text-center">
        <div className="inline-block bg-border/20 px-6 py-3 rounded-full">
          <p className="text-sm font-bold uppercase tracking-wider text-muted-foreground">For Businesses</p>
        </div>
      </div>
      <h3 className="text-3xl font-bold mb-8 text-center">BUSINESS SUBSCRIPTIONS</h3>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12" id="business-plans">
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
                      Try-ons valid for 30 days
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
      <Card className="premium-card bg-gradient-to-r from-primary/10 to-secondary/10 border-primary/30 rounded-2xl">
        <CardHeader>
          <CardTitle className="text-2xl">Flexible Billing & No Lock-In</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-8">
            <div className="space-y-4">
              <h4 className="font-bold text-lg flex items-center gap-2">
                <span className="text-primary text-2xl">✓</span>
                Cancel Anytime
              </h4>
              <p className="text-muted-foreground leading-relaxed">
                No long-term contracts or hidden fees. Cancel your subscription whenever you want, instantly.
              </p>
            </div>
            <div className="space-y-4">
              <h4 className="font-bold text-lg flex items-center gap-2">
                <span className="text-primary text-2xl">✓</span>
                Valid for 30 Days
              </h4>
              <p className="text-muted-foreground leading-relaxed">
                All try-ons are valid for 30 days from purchase. Use them within the validity period to maximize your subscription value.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </section>
  );
}
