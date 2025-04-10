/**
 * SERVER IMPLEMENTATION
 * Hono server that handles SSR
 */

import { Hono } from "hono";
import { serveStatic } from "@hono/node-server/serve-static";
import { serve } from "@hono/node-server";

import { fileURLToPath } from "url";
import { dirname, resolve } from "path";

import FanFiction from "./FanFiction";
import debugFunction from "@shared/debug";

const DEBUG = debugFunction(new URL(import.meta.url).pathname);
const __dirname = dirname(fileURLToPath(import.meta.url));
const app = new Hono();
const port = process.env.PORT || 3000;

// Serve static assets
app.use(
  "/assets/*",
  serveStatic({
    root: fileURLToPath(new URL("../assets/", import.meta.url)),
  })
);
app.use(
  "/client/*",
  serveStatic({ root: fileURLToPath(new URL("../", import.meta.url)) })
);

// Add this function to your server.ts file
async function readTemplate(path: string): Promise<string> {
  try {
    const fs = await import("fs/promises");
    return await fs.readFile(path, "utf-8");
  } catch (error) {
    if (DEBUG) console.error("Error reading template:", error);
    return '<!DOCTYPE html><html><body><div id="app"><!--ssr-outlet--></div></body></html>';
  }
}

app.route("/FanFiction", FanFiction);

// Handle all routes
app.get("*", async (c) => {
  if (DEBUG) console.log("🌐 Default route handler called:", c.req.path);

  try {
    // Import the SSR entry point
    const { render } = await import("./entry-server.js");

    // Get the rendered app HTML
    const { appHtml } = render();

    // Read the index.html template
    const template = await readTemplate(resolve(__dirname, "../../index.html"));

    // Inject the rendered app into the template
    const html = appHtml ? template.replace("<!--ssr-outlet-->", appHtml) : "";

    return c.html(html);
  } catch (e) {
    if (DEBUG) console.error(e);
    return c.text("Internal Server Error", 500);
  }
});

// Export for SSG and serverless environments
export default {
  fetch: app.fetch,
  port,
};

// For development mode
if (import.meta.env.DEV) {
  if (DEBUG) console.log("🔧 Starting development server");

  // Store the server instance so we can close it on HMR
  let serverInstance: ReturnType<typeof serve> | null = null;

  const startServer = () => {
    serverInstance = serve(
      {
        fetch: app.fetch,
        port: port as number,
      },
      (info) => {
        if (DEBUG)
          console.log(`🌍 Server is running on http://localhost:${info.port}`);
      }
    );

    return serverInstance;
  };

  // Start the server initially
  startServer();

  // Handle HMR for Vite
  if (import.meta.hot) {
    import.meta.hot.accept((newModule) => {
      if (DEBUG) console.log("🔄 HMR update detected, restarting server...");
      if (newModule === undefined) {
        if (DEBUG) console.warn(`newModule is undefined`);
      }

      // Close the existing server if it exists
      if (serverInstance) {
        serverInstance.close((err) => {
          if (err) {
            if (DEBUG) console.error(`❌ Error closing server: ${err}`);
          } else {
            if (DEBUG) console.log("✅ Previous server instance closed");
          }

          // Start a new server with the updated module
          startServer();
        });
      } else {
        // Just in case the server wasn't started or stored properly
        startServer();
      }
    });

    // Cleanup on dispose
    import.meta.hot.dispose(() => {
      if (DEBUG) console.log("🧹 Cleaning up server resources");
      if (serverInstance) {
        serverInstance.close((err) => {
          if (err) {
            if (DEBUG)
              console.error("❌ Error closing server on dispose:", err);
          }
        });
      }
    });
  }
}
