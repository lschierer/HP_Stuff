import * as fs from "node:fs";
import * as path from "node:path";

import { type ParsedResult } from "@hp-stuff/schemas";
import { defaultLayout } from "./layout";

import debugFunction from "@shared/debug";
const DEBUG = debugFunction(new URL(import.meta.url).pathname);

export const mdTohtml = async (
  reqPath: string
): Promise<ParsedResult | string> => {
  if (DEBUG) {
    console.log(`start of mdTohtml for ${reqPath}`);
  }
  const reqDir = path.dirname(reqPath);

  const mdPath = reqPath.endsWith(".md") ? reqPath : `${reqPath}.md`;

  if (fs.existsSync(mdPath)) {
    if (DEBUG) {
      console.log(`file ${mdPath} exists in mdTohtml`);
    }
    const fileContent = fs.readFileSync(mdPath, "utf-8");

    // Generate HTML from markdown content
    const result = await defaultLayout({
      title: "",
      route: reqDir,
      markdownContent: fileContent,
    });

    // Return the result directly - it's already a ParsedResult
    return result;
  } else {
    if (DEBUG) {
      console.warn(`file ${mdPath} does not exist in mdTohtml`);
      return `<span>No File found for ${reqPath} at ${mdPath} </span>`;
    }
    return "";
  }
};
