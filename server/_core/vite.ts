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
  // In development, it's in the project root
  const distPath = path.resolve(import.meta.dirname, "../../dist/public");
  if (!fs.existsSync(distPath)) {
    console.error(
      `Could not find the build directory: ${distPath}, make sure to build the client first`
    );
    console.error(`Current directory: ${import.meta.dirname}`);
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
      let html = await fs.promises.readFile(indexPath, "utf-8");
      
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
      console.error("Error serving index.html:", error);
      res.status(500).send("Internal Server Error");
    }
  });
}
