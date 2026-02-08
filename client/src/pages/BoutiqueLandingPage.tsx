import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2, Instagram, Music, Facebook, MessageCircle, ExternalLink, ShoppingBag } from "lucide-react";
import { useMetaTags } from "@/hooks/useMetaTags";

interface BoutiqueLandingPageProps {
  slug: string;
}

export default function BoutiqueLandingPage({ slug }: BoutiqueLandingPageProps) {
  const [, setLocation] = useLocation();
  const { data: boutique, isLoading, error } = trpc.boutiques.getBySlug.useQuery({ slug });

  // Update meta tags for social media sharing
  useMetaTags({
    title: boutique?.name ? `${boutique.name} - Virtual Try-On` : "Virtual Try-On Boutique",
    description: boutique?.description || "Try on clothes virtually with AI-powered virtual fitting room technology",
    image: boutique?.logoUrl || undefined,
    url: typeof window !== 'undefined' ? window.location.href : '',
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading boutique...</p>
        </div>
      </div>
    );
  }

  if (error || !boutique) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <p className="text-center text-muted-foreground mb-4">
              Boutique not found
            </p>
            <Button
              variant="outline"
              className="w-full"
              onClick={() => setLocation("/")}
            >
              Back to Home
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      {/* Navigation */}
      <nav className="border-b border-border/20 sticky top-0 z-50 bg-background/95 backdrop-blur-sm">
        <div className="container mx-auto py-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            {boutique.logoUrl && (
              <img
                src={boutique.logoUrl}
                alt={boutique.name}
                className="w-10 h-10 rounded-lg"
              />
            )}
            <h1 className="font-heading font-bold text-xl">{boutique.name}</h1>
          </div>
          <Button variant="default" className="gap-2" onClick={() => setLocation(`/boutique/${slug}/shop`)}>
            <ShoppingBag className="w-4 h-4" />
            Shop Now
          </Button>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="py-20 container mx-auto">
        <div className="max-w-3xl mx-auto text-center space-y-6">
          <div className="inline-block bg-primary/10 border border-primary/30 px-4 py-2 rounded-lg">
            <span className="text-sm font-semibold text-primary">✨ Virtual Try-On Powered by StyleSwap</span>
          </div>
          <h2 className="text-5xl md:text-6xl font-heading font-bold">
            Experience Fashion Your Way
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Try on clothes virtually before you buy. See how our latest collection looks on you with AI-powered virtual fitting room technology.
          </p>
          <div className="flex gap-4 justify-center pt-4">
            <Button size="lg" className="gap-2" onClick={() => setLocation(`/boutique/${slug}/try-on`)}>
              <ShoppingBag className="w-5 h-5" />
              Start Virtual Try-On
            </Button>
            <Button size="lg" variant="outline" onClick={() => setLocation(`/boutique/${slug}`)}>
              Learn More
            </Button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 bg-muted/30 border-y border-border/20">
        <div className="container mx-auto">
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: "👗",
                title: "Instant Try-On",
                description: "See how clothes fit before purchasing"
              },
              {
                icon: "🎯",
                title: "Perfect Fit",
                description: "AI-powered sizing recommendations"
              },
              {
                icon: "🚀",
                title: "Fast & Easy",
                description: "Try on in seconds, not minutes"
              }
            ].map((feature, i) => (
              <Card key={i} className="border-0 bg-background/50">
                <CardContent className="pt-6 text-center space-y-3">
                  <div className="text-4xl">{feature.icon}</div>
                  <h3 className="font-semibold text-lg">{feature.title}</h3>
                  <p className="text-sm text-muted-foreground">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Social Media Links Section */}
      {(boutique.instagramHandle || boutique.tiktokHandle || boutique.facebookUrl || boutique.whatsappNumber) && (
        <section className="py-16 container mx-auto">
          <div className="max-w-2xl mx-auto">
            <h3 className="text-2xl font-bold text-center mb-8">Follow & Connect</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {boutique.instagramHandle && (
                <a
                  href={`https://instagram.com/${boutique.instagramHandle}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 p-4 bg-muted rounded-lg hover:bg-muted/80 transition"
                >
                  <Instagram className="w-5 h-5" />
                  <span className="text-sm font-medium">Instagram</span>
                </a>
              )}
              {boutique.tiktokHandle && (
                <a
                  href={`https://tiktok.com/@${boutique.tiktokHandle}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 p-4 bg-muted rounded-lg hover:bg-muted/80 transition"
                >
                  <Music className="w-5 h-5" />
                  <span className="text-sm font-medium">TikTok</span>
                </a>
              )}
              {boutique.facebookUrl && (
                <a
                  href={boutique.facebookUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 p-4 bg-muted rounded-lg hover:bg-muted/80 transition"
                >
                  <Facebook className="w-5 h-5" />
                  <span className="text-sm font-medium">Facebook</span>
                </a>
              )}
              {boutique.whatsappNumber && (
                <a
                  href={`https://wa.me/${boutique.whatsappNumber}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 p-4 bg-muted rounded-lg hover:bg-muted/80 transition"
                >
                  <MessageCircle className="w-5 h-5" />
                  <span className="text-sm font-medium">WhatsApp</span>
                </a>
              )}
            </div>
          </div>
        </section>
      )}

      {/* Website Link Section */}
      {boutique.websiteUrl && (
        <section className="py-16 bg-muted/30 border-t border-border/20">
          <div className="container mx-auto max-w-2xl text-center">
            <h3 className="text-2xl font-bold mb-4">Visit Our Website</h3>
            <a
              href={boutique.websiteUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-primary hover:underline"
            >
              {boutique.websiteUrl}
              <ExternalLink className="w-4 h-4" />
            </a>
          </div>
        </section>
      )}

      {/* Footer */}
      <footer className="border-t border-border/20 py-8 bg-background/50">
        <div className="container mx-auto text-center text-sm text-muted-foreground">
          <p>Powered by StyleSwap Virtual Try-On</p>
        </div>
      </footer>
    </div>
  );
}
