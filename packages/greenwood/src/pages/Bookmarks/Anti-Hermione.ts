import { type Compilation, type Route } from "../../lib/greenwoodPages.ts";
import "../../lib/BookmarksList.ts";
import BookmarksList from "../../lib/BookmarksList.ts";

import rehypeStringify from "rehype-stringify";
import remarkGfm from "remark-gfm";
import remarkParse from "remark-parse";
import remarkRehype from "remark-rehype";
import rehypeAddClasses from "rehype-class-names";
import { unified } from "unified";

import debugFunction from "../../lib/debug.ts";
const DEBUG = debugFunction(new URL(import.meta.url).pathname);
if (DEBUG) {
  console.log(`DEBUG enabled for ${new URL(import.meta.url).pathname}`);
}

async function getBody() {
  const bodyText = `
These stories are reactions to the way that Mrs. Rowling allowed [Hermione] to eclipse
both [Ron] and [Harry] in the latter books, and/or to the way in which some fans take this
to an even greater extreme.

[Hermione]: /Harrypedia/people/Granger/Hermione_Jean/
[Ron]: /Harrypedia/people/Weasley/Ronald_Bilius/
[Harry]: /Harrypedia/people/Potter/Harry_James/
`;
  const bookmarksList = new BookmarksList();
  bookmarksList.category = "Anti-Hermione";
  await bookmarksList.ParseBookmarks().then(() => {
    if (DEBUG) {
      console.log(
        `after parsing getBody sees ${bookmarksList.bookmarks.length} bookmarks`
      );
    }
  });
  return unified()
    .use(remarkParse)
    .use(remarkGfm)
    .use(remarkRehype)
    .use(rehypeAddClasses, {
      a: "spectrum-Link spectrum-Link--quiet spectrum-Link--primary",
      p: "spectrum-Body spectrum-Body--serif spectrum-Body--sizeM",
    })
    .use(rehypeStringify)
    .processSync(bodyText)
    .toString().concat(`
    <dl>
      ${bookmarksList.listBookMarks()}
    </dl>
    `);
}

function getFrontmatter() {
  return {
    title: "Anti-Hermione",
    collection: "Bookmarks",
    description: "HP Stories Notable for the Anti-Hermione Bias",
    author: "Luke Schierer",
  };
}

function getLayout(compilation: Compilation, route: Route) {
  return `
  <body>
    <header>
      <h1 class="spectrum-Heading spectrum-Heading--sizeXXL">
        ${route.title ? route.title : route.label}
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
}
export { getFrontmatter, getBody, getLayout };
