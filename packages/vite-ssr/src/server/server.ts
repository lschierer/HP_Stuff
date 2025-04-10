/**
 * SERVER IMPLEMENTATION
 * Hono server that handles SSR
 */

import { Hono } from "hono";
import { serveStatic } from "@hono/node-server/serve-static";
import { fileURLToPath } from "url";
import { dirname, resolve } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const app = new Hono();
const port = process.env.PORT || 3000;

// Serve static assets
// resolve(__dirname, "../client")
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
    console.error("Error reading template:", error);
    return '<!DOCTYPE html><html><body><div id="app"><!--ssr-outlet--></div></body></html>';
  }
}

// Handle all routes
app.get("*", async (c) => {
  try {
    // Import the SSR entry point
    const { render } = await import("./entry-server.js");

    // Get the rendered app HTML
    const { appHtml } = render();

    // Read the index.html template (you'd need to implement this)
    const template = await readTemplate(resolve(__dirname, "../../index.html"));

    // Inject the rendered app into the template
    const html = appHtml ? template.replace("<!--ssr-outlet-->", appHtml) : "";

    return c.html(html);
  } catch (e) {
    console.error(e);
    return c.text("Internal Server Error", 500);
  }
});

// Start the server
console.log(`Server running at http://localhost:${port}`);
export default {
  fetch: app.fetch,
  port,
};
