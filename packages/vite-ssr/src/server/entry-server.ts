/**
 * SERVER-SIDE ENTRY POINT
 * This code only runs on the server
 */

import { Hono } from "hono";
import { renderApp } from "@shared/app";

// Create the Hono app
export const app = new Hono();

// Define your routes
app.get("/", (c) => {
  const appHtml = renderApp();
  // Return the rendered HTML
  return c.html(`
       <div id="app">${appHtml}</div>
       `);
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
console.log("🖥️ Server-side code is running on the server");

// Export the app for SSG
export default app;
