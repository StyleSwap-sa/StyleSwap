import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Check, Zap, ArrowLeft } from "lucide-react";

export default function Pricing() {
  const { isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();

  const plans = [
    {
      name: "Starter",
      price: "R99",
      credits: 50,
      description: "Perfect for trying out StyleSwap",
      features: [
        "50 virtual try-ons",
        "Access to garment catalog",
        "Basic sharing features",
        "Email support",
        "7-day validity"
      ],
      popular: false
    },
    {
      name: "Professional",
      price: "R299",
      credits: 200,
      description: "Best for regular users",
      features: [
        "200 virtual try-ons",
        "Priority access to new garments",
        "Advanced sharing analytics",
        "Priority email support",
        "30-day validity",
        "Bulk discount on additional credits"
      ],
      popular: true
    },
    {
      name: "Enterprise",
      price: "R999",
      credits: 1000,
      description: "For fashion retailers & businesses",
      features: [
        "1000 virtual try-ons",
        "API access for integration",
        "Custom garment uploads",
        "24/7 priority support",
        "90-day validity",
        "Advanced analytics dashboard",
        "Dedicated account manager"
      ],
      popular: false
    }
  ];

  const handleSelectPlan = (planName: string) => {
    if (!isAuthenticated) {
      window.location.href = getLoginUrl();
    } else {
      // Navigate to checkout or payment page
      alert(`Selected ${planName} plan. Payment integration coming soon!`);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <div className="border-b border-border/20 py-6">
        <div className="container mx-auto flex items-center justify-between">
          <button
            onClick={() => setLocation('/')}
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            Back to Home
          </button>
          <h1 className="text-3xl font-bold">Pricing Plans</h1>
          <div className="w-24" />
        </div>
      </div>

      {/* Hero Section */}
      <div className="py-12 bg-gradient-to-b from-primary/5 to-transparent">
        <div className="container mx-auto text-center space-y-4">
          <h2 className="text-5xl font-bold">Simple, Transparent Pricing</h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Choose the perfect plan for your virtual try-on needs. All plans include access to our full garment catalog and sharing features.
          </p>
        </div>
      </div>

      {/* Pricing Cards */}
      <div className="py-20 container mx-auto">
        <div className="grid md:grid-cols-3 gap-8">
          {plans.map((plan, idx) => (
            <Card
              key={idx}
              className={`premium-card transition-all duration-300 ${
                plan.popular
                  ? "border-primary/50 shadow-2xl scale-105 md:scale-100 md:relative md:z-10"
                  : "hover:shadow-lg"
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground px-4 py-1 rounded-full text-sm font-bold">
                  Most Popular
                </div>
              )}

              <CardHeader>
                <CardTitle className="text-2xl">{plan.name}</CardTitle>
                <p className="text-muted-foreground text-sm mt-2">{plan.description}</p>
              </CardHeader>

              <CardContent className="space-y-6">
                {/* Price */}
                <div>
                  <div className="text-4xl font-bold text-primary">{plan.price}</div>
                  <p className="text-muted-foreground text-sm mt-2">
                    {plan.credits} credits included
                  </p>
                </div>

                {/* Features */}
                <ul className="space-y-3">
                  {plan.features.map((feature, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <Check className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                      <span className="text-sm text-muted-foreground">{feature}</span>
                    </li>
                  ))}
                </ul>

                {/* CTA Button */}
                <Button
                  onClick={() => handleSelectPlan(plan.name)}
                  className={`w-full h-12 font-bold ${
                    plan.popular
                      ? "premium-button bg-primary text-primary-foreground hover:bg-primary/90"
                      : "premium-button bg-secondary text-secondary-foreground hover:bg-secondary/90"
                  }`}
                >
                  <Zap className="w-4 h-4 mr-2" />
                  Get Started
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* FAQ Section */}
      <div className="py-20 bg-secondary/5 border-y border-secondary/20">
        <div className="container mx-auto max-w-3xl">
          <h2 className="text-4xl font-bold text-center mb-12">Frequently Asked Questions</h2>

          <div className="space-y-6">
            {[
              {
                q: "How many credits do I need for one try-on?",
                a: "Each virtual try-on uses 1 credit. You can create as many try-ons as you have credits for."
              },
              {
                q: "Do credits expire?",
                a: "Yes, credits are valid for the duration specified in your plan (7, 30, or 90 days). Unused credits expire after this period."
              },
              {
                q: "Can I upgrade my plan?",
                a: "Yes! You can upgrade to a higher plan at any time. The price difference will be prorated based on your remaining credits."
              },
              {
                q: "Is there a refund policy?",
                a: "We offer a 7-day money-back guarantee if you're not satisfied with StyleSwap. Contact our support team for details."
              },
              {
                q: "Can I use StyleSwap for commercial purposes?",
                a: "Yes! The Enterprise plan includes API access and is designed for retailers and fashion businesses. Contact us for custom solutions."
              },
              {
                q: "What payment methods do you accept?",
                a: "We accept all major credit cards (Visa, Mastercard, American Express) and local payment methods for South African customers."
              }
            ].map((faq, i) => (
              <div key={i} className="premium-card p-6 rounded-lg">
                <h3 className="font-bold text-lg mb-3">{faq.q}</h3>
                <p className="text-muted-foreground">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="py-20 container mx-auto">
        <div className="premium-card bg-gradient-to-r from-primary/10 to-secondary/10 p-12 rounded-2xl text-center space-y-6">
          <h2 className="text-4xl font-bold">Ready to Transform Your Fashion Retail?</h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Start with any plan and upgrade anytime. No hidden fees, no contracts.
          </p>
          <Button
            onClick={() => handleSelectPlan("Starter")}
            className="premium-button bg-primary text-primary-foreground hover:bg-primary/90 h-14 px-8 text-lg inline-flex items-center gap-2"
          >
            <Zap className="w-5 h-5" />
            Start Your Free Trial
          </Button>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-foreground/5 border-t border-border/20 py-12">
        <div className="container mx-auto text-center text-muted-foreground">
          <p>© 2026 StyleSwap. All rights reserved.</p>
          <div className="flex gap-6 justify-center mt-4 text-sm">
            <a href="#" className="hover:text-foreground transition">Privacy Policy</a>
            <a href="#" className="hover:text-foreground transition">Terms of Service</a>
            <a href="#" className="hover:text-foreground transition">Contact Us</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
