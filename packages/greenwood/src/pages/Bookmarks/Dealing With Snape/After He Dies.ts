import { type Compilation, type Route } from "../../../lib/greenwoodPages.ts";
import "../../../lib/BookmarksList.ts";
import BookmarksList from "../../../lib/BookmarksList.ts";

import markdownTextProcessing from "../../../lib/customMarkdownProcessing.ts";

import debugFunction from "../../../lib/debug.ts";
const DEBUG = debugFunction(new URL(import.meta.url).pathname);
if (DEBUG) {
  console.log(`DEBUG enabled for ${new URL(import.meta.url).pathname}`);
} else {
  console.log(`DEBUG not enabled for ${new URL(import.meta.url).pathname}`);
}

async function getBody() {
  const bodyText = `
Let's take a look at what might have happened after [Snape] died.  Just because Mrs. Rowling gave him a total pass on his bad behavior does not mean we have to.

[Snape]: /Harrypedia/people/Snape/Severus/
`;
  const bookmarksList = new BookmarksList();
  bookmarksList.category = "Snape Dies";
  await bookmarksList.ParseBookmarks().then(() => {
    if (DEBUG) {
      console.log(
        `after parsing getBody sees ${bookmarksList.bookmarks.length} bookmarks`
      );
    }
  });
  return markdownTextProcessing(bodyText).concat(`
    <dl>
      ${bookmarksList.listBookMarks()}
    </dl>
    `);
}

function getFrontmatter() {
  return {
    title: "After Snape Dies",
    collection: "Bookmarks",
    description:
      "HP stories focusing on Snape's death, judgement, or afterlife",
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
