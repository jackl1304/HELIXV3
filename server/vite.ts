
import express, { type Express } from "express";
import { createServer as createViteServer, type ViteDevServer } from "vite";
import { createLogger } from "vite";
import viteConfig from "../vite.config";
import path from "path";
import fs from "fs";
import { nanoid } from "nanoid";
import type { Server } from "http";

const viteLogger = createLogger();

export function log(message: string, source = "vite") {
  const time = new Date().toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });
  console.log(`${time} [${source}] ${message}`);
}

export async function setupVite(app: Express, server: Server): Promise<void> {
  try {
    // Resolve the correct root path for client directory
    const clientRoot = path.resolve(import.meta.dirname, "..", "client");
    const projectRoot = path.resolve(import.meta.dirname, "..");

    const vite = await createViteServer({
      ...viteConfig,
      configFile: false,
      root: clientRoot,
      resolve: {
        alias: {
          "@": path.resolve(projectRoot, "client", "src"),
          "@shared": path.resolve(projectRoot, "shared"),
          "@assets": path.resolve(projectRoot, "attached_assets"),
        },
      },
      customLogger: {
        ...viteLogger,
        error: (msg, options) => {
          viteLogger.error(msg, options);
          // Don't exit on Vite errors in development
        },
      },
      server: {
        middlewareMode: true,
        hmr: { server },
        allowedHosts: true,
      },
      appType: "custom",
    });

    app.use(vite.middlewares);

    // SPA fallback - only for non-API routes
    app.use("*", async (req, res, next) => {
      if (req.originalUrl.startsWith('/api/')) {
        return next();
      }

      try {
        const clientTemplate = path.resolve(
          import.meta.dirname,
          "..",
          "client",
          "index.html"
        );

        let template = await fs.promises.readFile(clientTemplate, "utf-8");
        template = template.replace(
          `src="/src/main.tsx"`,
          `src="/src/main.tsx?v=${nanoid()}"`
        );

        const page = await vite.transformIndexHtml(req.originalUrl, template);
        res.status(200).set({ "Content-Type": "text/html" }).end(page);
      } catch (e) {
        vite.ssrFixStacktrace(e as Error);
        next(e);
      }
    });

    log("Vite development server configured successfully");
  } catch (error) {
    log(`Vite setup failed: ${error}`, "error");
    throw error;
  }
}

export function serveStatic(app: Express): void {
  const distPath = path.resolve(import.meta.dirname, "..", "dist", "public");

  if (!fs.existsSync(distPath)) {
    log(`Build directory not found: ${distPath}`, "warning");
    log("Run 'npm run build' to create production build", "info");
    return;
  }

  // Serve static files with proper caching
  app.use(express.static(distPath, {
    maxAge: '1y',
    etag: true,
    lastModified: true,
    index: false // Don't auto-serve index.html
  }));

  // SPA fallback for non-API routes
  app.use("*", (req, res, next) => {
    if (req.path.startsWith('/api/')) {
      return next();
    }

    const indexPath = path.resolve(distPath, "index.html");
    if (fs.existsSync(indexPath)) {
      res.sendFile(indexPath);
    } else {
      res.status(404).send('Application not built properly');
    }
  });

  log(`Static files served from: ${distPath}`);
}
