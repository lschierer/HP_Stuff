/**
 * CLIENT-SIDE ENTRY POINT
 * This code only runs in the browser
 */

// Add a comment to clearly identify client-side code during development
import debugFunction from "@shared/debug";

const DEBUG = debugFunction(new URL(import.meta.url).pathname);
if (DEBUG || !(process.env.NODE_ENV !== "production")) {
  console.log("🌐 Client-side code is running in the browser");
  console.log(`process.env.NODE_ENV is ${process.env.NODE_ENV}`);
  console.log(`DEBUG is ${DEBUG}`);
  console.log(`pathname is ${new URL(import.meta.url).pathname}`);
}

import "@spectrum-web-components/theme/sp-theme.js";
import "@spectrum-web-components/theme/src/themes.js";
import "@spectrum-web-components/split-view/sp-split-view.js";
import "iconify-icon";
