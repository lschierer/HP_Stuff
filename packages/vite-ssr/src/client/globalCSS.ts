// src/client/globalCSS.ts
import debugFunction from "@shared/debug";
const DEBUG = debugFunction(new URL(import.meta.url).pathname);
if (DEBUG) {
  console.log(`loading global css styles`);
}
import "../styles/global.css";
