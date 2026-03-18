import { Suspense, lazy } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import { Loader2 } from "lucide-react";

// Eagerly load homepage and auth pages
import Home from "./pages/Home";
import AdminLogin from "./pages/AdminLogin";

// Lazy load all other pages
const Dashboard = lazy(() => import("./pages/Dashboard"));
const Pricing = lazy(() => import("./pages/Pricing"));
const Profile = lazy(() => import("./pages/Profile"));
const DemoTryOn = lazy(() => import("./pages/DemoTryOn"));
const Checkout = lazy(() => import("./pages/Checkout"));
const Analytics = lazy(() => import("./pages/Analytics"));
const Overview = lazy(() => import("./pages/Overview"));
const Technology = lazy(() => import("./pages/Technology"));
const Market = lazy(() => import("./pages/Market"));
const PricingPage = lazy(() => import("./pages/PricingPage"));
const ROI = lazy(() => import("./pages/ROI"));
const CaseStudiesPage = lazy(() => import("./pages/CaseStudiesPage"));
const ContactPage = lazy(() => import("./pages/ContactPage"));
const B2BLanding = lazy(() => import("./pages/B2BLanding"));
const B2BSignup = lazy(() => import("./pages/B2BSignup"));
const BoutiqueDashboard = lazy(() => import("./pages/BoutiqueDashboard"));
const BoutiqueLandingPage = lazy(() => import("./pages/BoutiqueLandingPage"));
const ProductManagement = lazy(() => import("./pages/ProductManagement"));
const BoutiqueCredits = lazy(() => import("./pages/BoutiqueCredits"));
const BoutiqueSettings = lazy(() => import("./pages/BoutiqueSettings"));
const AdminDashboard = lazy(() => import("./pages/AdminDashboard"));
const BoutiquePerformanceExport = lazy(() => import("./pages/BoutiquePerformanceExport"));
const BoutiqueFeatures = lazy(() => import("./pages/BoutiqueFeatures"));
const BoutiqueTutorial = lazy(() => import("./pages/BoutiqueTutorial"));
const CustomerTutorial = lazy(() => import("./pages/CustomerTutorial"));
const CustomerTryOn = lazy(() => import("./pages/CustomerTryOn"));
const BoutiqueTryOnPage = lazy(() => import("./pages/BoutiqueTryOnPage"));
const TestBoutiquePage = lazy(() => import("./pages/TestBoutiquePage"));
const BoutiqueShop = lazy(() => import("./pages/BoutiqueShop"));
const SocialSellerDashboard = lazy(() => import("./pages/SocialSellerDashboard"));
const ARTryOn = lazy(() => import("./pages/ARTryOn"));
const TryOnPage = lazy(() => import("./pages/TryOnPage"));
const TermsAndConditions = lazy(() => import("./pages/TermsAndConditions"));
const PrivacyPolicy = lazy(() => import("./pages/PrivacyPolicy"));
const RefundPolicy = lazy(() => import("./pages/RefundPolicy"));
const OwnerBoutiqueDashboard = lazy(() => import("./pages/OwnerBoutiqueDashboard"));
const MyOrders = lazy(() => import("./pages/MyOrders"));
const BoutiqueOrderDashboard = lazy(() => import("./pages/BoutiqueOrderDashboard"));
const OrderConfirmation = lazy(() => import("./pages/OrderConfirmation"));
const BoutiquePayoutDashboard = lazy(() => import("./pages/BoutiquePayoutDashboard"));
const AdminPayoutDashboard = lazy(() => import("./pages/AdminPayoutDashboard"));
const AdminCredits = lazy(() => import("./pages/AdminCredits"));
const ApiDocs = lazy(() => import("./pages/ApiDocs"));
const ForBoutiques = lazy(() => import("./pages/B2BLanding"));
const DeveloperPortal = lazy(() => import("./pages/DeveloperPortal"));
const BodyModels = lazy(() => import("./pages/BodyModels"));
const Blog = lazy(() => import("./pages/Blog"));
const WidgetDashboard = lazy(() => import("./pages/WidgetDashboard"));
const MyCloset = lazy(() => import("./pages/MyCloset"));
const OutfitVoting = lazy(() => import("./pages/OutfitVoting"));
const OutfitDiscovery = lazy(() => import("./pages/OutfitDiscovery"));
const NotificationCenter = lazy(() => import("./pages/NotificationCenter"));
const ModerationDashboard = lazy(() => import("./pages/ModerationDashboard"));
const UserProfile = lazy(() => import("./pages/UserProfile"));
const ReferralSignup = lazy(() => import("./pages/ReferralSignup"));
const BuyCredits = lazy(() => import("./pages/BuyCredits"));
const About = lazy(() => import("./pages/About"));
const RegisterApp = lazy(() => import("./pages/RegisterApp"));

