import { Button } from "@/components/ui/button";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ArrowRight,
  BarChart3,
  Sparkles,
  Check,
  TrendingUp,
  Users,
  Zap,
  Shield,
  Globe,
} from "lucide-react";
import { Link } from "wouter";
import DemoVideoModal from "@/components/DemoVideoModal";

export default function B2BLanding() {
  const [isDemoOpen, setIsDemoOpen] = useState(false);
  return (
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-md border-b border-border/20">
        <div className="container mx-auto py-4 flex justify-between items-center">
          <Link href="/">
            <div className="flex items-center gap-3 cursor-pointer hover:opacity-80 transition">
              <div className="font-heading font-bold text-2xl tracking-tight">
                Style<span className="text-primary">Swap</span>
              </div>
              <span className="text-xs font-bold bg-primary/20 text-primary px-2 py-1 rounded">
                FOR BUSINESS
              </span>
            </div>
          </Link>
          <div className="hidden md:flex gap-8 font-medium text-sm">
            {["Features", "Pricing", "Benefits", "Contact"].map((item) => (
              <a
                key={item}
                href={`#${item.toLowerCase()}`}
                className="hover:text-primary transition-colors uppercase tracking-wide"
              >
                {item}
              </a>
            ))}
            <Link href="/api-docs" className="hover:text-primary transition-colors uppercase tracking-wide">
              API Docs
            </Link>
            <Link href="/developer" className="hover:text-primary transition-colors uppercase tracking-wide">
              Developer Portal
            </Link>
          </div>
          <Link href="/b2b/signup">
            <Button className="premium-button bg-primary text-primary-foreground hover:bg-primary/90 font-bold cursor-pointer">
              Get Started
            </Button>
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 container mx-auto">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-8">
            <div className="inline-block bg-secondary/20 border border-secondary/40 px-4 py-2 rounded-lg font-bold text-sm uppercase tracking-wider text-secondary">
              ✨ For Boutiques & Retail Stores
            </div>
            <h1 className="text-6xl md:text-7xl font-heading font-bold leading-[0.95]">
              BOOST SALES WITH <br />
              <span className="gradient-accent bg-clip-text text-transparent">
                VIRTUAL TRY-ONS
              </span>
            </h1>
            <p className="text-xl text-muted-foreground max-w-lg font-medium leading-relaxed">
              Let your customers try on clothes virtually before they buy. Reduce
              returns, increase confidence, and grow your online sales with
              StyleSwap's AI-powered try-on technology.
            </p>
            <div className="flex gap-4">
              <Link href="/b2b/signup">
                <Button className="premium-button bg-primary text-primary-foreground hover:bg-primary/90 h-14 px-8 text-lg cursor-pointer">
                  Get Started <ArrowRight className="ml-2" />
                </Button>
              </Link>
              <Button
                onClick={() => setIsDemoOpen(true)}
                variant="outline"
                className="premium-button h-14 px-8 text-lg cursor-pointer"
              >
                Watch Demo
              </Button>
            </div>
          </div>
          <div className="relative">
            <div className="absolute -inset-6 bg-primary/10 rounded-2xl blur-3xl"></div>
            <div className="relative z-10 bg-gradient-to-br from-primary/20 to-secondary/20 rounded-2xl p-8 border border-primary/30">
              <div className="space-y-4">
                <div className="flex items-center gap-3 p-4 bg-background/50 rounded-lg">
                  <Users className="w-6 h-6 text-primary" />
                  <div>
                    <div className="font-bold">Customer Satisfaction</div>
                    <div className="text-sm text-muted-foreground">
                      +85% confidence in fit
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-4 bg-background/50 rounded-lg">
                  <TrendingUp className="w-6 h-6 text-primary" />
                  <div>
                    <div className="font-bold">Conversion Increase</div>
                    <div className="text-sm text-muted-foreground">
                      +40% purchase rate
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-4 bg-background/50 rounded-lg">
                  <Zap className="w-6 h-6 text-primary" />
                  <div>
                    <div className="font-bold">Return Reduction</div>
                    <div className="text-sm text-muted-foreground">
                      -30% returns
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 bg-secondary/5 border-y border-secondary/20">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-5xl md:text-6xl font-bold mb-6">
              POWERFUL FEATURES FOR YOUR BUSINESS
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Everything you need to integrate virtual try-ons into your website
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: <Sparkles className="w-8 h-8" />,
                title: "Easy Integration",
                desc: "Add try-on widget to your website in minutes. No coding required.",
              },
              {
                icon: <BarChart3 className="w-8 h-8" />,
                title: "Real-Time Analytics",
                desc: "Track try-on activity, popular products, and customer insights.",
              },
              {
                icon: <TrendingUp className="w-8 h-8" />,
                title: "Boost Conversions",
                desc: "Customers who try-on are 40% more likely to purchase.",
              },
              {
                icon: <Shield className="w-8 h-8" />,
                title: "Secure & Private",
                desc: "Enterprise-grade security with POPIA compliance.",
              },
              {
                icon: <Users className="w-8 h-8" />,
                title: "Manage Staff",
                desc: "Add team members and control access levels.",
              },
              {
                icon: <Globe className="w-8 h-8" />,
                title: "Custom Domain",
                desc: "Use your own domain for a branded experience.",
              },
            ].map((feature, i) => (
              <Card
                key={i}
                className="premium-card hover:shadow-2xl hover:-translate-y-1 transition-all duration-300"
              >
                <CardHeader>
                  <div className="w-16 h-16 bg-primary/20 rounded-lg flex items-center justify-center mb-4 text-primary">
                    {feature.icon}
                  </div>
                  <CardTitle className="text-2xl">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground leading-relaxed">
                    {feature.desc}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 container mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-5xl md:text-6xl font-bold mb-6">HOW IT WORKS</h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Simple 3-step process to get started
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {[
            {
              step: "1",
              title: "Sign Up",
              desc: "Create your boutique account and upload your product catalog.",
            },
            {
              step: "2",
              title: "Integrate",
              desc: "Add the try-on widget to your website with a simple code snippet.",
            },
            {
              step: "3",
              title: "Grow",
              desc: "Watch your conversion rates increase and returns decrease.",
            },
          ].map((item, i) => (
            <div key={i} className="relative">
              <div className="premium-card p-8 rounded-lg text-center">
                <div className="w-16 h-16 bg-primary text-primary-foreground rounded-full flex items-center justify-center mx-auto mb-6 font-heading font-bold text-2xl">
                  {item.step}
                </div>
                <h3 className="text-2xl font-bold mb-4">{item.title}</h3>
                <p className="text-muted-foreground">{item.desc}</p>
              </div>
              {i < 2 && (
                <div className="hidden md:flex absolute top-1/2 -right-4 transform -translate-y-1/2">
                  <ArrowRight className="w-8 h-8 text-primary" />
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-20 bg-secondary/5 border-y border-secondary/20">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-5xl md:text-6xl font-bold mb-6">
              SIMPLE, TRANSPARENT PRICING
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Pay only for what you use. Volume discounts available.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            {[
              {
                credits: 100,
                price: "R385",
                perCredit: "R3.85",
                color: "from-blue-500/20 to-blue-600/20",
              },
              {
                credits: 500,
                price: "R1,350",
                perCredit: "R2.70",
                color: "from-purple-500/20 to-purple-600/20",
                popular: true,
              },
              {
                credits: 5000,
                price: "R6,250",
                perCredit: "R1.25",
                color: "from-orange-500/20 to-orange-600/20",
              },
            ].map((tier, i) => (
              <Card
                key={i}
                className={`premium-card ${
                  tier.popular
                    ? "border-primary/50 shadow-lg scale-105"
                    : ""
                } bg-gradient-to-br ${tier.color}`}
              >
                <CardHeader>
                  {tier.popular && (
                    <div className="text-xs font-bold bg-primary text-primary-foreground px-3 py-1 rounded-full w-fit mb-4">
                      MOST POPULAR
                    </div>
                  )}
                  <CardTitle className="text-3xl font-bold">
                    {tier.credits.toLocaleString()} Credits
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <div className="text-4xl font-bold mb-2">{tier.price}</div>
                    <div className="text-sm text-muted-foreground">
                      {tier.perCredit} per try-on
                    </div>
                  </div>
                  <ul className="space-y-3">
                    <li className="flex items-center gap-2">
                      <Check className="w-5 h-5 text-primary" />
                      <span>Valid for 30 days</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="w-5 h-5 text-primary" />
                      <span>Full analytics</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="w-5 h-5 text-primary" />
                      <span>24/7 support</span>
                    </li>
                  </ul>
                  <Link href="/b2b/signup">
                    <Button className="w-full cursor-pointer">
                      Get Started
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="mt-12 text-center">
            <p className="text-muted-foreground mb-4">
              Need more credits? Contact our sales team for custom packages.
            </p>
            <a href="mailto:sales@styleswap.co.za">
              <Button variant="outline" className="cursor-pointer">
                Contact Sales
              </Button>
            </a>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section id="benefits" className="py-20 container mx-auto">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-6">
            <h2 className="text-5xl font-bold">WHY BOUTIQUES CHOOSE STYLESWAP</h2>
            <div className="space-y-4">
              {[
                "Increase online sales by up to 40%",
                "Reduce return rates by 30%",
                "Improve customer confidence in fit",
                "Easy integration with existing website",
                "Real-time analytics and insights",
                "Dedicated customer support",
                "POPIA compliant and secure",
                "No setup fees or long-term contracts",
              ].map((benefit, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                    <Check className="w-4 h-4 text-primary" />
                  </div>
                  <span className="font-medium">{benefit}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="relative">
            <div className="absolute -inset-6 bg-primary/10 rounded-2xl blur-3xl"></div>
            <div className="relative z-10 bg-gradient-to-br from-primary/20 to-secondary/20 rounded-2xl p-12 border border-primary/30">
              <div className="space-y-6">
                <div className="text-center">
                  <div className="text-5xl font-bold text-primary mb-2">40%</div>
                  <div className="text-muted-foreground">
                    Average conversion increase
                  </div>
                </div>
                <div className="h-px bg-border"></div>
                <div className="text-center">
                  <div className="text-5xl font-bold text-primary mb-2">30%</div>
                  <div className="text-muted-foreground">
                    Average return reduction
                  </div>
                </div>
                <div className="h-px bg-border"></div>
                <div className="text-center">
                  <div className="text-5xl font-bold text-primary mb-2">1000+</div>
                  <div className="text-muted-foreground">
                    Active boutiques worldwide
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-primary text-primary-foreground">
        <div className="container mx-auto text-center space-y-8">
          <h2 className="text-5xl md:text-6xl font-bold">
            READY TO BOOST YOUR SALES?
          </h2>
          <p className="text-xl max-w-2xl mx-auto opacity-90">
            Join hundreds of boutiques already using StyleSwap to increase
            conversions and reduce returns.
          </p>
          <div className="flex gap-4 justify-center">
            <Link href="/b2b/signup">
              <Button
                className="bg-primary-foreground text-primary hover:bg-primary-foreground/90 h-14 px-8 text-lg font-bold cursor-pointer"
              >
                Get Started <ArrowRight className="ml-2" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section id="contact" className="py-20 container mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-5xl md:text-6xl font-bold mb-6">
            FREQUENTLY ASKED QUESTIONS
          </h2>
        </div>

        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {[
            {
              q: "How long does it take to set up?",
              a: "You can be up and running in less than 5 minutes. Just sign up, add your products, and embed the widget.",
            },
            {
              q: "What payment methods do you accept?",
              a: "We accept all major credit cards, bank transfers, and mobile payment methods.",
            },
            {
              q: "Can I customize the widget?",
              a: "Yes! You can customize colors, branding, and placement to match your website.",
            },
            {
              q: "What if I need more credits?",
              a: "You can purchase additional credits anytime. Volume discounts are available for larger purchases.",
            },
            {
              q: "Is my customer data secure?",
              a: "Yes. We're POPIA compliant with end-to-end encryption and South Africa data residency.",
            },
            {
              q: "Do you offer support?",
              a: "Yes! We provide 24/7 email support and a dedicated account manager for larger accounts.",
            },
          ].map((item, i) => (
            <Card key={i} className="premium-card">
              <CardHeader>
                <CardTitle className="text-lg">{item.q}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">{item.a}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-foreground/5 border-t border-border/20 py-16">
        <div className="container mx-auto">
          <div className="grid md:grid-cols-4 gap-12 mb-12">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <span className="font-heading font-bold text-lg">
                  Style<span className="text-primary">Swap</span>
                </span>
              </div>
              <p className="text-sm text-muted-foreground">
                AI-powered virtual try-on technology for fashion retailers.
              </p>
            </div>
            <div>
              <h4 className="font-bold mb-4">Product</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>
                  <a href="#features" className="hover:text-primary transition">
                    Features
                  </a>
                </li>
                <li>
                  <a href="#pricing" className="hover:text-primary transition">
                    Pricing
                  </a>
                </li>
                <li>
                  <Link href="/api-docs" className="hover:text-primary transition">
                    API Documentation
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold mb-4">Company</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>
                  <a href="/" className="hover:text-primary transition">
                    About
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-primary transition">
                    Blog
                  </a>
                </li>
                <li>
                  <a href="#contact" className="hover:text-primary transition">
                    Contact
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold mb-4">Legal</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>
                  <a href="#" className="hover:text-primary transition">
                    Privacy
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-primary transition">
                    Terms
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-primary transition">
                    POPIA
                  </a>
                </li>
              </ul>
            </div>
          </div>
          <div className="border-t border-border/20 pt-8 flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-muted-foreground">
            <div>© 2026 StyleSwap. All rights reserved.</div>
            <div className="flex gap-6">
              <a href="#" className="hover:text-primary transition">
                Twitter
              </a>
              <a href="#" className="hover:text-primary transition">
                LinkedIn
              </a>
              <a href="#" className="hover:text-primary transition">
                Instagram
              </a>
            </div>
          </div>
        </div>
      </footer>

      {/* Demo Video Modal */}
      <DemoVideoModal
        isOpen={isDemoOpen}
        onClose={() => setIsDemoOpen(false)}
        defaultVideoId="boutique-demo"
      />
    </div>
  );
}
