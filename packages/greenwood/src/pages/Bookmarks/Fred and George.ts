import { type Compilation, type Route } from "../../lib/greenwoodPages.ts";
import "../../lib/BookmarksList.ts";
import BookmarksList from "../../lib/BookmarksList.ts";

import rehypeStringify from "rehype-stringify";
import remarkGfm from "remark-gfm";
import remarkParse from "remark-parse";
import remarkRehype from "remark-rehype";
import rehypeLinkProcessor from "rehype-link-processor";
import { unified } from "unified";

import debugFunction from "../../lib/debug.ts";
const DEBUG = debugFunction(new URL(import.meta.url).pathname);
if (DEBUG) {
  console.log(`DEBUG enabled for ${new URL(import.meta.url).pathname}`);
}

async function getBody() {
  const bodyText = `
These stories that are really about [Fred] and [George], more than they are about [Harry] himself.

[Fred]: /Harrypedia/people/Weasley/Fred/
[George]: /Harrypedia/people/Weasley/George/
[Harry]: /Harrypedia/people/Potter/Harry_James/
`;
  const bookmarksList = new BookmarksList();
  bookmarksList.category = "Fred and George";
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
    .use(
      rehypeLinkProcessor({
        rules: [
          () => {
            return {
              className:
                "spectrum-Link spectrum-Link--quiet spectrum-Link--primary",
            };
          },
        ],
      })
    )
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
    title: "Featuring Fred and George",
    collection: "Bookmarks",
    description: "HP Stories featuring Fred and George as main characters",
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
