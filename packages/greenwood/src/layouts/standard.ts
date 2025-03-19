import type { GetLayout, Compilation } from "@greenwood/cli";

import { setTimeout } from "node:timers/promises";
import pTimeout from "p-timeout";

import debugFunction from "../lib/debug.ts";
const DEBUG = debugFunction("layouts/standard.ts");

export const getLayout: GetLayout = async (
  compilation: Compilation,
  route: string
) => {
  /*start work around for GetFrontmatter requiring async */
  const delayedPromise = setTimeout(1);
  await pTimeout(delayedPromise, {
    milliseconds: 1,
  });
  /* end workaround */

  if (DEBUG) {
    console.log(`standard getLayout started`);
  }

  const page = compilation.graph.find((p) => {
    return !p.route.localeCompare(route);
  });
  if (DEBUG) {
    console.log(`route is ${route}`);
  }
  let title = "No Title Found";
  if (page) {
    title = page.title ? page.title : page.label;
  }

  return `
    <body>
      <header>
        <h1 class="spectrum-Heading spectrum-Heading--sizeXXL">
          ${title}
        </h1>
      </header>

      <sp-split-view resizable primary-size="20%">
        <div class="nav">
          <side-bar route="${page ? page.route : ""}"></side-bar>
        </div>
        <div>
          <main>
            <content-outlet></content-outlet>
          </main>
        </div>
      </sp-split-view>
      <script type="module" src="../components/side-nav.ts"></script>
      <script type="module" src="../lib/Spectrum/SplitView.ts"></script>
    </body>
  `;
};

export default getLayout;
