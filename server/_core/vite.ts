import express, { type Express } from "express";
import fs from "fs";
import { type Server } from "http";
import { nanoid } from "nanoid";
import path from "path";
import { createServer as createViteServer } from "vite";
import viteConfig from "../../vite.config";
import { ENV } from "./env";

export async function setupVite(app: Express, server: Server) {
  const serverOptions = {
    middlewareMode: true,
    hmr: { server },
    allowedHosts: true as const,
  };

  const vite = await createViteServer({
    ...viteConfig,
    configFile: false,
    server: serverOptions,
    appType: "custom",
  });

  // Apply Vite middleware but skip API routes
  app.use((req, res, next) => {
    // Skip Vite middleware for API routes
    if (req.path.startsWith("/api")) {
      return next();
    }
    vite.middlewares(req, res, next);
  });
  
  // SPA fallback - serve index.html for all non-API routes
  app.use("*", async (req, res, next) => {
    // Skip API routes and static assets
    console.log("[Vite SPA] Received request:", req.path);
    if (req.path.startsWith("/api")) {
      console.log("[Vite SPA] Skipping API route:", req.path);
      return next();
    }
    if (req.path.match(/\\.(js|css|json|png|jpg|svg|ico|woff|woff2)$/)) {
      console.log("[Vite SPA] Skipping static asset:", req.path);
      return next();
    }
    const url = req.originalUrl;

    try {
      const clientTemplate = path.resolve(
        import.meta.dirname,
        "../..",
        "client",
        "index.html"
      );

      // always reload the index.html file from disk incase it changes
      let template = await fs.promises.readFile(clientTemplate, "utf-8");
      
      // Only replace the script tag if it exists (for development with React)
      if (template.includes(`src="/src/main.tsx"`)) {
        template = template.replace(
          `src="/src/main.tsx"`,
          `src="/src/main.tsx?v=${nanoid()}"`
        );
      }
      
      // Inject environment variables as global window variables
      const envScript = `
        <script>
          window.__VITE_OAUTH_PORTAL_URL = "${ENV.oAuthPortalUrl || "https://manus.im"}";
          window.__VITE_APP_ID = "${ENV.appId || ""}";  
          console.log('[Vite] OAuth variables injected:', {
            appId: window.__VITE_APP_ID,
            portalUrl: window.__VITE_OAUTH_PORTAL_URL
          });
        </script>
      `;
      // Try to inject before </head>, then </body>, then just append
      if (template.includes("</head>")) {
        template = template.replace("</head>", `${envScript}</head>`);
      } else if (template.includes("<body>")) {
        template = template.replace("<body>", `<body>${envScript}`);
      } else {
        template += envScript;
      }
      console.log('[Vite] Template injection - appId:', ENV.appId, 'portalUrl:', ENV.oAuthPortalUrl);
      
      const page = await vite.transformIndexHtml(url, template);
      res.status(200).set({ "Content-Type": "text/html" }).end(page);
    } catch (e) {
      console.error("[Vite] Error serving index.html:", e);
      vite.ssrFixStacktrace(e as Error);
      // Serve a fallback error page instead of passing to next middleware
      const fallbackHtml = `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="UTF-8" />
            <meta name="viewport" content="width=device-width, initial-scale=1.0" />
            <title>Loading...</title>
            <style>
              body { margin: 0; padding: 20px; font-family: sans-serif; background: #f5f5f5; }
              .error { background: white; padding: 20px; border-radius: 8px; max-width: 600px; margin: 50px auto; }
              h1 { color: #333; margin-top: 0; }
              p { color: #666; line-height: 1.6; }
              code { background: #f0f0f0; padding: 2px 6px; border-radius: 3px; font-family: monospace; }
            </style>
          </head>
          <body>
            <div class="error">
              <h1>⚠️ Application Loading</h1>
              <p>The application is initializing. If you see this message for more than a few seconds, please refresh the page.</p>
              <p>Error details: <code>${e instanceof Error ? e.message : String(e)}</code></p>
            </div>
            <script>
              // Auto-refresh after 3 seconds
              setTimeout(() => { location.reload(); }, 3000);
            </script>
          </body>
        </html>
      `;
      res.status(200).set({ "Content-Type": "text/html" }).send(fallbackHtml);
    }
  });
}

