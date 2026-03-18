import React from "react";
import { createRoot } from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { httpBatchLink, TRPCClientError } from "@trpc/client";
import superjson from "superjson";
import { trpc } from "@/lib/trpc";
import App from "./App";
import "./index.css";
import { UNAUTHED_ERR_MSG } from "@shared/const";
import { getLoginUrl } from "./const";

// Initialize Query Client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 1000 * 60 * 5, // 5 minutes
    },
  },
});

// Handle unauthorized errors
const redirectToLoginIfUnauthorized = (error: unknown) => {
  if (!(error instanceof TRPCClientError)) return;
  if (typeof window === "undefined") return;

  const isUnauthorized = error.message === UNAUTHED_ERR_MSG;
  if (!isUnauthorized) return;

  window.location.href = getLoginUrl();
};

// Subscribe to query errors
queryClient.getQueryCache().subscribe((event) => {
  if (event.type === "updated" && event.action.type === "error") {
    const error = event.query.state.error;
    redirectToLoginIfUnauthorized(error);
    console.error("[API Query Error]", error);
  }
});

// Subscribe to mutation errors
queryClient.getMutationCache().subscribe((event) => {
  if (event.type === "updated" && event.action.type === "error") {
    const error = event.mutation.state.error;
    redirectToLoginIfUnauthorized(error);
    console.error("[API Mutation Error]", error);
  }
});

// Create tRPC client with error handling
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

// Render the app
try {
  const root = document.getElementById("root");
  if (!root) {
    throw new Error("Root element not found");
  }

  createRoot(root).render(
    <React.StrictMode>
      <trpc.Provider client={trpcClient} queryClient={queryClient}>
        <QueryClientProvider client={queryClient}>
          <App />
        </QueryClientProvider>
      </trpc.Provider>
    </React.StrictMode>
  );

  console.log("[App] Successfully mounted");
} catch (error) {
  console.error("[App] Fatal error during initialization:", error);

  // Display error to user
  const root = document.getElementById("root");
  if (root) {
    root.innerHTML = `
      <div style="
        display: flex;
        align-items: center;
        justify-content: center;
        min-height: 100vh;
        background: #f5f5f5;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
        padding: 20px;
      ">
        <div style="
          background: white;
          padding: 40px;
          border-radius: 8px;
          max-width: 500px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        ">
          <h1 style="color: #333; margin-top: 0;">⚠️ Application Error</h1>
          <p style="color: #666; line-height: 1.6;">
            The application encountered an error during initialization.
          </p>
          <p style="color: #999; font-size: 14px; font-family: monospace;">
            ${error instanceof Error ? error.message : String(error)}
          </p>
          <button onclick="location.reload()" style="
            background: #007AFF;
            color: white;
            border: none;
            padding: 10px 20px;
            border-radius: 6px;
            cursor: pointer;
            font-size: 16px;
          ">
            Retry
          </button>
        </div>
      </div>
    `;
  }
}
