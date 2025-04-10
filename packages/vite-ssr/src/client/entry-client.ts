/**
 * CLIENT-SIDE ENTRY POINT
 * This code only runs in the browser
 */

import "../styles/index.css";
import { renderApp } from "@shared/app";

// Hydrate the app on the client side
const appElement = document.getElementById("app");
if (appElement) {
  renderApp(appElement);
} else {
  console.warn(`client side application element not found`);
}

// Add a comment to clearly identify client-side code during development
console.log("🌐 Client-side code is running in the browser");
