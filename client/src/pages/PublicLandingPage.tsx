import { Button } from "@/components/ui/button";
import { ArrowRight, Sparkles, TrendingUp, Users, Zap, Download, Share2, BarChart3, Check } from "lucide-react";
import { getLoginUrl } from "@/const";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function PublicLandingPage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-md border-b border-border/20">
        <div className="container mx-auto py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
              <Sparkles className="w-6 h-6 text-primary-foreground" />
            </div>
            <div className="font-heading font-bold text-2xl tracking-tight">
              Style<span className="text-primary">Swap</span>
            </div>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex gap-8 font-medium text-sm">
            {[
              { label: 'Features', id: 'features' },
              { label: 'How It Works', id: 'how-it-works' },
              { label: 'Pricing', id: 'pricing' },
              { label: 'For Boutiques', id: 'for-boutiques' }
            ].map((item) => (
              <button
                key={item.id}
                onClick={() => scrollToSection(item.id)}
                className="hover:text-primary transition-colors"
              >
                {item.label}
              </button>
            ))}
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? '✕' : '☰'}
          </button>

          {/* Login Button */}
          <a
            href={getLoginUrl()}
            className="hidden md:block"
          >
            <Button variant="outline">Login</Button>
          </a>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-border/20 bg-background">
            <div className="container mx-auto py-4 space-y-3">
              {[
                { label: 'Features', id: 'features' },
                { label: 'How It Works', id: 'how-it-works' },
                { label: 'Pricing', id: 'pricing' },
                { label: 'For Boutiques', id: 'for-boutiques' }
              ].map((item) => (
                <button
                  key={item.id}
                  onClick={() => {
                    scrollToSection(item.id);
                    setMobileMenuOpen(false);
                  }}
                  className="block w-full text-left px-4 py-2 hover:bg-muted rounded-md"
                >
                  {item.label}
                </button>
              ))}
              <a href={getLoginUrl()} className="block">
                <Button variant="outline" className="w-full">Login</Button>
              </a>
            </div>
          </div>
        )}
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 container mx-auto px-4">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-8">
            <div className="inline-block bg-secondary/20 border border-secondary/40 px-4 py-2 rounded-lg font-bold text-sm uppercase tracking-wider text-secondary">
              ✨ AI-Powered Virtual Try-On
            </div>
            <h1 className="text-5xl md:text-6xl font-bold leading-[1.1]">
              Try Clothes <br />
              <span className="text-primary">Before You Buy</span>
            </h1>
            <p className="text-xl text-muted-foreground max-w-lg font-medium leading-relaxed">
              Upload your photo, see how clothes fit on your body with AI-powered virtual try-ons. Get perfect sizing recommendations and read reviews from customers with similar body types.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <a href={getLoginUrl()}>
                <Button className="w-full sm:w-auto h-14 px-8 text-lg">
                  Get Started <ArrowRight className="ml-2" />
                </Button>
              </a>
              <button
                onClick={() => scrollToSection('how-it-works')}
                className="w-full sm:w-auto"
              >
                <Button variant="outline" className="w-full h-14 px-8 text-lg">
                  Learn More
                </Button>
              </button>
            </div>
          </div>

          {/* Hero Image */}
          <div className="relative hidden lg:block">
            <div className="absolute -inset-6 bg-primary/10 rounded-2xl blur-3xl"></div>
            <div className="relative z-10 bg-gradient-to-br from-primary/20 to-secondary/20 rounded-2xl p-8 border border-border/20">
              <div className="bg-muted rounded-lg h-96 flex items-center justify-center">
                <Sparkles className="w-24 h-24 text-muted-foreground/30" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 bg-muted/30 border-y border-border/20">
        <div className="container mx-auto px-4">
          <h2 className="text-4xl md:text-5xl font-bold text-center mb-16">How It Works</h2>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: <Download className="w-8 h-8" />,
                title: "Upload Your Photo",
                description: "Take a full-body photo wearing neutral clothing to get started"
              },
              {
                icon: <Sparkles className="w-8 h-8" />,
                title: "AI Virtual Try-On",
                description: "Our AI generates realistic try-on results in seconds"
              },
              {
                icon: <Check className="w-8 h-8" />,
                title: "Get Size Recommendations",
                description: "See how different sizes fit and read customer reviews"
              }
            ].map((feature, i) => (
              <Card key={i} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="w-14 h-14 bg-primary/20 rounded-lg flex items-center justify-center text-primary mb-4">
                    {feature.icon}
                  </div>
                  <CardTitle>{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="py-20 container mx-auto px-4">
        <h2 className="text-4xl md:text-5xl font-bold text-center mb-16">Why StyleSwap?</h2>
        <div className="grid md:grid-cols-2 gap-12">
          {[
            {
              icon: <TrendingUp className="w-6 h-6" />,
              title: "Reduce Returns",
              description: "Find the perfect size before purchasing, reducing return rates by up to 40%"
            },
            {
              icon: <Users className="w-6 h-6" />,
              title: "Community Reviews",
              description: "Read reviews from customers with similar body types to make informed decisions"
            },
            {
              icon: <Zap className="w-6 h-6" />,
              title: "Instant Results",
              description: "Get AI-powered try-on results in seconds, not days"
            },
            {
              icon: <BarChart3 className="w-6 h-6" />,
              title: "Shop with Confidence",
              description: "Know exactly how clothes will look and fit before you buy"
            }
          ].map((item, i) => (
            <div key={i} className="flex gap-4">
              <div className="w-12 h-12 bg-primary/20 rounded-lg flex items-center justify-center text-primary flex-shrink-0">
                {item.icon}
              </div>
              <div>
                <h3 className="font-bold text-lg mb-2">{item.title}</h3>
                <p className="text-muted-foreground">{item.description}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-20 bg-muted/30 border-y border-border/20">
        <div className="container mx-auto px-4">
          <h2 className="text-4xl md:text-5xl font-bold text-center mb-16">Simple Pricing</h2>
          <div className="grid md:grid-cols-2 gap-8 max-w-2xl mx-auto">
            {[
              {
                name: "Pay Per Try-On",
                price: "$0.99",
                description: "Perfect for occasional shoppers",
                features: ["1 try-on per purchase", "Size recommendations", "Customer reviews"]
              },
              {
                name: "Subscription",
                price: "$9.99",
                description: "Per month, unlimited try-ons",
                features: ["Unlimited try-ons", "Priority support", "Early access to new features"],
                highlighted: true
              }
            ].map((plan, i) => (
              <Card
                key={i}
                className={`${plan.highlighted ? 'border-primary shadow-lg' : ''} hover:shadow-lg transition-shadow`}
              >
                <CardHeader>
                  <CardTitle>{plan.name}</CardTitle>
                  <p className="text-sm text-muted-foreground mt-2">{plan.description}</p>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <span className="text-4xl font-bold">{plan.price}</span>
                    {!plan.price.includes("month") && <span className="text-muted-foreground">/try-on</span>}
                  </div>
                  <ul className="space-y-3">
                    {plan.features.map((feature, j) => (
                      <li key={j} className="flex items-center gap-2">
                        <Check className="w-4 h-4 text-primary" />
                        <span className="text-sm">{feature}</span>
                      </li>
                    ))}
                  </ul>
                  <a href={getLoginUrl()} className="block">
                    <Button className="w-full" variant={plan.highlighted ? "default" : "outline"}>
                      Get Started
                    </Button>
                  </a>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* For Boutiques Section */}
      <section id="for-boutiques" className="py-20 container mx-auto px-4">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-6">
            <h2 className="text-4xl md:text-5xl font-bold">For Fashion Boutiques</h2>
            <p className="text-lg text-muted-foreground">
              Increase sales and reduce returns by offering StyleSwap to your customers. Showcase your products with AI-powered virtual try-ons.
            </p>
            <ul className="space-y-3">
              {[
                "Increase conversion rates by up to 40%",
                "Reduce return rates significantly",
                "Showcase your entire inventory",
                "Get detailed analytics on customer preferences",
                "Build customer loyalty with reviews"
              ].map((item, i) => (
                <li key={i} className="flex items-center gap-3">
                  <Check className="w-5 h-5 text-primary flex-shrink-0" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
            <a href={getLoginUrl()}>
              <Button className="h-12 px-8 text-base">
                Start Your Boutique <ArrowRight className="ml-2" />
              </Button>
            </a>
          </div>
          <div className="relative hidden lg:block">
            <div className="absolute -inset-6 bg-secondary/10 rounded-2xl blur-3xl"></div>
            <div className="relative z-10 bg-gradient-to-br from-secondary/20 to-primary/20 rounded-2xl p-8 border border-border/20">
              <div className="bg-muted rounded-lg h-96 flex items-center justify-center">
                <BarChart3 className="w-24 h-24 text-muted-foreground/30" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-primary text-primary-foreground">
        <div className="container mx-auto px-4 text-center space-y-8">
          <h2 className="text-4xl md:text-5xl font-bold">Ready to Transform Your Shopping?</h2>
          <p className="text-lg max-w-2xl mx-auto opacity-90">
            Join thousands of customers who are shopping smarter with StyleSwap
          </p>
          <a href={getLoginUrl()}>
            <Button className="h-12 px-8 text-base bg-primary-foreground text-primary hover:bg-primary-foreground/90">
              Get Started Now <ArrowRight className="ml-2" />
            </Button>
          </a>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-muted/50 border-t border-border/20 py-12">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Sparkles className="w-5 h-5 text-primary" />
                <span className="font-bold">StyleSwap</span>
              </div>
              <p className="text-sm text-muted-foreground">
                AI-powered virtual try-on for fashion retail
              </p>
            </div>
            <div>
              <h4 className="font-bold mb-4">Product</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><button onClick={() => scrollToSection('features')} className="hover:text-foreground">Features</button></li>
                <li><button onClick={() => scrollToSection('pricing')} className="hover:text-foreground">Pricing</button></li>
                <li><a href={getLoginUrl()} className="hover:text-foreground">Sign In</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold mb-4">For Business</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><button onClick={() => scrollToSection('for-boutiques')} className="hover:text-foreground">Boutiques</button></li>
                <li><a href="#" className="hover:text-foreground">Enterprise</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold mb-4">Legal</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#" className="hover:text-foreground">Privacy</a></li>
                <li><a href="#" className="hover:text-foreground">Terms</a></li>
                <li><a href="#" className="hover:text-foreground">Contact</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-border/20 pt-8 text-center text-sm text-muted-foreground">
            <p>© 2026 StyleSwap. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
