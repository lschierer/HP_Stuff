/**
 * SERVER-SIDE ENTRY POINT
 * This code only runs on the server
 */

import { Hono } from "hono";
import { renderApp } from "@shared/app";
import { defaultLayout } from "./layout";

import debugFunction from "@shared/debug";

const DEBUG = debugFunction(new URL(import.meta.url).pathname);

// Create the Hono app
export const app = new Hono();

// Define your routes
app.get("/", async (c) => {
  const appHtml = renderApp();
  // Return the rendered HTML

  const rp = String(
    await defaultLayout({
      title: "",
      content: appHtml ?? "",
    })
  );
  return c.html(rp);
});

// Function to render the app on the server
export function render() {
  // Create a container for the app
  const appHtml = renderApp();

  // Return the rendered HTML
  return {
    appHtml,
    // You can add more data here to be passed to the client
  };
}

// Log to clearly identify server-side code during development
if (DEBUG) console.log("🖥️ Server-side code is running on the server");

// Export the app for SSG
export default app;
