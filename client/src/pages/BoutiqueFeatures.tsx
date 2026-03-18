import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  ShoppingBag, 
  TrendingUp, 
  Users, 
  Zap, 
  BarChart3, 
  Share2, 
  Lock, 
  Smartphone,
  DollarSign,
  CheckCircle2,
  ArrowRight
} from "lucide-react";
import { Link } from "wouter";
import { LeadCaptureForm } from "@/components/LeadCaptureForm";
import { TestimonialsSection } from "@/components/TestimonialsSection";
import { ChatWidget } from "@/components/ChatWidget";

export default function BoutiqueFeatures() {
  const features = [
    {
      icon: <Smartphone className="w-8 h-8" />,
      title: "Virtual Try-On Technology",
      description: "AI-powered virtual fitting room that generates photorealistic try-on images in seconds",
      benefits: ["40% reduction in returns", "35-40% increase in conversions", "Instant results"]
    },
    {
      icon: <ShoppingBag className="w-8 h-8" />,
      title: "Landing Page Generator",
      description: "Professional, customizable boutique landing page with no coding required",
      benefits: ["SEO optimized", "Mobile responsive", "Brand customization"]
    },
    {
      icon: <BarChart3 className="w-8 h-8" />,
      title: "Product Management",
      description: "Centralized product catalog with easy uploads and inventory tracking",
      benefits: ["Bulk uploads", "Real-time updates", "Category organization"]
    },
    {
      icon: <DollarSign className="w-8 h-8" />,
      title: "Credit-Based Pricing",
      description: "Pay only for what you use with flexible, scalable credit system",
      benefits: ["No monthly minimums", "Volume discounts", "Transparent pricing"]
    },
    {
      icon: <TrendingUp className="w-8 h-8" />,
      title: "Analytics Dashboard",
      description: "Real-time metrics showing try-on volume, engagement, and revenue impact",
      benefits: ["Usage tracking", "Performance insights", "ROI measurement"]
    },
    {
      icon: <Users className="w-8 h-8" />,
      title: "Staff Management",
      description: "Add team members with different permission levels and track changes",
      benefits: ["Team collaboration", "Access control", "Accountability"]
    },
    {
      icon: <Share2 className="w-8 h-8" />,
      title: "Social Media Integration",
      description: "One-click sharing of try-on results to Instagram, TikTok, Twitter, and more",
      benefits: ["Viral potential", "User-generated content", "Brand awareness"]
    },
    {
      icon: <Lock className="w-8 h-8" />,
      title: "Security & Compliance",
      description: "Enterprise-grade security with GDPR and POPIA compliance",
      benefits: ["Data encryption", "Privacy protection", "Regular audits"]
    }
  ];

  const pricingTiers = [
    { price: "R385", credits: "100 try-ons", perTryOn: "R3.85/try-on" },
    { price: "R750", credits: "200 try-ons", perTryOn: "R3.75/try-on" },
    { price: "R1,350", credits: "500 try-ons", perTryOn: "R2.70/try-on" },
    { price: "R2,200", credits: "1,000 try-ons", perTryOn: "R2.20/try-on" },
    { price: "R6,250", credits: "5,000 try-ons", perTryOn: "R1.25/try-on" },
    { price: "R18,600", credits: "20,000 try-ons", perTryOn: "R0.93/try-on" }
  ];

  const benefits = [
    {
      title: "Reduce Returns",
      description: "40% reduction in return rates by showing customers exactly how clothes fit",
      icon: "📉"
    },
    {
      title: "Increase Sales",
      description: "35-40% increase in conversion rates and 25-30% higher average order value",
      icon: "📈"
    },
    {
      title: "Save Costs",
      description: "80% reduction in photography costs by using try-on results as product images",
      icon: "💰"
    },
    {
      title: "Build Loyalty",
      description: "Unique experience builds customer loyalty and increases repeat purchases",
      icon: "❤️"
    },
    {
      title: "Gain Insights",
      description: "Understand which products customers love through detailed analytics",
      icon: "📊"
    },
    {
      title: "Go Social",
      description: "Viral potential as customers share try-on results on social media",
      icon: "🚀"
    }
  ];

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Hero Section */}
      <section className="py-20 px-4 bg-gradient-to-br from-primary/10 to-secondary/10 border-b border-border">
        <div className="max-w-6xl mx-auto">
          <div className="text-center space-y-6">
            <h1 className="text-5xl md:text-6xl font-bold tracking-tight">
              Transform Your Boutique with <span className="text-primary">StyleSwap</span>
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              AI-powered virtual fitting room technology designed specifically for fashion boutiques. Reduce returns, increase sales, and delight your customers.
            </p>
          </div>
        </div>
      </section>

      {/* Key Benefits */}
      <section className="py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-4xl font-bold text-center mb-16">Why Boutiques Choose StyleSwap</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {benefits.map((benefit, i) => (
              <Card key={i} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="text-4xl mb-4">{benefit.icon}</div>
                  <CardTitle>{benefit.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">{benefit.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Core Features */}
      <section className="py-20 px-4 bg-muted/30">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-4xl font-bold text-center mb-16">Powerful Features</h2>
          <div className="grid md:grid-cols-2 gap-8">
            {features.map((feature, i) => (
              <Card key={i} className="hover:shadow-lg transition-all hover:-translate-y-1">
                <CardHeader>
                  <div className="flex items-start gap-4">
                    <div className="text-primary bg-primary/10 p-3 rounded-lg">
                      {feature.icon}
                    </div>
                    <CardTitle className="text-xl">{feature.title}</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-muted-foreground">{feature.description}</p>
                  <ul className="space-y-2">
                    {feature.benefits.map((benefit, j) => (
                      <li key={j} className="flex items-center gap-2 text-sm">
                        <CheckCircle2 className="w-4 h-4 text-primary flex-shrink-0" />
                        <span>{benefit}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-4xl font-bold text-center mb-4">Simple, Transparent Pricing</h2>
          <p className="text-center text-muted-foreground mb-16 max-w-2xl mx-auto">
            No monthly minimums. No hidden fees. Pay only for what you use.
          </p>
          <div className="grid md:grid-cols-3 gap-8">
            {pricingTiers.map((tier, i) => (
              <Card key={i} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="text-3xl font-bold">{tier.price}</div>
                  <div className="text-sm text-muted-foreground mt-2">{tier.credits}</div>
                  <div className="text-sm text-primary font-semibold mt-2">{tier.perTryOn}</div>
                </CardHeader>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Success Metrics */}
      <section className="py-20 px-4 bg-primary/5 border-y border-border">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-4xl font-bold text-center mb-16">Proven Results</h2>
          <div className="grid md:grid-cols-4 gap-8">
            {[
              { label: "Return Reduction", value: "-40%" },
              { label: "Conversion Lift", value: "+35-40%" },
              { label: "Photography Savings", value: "80%" },
              { label: "Active Boutiques", value: "50+" }
            ].map((stat, i) => (
              <div key={i} className="text-center">
                <div className="text-4xl font-bold text-primary mb-2">{stat.value}</div>
                <div className="text-muted-foreground">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-20 px-4">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-4xl font-bold text-center mb-16">Frequently Asked Questions</h2>
          <div className="space-y-6">
            {[
              {
                q: "How does the credit system work?",
                a: "Each try-on generation consumes one credit. Credits are purchased in bulk with volume discounts. Credits are valid for 30 days from purchase."
              },
              {
                q: "What's included in the landing page?",
                a: "Your custom landing page includes your boutique info, product showcase, virtual try-on demo, social media links, and contact information."
              },
              {
                q: "Can I manage multiple staff members?",
                a: "Yes! Add team members with different permission levels (Admin, Manager, Viewer) and track all changes."
              },
              {
                q: "Is my customer data secure?",
                a: "Absolutely. We use enterprise-grade encryption, comply with GDPR and POPIA, and automatically delete customer photos after processing."
              },
              {
                q: "How long does onboarding take?",
                a: "You can be up and running in under 30 minutes. Our team provides step-by-step guidance and video tutorials."
              },
              {
                q: "What if I need help?",
                a: "We offer email support, video tutorials, and a dedicated onboarding specialist for your boutique."
              }
            ].map((faq, i) => (
              <Card key={i}>
                <CardHeader>
                  <CardTitle className="text-lg">{faq.q}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">{faq.a}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 bg-gradient-to-r from-primary/10 to-secondary/10 border-t border-border">
        <div className="max-w-4xl mx-auto text-center space-y-8">
          <h2 className="text-4xl font-bold">Ready to Transform Your Boutique?</h2>
          <p className="text-xl text-muted-foreground">
            Join 50+ boutiques already using StyleSwap to reduce returns and increase sales.
          </p>
          <p className="text-sm text-muted-foreground">
            Contact us to learn more about our platform and pricing options.
          </p>
        </div>
      </section>

      {/* Onboarding CTA */}
      <section className="py-16 px-4 bg-gradient-to-r from-primary/10 to-secondary/10 border-y border-primary/20">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Ready to Get Started?</h2>
          <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
            Join hundreds of boutiques already using StyleSwap. Complete onboarding in 5 minutes and start generating virtual try-ons.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/onboarding">
              <Button size="lg" className="bg-primary hover:bg-primary/90">
                <ArrowRight className="mr-2 w-5 h-5" />
                Start Onboarding
              </Button>
            </Link>
            <Link href="/api-docs">
              <Button size="lg" variant="outline">
                View API Docs
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer CTA */}
      <section className="py-12 px-4 bg-muted/50 border-t border-border">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-3 gap-8 text-center">
            <div>
              <Zap className="w-8 h-8 text-primary mx-auto mb-4" />
              <h3 className="font-semibold mb-2">Fast Setup</h3>
              <p className="text-sm text-muted-foreground">Get started in under 30 minutes</p>
            </div>
            <div>
              <Lock className="w-8 h-8 text-primary mx-auto mb-4" />
              <h3 className="font-semibold mb-2">Secure & Compliant</h3>
              <p className="text-sm text-muted-foreground">GDPR & POPIA compliant</p>
            </div>
            <div>
              <Users className="w-8 h-8 text-primary mx-auto mb-4" />
              <h3 className="font-semibold mb-2">Expert Support</h3>
              <p className="text-sm text-muted-foreground">Dedicated support team</p>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <TestimonialsSection />

      {/* Lead Capture Section */}
      <section className="py-16 bg-background">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">Ready to Get Started?</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Join our growing community of successful boutiques. Fill out the form below and our team will contact you with personalized pricing and a demo.
            </p>
          </div>
          <div className="flex justify-center">
            <LeadCaptureForm />
          </div>
        </div>
      </section>

      {/* Chat Widget */}
      <ChatWidget />
    </div>
  );
}
