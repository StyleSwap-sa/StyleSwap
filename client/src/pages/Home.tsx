import { FeatureComparisonChart, MarketGrowthChart, PricingComparisonChart } from "@/components/Charts";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowRight, BarChart3, Box, Check, Download, Layers, Share2, Zap } from "lucide-react";
import { useState } from "react";

export default function Home() {
  const [activeSection, setActiveSection] = useState('overview');

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
      setActiveSection(id);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b-2 border-border">
        <div className="container mx-auto py-4 flex justify-between items-center">
          <div className="font-heading font-bold text-2xl tracking-tighter flex items-center gap-2">
            <div className="w-8 h-8 bg-primary border-2 border-border flex items-center justify-center">
              <Box className="w-5 h-5 text-primary-foreground" />
            </div>
            FITROOM<span className="text-primary">.AI</span>
          </div>
          <div className="hidden md:flex gap-6 font-medium">
            {['Overview', 'Technology', 'Market', 'Pricing'].map((item) => (
              <button 
                key={item}
                onClick={() => scrollToSection(item.toLowerCase())}
                className="hover:text-primary transition-colors uppercase text-sm tracking-wide"
              >
                {item}
              </button>
            ))}
          </div>
          <Button className="neo-button bg-primary text-primary-foreground hover:bg-primary/90 font-bold">
            Download Report <Download className="ml-2 w-4 h-4" />
          </Button>
        </div>
      </nav>

      {/* Hero Section */}
      <section id="overview" className="pt-32 pb-20 container mx-auto">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-8">
            <div className="inline-block bg-secondary border-2 border-border px-4 py-1 font-bold text-sm uppercase tracking-wider shadow-[4px_4px_0px_0px_var(--color-border)]">
              Research Report 2026
            </div>
            <h1 className="text-6xl md:text-7xl font-heading font-bold leading-[0.9]">
              THE FUTURE OF <br/>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary">VIRTUAL FITTING</span>
            </h1>
            <p className="text-xl text-muted-foreground max-w-lg font-medium">
              A comprehensive analysis of Fitroom AI as a supplier for next-generation fashion retail businesses.
            </p>
            <div className="flex gap-4">
              <Button 
                onClick={() => scrollToSection('technology')}
                className="neo-button bg-foreground text-background hover:bg-foreground/90 h-14 px-8 text-lg"
              >
                Explore Analysis <ArrowRight className="ml-2" />
              </Button>
              <Button variant="outline" className="neo-button bg-background h-14 px-8 text-lg">
                View Demo
              </Button>
            </div>
          </div>
          <div className="relative">
            <div className="absolute -inset-4 bg-primary/20 border-2 border-border z-0 translate-x-4 translate-y-4"></div>
            <img 
              src="/images/hero-banner.jpg" 
              alt="Virtual Fitting Room" 
              className="relative z-10 w-full border-2 border-border shadow-[8px_8px_0px_0px_var(--color-border)]"
            />
            <div className="absolute -bottom-8 -left-8 bg-background border-2 border-border p-4 shadow-[4px_4px_0px_0px_var(--color-border)] z-20 max-w-xs">
              <div className="flex items-center gap-2 mb-2">
                <Zap className="w-5 h-5 text-primary fill-primary" />
                <span className="font-bold uppercase">Key Insight</span>
              </div>
              <p className="text-sm font-medium">AI-generated try-ons reduce return rates by up to 40% for fashion retailers.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Marquee */}
      <div className="bg-foreground text-background py-4 border-y-2 border-border overflow-hidden whitespace-nowrap">
        <div className="inline-flex animate-marquee">
          {[...Array(10)].map((_, i) => (
            <span key={i} className="mx-8 font-heading font-bold text-2xl uppercase flex items-center gap-4">
              VIRTUAL TRY-ON <span className="text-primary">★</span> 
              AI GENERATION <span className="text-primary">★</span> 
              REDUCE RETURNS <span className="text-primary">★</span>
            </span>
          ))}
        </div>
      </div>

      {/* Technology Section */}
      <section id="technology" className="py-20 container mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-end mb-12 gap-6">
          <div>
            <h2 className="text-4xl md:text-5xl font-bold mb-4">CORE TECHNOLOGY</h2>
            <p className="text-muted-foreground max-w-xl text-lg">
              Fitroom AI leverages Generative Adversarial Networks (GANs) to create hyper-realistic clothing simulations, moving beyond simple 2D overlays.
            </p>
          </div>
          <div className="flex gap-2">
            <div className="w-3 h-3 bg-primary border border-border"></div>
            <div className="w-3 h-3 bg-secondary border border-border"></div>
            <div className="w-3 h-3 bg-foreground border border-border"></div>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {[
            {
              title: "Generative AI",
              icon: <Zap className="w-8 h-8" />,
              desc: "Uses StyleGAN and CycleGAN to generate synthetic images that capture fabric texture, shadows, and folds with photorealistic accuracy."
            },
            {
              title: "Pose Estimation",
              icon: <Layers className="w-8 h-8" />,
              desc: "Algorithms like OpenPose detect key body points to map the user's unique physique and posture in 3D space."
            },
            {
              title: "Neural Rendering",
              icon: <Box className="w-8 h-8" />,
              desc: "Simulates physical fabric properties including draping, stretch, and light reflection for natural-looking fit."
            }
          ].map((card, i) => (
            <Card key={i} className="neo-card hover:-translate-y-2 transition-transform duration-300">
              <CardHeader>
                <div className="w-16 h-16 bg-secondary border-2 border-border flex items-center justify-center mb-4 shadow-[4px_4px_0px_0px_var(--color-border)]">
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

        <div className="mt-16 grid lg:grid-cols-2 gap-12 items-center">
          <div className="order-2 lg:order-1">
            <img 
              src="/images/tech-visualization.jpg" 
              alt="Tech Visualization" 
              className="w-full border-2 border-border shadow-[8px_8px_0px_0px_var(--color-border)]"
            />
          </div>
          <div className="order-1 lg:order-2 space-y-6">
            <h3 className="text-3xl font-bold">THE WORKFLOW</h3>
            <ul className="space-y-4">
              {[
                "User uploads a full-body photo",
                "AI analyzes body shape and posture",
                "Garment is segmented and mapped to body mesh",
                "Neural rendering applies fabric physics",
                "Final HD image generated in < 15 seconds"
              ].map((step, i) => (
                <li key={i} className="flex items-center gap-4 p-4 border-2 border-border bg-background shadow-[4px_4px_0px_0px_var(--color-border)]">
                  <span className="font-heading font-bold text-xl text-primary">0{i+1}</span>
                  <span className="font-medium">{step}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* Market Data Section */}
      <section id="market" className="py-20 bg-secondary/20 border-y-2 border-border">
        <div className="container mx-auto">
          <h2 className="text-4xl md:text-5xl font-bold mb-12 text-center">MARKET INTELLIGENCE</h2>
          
          <div className="grid lg:grid-cols-2 gap-8 mb-12">
            <MarketGrowthChart />
            <div className="grid gap-8">
              <FeatureComparisonChart />
              <Card className="neo-card bg-primary text-primary-foreground">
                <CardHeader>
                  <CardTitle className="text-2xl">KEY OPPORTUNITY</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-lg font-medium leading-relaxed">
                    The virtual try-on market is projected to reach <span className="bg-background text-foreground px-2 border border-border">$35.7B by 2032</span>. Fitroom AI's low entry cost allows small retailers to capture this growth without enterprise-level investment.
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
              <div key={i} className="bg-background border-2 border-border p-6 text-center shadow-[4px_4px_0px_0px_var(--color-border)]">
                <div className="text-4xl font-heading font-bold text-primary mb-2">{stat.value}</div>
                <div className="text-sm font-bold uppercase tracking-wider">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-20 container mx-auto">
        <h2 className="text-4xl md:text-5xl font-bold mb-12 text-center">COMPETITIVE ADVANTAGE</h2>
        
        <div className="grid lg:grid-cols-2 gap-12 items-center mb-16">
          <div className="space-y-6">
            <h3 className="text-3xl font-bold">COST EFFICIENCY</h3>
            <p className="text-lg text-muted-foreground">
              Fitroom AI offers a significant price advantage over AR-based competitors. With a pay-as-you-go model starting at just $0.02 per credit, it enables high-margin resale opportunities.
            </p>
            <ul className="space-y-3">
              {[
                "No monthly minimums for API access",
                "Volume discounts for high-traffic retailers",
                "Dual-use: Consumer try-on + Catalog photography",
                "Lower infrastructure costs (no 3D asset creation needed)"
              ].map((item, i) => (
                <li key={i} className="flex items-center gap-3">
                  <div className="bg-primary rounded-full p-1">
                    <Check className="w-3 h-3 text-primary-foreground" />
                  </div>
                  <span className="font-medium">{item}</span>
                </li>
              ))}
            </ul>
          </div>
          <PricingComparisonChart />
        </div>

        <div className="bg-foreground text-background p-8 md:p-12 border-2 border-border shadow-[8px_8px_0px_0px_var(--color-primary)]">
          <div className="flex flex-col md:flex-row justify-between items-center gap-8">
            <div>
              <h3 className="text-3xl font-bold mb-4 text-primary">READY TO START?</h3>
              <p className="text-lg max-w-xl">
                Leverage this research to build your virtual fitting room business. The market is ready, and the technology is accessible.
              </p>
            </div>
            <div className="flex gap-4">
              <Button className="neo-button bg-primary text-primary-foreground hover:bg-primary/90 h-14 px-8 text-lg">
                Download Full Report
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-background border-t-2 border-border py-12">
        <div className="container mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="font-heading font-bold text-xl flex items-center gap-2">
            <Box className="w-6 h-6" />
            FITROOM<span className="text-primary">.AI</span> RESEARCH
          </div>
          <div className="text-sm text-muted-foreground">
            © 2026 Manus AI Research. All rights reserved.
          </div>
          <div className="flex gap-4">
            <Button variant="ghost" size="icon" className="hover:bg-secondary border border-transparent hover:border-border">
              <Share2 className="w-5 h-5" />
            </Button>
            <Button variant="ghost" size="icon" className="hover:bg-secondary border border-transparent hover:border-border">
              <BarChart3 className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </footer>
    </div>
  );
}