export function serveStatic(app: Express) {
  console.log("[Static] Starting static file server configuration...");
  console.log("[Static] process.cwd():", process.cwd());
  console.log("[Static] import.meta.dirname:", import.meta.dirname);
  
  // Build a comprehensive list of possible paths
  const possiblePaths = [
    // Relative to current working directory
    path.resolve(process.cwd(), "dist/public"),
    path.resolve(process.cwd(), "dist"),
    
    // Relative to the server code location
    path.resolve(import.meta.dirname, "../../dist/public"),
    path.resolve(import.meta.dirname, "../../dist"),
    path.resolve(import.meta.dirname, "../dist/public"),
    path.resolve(import.meta.dirname, "../dist"),
    path.resolve(import.meta.dirname, "../../../dist/public"),
    path.resolve(import.meta.dirname, "../../../dist"),
    
    // Common deployment paths
    "/app/dist/public",
    "/app/dist",
    "/home/ubuntu/fitroom-ai-research/dist/public",
    "/home/ubuntu/fitroom-ai-research/dist",
    "/root/dist/public",
    "/root/dist",
  ];
  
  let distPath = "";
  
  // Try to find the dist/public folder
  for (const possiblePath of possiblePaths) {
    const publicPath = possiblePath.endsWith('/public') ? possiblePath : path.join(possiblePath, 'public');
    const distOnlyPath = possiblePath.endsWith('/public') ? path.dirname(possiblePath) : possiblePath;
    
    if (fs.existsSync(publicPath)) {
      distPath = publicPath;
      console.log("[Static] Found dist/public at:", distPath);
      break;
    }
    
    // Also check if dist folder exists (might have index.html directly in dist)
    if (fs.existsSync(distOnlyPath) && fs.existsSync(path.join(distOnlyPath, 'index.html'))) {
      distPath = distOnlyPath;
      console.log("[Static] Found dist with index.html at:", distPath);
      break;
    }
  }
  
  if (!distPath) {
    console.error("[Static] ERROR: Could not find dist folder in any of the expected locations");
    try {
      const cwdContents = fs.readdirSync(process.cwd());
      console.error("[Static] Current working directory contents:", cwdContents.slice(0, 50));
      
      // Try to find any dist folder
      const distDirs = cwdContents.filter(f => f.includes('dist'));
      if (distDirs.length > 0) {
        console.error("[Static] Found dist-related directories:", distDirs);
      }
    } catch (e) {
      console.error("[Static] Could not read directory:", e);
    }
    
    // Fallback: use the first path and hope it exists at runtime
    distPath = possiblePaths[0];
    console.warn("[Static] Using fallback path:", distPath);
  } else {
    console.log("[Static] Build directory found successfully");
    // Verify index.html exists
    const indexPath = path.resolve(distPath, 'index.html');
    if (fs.existsSync(indexPath)) {
      const stats = fs.statSync(indexPath);
      console.log("[Static] index.html found, size:", stats.size, "bytes");
    } else {
      console.warn("[Static] index.html not found at:", indexPath);
    }
  }

  // Serve static files (assets, public files, etc.) with proper cache headers
  // Skip API routes
  app.use((req, res, next) => {
    if (req.path.startsWith("/api") || req.path === "/health") {
      return next();
    }
    express.static(distPath, {
      maxAge: "1h",
      etag: false,
    })(req, res, next);
  });

  // fall through to index.html if the file doesn't exist
  // Only for HTML pages, not for static assets that don't exist
  // Use app.get instead of app.use to avoid catching API routes
  app.get("*", async (req, res, next) => {
    // Don't serve index.html for API routes or health checks
    if (req.path.startsWith("/api") || req.path === "/health" || req.path.startsWith("/api-json")) {
      console.log("[Static] Skipping SPA fallback for:", req.path);
      return next();
    }
    
    // Skip for known static file extensions
    if (req.path.match(/\.(js|css|json|png|jpg|jpeg|gif|svg|ico|woff|woff2|ttf|eot|map)$/i)) {
      return next();
    }

    try {
      const indexPath = path.resolve(distPath, 'index.html');
      
      if (!fs.existsSync(indexPath)) {
        console.error("[Static] index.html not found at:", indexPath);
        console.error("[Static] distPath:", distPath);
        console.error("[Static] distPath exists:", fs.existsSync(distPath));
        if (fs.existsSync(distPath)) {
          console.error("[Static] Contents of distPath:", fs.readdirSync(distPath));
        }
        // Serve a helpful error page instead of 404
        const errorHtml = `
          <!DOCTYPE html>
          <html>
            <head>
              <meta charset="UTF-8" />
              <meta name="viewport" content="width=device-width, initial-scale=1.0" />
              <title>Build Error</title>
              <style>
                body { margin: 0; padding: 20px; font-family: sans-serif; background: #f5f5f5; }
                .error { background: white; padding: 20px; border-radius: 8px; max-width: 600px; margin: 50px auto; }
                h1 { color: #d32f2f; margin-top: 0; }
                p { color: #666; line-height: 1.6; }
                code { background: #f0f0f0; padding: 2px 6px; border-radius: 3px; font-family: monospace; }
                .path { background: #fff3cd; padding: 10px; border-radius: 4px; margin: 10px 0; font-family: monospace; font-size: 12px; }
              </style>
            </head>
            <body>
              <div class="error">
                <h1>❌ Build Output Not Found</h1>
                <p>The application has not been built yet. Please run <code>npm run build</code> to create the production build.</p>
                <p><strong>Looking for:</strong></p>
                <div class="path">${indexPath}</div>
                <p><strong>Available paths:</strong></p>
                <div class="path">${distPath}</div>
              </div>
            </body>
          </html>
        `;
        return res.status(200).set({ "Content-Type": "text/html" }).send(errorHtml);
      }
      
      let html = await fs.promises.readFile(indexPath, "utf-8");
      console.log("[Static] Successfully served index.html for:", req.path);
      
      // Inject environment variables as global window variables
      const envScript = `
        <script>
          window.__VITE_OAUTH_PORTAL_URL = "${ENV.oAuthPortalUrl || "https://manus.im"}";
          window.__VITE_APP_ID = "${ENV.appId || ""}";  
        </script>
      `;
      // Try to inject before </head>, then </body>, then just append
      if (html.includes("</head>")) {
        html = html.replace("</head>", `${envScript}</head>`);
      } else if (html.includes("<body>")) {
        html = html.replace("<body>", `<body>${envScript}`);
      } else {
        html += envScript;
      }
      
      res.set({ "Content-Type": "text/html" }).send(html);
    } catch (error) {
      console.error("[Static] Error serving index.html:", error);
      console.error("[Static] Error details:", error instanceof Error ? error.message : String(error));
      // Serve a helpful error page instead of 500
      const errorHtml = `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="UTF-8" />
            <meta name="viewport" content="width=device-width, initial-scale=1.0" />
            <title>Server Error</title>
            <style>
              body { margin: 0; padding: 20px; font-family: sans-serif; background: #f5f5f5; }
              .error { background: white; padding: 20px; border-radius: 8px; max-width: 600px; margin: 50px auto; }
              h1 { color: #d32f2f; margin-top: 0; }
              p { color: #666; line-height: 1.6; }
              code { background: #f0f0f0; padding: 2px 6px; border-radius: 3px; font-family: monospace; }
            </style>
          </head>
          <body>
            <div class="error">
              <h1>⚠️ Server Error</h1>
              <p>An error occurred while serving the application.</p>
              <p><strong>Error:</strong> <code>${error instanceof Error ? error.message : String(error)}</code></p>
              <p>Please try refreshing the page.</p>
            </div>
          </body>
        </html>
      `;
      res.status(200).set({ "Content-Type": "text/html" }).send(errorHtml);
    }
  });
}
