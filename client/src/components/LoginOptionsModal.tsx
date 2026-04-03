import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Store, User } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";

interface LoginOptionsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function LoginOptionsModal({ open, onOpenChange }: LoginOptionsModalProps) {
  const { refresh } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [userType, setUserType] = useState<"customer" | "merchant">("customer");
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState<"login" | "signup">("login");

  const loginMutation = trpc.auth.login.useMutation({
    onSuccess: async () => {
      await refresh();
      onOpenChange(false);
      setError("");
      setEmail("");
      setPassword("");
    },
    onError: (err) => {
      setError(err.message);
    },
  });

  const signupMutation = trpc.auth.signup.useMutation({
    onSuccess: async () => {
      await refresh();
      onOpenChange(false);
      setError("");
      setEmail("");
      setPassword("");
      setName("");
    },
    onError: (err) => {
      setError(err.message);
    },
  });

  const handleLogin = () => {
    if (!email || !password) {
      setError("Please fill in all fields");
      return;
    }
    loginMutation.mutate({ email, password });
  };

  const handleSignup = () => {
    if (!email || !password) {
      setError("Please fill in all fields");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }
    signupMutation.mutate({ email, password, name, userType });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Welcome to StyleSwap</DialogTitle>
          <DialogDescription>
            Sign in or create an account to start trying on clothes virtually.
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "login" | "signup")} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="login">Login</TabsTrigger>
            <TabsTrigger value="signup">Sign Up</TabsTrigger>
          </TabsList>

          <TabsContent value="login" className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="login-email">Email</Label>
              <Input
                id="login-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                onKeyDown={(e) => e.key === "Enter" && handleLogin()}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="login-password">Password</Label>
              <Input
                id="login-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleLogin()}
              />
            </div>
            {error && <p className="text-sm text-red-500">{error}</p>}
            <Button
              onClick={handleLogin}
              disabled={loginMutation.isPending}
              className="w-full"
            >
              {loginMutation.isPending ? "Logging in..." : "Login"}
            </Button>
          </TabsContent>

          <TabsContent value="signup" className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="signup-name">Name (optional)</Label>
              <Input
                id="signup-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="signup-email">Email</Label>
              <Input
                id="signup-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="signup-password">Password (min. 6 characters)</Label>
              <Input
                id="signup-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            
            {/* 🔥 NEW: User Type Selection */}
            <div className="space-y-2">
              <Label>Account Type</Label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setUserType("customer")}
                  className={`flex flex-col items-center gap-2 p-3 rounded-lg border-2 transition-all ${
                    userType === "customer"
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-primary/50"
                  }`}
                >
                  <User className="w-5 h-5" />
                  <span className="text-sm font-medium">Customer</span>
                  <span className="text-xs text-muted-foreground">Try on clothes</span>
                </button>
                <button
                  type="button"
                  onClick={() => setUserType("merchant")}
                  className={`flex flex-col items-center gap-2 p-3 rounded-lg border-2 transition-all ${
                    userType === "merchant"
                      ? "border-secondary bg-secondary/5"
                      : "border-border hover:border-secondary/50"
                  }`}
                >
                  <Store className="w-5 h-5" />
                  <span className="text-sm font-medium">Boutique</span>
                  <span className="text-xs text-muted-foreground">Sell clothes</span>
                </button>
              </div>
            </div>
            
            {error && <p className="text-sm text-red-500">{error}</p>}
            <Button
              onClick={handleSignup}
              disabled={signupMutation.isPending}
              className="w-full"
            >
              {signupMutation.isPending ? "Creating account..." : "Sign Up"}
            </Button>
          </TabsContent>
        </Tabs>

        <div className="flex gap-2 pt-4 border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)} className="flex-1">
            Cancel
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}