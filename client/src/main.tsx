import { trpc } from "@/lib/trpc";
import { UNAUTHED_ERR_MSG } from '@shared/const';
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { httpBatchLink, TRPCClientError } from "@trpc/client";
import { createRoot } from "react-dom/client";
import superjson from "superjson";
import App from "./App";
import { getLoginUrl } from "./const";
import "./index.css";

console.log('[Main] Initializing QueryClient...');
const queryClient = new QueryClient();
console.log('[Main] QueryClient initialized');

const redirectToLoginIfUnauthorized = (error: unknown) => {
  if (!(error instanceof TRPCClientError)) return;
  if (typeof window === "undefined") return;

  const isUnauthorized = error.message === UNAUTHED_ERR_MSG;

  if (!isUnauthorized) return;

  window.location.href = getLoginUrl();
};

queryClient.getQueryCache().subscribe(event => {
  if (event.type === "updated" && event.action.type === "error") {
    const error = event.query.state.error;
    redirectToLoginIfUnauthorized(error);
    console.error("[API Query Error]", error);
  }
});

queryClient.getMutationCache().subscribe(event => {
  if (event.type === "updated" && event.action.type === "error") {
    const error = event.mutation.state.error;
    redirectToLoginIfUnauthorized(error);
    console.error("[API Mutation Error]", error);
  }
});

console.log('[Main] Creating tRPC client...');
const trpcClient = trpc.createClient({
  links: [
    httpBatchLink({
      url: "/api/trpc",
      transformer: superjson,
      fetch(input, init) {
        return globalThis.fetch(input, {
          ...(init ?? {}),
          credentials: "include",
        });
      },
    }),
  ],
});

console.log('[Main] Creating React root...');
const rootElement = document.getElementById("root");
console.log('[Main] Root element:', rootElement);
if (!rootElement) {
  console.error('[Main] Root element not found!');
  document.body.innerHTML = '<div style="padding: 20px; font-family: sans-serif; background: #f5f5f5;"><h1>Error: Root element not found</h1><p>The application failed to initialize.</p></div>';
  throw new Error('Root element not found');
}

try {
  console.log('[Main] Rendering React app...');
  createRoot(rootElement).render(
  <trpc.Provider client={trpcClient} queryClient={queryClient}>
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  </trpc.Provider>
  );
  console.log('[Main] React app rendered successfully');
} catch (error) {
  console.error('[Main] Failed to render React app:', error);
  document.body.innerHTML = '<div style="padding: 20px; font-family: sans-serif; background: #fff3cd;"><h1>Application Error</h1><p>' + (error instanceof Error ? error.message : String(error)) + '</p><p>Check the browser console for more details.</p></div>';
}
