import { useAuth } from "@/_core/hooks/useAuth";
import { useLocation } from "wouter";
import { useEffect } from "react";
import PublicLandingPage from "./PublicLandingPage";

export default function Home() {
  const { user, isAuthenticated, loading } = useAuth();
  const [, setLocation] = useLocation();

  // Redirect authenticated users to their appropriate dashboard
  useEffect(() => {
    if (loading) return; // Wait for auth state to load

    if (isAuthenticated && user) {
      // Determine which dashboard to redirect to based on user role
      if (user.role === 'admin' || user.userType === 'admin') {
        setLocation('/admin');
      } else if (user.role === 'merchant' || user.userType === 'merchant') {
        setLocation('/boutique-dashboard');
      } else {
        // Default to customer dashboard
        setLocation('/dashboard');
      }
    }
  }, [isAuthenticated, user, loading, setLocation]);

  // Show loading state while checking authentication
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  // If not authenticated, show the public landing page
  if (!isAuthenticated) {
    return <PublicLandingPage />;
  }

  // If authenticated, the useEffect above will redirect them
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
    </div>
  );
}
