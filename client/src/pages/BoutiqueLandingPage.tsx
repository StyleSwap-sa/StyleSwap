import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2, Instagram, Music, Facebook, MessageCircle, ExternalLink, ShoppingBag } from "lucide-react";

interface BoutiqueLandingPageProps {
  slug: string;
}

export default function BoutiqueLandingPage({ slug }: BoutiqueLandingPageProps) {
  const [, setLocation] = useLocation();
  const { data: boutique, isLoading, error } = trpc.boutiques.getBySlug.useQuery({ slug });

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
          <Button variant="default" className="gap-2">
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
            <Button size="lg" className="gap-2">
              <ShoppingBag className="w-5 h-5" />
              Start Virtual Try-On
            </Button>
            <Button size="lg" variant="outline">
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
                desc: "See how clothes fit on your body in seconds",
              },
              {
                icon: "🎯",
                title: "Perfect Fit",
                desc: "Find your perfect size with AI-powered recommendations",
              },
              {
                icon: "📱",
                title: "Easy to Use",
                desc: "Just upload a photo and start trying on",
              },
            ].map((feature, i) => (
              <div key={i} className="text-center space-y-3">
                <div className="text-4xl">{feature.icon}</div>
                <h3 className="font-semibold text-lg">{feature.title}</h3>
                <p className="text-muted-foreground">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* About Boutique Section */}
      <section className="py-20 container mx-auto">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div className="space-y-6">
            <h3 className="text-3xl font-bold">About {boutique.name}</h3>
            {boutique.description && (
              <p className="text-lg text-muted-foreground leading-relaxed">
                {boutique.description}
              </p>
            )}
            <div className="space-y-3">
              <p className="font-semibold">Visit us:</p>
              {boutique.websiteUrl && (
                <div className="flex items-center gap-2">
                  <ExternalLink className="w-4 h-4 text-primary" />
                  <a
                    href={boutique.websiteUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline"
                  >
                    {boutique.websiteUrl}
                  </a>
                </div>
              )}
            </div>
          </div>
          <div className="bg-muted/50 rounded-2xl p-8 space-y-6">
            <h4 className="font-semibold text-lg">Connect With Us</h4>
            <div className="space-y-3">
              {boutique.instagramHandle && (
                <a
                  href={`https://instagram.com/${boutique.instagramHandle.replace('@', '')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted transition-colors"
                >
                  <Instagram className="w-5 h-5 text-pink-600" />
                  <span className="text-sm">{boutique.instagramHandle}</span>
                  <ExternalLink className="w-4 h-4 ml-auto text-muted-foreground" />
                </a>
              )}
              {boutique.tiktokHandle && (
                <a
                  href={`https://tiktok.com/@${boutique.tiktokHandle.replace('@', '')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted transition-colors"
                >
                  <Music className="w-5 h-5 text-black dark:text-white" />
                  <span className="text-sm">{boutique.tiktokHandle}</span>
                  <ExternalLink className="w-4 h-4 ml-auto text-muted-foreground" />
                </a>
              )}
              {boutique.facebookUrl && (
                <a
                  href={boutique.facebookUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted transition-colors"
                >
                  <Facebook className="w-5 h-5 text-blue-600" />
                  <span className="text-sm">Facebook</span>
                  <ExternalLink className="w-4 h-4 ml-auto text-muted-foreground" />
                </a>
              )}
              {boutique.whatsappNumber && (
                <a
                  href={`https://wa.me/${boutique.whatsappNumber.replace(/\D/g, '')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted transition-colors"
                >
                  <MessageCircle className="w-5 h-5 text-green-600" />
                  <span className="text-sm">{boutique.whatsappNumber}</span>
                  <ExternalLink className="w-4 h-4 ml-auto text-muted-foreground" />
                </a>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-primary/10 to-secondary/10 border-y border-border/20">
        <div className="container mx-auto text-center space-y-6">
          <h3 className="text-4xl font-bold">Ready to Try On?</h3>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Experience the future of fashion shopping with our AI-powered virtual try-on technology.
          </p>
          <Button size="lg" className="gap-2">
            <ShoppingBag className="w-5 h-5" />
            Start Virtual Try-On Now
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-muted/30 border-t border-border/20 py-12">
        <div className="container mx-auto">
          <div className="grid md:grid-cols-3 gap-8 mb-8">
            <div>
              <h4 className="font-semibold mb-4">About StyleSwap</h4>
              <p className="text-sm text-muted-foreground">
                Empowering boutiques with AI-powered virtual try-on technology.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Quick Links</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="/" className="hover:text-primary transition">Home</a></li>
                <li><a href="/b2b" className="hover:text-primary transition">For Boutiques</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Support</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#" className="hover:text-primary transition">Help Center</a></li>
                <li><a href="#" className="hover:text-primary transition">Contact Us</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-border/20 pt-8 text-center text-sm text-muted-foreground">
            <p>© 2026 {boutique.name}. Powered by <a href="/" className="text-primary hover:underline">StyleSwap</a></p>
          </div>
        </div>
      </footer>
    </div>
  );
}