// Loading fallback component
function LoadingFallback() {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4" />
        <p className="text-muted-foreground">Loading...</p>
      </div>
    </div>
  );
}

export default function App() {
  // make sure to consider if you need authentication for certain routes
  let { user, loading, error, isAuthenticated, logout } = useAuth();

  if (loading) {
    return <LoadingFallback />;
  }

  return (
    <ThemeProvider defaultTheme="light">
      <TooltipProvider>
        <ErrorBoundary>
          <Suspense fallback={<LoadingFallback />}>
            <Switch>
              <Route path="/" component={Home} />
              <Route path="/admin/login" component={AdminLogin} />
              <Route path="/dashboard" component={Dashboard} />
              <Route path="/pricing" component={Pricing} />
              <Route path="/profile" component={Profile} />
              <Route path="/demo" component={DemoTryOn} />
              <Route path="/checkout" component={Checkout} />
              <Route path="/analytics" component={Analytics} />
              <Route path="/overview" component={Overview} />
              <Route path="/technology" component={Technology} />
              <Route path="/market" component={Market} />
              <Route path="/pricing-page" component={PricingPage} />
              <Route path="/roi" component={ROI} />
              <Route path="/case-studies" component={CaseStudiesPage} />
              <Route path="/contact" component={ContactPage} />
              <Route path="/b2b" component={B2BLanding} />
              <Route path="/b2b/signup" component={B2BSignup} />
              <Route path="/boutique/dashboard" component={BoutiqueDashboard} />
              <Route path="/boutique/landing" component={BoutiqueLandingPage} />
              <Route path="/boutique/products" component={ProductManagement} />
              <Route path="/boutique/credits" component={BoutiqueCredits} />
              <Route path="/boutique/settings" component={BoutiqueSettings} />
              <Route path="/admin/dashboard" component={AdminDashboard} />
              <Route path="/boutique/performance" component={BoutiquePerformanceExport} />
              <Route path="/boutique/features" component={BoutiqueFeatures} />
              <Route path="/boutique/tutorial" component={BoutiqueTutorial} />
              <Route path="/customer/tutorial" component={CustomerTutorial} />
              <Route path="/customer/tryon" component={CustomerTryOn} />
              <Route path="/boutique/tryon" component={BoutiqueTryOnPage} />
              <Route path="/test-boutique" component={TestBoutiquePage} />
              <Route path="/boutique/shop" component={BoutiqueShop} />
              <Route path="/social-seller" component={SocialSellerDashboard} />
              <Route path="/ar-tryon" component={ARTryOn} />
              <Route path="/tryon" component={TryOnPage} />
              <Route path="/try-on" component={TryOnPage} />
              <Route path="/terms" component={TermsAndConditions} />
              <Route path="/privacy" component={PrivacyPolicy} />
              <Route path="/refund" component={RefundPolicy} />
              <Route path="/owner/boutique" component={OwnerBoutiqueDashboard} />
              <Route path="/orders" component={MyOrders} />
              <Route path="/boutique/orders" component={BoutiqueOrderDashboard} />
              <Route path="/order/confirmation" component={OrderConfirmation} />
              <Route path="/boutique/payouts" component={BoutiquePayoutDashboard} />
              <Route path="/admin/payouts" component={AdminPayoutDashboard} />
              <Route path="/admin/credits" component={AdminCredits} />
              <Route path="/api-docs" component={ApiDocs} />
              <Route path="/register-app" component={RegisterApp} />
              <Route path="/for-boutiques" component={ForBoutiques} />
              <Route path="/customer-try-on" component={CustomerTryOn} />
              <Route path="/developer" component={DeveloperPortal} />
              <Route path="/body-models" component={BodyModels} />
              <Route path="/boutique/:boutiqueId/widget" component={WidgetDashboard} />
              <Route path="/closet" component={MyCloset} />
              <Route path="/voting" component={OutfitVoting} />
              <Route path="/discover" component={OutfitDiscovery} />
              <Route path="/notifications" component={NotificationCenter} />
              <Route path="/moderation" component={ModerationDashboard} />
              <Route path="/profile/:userId" component={UserProfile} />
              <Route path="/referral/:referralCode" component={ReferralSignup} />
              <Route path="/buy-credits" component={BuyCredits} />
              <Route path="/about" component={About} />
              <Route path="/blog" component={Blog} />
              <Route component={NotFound} />
            </Switch>
          </Suspense>
        </ErrorBoundary>
      </TooltipProvider>
    </ThemeProvider>
  );
}
// Force rebuild - Wed Mar 11 16:30:00 GMT 2026
