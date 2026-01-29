import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Lock, AlertCircle } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { useLocation } from "wouter";

export default function AdminLogin() {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [, setLocation] = useLocation();

  const adminLoginMutation = trpc.admin.verifyAdminPassword.useMutation({
    onSuccess: (data) => {
      if (data.success) {
        // Store admin session token
        localStorage.setItem("adminToken", data.token);
        localStorage.setItem("adminLoginTime", new Date().toISOString());
        setLocation("/admin-dashboard");
      } else {
        setError("Invalid password");
      }
    },
    onError: (error) => {
      setError(error.message || "Failed to verify password");
      console.error("Admin login error:", error);
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    if (!password) {
      setError("Password is required");
      setIsLoading(false);
      return;
    }

    try {
      await adminLoginMutation.mutateAsync({ password });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-2">
          <div className="flex items-center justify-center mb-4">
            <div className="w-12 h-12 bg-primary/20 rounded-lg flex items-center justify-center">
              <Lock className="w-6 h-6 text-primary" />
            </div>
          </div>
          <CardTitle className="text-center text-2xl">Admin Portal</CardTitle>
          <p className="text-center text-sm text-muted-foreground">
            StyleSwap Platform Management
          </p>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3 bg-destructive/10 border border-destructive/30 rounded-lg flex gap-2">
                <AlertCircle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
                <p className="text-sm text-destructive">{error}</p>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium mb-2">
                Admin Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter admin password"
                className="w-full px-3 py-2 border border-input rounded-md bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                disabled={isLoading}
              />
            </div>

            <Button
              type="submit"
              disabled={isLoading || adminLoginMutation.isPending}
              className="w-full"
            >
              {isLoading ? "Verifying..." : "Access Admin Portal"}
            </Button>
          </form>

          <p className="text-xs text-muted-foreground text-center mt-4">
            This portal is restricted to authorized administrators only.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
