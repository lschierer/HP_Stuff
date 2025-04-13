import * as fs from "node:fs";

import debugFunction from "@shared/debug";
const DEBUG = debugFunction(new URL(import.meta.url).pathname);

console.log(`🔍 DEBUG ${DEBUG} for ${new URL(import.meta.url).pathname}`);

export const isDirectorySync = (filePath: string) => {
  if (DEBUG) {
    console.log(`checking if ${filePath} is a Directory`);
  }
  try {
    const stats = fs.statSync(filePath); // or fs.lstatSync(filePath)
    return stats.isDirectory();
  } catch (error: unknown) {
    // Handle errors such as file not found
    if (DEBUG) {
      console.error(
        `Error checking path ${filePath}: ${error instanceof Error ? error.message : JSON.stringify(error)}`
      );
    }
    return false;
  }
};
