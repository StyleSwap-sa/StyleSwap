import { useAuth } from "@/_core/hooks/useAuth";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { LogOut, Menu, X, ChevronDown } from "lucide-react";
import { getLoginUrl } from "@/const";
import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { BusinessPricingComponent } from "./BusinessPricingComponent";

export default function Navigation() {
  const { user, isAuthenticated, logout } = useAuth();
  const [, setLocation] = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showPricingDetails, setShowPricingDetails] = useState(false);



  const navigationItems = [
    { label: 'Overview', path: '/overview' },
    { label: 'Technology', path: '/technology' },
    { label: 'Market', path: '/market' },
    { label: 'About', path: '/about' },
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
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="gap-2 hidden sm:flex">
                    <span className="text-sm font-medium">{user?.name}</span>
                    <ChevronDown className="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem onClick={() => handleNavClick(`/profile/${user?.id}`)}>
                    Profile
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleNavClick('/dashboard')}>
                    Dashboard
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => {
                    logout();
                    handleNavClick('/');
                  }} className="text-destructive">
                    Logout
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
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
            {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
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
                <div className="px-4 py-4 bg-background/50 rounded-lg mt-2 max-h-96 overflow-y-auto">
                  <BusinessPricingComponent compact={true} />
                </div>
              )}
            </div>
            
            {/* Mobile Auth Buttons */}
            <div className="border-t border-border/20 pt-4 mt-4 space-y-2">
              {isAuthenticated ? (
                <>
                  <Button
                    onClick={() => handleNavClick(`/profile/${user?.id}`)}
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
