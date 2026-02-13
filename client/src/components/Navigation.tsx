import { useAuth } from "@/_core/hooks/useAuth";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { LogOut, Menu, X, Check } from "lucide-react";
import { getLoginUrl } from "@/const";
import { useState } from "react";

export default function Navigation() {
  const { user, isAuthenticated, logout } = useAuth();
  const [, setLocation] = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showPricingDetails, setShowPricingDetails] = useState(false);

  const navigationItems = [
    { label: 'Overview', path: '/overview' },
    { label: 'Technology', path: '/technology' },
    { label: 'Market', path: '/market' },
    { label: 'Pricing', path: '/pricing' },
    { label: 'ROI', path: '/roi' },
    { label: 'Case Studies', path: '/case-studies' },
    { label: 'Contact', path: '/contact' },
  ];

  const businessPlans = [
    { 
      name: "Boutique Starter",
      price: 385,
      features: [
        "100 Virtual Try-Ons",
        "Widget integration",
        "Social media landing page",
        "Basic dashboard access",
        "Effective rate: R3.85 per simulation"
      ]
    },
    { 
      name: "Boutique Growth",
      price: 750,
      features: [
        "200 Virtual Try-Ons",
        "Widget + API access",
        "Social media landing page",
        "Usage analytics",
        "Effective rate: R3.75 per simulation"
      ]
    },
    { 
      name: "Store Pro",
      price: 1350,
      features: [
        "500 Virtual Try-Ons",
        "Full API access/widget integration",
        "Branded try-on experience",
        "Conversion tracking",
        "Effective rate: R2.70 per simulation"
      ]
    },
    { 
      name: "Store Scale",
      price: 2200,
      features: [
        "1,000 Virtual Try-Ons",
        "Advanced analytics",
        "Full API access",
        "Priority support",
        "Branded try-on experience",
        "Lower per-use rate",
        "Effective rate: R2.20 per simulation"
      ]
    },
    { 
      name: "Retailer Pro",
      price: 6250,
      features: [
        "5,000 Virtual Try-Ons",
        "API + Custom integration",
        "Dedicated onboarding",
        "Performance reporting",
        "White label option",
        "Effective rate: R1.25 per simulation"
      ]
    },
    { 
      name: "Enterprise Retail",
      price: 18600,
      features: [
        "20,000 Virtual Try-Ons",
        "Full API integration",
        "White-label option",
        "Dedicated support",
        "Custom SLA",
        "Effective rate: R0.93 per simulation"
      ]
    }
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
              <div key={item.path}>
                {item.label === 'Pricing' ? (
                  <>
                    <button
                      onClick={() => setShowPricingDetails(!showPricingDetails)}
                      className="w-full text-left px-4 py-2 hover:bg-background/80 rounded-lg transition-colors font-medium text-sm uppercase tracking-wide"
                    >
                      {item.label}
                    </button>
                    
                    {/* Pricing Details Dropdown */}
                    {showPricingDetails && (
                      <div className="pl-4 pr-4 py-4 space-y-4 bg-background/50 rounded-lg my-2">
                        <p className="text-xs font-semibold text-slate-600 mb-4">
                          Reduce Returns. Increase Conversions. Let customers try before they buy.
                        </p>
                        
                        {businessPlans.map((plan) => (
                          <div key={plan.name} className="border border-orange-200 rounded-lg overflow-hidden bg-white">
                            <div className="bg-orange-600 text-white p-3">
                              <h4 className="font-bold text-sm mb-1">{plan.name}</h4>
                              <p className="text-2xl font-bold">R{plan.price.toLocaleString()}</p>
                              <p className="text-xs opacity-90">/month</p>
                            </div>
                            <div className="p-3">
                                <ul className="space-y-1 text-xs text-slate-700">
                                  {plan.features.map((feature, idx) => (
                                    <li key={idx} className="flex items-start gap-2">
                                      <Check className="w-3 h-3 text-orange-600 flex-shrink-0 mt-0.5" />
                                      <span>{feature}</span>
                                    </li>
                                  ))}
                                </ul>
                            </div>
                          </div>
                        ))}
                        
                        <div className="border-t pt-3 mt-3">
                          <p className="text-xs font-semibold text-slate-600">Additional simulations billed at plan rate.</p>
                          <p className="text-xs font-semibold text-slate-600 mt-1">Seamless integration via widget, API, or social selling landing page.</p>
                        </div>
                        
                        <Button
                          onClick={() => handleNavClick('/pricing')}
                          className="w-full bg-orange-600 hover:bg-orange-700 text-white text-xs py-2"
                        >
                          View Full Pricing Page
                        </Button>
                      </div>
                    )}
                  </>
                ) : (
                  <button
                    onClick={() => handleNavClick(item.path)}
                    className="w-full text-left px-4 py-2 hover:bg-background/80 rounded-lg transition-colors font-medium text-sm uppercase tracking-wide"
                  >
                    {item.label}
                  </button>
                )}
              </div>
            ))}
            
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
