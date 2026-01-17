import { useAuth } from "@/_core/hooks/useAuth";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowRight, Zap } from "lucide-react";
import { getLoginUrl } from "@/const";
import Navigation from "@/components/Navigation";

export default function Overview() {
  const { isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();

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

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navigation />
      {/* Hero Section */}
      <section className="pt-32 pb-20 container mx-auto">
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
                onClick={() => setLocation('/technology')}
                className="premium-button bg-primary text-primary-foreground hover:bg-primary/90 h-14 px-8 text-lg"
              >
                Explore Technology <ArrowRight className="ml-2" />
              </Button>
              <Button 
                onClick={handleTryOn}
                variant="outline" 
                className="premium-button h-14 px-8 text-lg"
              >
                Try It Now
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

      {/* CTA Section */}
      <section className="py-20 container mx-auto">
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
    </div>
  );
}
