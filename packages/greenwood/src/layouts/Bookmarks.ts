import { type Compilation, type Page, type GetLayout } from "@greenwood/cli";

const getLayout: GetLayout = async (
  compilation: Compilation,
  route: string
) => {
  /*start work around for GetFrontmatter requiring async */
  await new Promise((resolve) => setTimeout(resolve, 1));
  /* end workaround */

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
