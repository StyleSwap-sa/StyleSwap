import { useAuth } from "@/_core/hooks/useAuth";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";
import { getLoginUrl } from "@/const";

export default function Navigation() {
  const { user, isAuthenticated, logout } = useAuth();
  const [, setLocation] = useLocation();

  const navigationItems = [
    { label: 'Overview', path: '/overview' },
    { label: 'Technology', path: '/technology' },
    { label: 'Market', path: '/market' },
    { label: 'Pricing', path: '/pricing-page' },
    { label: 'ROI', path: '/roi' },
    { label: 'Case Studies', path: '/case-studies' },
    { label: 'Contact', path: '/contact' },
  ];

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-md border-b border-border/20">
      <div className="container mx-auto py-4 flex justify-between items-center">
        <div className="flex items-center gap-3 cursor-pointer" onClick={() => setLocation('/')}>
          <img src="https://files.manuscdn.com/user_upload_by_module/session_file/310519663284718291/ilMaDKzhgsDAyZui.png" alt="StyleSwap" className="h-12" width="auto" height="48" />
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
        </div>
        <div className="flex items-center gap-3">
          {isAuthenticated ? (
            <>
              <span className="text-sm font-medium text-muted-foreground">
                {user?.name}
              </span>
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
              onClick={() => window.location.href = getLoginUrl()}
              className="premium-button bg-primary text-primary-foreground hover:bg-primary/90"
            >
              Get Started
            </Button>
          )}
        </div>
      </div>
    </nav>
  );
}
