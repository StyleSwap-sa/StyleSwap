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

  app.use(vite.middlewares);
  app.use("*", async (req, res, next) => {
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
      template = template.replace(
        `src="/src/main.tsx"`,
        `src="/src/main.tsx?v=${nanoid()}"`
      );
      
      // Inject environment variables as global window variables
      const envScript = `
        <script>
          window.__VITE_OAUTH_PORTAL_URL = "${ENV.oAuthPortalUrl || "https://manus.im"}";
          window.__VITE_APP_ID = "${ENV.appId || ""}";
        </script>
      `;
      template = template.replace("<body>", `<body>${envScript}`);
      
      const page = await vite.transformIndexHtml(url, template);
      res.status(200).set({ "Content-Type": "text/html" }).end(page);
    } catch (e) {
      vite.ssrFixStacktrace(e as Error);
      next(e);
    }
  });
}

export function serveStatic(app: Express) {
  // In production, the dist folder is bundled with the server code
  // Use process.cwd() to get the working directory which is reliable in both dev and prod
  // The dist/public folder should be in the same directory as where the server is running
  const distPath = path.resolve(process.cwd(), "dist/public");
  console.log("[Static] Serving static files from:", distPath);
  console.log("[Static] process.cwd():", process.cwd());
  console.log("[Static] import.meta.dirname:", import.meta.dirname);
  
  if (!fs.existsSync(distPath)) {
    console.error(
      `[Static] ERROR: Could not find the build directory: ${distPath}`
    );
    console.error("[Static] Available directories:", fs.readdirSync(process.cwd()).slice(0, 20));
    // Try alternative paths
    const altPath1 = path.resolve(import.meta.dirname, "../../dist/public");
    const altPath2 = path.resolve(import.meta.dirname, "../dist/public");
    console.error("[Static] Trying alternative path 1:", altPath1, "exists:", fs.existsSync(altPath1));
    console.error("[Static] Trying alternative path 2:", altPath2, "exists:", fs.existsSync(altPath2));
  } else {
    console.log("[Static] Build directory found successfully");
  }

  // Serve static files (assets, public files, etc.) with proper cache headers
  app.use(express.static(distPath, {
    maxAge: "1h",
    etag: false,
  }));

  // fall through to index.html if the file doesn't exist
  // Only for HTML pages, not for static assets that don't exist
  app.use("*", async (req, res) => {
    // Don't serve index.html for API routes or health checks
    if (req.path.startsWith("/api/") || req.path.startsWith("/health")) {
      res.status(404).send("Not Found");
      return;
    }

    try {
      const indexPath = path.resolve(distPath, "index.html");
      console.log("[Static] Attempting to serve index.html from:", indexPath);
      let html = await fs.promises.readFile(indexPath, "utf-8");
      console.log("[Static] Successfully read index.html, size:", html.length, "bytes");
      
      // Inject environment variables as global window variables
      const envScript = `
        <script>
          window.__VITE_OAUTH_PORTAL_URL = "${ENV.oAuthPortalUrl || "https://manus.im"}";
          window.__VITE_APP_ID = "${ENV.appId || ""}";
        </script>
      `;
      html = html.replace("<body>", `<body>${envScript}`);
      
      res.set({ "Content-Type": "text/html" }).send(html);
    } catch (error) {
      console.error("[Static] Error serving index.html:", error);
      console.error("[Static] Error details:", error instanceof Error ? error.message : String(error));
      res.status(500).send("Internal Server Error");
    }
  });
}
