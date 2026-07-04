import { useAuth } from "@/_core/hooks/useAuth";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { ArrowRight, LogOut, Menu, X } from "lucide-react";
import { getLoginUrl } from "@/const";
import { useState } from "react";
import { LoginOptionsModal } from "@/components/LoginOptionsModal";
import { Footer } from "@/components/Footer";
import DemoVideoModal from "@/components/DemoVideoModal";
import { FitroomCreditsWidget } from "@/components/FitroomCreditsWidget";
import styleswapLogo from "../images/styleswapimg.png";



export default function Home() {
  const { user, isAuthenticated, logout, loading } = useAuth();
  const [, setLocation] = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showLoginOptions, setShowLoginOptions] = useState(false);
  const [isDemoOpen, setIsDemoOpen] = useState(false);

  const handleGetStarted = () => {
    if (isAuthenticated) {
      // Redirect based on user type
      if (user?.userType === 'admin' || user?.role === 'admin') {
        setLocation('/admin/dashboard');
      } else if (user?.userType === 'merchant') {
        setLocation('/boutique/dashboard');
      } else {
        setLocation('/dashboard');
      }
    } else {
      setShowLoginOptions(true);
    }
  };

  const getDashboardPath = () => {
    if (user?.userType === 'admin' || user?.role === 'admin') {
      return '/admin/dashboard';
    } else if (user?.userType === 'merchant') {
      return '/boutique/dashboard';
    } else {
      return '/dashboard';
    }
  };

  const getDashboardLabel = () => {
    if (user?.userType === 'admin' || user?.role === 'admin') {
      return 'Platform Analytics';
    } else if (user?.userType === 'merchant') {
      return 'Boutique Dashboard';
    } else {
      return 'My Dashboard';
    }
  };

  const navigationItems = [
    { label: 'Overview', path: '/overview' },
    { label: 'Technology', path: '/technology' },
    { label: 'Market', path: '/market' },
    { label: 'Pricing', path: '/pricing-page' },
    { label: 'ROI', path: '/roi' },
    { label: 'Case Studies', path: '/case-studies' },
    { label: 'For Boutiques', path: '/for-boutiques' },
    { label: 'API Docs', path: '/api-docs' },
    { label: 'Contact', path: '/contact' },
  ];

  const authenticatedNavItems = [
    { label: 'Dashboard', path: getDashboardPath() },
    { label: 'Profile', path: `/profile/${user?.id}`},
  ];

  // For admin users, add a link to the customer dashboard for testing
  const adminTestItems = (user?.role === 'admin' || user?.userType === 'admin') ? [
    { label: 'Try Customer Dashboard', path: '/dashboard' },
  ] : [];

  const isAdmin = user?.role === 'admin' || user?.userType === 'admin';

  return (
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-md border-b border-border/20">
        <div className="container mx-auto py-4 flex justify-between items-center px-4 md:px-0">
          <div className="flex items-center gap-3">
            <img src={styleswapLogo} alt="StyleSwap" className="h-12" width="auto" height="48" />
          </div>

          {/* Desktop Navigation */}
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
           
          </div>

          {/* Fitroom Credits Widget */}
          {isAuthenticated && (
            <FitroomCreditsWidget apiKey="744af8dfea9f4b04bc2ba36082c255049928648390bb4586a8fb157a2116e483" />
          )}
          
          {/* Desktop Auth Buttons */}
          <div className="hidden md:flex items-center gap-3 pl-4">
            {isAuthenticated ? (
              <>
                <span className="text-sm font-medium text-muted-foreground">
                  {user?.name}
                </span>
                <Button
                  onClick={() => setLocation(getDashboardPath())}
                  className="premium-button bg-primary text-primary-foreground hover:bg-primary/90 gap-2"
                >
                  {getDashboardLabel()}
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
              <>
                <Button 
                  onClick={handleGetStarted}
                  className="premium-button bg-primary text-primary-foreground hover:bg-primary/90"
                >
                  Get Started
                </Button>
                <LoginOptionsModal 
                  open={showLoginOptions} 
                  onOpenChange={setShowLoginOptions}
                />
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 hover:bg-background rounded-lg transition-colors"
          >
            {mobileMenuOpen ? (
              <X className="w-6 h-6" />
            ) : (
              <Menu className="w-6 h-6" />
            )}
          </button>
        </div>
      </nav>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden fixed top-16 left-0 right-0 bg-background border-b border-border/20 z-40 max-h-[calc(100vh-4rem)] overflow-y-auto">
          <div className="container mx-auto py-4 space-y-2 px-4">
            {navigationItems.map((item) => (
              <button
                key={item.path}
                onClick={() => {
                  setLocation(item.path);
                  setMobileMenuOpen(false);
                }}
                className="block w-full text-left px-4 py-2 hover:bg-background/80 rounded transition-colors uppercase tracking-wide text-sm font-medium"
              >
                {item.label}
              </button>
            ))}
            {isAuthenticated && (
              <>
                <div className="border-t border-border/20 my-2"></div>
                {authenticatedNavItems.map((item) => (
                  <button
                    key={item.path}
                    onClick={() => {
                      setLocation(item.path);
                      setMobileMenuOpen(false);
                    }}
                    className="block w-full text-left px-4 py-2 hover:bg-background/80 rounded transition-colors uppercase tracking-wide text-sm font-bold text-primary"
                  >
                    {item.label}
                  </button>
                ))}
                {isAdmin && (
                  <>
                    <div className="border-t border-border/20 my-2"></div>
                    <button
                      onClick={() => {
                        setLocation('/customer-try-on');
                        setMobileMenuOpen(false);
                      }}
                      className="block w-full text-left px-4 py-2 hover:bg-background/80 rounded transition-colors uppercase tracking-wide text-sm font-bold text-secondary"
                      title="Test the customer try-on dashboard"
                    >
                      Try Customer Dashboard
                    </button>
                    <button
                      onClick={() => {
                        setLocation('/test-boutique');
                        setMobileMenuOpen(false);
                      }}
                      className="block w-full text-left px-4 py-2 hover:bg-background/80 rounded transition-colors uppercase tracking-wide text-sm font-bold text-secondary"
                      title="Test the boutique try-on dashboard"
                    >
                      Try Boutique Dashboard
                    </button>
                  </>
                )}
              </>
            )}
            <div className="border-t border-border/20 my-2"></div>
            {isAuthenticated && user ? (
              <>
                <div className="px-4 py-2 text-sm font-medium text-muted-foreground">
                  {user?.name}
                </div>
                <Button
                  onClick={() => setLocation(`/profile/${user?.id}`)}
                  className="w-full"
                  variant="outline"
                >
                  Profile
                </Button>
                <Button
                  onClick={() => {
                    logout();
                    setLocation('/');
                    setMobileMenuOpen(false);
                  }}
                  variant="outline"
                  className="w-full"
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  Logout
                </Button>
              </>
            ) : (
              <Button
                onClick={() => {
                  handleGetStarted();
                  setMobileMenuOpen(false);
                }}
                className="w-full premium-button bg-primary text-primary-foreground hover:bg-primary/90"
              >
                Get Started
              </Button>
            )}
          </div>
        </div>
      )}

      {/* Main Content - Placeholder */}
      <main className="pt-20 pb-20">
        <div className="container mx-auto px-4 md:px-0">
          <div className="text-center py-20">
            <h1 className="text-4xl md:text-6xl font-bold mb-4">Welcome to StyleSwap</h1>
            <p className="text-lg md:text-xl text-muted-foreground mb-2">AI-powered virtual try-on for fashion retail</p>
            <p className="text-sm md:text-base text-muted-foreground/80 mb-8">Transform how customers shop with realistic virtual clothing simulations</p>
            <div className="flex gap-4 justify-center flex-wrap">
              <Button 
                onClick={handleGetStarted}
                className="premium-button bg-primary text-primary-foreground hover:bg-primary/90 gap-2"
              >
                Get Started <ArrowRight className="w-4 h-4" />
              </Button>
              <Button 
                onClick={() => setIsDemoOpen(true)}
                variant="outline"
                className="premium-button gap-2"
              >
                Watch Demo
              </Button>
            </div>
          </div>
        </div>
      </main>

      {/* Demo Video Modal */}
      <DemoVideoModal
        isOpen={isDemoOpen}
        onClose={() => setIsDemoOpen(false)}
        defaultVideoId="customer-demo"
      />

      {/* Footer */}
      <Footer />
    </div>
  );
}