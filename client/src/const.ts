export { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";

// Cache for OAuth configuration
let oauthConfig: { appId: string; portalUrl: string } | null = null;

// Fetch OAuth configuration from server
async function fetchOAuthConfig() {
  if (oauthConfig) {
    return oauthConfig;
  }

  try {
    const response = await fetch("/api/oauth/config");
    if (response.ok) {
      oauthConfig = await response.json();
      console.log("[OAuth] Configuration fetched from server:", oauthConfig);
      return oauthConfig;
    }
  } catch (error) {
    console.error("[OAuth] Failed to fetch configuration from server:", error);
  }

  // Fallback to window variables if available
  const appId = (window as any).__VITE_APP_ID || "";
  const portalUrl = (window as any).__VITE_OAUTH_PORTAL_URL || "https://manus.im";
  
  oauthConfig = { appId, portalUrl };
  console.log("[OAuth] Using fallback configuration:", oauthConfig);
  return oauthConfig;
}

// Generate login URL at runtime so redirect URI reflects the current origin.
export const getLoginUrl = async () => {
  const config = await fetchOAuthConfig();
  const { appId, portalUrl } = config;
  
  // If OAuth is not configured, return a placeholder URL
  if (!appId) {
    console.warn("[OAuth] VITE_APP_ID is not configured. OAuth features will be disabled.");
    return "#oauth-not-configured";
  }
  
  const redirectUri = `${window.location.origin}/api/oauth/callback`;
  const state = btoa(redirectUri);

  const url = new URL(`${portalUrl}/app-auth`);
  url.searchParams.set("appId", appId);
  url.searchParams.set("redirectUri", redirectUri);
  url.searchParams.set("state", state);
  url.searchParams.set("type", "signIn");

  return url.toString();
};

// Generate boutique signup URL with merchant user type
export const getBoutiqueSignupUrl = async () => {
  const config = await fetchOAuthConfig();
  const { appId, portalUrl } = config;
  
  // If OAuth is not configured, return a placeholder URL
  if (!appId) {
    console.warn("[OAuth] VITE_APP_ID is not configured. OAuth features will be disabled.");
    return "#oauth-not-configured";
  }
  
  const redirectUri = `${window.location.origin}/api/oauth/callback`;
  const state = btoa(redirectUri);

  const url = new URL(`${portalUrl}/app-auth`);
  url.searchParams.set("appId", appId);
  url.searchParams.set("redirectUri", redirectUri);
  url.searchParams.set("state", state);
  url.searchParams.set("type", "signUp");
  url.searchParams.set("userType", "merchant");

  return url.toString();
};
