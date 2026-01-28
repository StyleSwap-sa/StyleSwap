import { useAuth } from "@/_core/hooks/useAuth";
import { useLocation } from "wouter";
import { useEffect } from "react";
import { Loader2 } from "lucide-react";

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole: "admin" | "customer" | "merchant";
}

/**
 * ProtectedAdminRoute - Only platform admin can access
 */
export function ProtectedAdminRoute({ children, requiredRole }: ProtectedRouteProps) {
  const { user, loading, isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (loading) return;

    // Not authenticated - redirect to login
    if (!isAuthenticated) {
      setLocation("/");
      return;
    }

    // Check if user has admin role
    const isAdmin = user?.role === "admin" || user?.userType === "admin";
    if (!isAdmin) {
      // Not admin - redirect to appropriate dashboard
      if (user?.role === "merchant" || user?.userType === "merchant") {
        setLocation("/boutique-dashboard");
      } else {
        setLocation("/dashboard");
      }
    }
  }, [isAuthenticated, user, loading, setLocation]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  const isAdmin = user?.role === "admin" || user?.userType === "admin";
  if (!isAuthenticated || !isAdmin) {
    return null;
  }

  return <>{children}</>;
}

/**
 * ProtectedCustomerRoute - Only customers can access
 */
export function ProtectedCustomerRoute({ children }: { children: React.ReactNode }) {
  const { user, loading, isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (loading) return;

    // Not authenticated - redirect to login
    if (!isAuthenticated) {
      setLocation("/");
      return;
    }

    // Check if user is customer (not merchant or admin)
    const isCustomer = 
      user?.role !== "merchant" && 
      user?.role !== "admin" && 
      user?.userType !== "merchant" && 
      user?.userType !== "admin";

    if (!isCustomer) {
      // Not customer - redirect to appropriate dashboard
      if (user?.role === "admin" || user?.userType === "admin") {
        setLocation("/admin");
      } else if (user?.role === "merchant" || user?.userType === "merchant") {
        setLocation("/boutique-dashboard");
      }
    }
  }, [isAuthenticated, user, loading, setLocation]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  const isCustomer = 
    user?.role !== "merchant" && 
    user?.role !== "admin" && 
    user?.userType !== "merchant" && 
    user?.userType !== "admin";

  if (!isAuthenticated || !isCustomer) {
    return null;
  }

  return <>{children}</>;
}

/**
 * ProtectedBoutiqueRoute - Only boutique owners can access
 */
export function ProtectedBoutiqueRoute({ children }: { children: React.ReactNode }) {
  const { user, loading, isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (loading) return;

    // Not authenticated - redirect to login
    if (!isAuthenticated) {
      setLocation("/");
      return;
    }

    // Check if user is boutique owner
    const isBoutique = user?.role === "merchant" || user?.userType === "merchant";

    if (!isBoutique) {
      // Not boutique - redirect to appropriate dashboard
      if (user?.role === "admin" || user?.userType === "admin") {
        setLocation("/admin");
      } else {
        setLocation("/dashboard");
      }
    }
  }, [isAuthenticated, user, loading, setLocation]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  const isBoutique = user?.role === "merchant" || user?.userType === "merchant";

  if (!isAuthenticated || !isBoutique) {
    return null;
  }

  return <>{children}</>;
}
