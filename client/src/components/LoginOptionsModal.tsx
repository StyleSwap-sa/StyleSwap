import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Store, User, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { getLoginUrl, getBoutiqueSignupUrl, isOAuthConfigured } from "@/const";

interface LoginOptionsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function LoginOptionsModal({ open, onOpenChange }: LoginOptionsModalProps) {
  const [loading, setLoading] = useState(false);
  const oauthConfigured = isOAuthConfigured();

  const handleCustomerLogin = () => {
    if (!oauthConfigured) {
      toast.error('Authentication Setup in Progress', {
        description: 'OAuth is being configured. Please try again in a few moments.',
        duration: 4000,
      });
      return;
    }
    setLoading(true);
    // Store the dashboard URL in localStorage so OAuth callback can redirect there
    localStorage.setItem('oauth_return_url', '/dashboard');
    window.location.href = getLoginUrl();
  };

  const handleBoutiqueSignup = () => {
    if (!oauthConfigured) {
      toast.error('Authentication Setup in Progress', {
        description: 'OAuth is being configured. Please try again in a few moments.',
        duration: 4000,
      });
      return;
    }
    setLoading(true);
    // Store the boutique dashboard URL in localStorage so OAuth callback can redirect there
    localStorage.setItem('oauth_return_url', '/boutique-dashboard');
    window.location.href = getBoutiqueSignupUrl();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Choose Your Account Type</DialogTitle>
          <DialogDescription>
            Select whether you want to login as a customer or register your boutique
          </DialogDescription>
        </DialogHeader>

        {!oauthConfigured && (
          <div className="flex items-center gap-3 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0" />
            <p className="text-sm text-yellow-800">
              Authentication is being set up. Please try again in a few moments.
            </p>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 py-6">
          {/* Customer Login */}
          <button
            onClick={handleCustomerLogin}
            disabled={loading || !oauthConfigured}
            className="flex flex-col items-center justify-center gap-3 p-6 rounded-lg border-2 border-border hover:border-primary hover:bg-primary/5 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <User className="w-8 h-8 text-primary" />
            <div className="text-center">
              <h3 className="font-semibold">Customer</h3>
              <p className="text-xs text-muted-foreground mt-1">
                Try virtual fitting
              </p>
            </div>
          </button>

          {/* Boutique Signup */}
          <button
            onClick={handleBoutiqueSignup}
            disabled={loading || !oauthConfigured}
            className="flex flex-col items-center justify-center gap-3 p-6 rounded-lg border-2 border-border hover:border-secondary hover:bg-secondary/5 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Store className="w-8 h-8 text-secondary" />
            <div className="text-center">
              <h3 className="font-semibold">Boutique</h3>
              <p className="text-xs text-muted-foreground mt-1">
                Manage your catalog
              </p>
            </div>
          </button>
        </div>

        <div className="flex gap-2 pt-4 border-t">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="flex-1"
          >
            Cancel
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
