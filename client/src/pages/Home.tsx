import { useAuth } from "@/_core/hooks/useAuth";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { ArrowRight, LogOut } from "lucide-react";
import { getLoginUrl } from "@/const";

export default function Home() {
  const { user, isAuthenticated, logout } = useAuth();
  const [, setLocation] = useLocation();

  const handleGetStarted = () => {
    if (isAuthenticated) {
      setLocation('/dashboard');
    } else {
      window.location.href = getLoginUrl();
    }
  };

  const navigationItems = [
    { label: 'Overview', path: '/overview' },
    { label: 'Technology', path: '/technology' },
    { label: 'Market', path: '/market' },
    { label: 'Pricing', path: '/pricing-page' },
    { label: 'ROI', path: '/roi' },
    { label: 'Case Studies', path: '/case-studies' },
    { label: 'Contact', path: '/contact' },
  ];

  const authenticatedNavItems = [
    { label: 'Dashboard', path: '/boutique-dashboard' },
    { label: 'Profile', path: '/profile' },
  ];

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
            {navigationItems.map((item) => (
              <button 
                key={item.path}
                onClick={() => setLocation(item.path)}
                className="hover:text-primary transition-colors uppercase tracking-wide"
              >
                {item.label}
              </button>
            ))}
            {isAuthenticated && (
              <>
                <div className="w-px bg-border/30"></div>
                {authenticatedNavItems.map((item) => (
                  <button
                    key={item.path}
                    onClick={() => setLocation(item.path)}
                    className="hover:text-primary transition-colors uppercase tracking-wide text-primary font-bold"
                  >
                    {item.label}
                  </button>
                ))}
              </>
            )}
          </div>
          <div className="flex items-center gap-3">
            {isAuthenticated ? (
              <>
                <span className="text-sm font-medium text-muted-foreground">
                  {user?.name}
                </span>
                <Button
                  onClick={() => setLocation('/boutique-dashboard')}
                  className="premium-button bg-primary text-primary-foreground hover:bg-primary/90 gap-2"
                >
                  Dashboard
                </Button>
                <Button
                  onClick={() => setLocation('/profile')}
                  variant="outline"
                  className="gap-2"
                >
                  Profile
                </Button>
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
              <Button 
                onClick={handleGetStarted}
                className="premium-button bg-primary text-primary-foreground hover:bg-primary/90"
              >
                Get Started
              </Button>
            )}
          </div>
        </div>
      </nav>

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
                onClick={() => setLocation('/overview')}
                variant="outline" 
                className="premium-button h-14 px-8 text-lg"
              >
                Learn More
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

      {/* Quick Stats */}
      <section className="py-20 container mx-auto">
        <div className="grid md:grid-cols-4 gap-6 mb-12">
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
      </section>

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

      {/* Navigation Links Section */}
      <section className="py-20 container mx-auto">
        <h2 className="text-3xl font-bold mb-12 text-center">Explore StyleSwap</h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {navigationItems.map((item) => (
            <button
              key={item.path}
              onClick={() => setLocation(item.path)}
              className="premium-card p-6 rounded-lg text-center hover:shadow-lg hover:-translate-y-1 transition-all duration-300"
            >
              <h3 className="text-xl font-bold text-primary mb-2">{item.label}</h3>
              <p className="text-sm text-muted-foreground">
                {item.label === 'Overview' && 'Discover what StyleSwap offers'}
                {item.label === 'Technology' && 'Learn about our AI technology'}
                {item.label === 'Market' && 'Explore market opportunities'}
                {item.label === 'Pricing' && 'View our pricing plans'}
                {item.label === 'ROI' && 'Calculate your ROI'}
                {item.label === 'Case Studies' && 'See proven results'}
                {item.label === 'Contact' && 'Get in touch with us'}
              </p>
              <ArrowRight className="w-4 h-4 mx-auto mt-4 text-primary" />
            </button>
          ))}
        </div>
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
                <li><button onClick={() => setLocation('/pricing-page')} className="hover:text-primary transition">Pricing</button></li>
                <li><button onClick={() => setLocation('/roi')} className="hover:text-primary transition">ROI Calculator</button></li>
                <li><button onClick={() => setLocation('/case-studies')} className="hover:text-primary transition">Case Studies</button></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold mb-4">Company</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><button onClick={() => setLocation('/overview')} className="hover:text-primary transition">About</button></li>
                <li><button onClick={() => setLocation('/technology')} className="hover:text-primary transition">Technology</button></li>
                <li><button onClick={() => setLocation('/contact')} className="hover:text-primary transition">Contact</button></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold mb-4">Contact</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>info@styleswap.co.za</li>
                <li>Johannesburg, South Africa</li>
              </ul>
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
