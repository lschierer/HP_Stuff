import {
  type Compilation,
  type Route,
  type Page,
  sortPages,
} from "../../../../lib/greenwoodPages.ts";

import { type CardDetails } from "../../../../lib/CardDetails.ts";

async function getBody(compilation: Compilation, route: Route) {
  const cardDetails = new Array<CardDetails>();
  compilation.graph
    .filter((page: Page) => {
      return (
        page.route.toString().startsWith(route.route.toString()) &&
        page.route.toString().localeCompare(route.route.toString())
      );
    })
    .sort((a, b) => sortPages(a, b))
    .map((page: Page) => {
      const detail: CardDetails = {
        title: page.title ? page.title.toString() : page.label.toString(),
        name: "dashicons:text-page",
        target: page.route.toString(),
      };
      cardDetails.push(detail);
    });
  const cd = encodeURIComponent(JSON.stringify(cardDetails));
  console.log(`card details are ${cd}`);
  return `
    <html>
      <body>
        <card-grid gridcards="${cd}"></card-grid>
      </body>
    </html>
  `;
}

async function getLayout(compilation: Compilation, route: Route) {
  return `
  <!doctype html>
  <html>
    <head>
      <script type="module" src="../components/card-grid.ts"></script>
      <script type="module" src="../components/horizontal-card.ts"></script>
      <script
        type="module"
        src="/node_modules/@spectrum-web-components/split-view/sp-split-view.js"
      ></script>
      <script type="module" src="../components/side-nav.ts"></script>
    </head>

    <body>
      <sp-split-view resizable primary-size="20%">
        <div class="nav">
          <side-nav route="${route.route}"></side-nav>
        </div>
        <div>
          <main>
            <content-outlet></content-outlet>
          </main>
        </div>
      </sp-split-view>
    </body>
  </html>
  `;
}

async function getFrontmatter(
  compilation: Compilation,
  route: Route,
  label: string,
  id: string,
) {
  return {
    id: id,
    label: label,
    title: route.title ? route.title : route.label,
    collection: "Nephilim",
  };
}

export { getFrontmatter, getBody, getLayout };
