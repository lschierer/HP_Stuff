/**
 * SERVER IMPLEMENTATION
 * Hono server that handles SSR with AWS Lambda support
 */

import { Hono } from "hono";
import { serveStatic } from "@hono/node-server/serve-static";
import { serve } from "@hono/node-server";
import { showRoutes } from "hono/dev";
import * as path from "node:path";
import { readFileSync } from "node:fs";

import { config } from "@shared/config";

import debugFunction from "@shared/debug";
const DEBUG = debugFunction(new URL(import.meta.url).pathname);

import FanFiction from "./FanFiction";
import Harrypedia from "./Harrypedia";
import Searches from "./Searches";

export const app = new Hono();
const port = process.env.PORT || 3000;

// Conditionally initialize livereload in development mode
if (
  config.NODE_ENV === "development" &&
  !process.env.AWS_LAMBDA_FUNCTION_NAME
) {
  // Use dynamic import for livereload
  const initLivereload = async () => {
    try {
      const livereloadModule = await import("livereload");
      const livereload =
        "default" in livereloadModule
          ? livereloadModule.default
          : livereloadModule;
      livereload.createServer().watch("dist");
      if (DEBUG) console.log("Livereload initialized");
    } catch (error) {
      console.error("Failed to initialize livereload:", error);
    }
  };

  // Initialize livereload without blocking
  initLivereload().catch(console.error);
}

app.route("/FanFiction", FanFiction);
app.route("/Harrypedia", Harrypedia);
app.route("/Searches", Searches);

// Only use static file serving when not in Lambda environment
if (!process.env.AWS_LAMBDA_FUNCTION_NAME) {
  // ✅ Serve static /client/ files from dist/client
  const distPath = "dist";
  if (DEBUG) console.log(`Serving /client from ${distPath}`);
  app.use("/client/*", serveStatic({ root: distPath }));

  // ✅ Serve static /styles/ files from dist/styles
  if (DEBUG) console.log("Serving /styles from dist/styles");
  app.use("/styles/*", serveStatic({ root: "dist" }));

  // ✅ Explicit handler for root-level *.html pages
  app.get("/:page", async (c, next) => {
    const { page } = c.req.param();
    const filePath = path.join(process.cwd(), `dist/${page}.html`);
    const handler = serveStatic({ path: filePath });
    return await handler(c, next); // ✅ Now provides both args
  });
}

app.get("/", async (c) => {
  try {
    const html = readFileSync("dist/index.html", "utf8");
    return c.html(html);
  } catch {
    return c.notFound();
  }
});

// ✅ Optional: fallback for true 404s
app.notFound((c) => {
  if (DEBUG) console.log(`server.ts 404 fallback: ${c.req.path}`);
  return c.text("Not found", 404);
});

// Export for SSG and serverless environments
export default {
  fetch: app.fetch,
  port,
};

// For development mode - only start the server when not in Lambda environment
if (config.NODE_ENV !== "production" && !process.env.AWS_LAMBDA_FUNCTION_NAME) {
  console.log("🔧 Starting development server");

  // Store the server instance so we can close it on HMR
  let serverInstance: ReturnType<typeof serve> | null = null;

  const startServer = () => {
    serverInstance = serve(
      {
        fetch: app.fetch,
        port: port as number,
      },
      (info) => {
        if (DEBUG || config.NODE_ENV !== "production")
          console.log(`🌍 Server is running on http://localhost:${info.port}`);
      }
    );

    return serverInstance;
  };

  // Start the server initially
  startServer();

  if (DEBUG) {
    showRoutes(app, {
      verbose: true,
    });
  }
}
