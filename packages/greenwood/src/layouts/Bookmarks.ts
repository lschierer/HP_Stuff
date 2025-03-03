import { type Compilation, type Page, type GetLayout } from "@greenwood/cli";

const getLayout: GetLayout = (compilation: Compilation, route: string) => {
  const page: Page | undefined = compilation.graph.find((p) => {
    return !p.route.localeCompare(route);
  });
  return `
  <body>
    <header>
      <h1 class="spectrum-Heading spectrum-Heading--sizeXXL">
        ${page ? (page.title ? page.title : page.label) : ""}
      </h1>
      <link rel="stylesheet" href="/styles/BookmarksList.css" />
    </header>

    <div class="main">
      <div class="content">
        <content-outlet></content-outlet>

      </div>
    </div>
  </body>
  `;
};

export default getLayout;
