import { readFileSync } from "node:fs";
import { join } from "node:path";
import { parse } from "node:path";

import type { GetLayout } from "@greenwood/cli";

// Central control over whether or not to output debugging
import debugFunction from "../lib/debug.ts";
const DEBUG = debugFunction(new URL(import.meta.url).pathname);

/**
 * Custom layout for Harry Potter and the Nightmares of Futures Past pages
 *
 * This layout:
 * 1. Reads the standard layout HTML
 * 2. Removes the SideBar.ts script from the head
 * 3. Replaces <side-bar></side-bar> with the navigation fragment
 */
const HPNOFPLayout: GetLayout = async () => {
  if (DEBUG) {
    console.log("Applying HPNOFP layout");
  }

  /*start work around for GetFrontmatter requiring async */
  await new Promise((resolve) => setTimeout(resolve, 1));
  /* end workaround */

  // Get the path to the standard layout
  const standardLayoutPath = join(parse(import.meta.url).dir, "standard.html");

  // Get the path to the navigation fragment
  const navFragmentPath = join(
    parse(import.meta.url).dir,
    "..",
    "pages",
    "FanFiction",
    "Harry Potter and the Nightmares of Futures Past",
    "nav.fragment.html"
  );

  if (DEBUG) {
    console.log(`Standard layout path: ${standardLayoutPath}`);
    console.log(`Nav fragment path: ${navFragmentPath}`);
  }

  // Read the standard layout content
  let standardLayoutContent;
  try {
    standardLayoutContent = readFileSync(standardLayoutPath, "utf-8");
    if (DEBUG) {
      console.log("Successfully read standard layout");
    }
  } catch (error) {
    console.error(`Error reading standard layout: ${JSON.stringify(error)}`);
    throw new Error(`Failed to read standard layout: ${JSON.stringify(error)}`);
  }

  // Read the navigation fragment content
  let navFragmentContent;
  try {
    navFragmentContent = readFileSync(navFragmentPath, "utf-8");
    if (DEBUG) {
      console.log("Successfully read navigation fragment");
    }
  } catch (error) {
    console.error(
      `Error reading navigation fragment: ${JSON.stringify(error)}`
    );
    navFragmentContent = "<div>Navigation fragment could not be loaded</div>";
  }

  // 1. Remove the SideBar script from the head
  const sidebarScriptRegex =
    /<script[^>]*src="[^"]*SideBar\.ts"[^>]*><\/script>/;
  standardLayoutContent = standardLayoutContent.replace(sidebarScriptRegex, "");

  // 2. Replace <side-bar></side-bar> with the navigation fragment content
  const sideBarRegex = /<side-bar><\/side-bar>/;
  standardLayoutContent = standardLayoutContent.replace(
    sideBarRegex,
    `<div class="hpnofp-nav">${navFragmentContent}</div>`
  );

  return standardLayoutContent;
};

export { HPNOFPLayout as getLayout };
