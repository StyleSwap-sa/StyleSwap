import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";
import Dashboard from "./pages/Dashboard";
import Pricing from "./pages/Pricing";
import Profile from "./pages/Profile";
import DemoTryOn from "./pages/DemoTryOn";
import Checkout from "./pages/Checkout";
import Analytics from "./pages/Analytics";
import Overview from "./pages/Overview";
import Technology from "./pages/Technology";
import Market from "./pages/Market";
import PricingPage from "./pages/PricingPage";
import ROI from "./pages/ROI";
import CaseStudiesPage from "./pages/CaseStudiesPage";
import ContactPage from "./pages/ContactPage";
import B2BLanding from "./pages/B2BLanding";
import B2BSignup from "./pages/B2BSignup";
import BoutiqueDashboard from "./pages/BoutiqueDashboard";
import BoutiqueLandingPage from "./pages/BoutiqueLandingPage";
import ProductManagement from "./pages/ProductManagement";
import BoutiqueCredits from "./pages/BoutiqueCredits";
import BoutiqueSettings from "./pages/BoutiqueSettings";
import AdminDashboard from "./pages/AdminDashboard";
import BoutiquePerformanceExport from "./pages/BoutiquePerformanceExport";
import BoutiqueFeatures from "./pages/BoutiqueFeatures";
import CustomerTryOn from "./pages/CustomerTryOn";
import BoutiqueTryOnPage from "./pages/BoutiqueTryOnPage";
import TestBoutiquePage from "./pages/TestBoutiquePage";
import AdminLogin from "./pages/AdminLogin";
import BoutiqueShop from "./pages/BoutiqueShop";
import SocialSellerDashboard from "./pages/SocialSellerDashboard";
import ARTryOn from "./pages/ARTryOn";
import TryOnPage from "./pages/TryOnPage";

function Router() {
  // make sure to consider if you need authentication for certain routes
  return (
    <Switch>
      <Route path={"/"} component={Home} />
      <Route path={"/overview"} component={Overview} />
      <Route path={"/technology"} component={Technology} />
      <Route path={"/market"} component={Market} />
      <Route path={"/pricing-page"} component={PricingPage} />
      <Route path={"/roi"} component={ROI} />
      <Route path={"/case-studies"} component={CaseStudiesPage} />
      <Route path={"/contact"} component={ContactPage} />
      <Route path={"/dashboard"} component={Dashboard} />
      <Route path={"/pricing"} component={Pricing} />
      <Route path={"/profile"} component={Profile} />
       <Route path={"/demo"} component={DemoTryOn} />
      <Route path={"/customer-try-on"} component={CustomerTryOn} />
      <Route path={"/checkout"} component={Checkout} />
      <Route path={"/analytics"} component={Analytics} />
      <Route path={"/b2b"} component={B2BLanding} />
      <Route path={"/b2b-signup"} component={B2BSignup} />
      <Route path={"/for-boutiques"} component={BoutiqueFeatures} />
      <Route path={"/boutique-dashboard"} component={BoutiqueDashboard} />
      <Route path={"/boutique/:slug"} component={(props: any) => <BoutiqueLandingPage slug={props.params.slug} />} />
      <Route path={"/boutique-products/:boutiqueId"} component={ProductManagement} />
      <Route path={"/boutique-credits/:boutiqueId"} component={BoutiqueCredits} />
      <Route path={"/boutique-settings/:boutiqueId"} component={BoutiqueSettings} />
      <Route path={"products"} component={ProductManagement} />
      <Route path={"/boutique/:slug/shop"} component={(props: any) => <BoutiqueShop slug={props.params.slug} />} />
      <Route path={"/social-seller-dashboard"} component={SocialSellerDashboard} />
      <Route path={"/boutique-try-on"} component={BoutiqueTryOnPage} />
      <Route path={"/test-boutique"} component={TestBoutiquePage} />
      <Route path={"/admin-login"} component={AdminLogin} />
      <Route path={"/admin-dashboard"} component={AdminDashboard} />
      <Route path={"/admin"} component={AdminDashboard} />
      <Route path={"admin/performance-export"} component={BoutiquePerformanceExport} />
      <Route path={"/ar-tryon"} component={ARTryOn} />
      <Route path={"/try-on"} component={TryOnPage} />
      <Route path={"/404"} component={NotFound} />
      {/* Final fallback route */}
      <Route component={NotFound} />
    </Switch>
  );
}

// NOTE: About Theme
// - First choose a default theme according to your design style (dark or light bg), than change color palette in index.css
//   to keep consistent foreground/background color across components
// - If you want to make theme switchable, pass `switchable` ThemeProvider and use `useTheme` hook

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider
        defaultTheme="light"
        // switchable
      >
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
