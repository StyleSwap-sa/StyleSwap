import React from "react";
import { createRoot } from "react-dom/client";
import "./index.css";

// Store errors to display
const errors: string[] = [];

// Capture all errors
window.addEventListener("error", (event) => {
  const error = `${event.error?.name || "Error"}: ${event.error?.message || event.message}`;
  errors.push(error);
  console.error("[Global Error]", error);
  updateErrorDisplay();
});

// Capture unhandled promise rejections
window.addEventListener("unhandledrejection", (event) => {
  const error = `Unhandled Promise: ${event.reason?.message || String(event.reason)}`;
  errors.push(error);
  console.error("[Unhandled Promise]", error);
  updateErrorDisplay();
});

// Update error display
function updateErrorDisplay() {
  const root = document.getElementById("root");
  if (root) {
    root.innerHTML = `
      <div style="
        background: #fff3cd;
        border: 2px solid #ff6b6b;
        padding: 20px;
        margin: 20px;
        border-radius: 8px;
        font-family: monospace;
        font-size: 12px;
        max-height: 80vh;
        overflow-y: auto;
      ">
        <h2 style="color: #d32f2f; margin-top: 0;">🚨 Application Errors Detected</h2>
        <div style="background: white; padding: 10px; border-radius: 4px; margin-bottom: 10px;">
          ${errors.map((e, i) => `<div style="margin: 5px 0; color: #d32f2f;"><strong>${i + 1}.</strong> ${e}</div>`).join("")}
        </div>
        <button onclick="location.reload()" style="
          background: #007AFF;
          color: white;
          border: none;
          padding: 10px 20px;
          border-radius: 6px;
          cursor: pointer;
          font-size: 14px;
        ">
          Retry
        </button>
      </div>
    `;
  }
}

// Try to load the app
async function initializeApp() {
  try {
    console.log("[App] Starting initialization...");

    // Import dependencies
    console.log("[App] Importing React Query...");
    const { QueryClient, QueryClientProvider } = await import("@tanstack/react-query");

    console.log("[App] Importing tRPC...");
    const { httpBatchLink, TRPCClientError } = await import("@trpc/client");
    const superjson = (await import("superjson")).default;

    console.log("[App] Importing tRPC client...");
    const { trpc } = await import("@/lib/trpc");

    console.log("[App] Importing App component...");
    const App = (await import("./App")).default;

    console.log("[App] Creating Query Client...");
    const queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: 1, staleTime: 1000 * 60 * 5 },
      },
    });

    console.log("[App] Creating tRPC client...");
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

    console.log("[App] Rendering React app...");
    const root = document.getElementById("root");
    if (!root) throw new Error("Root element not found");

    createRoot(root).render(
      <React.StrictMode>
        <trpc.Provider client={trpcClient} queryClient={queryClient}>
          <QueryClientProvider client={queryClient}>
            <App />
          </QueryClientProvider>
        </trpc.Provider>
      </React.StrictMode>
    );

    console.log("[App] Successfully mounted!");
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    errors.push(`Initialization Error: ${errorMsg}`);
    console.error("[App] Initialization failed:", error);
    updateErrorDisplay();
  }
}

// Start the app
console.log("[App] Page loaded, starting initialization...");
initializeApp();
