import { trpc } from "@/lib/trpc";
import { UNAUTHED_ERR_MSG } from '@shared/const';
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { httpBatchLink, TRPCClientError } from "@trpc/client";
import superjson from "superjson";
import { getLoginUrl } from "./const";
import { createRoot } from "react-dom/client";
import App from "./App";
import React from "react";

// Global error tracking
const logError = (context: string, error: unknown) => {
  const errorMsg = error instanceof Error ? error.message : String(error);
  const errorStack = error instanceof Error ? error.stack : '';
  console.error(`[${context}] ${errorMsg}`, error);
  
  // Send to server for logging
  try {
    fetch('/api/client-error', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        context,
        message: errorMsg,
        stack: errorStack,
        url: window.location.href,
        timestamp: new Date().toISOString(),
      }),
    }).catch(err => console.error('[Error Logging] Failed to send error to server:', err));
  } catch (err) {
    console.error('[Error Logging] Exception:', err);
  }
};

// Set up global error handlers
window.addEventListener('error', (event) => {
  logError('Global Error Handler', event.error);
});

window.addEventListener('unhandledrejection', (event) => {
  logError('Unhandled Promise Rejection', event.reason);
});

console.log('[Main] Starting application initialization...');
console.log('[Main] Environment:', {
  NODE_ENV: process.env.NODE_ENV,
  VITE_APP_ID: process.env.VITE_APP_ID ? '***' : 'undefined',
  VITE_OAUTH_PORTAL_URL: process.env.VITE_OAUTH_PORTAL_URL || 'undefined',
});

try {
  console.log('[Main] Creating QueryClient...');
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: 1,
        staleTime: 1000 * 60 * 5, // 5 minutes
      },
    },
  });

  console.log('[Main] Setting up error handlers...');
  const redirectToLoginIfUnauthorized = (error: unknown) => {
    if (!(error instanceof TRPCClientError)) return;
    if (typeof window === "undefined") return;

    const isUnauthorized = error.message === UNAUTHED_ERR_MSG;

    if (!isUnauthorized) return;

    console.warn('[Main] Unauthorized error detected, redirecting to login');
    window.location.href = getLoginUrl();
  };

  queryClient.getQueryCache().subscribe(event => {
    if (event.type === "updated" && event.action.type === "error") {
      const error = event.query.state.error;
      redirectToLoginIfUnauthorized(error);
      logError('Query Error', error);
    }
  });

  queryClient.getMutationCache().subscribe(event => {
    if (event.type === "updated" && event.action.type === "error") {
      const error = event.mutation.state.error;
      redirectToLoginIfUnauthorized(error);
      logError('Mutation Error', error);
    }
  });

  console.log('[Main] Creating tRPC client...');
  const trpcClient = trpc.createClient({
    links: [
      httpBatchLink({
        url: "/api/trpc",
        transformer: superjson,
        fetch(input, init) {
          console.log('[tRPC] Fetch:', input);
          return globalThis.fetch(input, {
            ...(init ?? {}),
            credentials: "include",
          });
        },
      }),
    ],
  });

  console.log('[Main] Getting root element...');
  const rootElement = document.getElementById("root");
  
  if (!rootElement) {
    throw new Error('Root element (#root) not found in DOM');
  }

  console.log('[Main] Root element found, creating React root...');
  const root = createRoot(rootElement);

  console.log('[Main] Rendering App component...');
  root.render(
    <React.StrictMode>
      <trpc.Provider client={trpcClient} queryClient={queryClient}>
        <QueryClientProvider client={queryClient}>
          <App />
        </QueryClientProvider>
      </trpc.Provider>
    </React.StrictMode>
  );

  console.log('[Main] Application rendered successfully');
} catch (error) {
  logError('Application Initialization', error);
  
  // Render error UI
  const rootElement = document.getElementById("root");
  if (rootElement) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    const errorStack = error instanceof Error ? error.stack : '';
    
    rootElement.innerHTML = `
      <div style="
        padding: 40px;
        font-family: monospace;
        background: #fee;
        color: #c00;
        max-width: 800px;
        margin: 40px auto;
        border: 2px solid #c00;
        border-radius: 8px;
      ">
        <h1 style="margin-top: 0; color: #c00;">⚠️ Application Error</h1>
        <p><strong>Error:</strong> ${errorMsg}</p>
        <details style="margin-top: 20px; cursor: pointer;">
          <summary style="font-weight: bold; padding: 10px; background: #f0f0f0; border-radius: 4px;">Stack Trace</summary>
          <pre style="
            background: #f5f5f5;
            padding: 10px;
            border-radius: 4px;
            overflow-x: auto;
            margin-top: 10px;
            font-size: 12px;
          ">${errorStack}</pre>
        </details>
        <p style="margin-top: 20px; font-size: 12px; color: #666;">
          Check the browser console (F12) for more details.
        </p>
      </div>
    `;
  }
  
  throw error;
}
