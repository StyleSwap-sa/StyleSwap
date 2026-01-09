import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowRight, Sparkles } from "lucide-react";

export function ModelShowcase() {
  return (
    <section className="py-20 container mx-auto">
      <div className="text-center mb-16">
        <h2 className="text-5xl md:text-6xl font-bold mb-6">SEE IT IN ACTION</h2>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
          Watch how StyleSwap transforms the shopping experience. Virtual try-ons that look photorealistic and feel natural.
        </p>
      </div>

      <Card className="premium-card rounded-3xl overflow-hidden border-2 border-primary/20 shadow-2xl">
        <div className="relative">
          {/* Model Showcase Image */}
          <img 
            src="/images/model-virtual-tryon-showcase.jpg" 
            alt="Model trying on clothing with StyleSwap virtual try-on technology"
            className="w-full h-auto object-cover"
          />
          
          {/* Overlay gradient for text readability */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"></div>
          
          {/* Content overlay */}
          <div className="absolute bottom-0 left-0 right-0 p-8 md:p-12">
            <div className="max-w-2xl">
              <div className="flex items-center gap-2 mb-4">
                <Sparkles className="w-5 h-5 text-primary" />
                <span className="text-sm font-bold uppercase tracking-wider text-primary">AI-Powered Virtual Try-On</span>
              </div>
              <h3 className="text-3xl md:text-4xl font-bold text-white mb-4 leading-tight">
                See How Clothes Look Before You Buy
              </h3>
              <p className="text-lg text-gray-100 mb-6 leading-relaxed">
                Our AI technology generates photorealistic images of how garments fit and drape on real body types. No more guessing. No more returns.
              </p>
              <Button className="premium-button bg-primary text-primary-foreground hover:bg-primary/90 h-12 text-base font-bold gap-2">
                Try It Now <ArrowRight className="w-5 h-5" />
              </Button>
            </div>
          </div>
        </div>
      </Card>

      {/* Key Benefits */}
      <div className="grid md:grid-cols-3 gap-6 mt-16">
        <div className="space-y-4">
          <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
            <span className="text-2xl">👗</span>
          </div>
          <h4 className="font-bold text-lg">Realistic Fit Preview</h4>
          <p className="text-muted-foreground">
            See exactly how garments fit your body type with AI-generated photorealistic images.
          </p>
        </div>
        <div className="space-y-4">
          <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
            <span className="text-2xl">⚡</span>
          </div>
          <h4 className="font-bold text-lg">Instant Results</h4>
          <p className="text-muted-foreground">
            Get results in seconds. No waiting for photoshoots or model availability.
          </p>
        </div>
        <div className="space-y-4">
          <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
            <span className="text-2xl">📊</span>
          </div>
          <h4 className="font-bold text-lg">Reduce Returns</h4>
          <p className="text-muted-foreground">
            Customers make confident purchases, reducing return rates by up to 40%.
          </p>
        </div>
      </div>
    </section>
  );
}
