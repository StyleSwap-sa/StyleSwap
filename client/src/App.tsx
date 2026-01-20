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
      <Route path={"/checkout"} component={Checkout} />
      <Route path={"/analytics"} component={Analytics} />
      <Route path={"/b2b"} component={B2BLanding} />
      <Route path={"/b2b-signup"} component={B2BSignup} />
      <Route path={"/boutique-dashboard"} component={BoutiqueDashboard} />
      <Route path={"/boutique/:slug"} component={(props: any) => <BoutiqueLandingPage slug={props.params.slug} />} />
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
