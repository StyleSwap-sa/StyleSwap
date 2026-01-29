export { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";

// Generate login URL at runtime so redirect URI reflects the current origin.
export const getLoginUrl = () => {
  // Get values from window object injected by server
  const oauthPortalUrl = (window as any).__VITE_OAUTH_PORTAL_URL || "https://manus.im";
  const appId = (window as any).__VITE_APP_ID || "";
  
  if (!appId) {
    console.error("[OAuth] VITE_APP_ID is not configured");
    throw new Error("OAuth configuration missing: VITE_APP_ID");
  }
  
  const redirectUri = `${window.location.origin}/api/oauth/callback`;
  const state = btoa(redirectUri);

  const url = new URL(`${oauthPortalUrl}/app-auth`);
  url.searchParams.set("appId", appId);
  url.searchParams.set("redirectUri", redirectUri);
  url.searchParams.set("state", state);
  url.searchParams.set("type", "signIn");

  return url.toString();
};

// Generate boutique signup URL with merchant user type
export const getBoutiqueSignupUrl = () => {
  // Get values from window object injected by server
  const oauthPortalUrl = (window as any).__VITE_OAUTH_PORTAL_URL || "https://manus.im";
  const appId = (window as any).__VITE_APP_ID || "";
  
  if (!appId) {
    console.error("[OAuth] VITE_APP_ID is not configured");
    throw new Error("OAuth configuration missing: VITE_APP_ID");
  }
  
  const redirectUri = `${window.location.origin}/api/oauth/callback`;
  const state = btoa(redirectUri);

  const url = new URL(`${oauthPortalUrl}/app-auth`);
  url.searchParams.set("appId", appId);
  url.searchParams.set("redirectUri", redirectUri);
  url.searchParams.set("state", state);
  url.searchParams.set("type", "signUp");
  url.searchParams.set("userType", "merchant");

  return url.toString();
};
