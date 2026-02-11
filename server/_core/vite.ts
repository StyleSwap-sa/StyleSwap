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
  // Try multiple possible paths to find the dist/public folder
  let distPath = "";
  const possiblePaths = [
    path.resolve(process.cwd(), "dist/public"),
    path.resolve(import.meta.dirname, "../../dist/public"),
    path.resolve(import.meta.dirname, "../dist/public"),
    path.resolve(import.meta.dirname, "../../../dist/public"),
    "/app/dist/public",
    "/home/ubuntu/fitroom-ai-research/dist/public",
  ];
  
  console.log("[Static] Searching for dist/public folder...");
  console.log("[Static] process.cwd():", process.cwd());
  console.log("[Static] import.meta.dirname:", import.meta.dirname);
  
  for (const possiblePath of possiblePaths) {
    console.log("[Static] Checking:", possiblePath, "exists:", fs.existsSync(possiblePath));
    if (fs.existsSync(possiblePath)) {
      distPath = possiblePath;
      console.log("[Static] Found dist/public at:", distPath);
      break;
    }
  }
  
  if (!distPath) {
    console.error("[Static] ERROR: Could not find dist/public in any of the expected locations");
    console.error("[Static] Possible paths checked:", possiblePaths);
    console.error("[Static] Current working directory contents:", fs.readdirSync(process.cwd()).slice(0, 30));
    // Fallback to the first path anyway
    distPath = possiblePaths[0];
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
  app.use("*", async (req, res, next) => {
    // Don't serve index.html for API routes
    if (req.path.startsWith("/api/")) {
      return next();
    }
    
    // Don't serve index.html for health checks - let them fall through
    if (req.path === "/health") {
      return next();
    }

    try {
      const indexPath = path.resolve(distPath, "index.html");
      console.log("[Static] Attempting to serve index.html from:", indexPath);
      
      if (!fs.existsSync(indexPath)) {
        console.error("[Static] index.html not found at:", indexPath);
        return res.status(404).send("index.html not found");
      }
      
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
