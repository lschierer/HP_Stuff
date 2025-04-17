import fs from "node:fs/promises";
import path from "node:path";

import type {
  GetFrontmatter,
  GetBody,
  Frontmatter,
  GetLayout,
  Compilation,
  Page,
} from "@greenwood/cli";

import debugFunction from "../lib/debug.ts";
const DEBUG = debugFunction(new URL(import.meta.url).pathname);
if (DEBUG) {
  console.log(`debugging enabled for ${new URL(import.meta.url).pathname}`);
}

const getBody: GetBody = async () => {
  /*start work around for  requiring async */
  await new Promise((resolve) => setTimeout(resolve, 1));
  /* end workaround */

  return `BODY`;
};

const getFrontmatter: GetFrontmatter = async () => {
  /*start work around for  requiring async */
  await new Promise((resolve) => setTimeout(resolve, 1));
  /* end workaround */

  return {
    collection: ["FanFiction", "HPNOFP"],
    title: "TITLETEXT",
    data: {
      author: "Luke Schierer",
      tableOfContents: "false",
    },
  } as Frontmatter;
};

// Function to load the nav fragment
const loadNavFragment = async (compilation: Compilation, tocPage: Page) => {
  try {
    // Determine if we're in development or production mode
    const mode =
      process.env.__GWD_COMMAND__ === "develop" ? "development" : "production";

    if (DEBUG) {
      console.log(`Current mode: ${mode}, TOC route: ${tocPage.route}`);
    }

    let navFragmentPath;
    let navContent = "";

    const tocRoute = decodeURIComponent(tocPage.route);
    const tocDirPath = path.dirname(tocRoute);

    if (mode === "development") {
      // In dev mode, construct path from the TOC route
      // In dev mode, construct path from the TOC route

      navFragmentPath = path.join(
        new URL(compilation.context.pagesDir).pathname,
        tocDirPath.replace(/^\//, ""),
        "nav.fragment.html"
      );

      if (DEBUG) {
        console.log(
          `Dev mode path construction: ${tocDirPath} -> ${navFragmentPath}`
        );
      }
    } else {
      // In production mode, the fragment should be in the output directory

      navFragmentPath = path.join(
        new URL(compilation.context.outputDir).pathname,
        tocDirPath.replace(/^\//, ""),
        "nav.fragment.html"
      );
    }

    if (DEBUG) {
      console.log(`Looking for nav fragment at: ${navFragmentPath}`);
    }

    try {
      navContent = await fs.readFile(navFragmentPath, "utf-8");
      if (DEBUG) {
        console.log("Successfully loaded nav fragment");
      }
    } catch (error) {
      if (DEBUG) {
        console.warn(
          `Could not load nav fragment from ${navFragmentPath}:`,
          error
        );
      }

      // Try an alternate location if the first attempt fails
      if (mode === "development") {
        // Try the public directory as fallback
        const altPath = path.join(
          compilation.context.outputDir.pathname,
          tocPage.route.replace(/^\//, "").replace(/\/$/, ""),
          "nav.fragment.html"
        );

        try {
          navContent = await fs.readFile(altPath, "utf-8");
          if (DEBUG) {
            console.log(
              `Successfully loaded nav fragment from alternate location: ${altPath}`
            );
          }
        } catch (altError) {
          if (DEBUG) {
            console.warn(
              `Could not load nav fragment from alternate location ${altPath}`,
              altError
            );
          }
        }
      }
    }

    return navContent;
  } catch (error) {
    if (DEBUG) {
      console.error("Error loading nav fragment:", error);
    }

    return "";
  }
};

const getLayout: GetLayout = async (
  compilation: Compilation,
  route: object | string
) => {
  /*start work around for  requiring async */
  await new Promise((resolve) => setTimeout(resolve, 1));
  /* end workaround */

  let realRoute = "";
  if (typeof route === "object") {
    realRoute = route["route" as keyof typeof route] as string;
  } else {
    realRoute = route;
  }

  if (typeof route === "object") {
    if (DEBUG) {
      console.log(
        `route has keys ${Object.keys(route)
          .map((k) => k)
          .join(" ")}`,
        `route.keys looks like ${JSON.stringify(route["route" as keyof typeof route])}`
      );
    }
  }

  if (realRoute.endsWith("TOC/")) {
    return `
    <main>
      <content-outlet></content-outlet>
    </main>
    `;
  }
  const page = compilation.graph.find((p) => {
    return !p.route.localeCompare(realRoute);
  });

  if (DEBUG) {
    console.log(
      `route is ${realRoute}`,
      `page is ${page ? page.id : undefined}`
    );
  }

  let title = "No Title Found";
  if (page) {
    title = page.title ? page.title : page.label;
  }

  const TOC = compilation.graph.find((page) => {
    if (page.route.startsWith("/FanFiction/Harry")) {
      return page.route.endsWith("TOC/");
    }
    return false;
  });

  let navContent = "";
  if (TOC) {
    if (DEBUG) {
      console.log(`TOC.route is ${TOC.route}`);
    }
    // Load the nav fragment
    navContent = await loadNavFragment(compilation, TOC);
  }

  return `
    <head>
      <link rel="stylesheet" src="/styles/HPNOFP/style.css" />
    </head>
    <body>
      <header>
        <h1 class="spectrum-Heading spectrum-Heading--sizeXXL">
          ${title}
        </h1>
      </header>

      <sp-split-view resizable primary-size="80%">
        <div >
          <main>
            <content-outlet></content-outlet>
          </main>
        </div>
        <div class="nav">
          ${navContent}
        </div>
      </sp-split-view>
      <script type="module" src="../lib/Spectrum/SplitView.ts"></script>
    </body>
  `;
};

export { getFrontmatter, getBody, getLayout };
