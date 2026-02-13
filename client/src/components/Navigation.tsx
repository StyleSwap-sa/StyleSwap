import { useAuth } from "@/_core/hooks/useAuth";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { LogOut, Menu, X, Check, ChevronDown } from "lucide-react";
import { getLoginUrl } from "@/const";
import { useState } from "react";
import { trpc } from "@/lib/trpc";

export default function Navigation() {
  const { user, isAuthenticated, logout } = useAuth();
  const [, setLocation] = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showPricingDetails, setShowPricingDetails] = useState(false);
  const [loadingPackage, setLoadingPackage] = useState<string | null>(null);
  const createCheckout = trpc.payment.createCheckout.useMutation();


  const navigationItems = [
    { label: 'Overview', path: '/overview' },
    { label: 'Technology', path: '/technology' },
    { label: 'Market', path: '/market' },
    { label: 'Pricing', path: '/pricing' },
    { label: 'ROI', path: '/roi' },
    { label: 'Case Studies', path: '/case-studies' },
    { label: 'Contact', path: '/contact' },
  ];



  const handleNavClick = (path: string) => {
    setLocation(path);
    setIsMobileMenuOpen(false);
    setShowPricingDetails(false);
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-md border-b border-border/20">
      <div className="container mx-auto py-4 flex justify-between items-center">
        <div className="flex items-center gap-3 cursor-pointer" onClick={() => handleNavClick('/')}>
          <img src="https://files.manuscdn.com/user_upload_by_module/session_file/310519663284718291/ilMaDKzhgsDAyZui.png" alt="StyleSwap" className="h-12" width="auto" height="48" />
        </div>
        
        {/* Desktop Navigation */}
        <div className="hidden md:flex gap-8 font-medium text-sm">
          {navigationItems.map((item) => (
            <button 
              key={item.path}
              onClick={() => handleNavClick(item.path)}
              className="hover:text-primary transition-colors uppercase tracking-wide"
            >
              {item.label}
            </button>
          ))}
        </div>
        
        <div className="flex items-center gap-3">
          {isAuthenticated ? (
            <>
              <span className="text-sm font-medium text-muted-foreground hidden sm:inline">
                {user?.name}
              </span>
              <Button
                onClick={() => handleNavClick('/profile')}
                variant="outline"
                className="gap-2 hidden sm:flex"
              >
                Profile
              </Button>
              <Button
                onClick={() => {
                  logout();
                  handleNavClick('/');
                }}
                variant="outline"
                className="gap-2 hidden sm:flex"
              >
                <LogOut className="w-4 h-4" />
                Logout
              </Button>
            </>
          ) : (
            <Button 
              onClick={() => window.location.href = getLoginUrl()}
              className="premium-button bg-primary text-primary-foreground hover:bg-primary/90 hidden sm:flex"
            >
              Get Started
            </Button>
          )}
          
          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="md:hidden p-2 hover:bg-background/80 rounded-lg transition-colors"
          >
            {isMobileMenuOpen ? (
              <X className="w-5 h-5" />
            ) : (
              <Menu className="w-5 h-5" />
            )}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden bg-background border-t border-border/20 max-h-[calc(100vh-80px)] overflow-y-auto">
          <div className="container mx-auto py-4 space-y-2">
            {navigationItems.map((item) => (
              <button
                key={item.path}
                onClick={() => handleNavClick(item.path)}
                className="w-full text-left px-4 py-2 hover:bg-background/80 rounded-lg transition-colors font-medium text-sm uppercase tracking-wide"
              >
                {item.label}
              </button>
            ))}
            
            {/* Pricing Section */}
            <div className="border-t border-border/20 pt-4 mt-4">
              <button
                onClick={() => setShowPricingDetails(!showPricingDetails)}
                className="w-full text-left px-4 py-2 hover:bg-background/80 rounded-lg transition-colors font-medium text-sm uppercase tracking-wide flex items-center justify-between"
              >
                Pricing
                <ChevronDown className={`w-4 h-4 transition-transform ${showPricingDetails ? 'rotate-180' : ''}`} />
              </button>
              
              {showPricingDetails && (
                <div className="px-4 py-4 space-y-3 bg-background/50 rounded-lg mt-2">
                  {[
                    { name: "Boutique Starter", price: 385, features: ["100 Virtual Try-Ons", "Widget integration", "Effective rate: R3.85/sim"] },
                    { name: "Boutique Growth", price: 750, features: ["200 Virtual Try-Ons", "Widget + API access", "Effective rate: R3.75/sim"] },
                    { name: "Store Pro", price: 1350, features: ["500 Virtual Try-Ons", "Full API access", "Effective rate: R2.70/sim"] },
                    { name: "Store Scale", price: 2200, features: ["1,000 Virtual Try-Ons", "Advanced analytics", "Effective rate: R2.20/sim"] },
                    { name: "Retailer Pro", price: 6250, features: ["5,000 Virtual Try-Ons", "Custom integration", "Effective rate: R1.25/sim"] },
                    { name: "Enterprise Retail", price: 18600, features: ["20,000 Virtual Try-Ons", "White-label option", "Effective rate: R0.93/sim"] },
                  ].map((plan) => (
                    <div key={plan.name} className="p-3 bg-white border border-border/20 rounded-lg">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h4 className="font-bold text-sm">{plan.name}</h4>
                          <p className="text-orange-600 font-bold">R{plan.price.toLocaleString()}/month</p>
                        </div>
                      </div>
                      <ul className="space-y-1 mb-2">
                        {plan.features.map((feature, idx) => (
                          <li key={idx} className="flex items-start gap-2 text-xs text-muted-foreground">
                            <Check className="w-3 h-3 text-orange-600 flex-shrink-0 mt-0.5" />
                            <span>{feature}</span>
                          </li>
                        ))}
                      </ul>
                      <Button
                        onClick={() => handleNavClick('/pricing')}
                        className="w-full bg-orange-600 hover:bg-orange-700 text-white text-xs py-1 h-auto"
                      >
                        Subscribe Now
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            {/* Mobile Auth Buttons */}
            <div className="border-t border-border/20 pt-4 mt-4 space-y-2">
              {isAuthenticated ? (
                <>
                  <Button
                    onClick={() => handleNavClick('/profile')}
                    variant="outline"
                    className="w-full justify-start"
                  >
                    Profile
                  </Button>
                  <Button
                    onClick={() => {
                      logout();
                      handleNavClick('/');
                    }}
                    variant="outline"
                    className="w-full justify-start gap-2"
                  >
                    <LogOut className="w-4 h-4" />
                    Logout
                  </Button>
                </>
              ) : (
                <Button 
                  onClick={() => window.location.href = getLoginUrl()}
                  className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
                >
                  Get Started
                </Button>
              )}
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
