import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { useLocation } from "wouter";
import { ContactForm } from "@/components/ContactForm";
import { CaseStudies } from "@/components/CaseStudies";
import { SubscriptionPricing } from "@/components/SubscriptionPricing";
import { ROICalculator } from "@/components/ROICalculator";
import { ModelShowcase } from "@/components/ModelShowcase";
import { InteractiveCarousel } from "@/components/InteractiveCarousel";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowRight, BarChart3, Sparkles, Check, Download, Zap, Share2, LogOut } from "lucide-react";
import { useState } from "react";

export default function Home() {
  const { user, loading, isAuthenticated, logout } = useAuth();
  const [, setLocation] = useLocation();
  const [activeSection, setActiveSection] = useState('overview');

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
      setActiveSection(id);
    }
  };

  const handleGetStarted = () => {
    if (isAuthenticated) {
      setLocation('/dashboard');
    } else {
      window.location.href = getLoginUrl();
    }
  };

  const handleTryOn = () => {
    if (isAuthenticated) {
      setLocation('/dashboard?tab=try-on');
    } else {
      window.location.href = getLoginUrl();
    }
  };

  const handleViewDemo = () => {
    if (isAuthenticated) {
      setLocation('/dashboard?tab=catalog');
    } else {
      window.location.href = getLoginUrl();
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-md border-b border-border/20">
        <div className="container mx-auto py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <img src="/images/styleswap-icon.png" alt="StyleSwap" className="w-10 h-10" />
            <div className="font-heading font-bold text-2xl tracking-tight">
              Style<span className="text-primary">Swap</span>
            </div>
          </div>
          <div className="hidden md:flex gap-8 font-medium text-sm">
            {['Overview', 'Technology', 'Market', 'Pricing', 'ROI', 'Case Studies', 'Contact'].map((item) => (
              <button 
                key={item}
                onClick={() => scrollToSection(item.toLowerCase())}
                className="hover:text-primary transition-colors uppercase tracking-wide"
              >
                {item}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-3">
            {isAuthenticated ? (
              <>
                <span className="text-sm font-medium text-muted-foreground">
                  {user?.name}
                </span>
                <Button
                  onClick={() => {
                    logout();
                    setLocation('/');
                  }}
                  variant="outline"
                  className="gap-2"
                >
                  <LogOut className="w-4 h-4" />
                  Logout
                </Button>
              </>
            ) : (
              <>
                <Button
                  onClick={handleGetStarted}
                  className="premium-button bg-primary text-primary-foreground hover:bg-primary/90 font-bold"
                >
                  Get Started <Download className="ml-2 w-4 h-4" />
                </Button>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section id="overview" className="pt-32 pb-20 container mx-auto">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-8">
            <div className="inline-block bg-secondary/20 border border-secondary/40 px-4 py-2 rounded-lg font-bold text-sm uppercase tracking-wider text-secondary">
              ✨ Premium AI Fashion Tech
            </div>
            <h1 className="text-6xl md:text-7xl font-heading font-bold leading-[0.95]">
              THE FUTURE OF <br/>
              <span className="gradient-accent bg-clip-text text-transparent">VIRTUAL FITTING</span>
            </h1>
            <p className="text-xl text-muted-foreground max-w-lg font-medium leading-relaxed">
              Experience the next generation of fashion retail with AI-powered virtual try-ons that transform how customers shop and brands sell.
            </p>
            <div className="flex gap-4">
              <Button 
                onClick={() => scrollToSection('technology')}
                className="premium-button bg-primary text-primary-foreground hover:bg-primary/90 h-14 px-8 text-lg"
              >
                Explore Technology <ArrowRight className="ml-2" />
              </Button>
              <Button 
                onClick={handleViewDemo}
                variant="outline" 
                className="premium-button h-14 px-8 text-lg"
              >
                View Demo
              </Button>
            </div>
          </div>
          <div className="relative">
            <div className="absolute -inset-6 bg-primary/10 rounded-2xl blur-3xl"></div>
            <img 
              src="/images/hero-banner.jpg" 
              alt="Virtual Fitting Room" 
              className="relative z-10 w-full rounded-2xl shadow-2xl border border-border/20"
            />
            <div className="absolute -bottom-8 -left-8 bg-card border border-border/20 p-6 rounded-xl shadow-2xl z-20 max-w-xs premium-card">
              <div className="flex items-center gap-2 mb-3">
                <Zap className="w-5 h-5 text-primary fill-primary" />
                <span className="font-bold uppercase text-sm">Key Insight</span>
              </div>
              <p className="text-sm font-medium text-muted-foreground">
                AI-generated try-ons reduce return rates by up to 40% for fashion retailers.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Marquee */}
      <div className="bg-primary text-primary-foreground py-6 border-y border-primary/30 overflow-hidden whitespace-nowrap">
        <div className="inline-flex animate-marquee">
          {[...Array(8)].map((_, i) => (
            <span key={i} className="mx-12 font-heading font-bold text-xl uppercase flex items-center gap-4">
              VIRTUAL TRY-ON <span className="text-primary-foreground/60">•</span> 
              AI GENERATION <span className="text-primary-foreground/60">•</span> 
              REDUCE RETURNS <span className="text-primary-foreground/60">•</span>
            </span>
          ))}
        </div>
      </div>

      {/* Model Showcase Section */}
      <section id="showcase">
        <ModelShowcase />
      </section>

      {/* Interactive Carousel Section */}
      <section id="demo">
        <InteractiveCarousel />
      </section>

      {/* Technology Section */}
      <section id="technology" className="py-20 container mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-end mb-16 gap-6">
          <div>
            <h2 className="text-5xl md:text-6xl font-bold mb-6">CORE TECHNOLOGY</h2>
            <p className="text-muted-foreground max-w-xl text-lg leading-relaxed">
              StyleSwap leverages cutting-edge Generative Adversarial Networks (GANs) to create hyper-realistic clothing simulations that go far beyond simple 2D overlays.
            </p>
          </div>
          <div className="flex gap-3">
            <div className="w-4 h-4 bg-primary rounded-full"></div>
            <div className="w-4 h-4 bg-secondary rounded-full"></div>
            <div className="w-4 h-4 bg-foreground/20 rounded-full"></div>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-8 mb-16">
          {[
            {
              title: "Generative AI",
              icon: <Sparkles className="w-8 h-8" />,
              desc: "Uses StyleGAN and CycleGAN to generate synthetic images that capture fabric texture, shadows, and folds with photorealistic accuracy."
            },
            {
              title: "Pose Estimation",
              icon: <Zap className="w-8 h-8" />,
              desc: "Algorithms like OpenPose detect key body points to map the user's unique physique and posture in 3D space."
            },
            {
              title: "Neural Rendering",
              icon: <BarChart3 className="w-8 h-8" />,
              desc: "Simulates physical fabric properties including draping, stretch, and light reflection for natural-looking fit."
            }
          ].map((card, i) => (
            <Card key={i} className="premium-card hover:shadow-2xl hover:-translate-y-1 transition-all duration-300">
              <CardHeader>
                <div className="w-16 h-16 bg-primary/20 rounded-lg flex items-center justify-center mb-4 text-primary">
                  {card.icon}
                </div>
                <CardTitle className="text-2xl">{card.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground leading-relaxed">
                  {card.desc}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div className="order-2 lg:order-1">
            <img 
              src="/images/tech-visualization.jpg" 
              alt="Tech Visualization" 
              className="w-full rounded-2xl shadow-2xl border border-border/20"
            />
          </div>
          <div className="order-1 lg:order-2 space-y-6">
            <h3 className="text-4xl font-bold">THE WORKFLOW</h3>
            <ul className="space-y-4">
              {[
                "User uploads a full-body photo",
                "AI analyzes body shape and posture",
                "Garment is segmented and mapped to body mesh",
                "Neural rendering applies fabric physics",
                "Final HD image generated in < 15 seconds"
              ].map((step, i) => (
                <li key={i} className="flex items-center gap-4 p-4 premium-card rounded-lg">
                  <span className="font-heading font-bold text-xl text-primary">0{i+1}</span>
                  <span className="font-medium text-muted-foreground">{step}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* Market Data Section */}
      <section id="market" className="py-20 bg-secondary/5 border-y border-secondary/20">
        <div className="container mx-auto">
          <h2 className="text-5xl md:text-6xl font-bold mb-16 text-center">MARKET INTELLIGENCE</h2>
          
          <div className="grid lg:grid-cols-2 gap-8 mb-12">
            <Card className="premium-card">
              <CardHeader>
                <CardTitle>Market Growth</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">The virtual try-on market is experiencing exponential growth with a projected CAGR of 36.9% through 2032.</p>
              </CardContent>
            </Card>
            <div className="grid gap-8">
              <Card className="premium-card bg-gradient-to-br from-primary/10 to-secondary/10 border-primary/30">
                <CardHeader>
                  <CardTitle className="text-2xl">KEY OPPORTUNITY</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-lg font-medium leading-relaxed text-muted-foreground">
                    The virtual try-on market is projected to reach <span className="text-primary font-bold">R630 billion by 2032</span>. StyleSwap's low entry cost allows small retailers to capture this growth without enterprise-level investment.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>

          <div className="grid md:grid-cols-4 gap-6">
            {[
              { label: "Market CAGR", value: "36.9%" },
              { label: "Conversion Lift", value: "+40%" },
              { label: "Return Reduction", value: "-30%" },
              { label: "Photo Cost Savings", value: "80%" }
            ].map((stat, i) => (
              <div key={i} className="premium-card p-6 text-center rounded-lg">
                <div className="text-4xl font-heading font-bold text-primary mb-2">{stat.value}</div>
                <div className="text-sm font-bold uppercase tracking-wider text-muted-foreground">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-20 container mx-auto">
        <h2 className="text-5xl md:text-6xl font-bold mb-16 text-center">COMPETITIVE ADVANTAGE</h2>
        
        <div className="grid lg:grid-cols-2 gap-12 items-center mb-16">
          <div className="space-y-6">
            <h3 className="text-3xl font-bold">COST EFFICIENCY</h3>
            <p className="text-lg text-muted-foreground leading-relaxed">
              StyleSwap offers a significant price advantage over AR-based competitors. With a pay-as-you-go model starting at just R0.85 per try-on, it enables high-margin resale opportunities for retailers.
            </p>
            <ul className="space-y-3">
              {[
                "No monthly minimums for API access",
                "Volume discounts for high-traffic retailers",
                "Dual-use: Consumer try-on + Catalog photography",
                "Lower infrastructure costs (no 3D asset creation needed)"
              ].map((item, i) => (
                <li key={i} className="flex items-center gap-3">
                  <div className="bg-primary/20 rounded-full p-1">
                    <Check className="w-4 h-4 text-primary" />
                  </div>
                  <span className="font-medium text-muted-foreground">{item}</span>
                </li>
              ))}
            </ul>
          </div>
          <Card className="premium-card">
            <CardHeader>
              <CardTitle>Pricing Comparison</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">StyleSwap's pricing is significantly more competitive than traditional AR solutions.</p>
            </CardContent>
          </Card>
        </div>

        <div className="premium-card bg-gradient-to-r from-primary/5 to-secondary/5 p-12 rounded-2xl border-primary/30">
          <div className="flex flex-col md:flex-row justify-between items-center gap-8">
            <div>
              <h3 className="text-3xl font-bold mb-4 text-primary">READY TO TRANSFORM?</h3>
              <p className="text-lg max-w-xl text-muted-foreground leading-relaxed">
                Join the future of fashion retail. StyleSwap makes it accessible for businesses of all sizes.
              </p>
            </div>
            <div className="flex gap-4">
              <Button 
                onClick={handleGetStarted}
                className="premium-button bg-primary text-primary-foreground hover:bg-primary/90 h-14 px-8 text-lg"
              >
                Get Started Now
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Subscription Pricing Section */}
      <section id="pricing-tiers">
        <SubscriptionPricing />
      </section>

      {/* ROI Calculator Section */}
      <section id="roi">
        <ROICalculator />
      </section>

      {/* Case Studies Section */}
      <section id="case-studies">
        <CaseStudies />
      </section>

      {/* Contact Section */}
      <section id="contact">
        <ContactForm />
      </section>

      {/* Footer */}
      <footer className="bg-foreground/5 border-t border-border/20 py-16">
        <div className="container mx-auto">
          <div className="grid md:grid-cols-4 gap-12 mb-12">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <img src="/images/styleswap-icon.png" alt="StyleSwap" className="w-8 h-8" />
                <span className="font-heading font-bold text-lg">Style<span className="text-primary">Swap</span></span>
              </div>
              <p className="text-sm text-muted-foreground">
                Premium AI-powered virtual fitting room technology for modern fashion retail.
              </p>
            </div>
            <div>
              <h4 className="font-bold mb-4">Product</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><button onClick={() => scrollToSection('pricing-tiers')} className="hover:text-primary transition">Pricing</button></li>
                <li><button onClick={() => scrollToSection('roi')} className="hover:text-primary transition">ROI Calculator</button></li>
                <li><button onClick={() => scrollToSection('case-studies')} className="hover:text-primary transition">Case Studies</button></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold mb-4">Company</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><button onClick={() => scrollToSection('overview')} className="hover:text-primary transition">About</button></li>
                <li><a href="#" className="hover:text-primary transition">Blog</a></li>
                <li><button onClick={() => scrollToSection('contact')} className="hover:text-primary transition">Contact</button></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold mb-4">Connect</h4>
              <div className="flex gap-4">
                <button className="hover:text-primary transition">
                  <Share2 className="w-5 h-5" />
                </button>
                <button className="hover:text-primary transition">
                  <BarChart3 className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
          <div className="border-t border-border/20 pt-8 flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-muted-foreground">
            <div>© 2026 StyleSwap. All rights reserved.</div>
            <div className="flex gap-6">
              <a href="#" className="hover:text-primary transition">Privacy</a>
              <a href="#" className="hover:text-primary transition">Terms</a>
              <a href="#" className="hover:text-primary transition">Cookies</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
