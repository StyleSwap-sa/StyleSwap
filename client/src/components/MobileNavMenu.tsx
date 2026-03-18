import { useState } from "react";
import { Menu, X, History } from "lucide-react";
import { Button } from "@/components/ui/button";

interface MobileNavMenuProps {
  activeTab: "overview" | "history";
  onTabChange: (tab: "overview" | "history") => void;
  onTryOnClick: () => void;
  onAdminClick?: () => void;
  isAdmin?: boolean;
}

export function MobileNavMenu({
  activeTab,
  onTabChange,
  onTryOnClick,
  onAdminClick,
  isAdmin = false,
}: MobileNavMenuProps) {
  const [isOpen, setIsOpen] = useState(false);

  const handleTabClick = (tab: "overview" | "history") => {
    onTabChange(tab);
    setIsOpen(false);
  };

  const handleTryOnClick = () => {
    onTryOnClick();
    setIsOpen(false);
  };

  const handleAdminClick = () => {
    if (onAdminClick) {
      onAdminClick();
      setIsOpen(false);
    }
  };

  return (
    <div className="sm:hidden relative">
      {/* Hamburger Button */}
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 transition-colors duration-200"
      >
        {isOpen ? (
          <X className="w-5 h-5 transition-transform duration-200" />
        ) : (
          <Menu className="w-5 h-5 transition-transform duration-200" />
        )}
      </Button>

      {/* Mobile Menu Dropdown with Animation */}
      {isOpen && (
        <div className="absolute top-full right-0 mt-2 w-48 bg-background border border-border/20 rounded-lg shadow-lg z-50 transition-all duration-200 ease-in-out">
          <div className="flex flex-col gap-1 p-2">
            <Button
              onClick={() => handleTabClick("overview")}
              variant={activeTab === "overview" ? "default" : "ghost"}
              className="justify-start text-sm transition-colors duration-150"
              size="sm"
            >
              Overview
            </Button>
            <Button
              onClick={handleTryOnClick}
              variant="ghost"
              className="justify-start text-sm border-primary/50 text-primary hover:bg-primary/10 transition-colors duration-150"
              size="sm"
            >
              Try-On
            </Button>
            <Button
              onClick={() => handleTabClick("history")}
              variant={activeTab === "history" ? "default" : "ghost"}
              className="justify-start text-sm transition-colors duration-150"
              size="sm"
            >
              <History className="w-3 h-3 mr-2" />
              History
            </Button>

            {/* Admin Link */}
            {isAdmin && (
              <>
                <div className="border-t border-border/20 my-1" />
                <Button
                  onClick={handleAdminClick}
                  variant="ghost"
                  className="justify-start text-sm border-primary/50 text-primary hover:bg-primary/10 transition-colors duration-150"
                  size="sm"
                >
                  Analytics
                </Button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
