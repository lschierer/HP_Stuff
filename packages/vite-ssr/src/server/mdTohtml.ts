import * as path from "node:path";
import * as fs from "node:fs";
import { fileURLToPath } from "node:url";

import { defaultLayout, type ParsedResult } from "./layout";

import debugFunction from "@shared/debug";
const DEBUG = debugFunction(new URL(import.meta.url).pathname);

export const mdTohtml = async (
  reqPath: string
): Promise<ParsedResult | string> => {
  if (DEBUG) {
    console.log(`start of mdTohtml for ${reqPath}`);
  }
  const reqDir = path.dirname(reqPath);
  const reqFile = path.basename(reqPath, ".html");

  const mdPath = path.join(
    fileURLToPath(import.meta.url),
    "../../pages/",
    reqDir,
    `${reqFile}.md`
  );

  if (fs.existsSync(mdPath)) {
    const fileContent = fs.readFileSync(mdPath, "utf-8");

    // Generate HTML from markdown content
    const result = await defaultLayout({
      title: "",
      markdownContent: fileContent,
    });

    // Return both the HTML and the frontmatter
    return result;
  } else {
    if (DEBUG) {
      return `<span>No File found for ${reqPath}</span>`;
    }
    return "";
  }
};
