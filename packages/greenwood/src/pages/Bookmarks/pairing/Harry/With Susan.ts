import {
  type Compilation,
  type Route,
} from "../../../../lib/greenwoodPages.ts";
import "../../../../lib/BookmarksList.ts";
import BookmarksList from "../../../../lib/BookmarksList.ts";

import markdownTextProcessing from "../../../../lib/customMarkdownProcessing.ts";

import debugFunction from "../../../../lib/debug.ts";
const DEBUG = debugFunction(new URL(import.meta.url).pathname);
if (DEBUG) {
  console.log(`DEBUG enabled for ${new URL(import.meta.url).pathname}`);
}

async function getBody() {
  const bodyText = `
Many of these stories happen when [Amelia] [Bones] steps in to, you know, actually do her job as a law enforcement official, and thus belong in the [Responsible Adult] category. While that might happen in a few of these, it is not why they are included.

[Amelia]: /Harrypedia/people/Bones/Amelia_Susan/
[Bones]: /Harrypedia/people/Bones/
[Responsible Adult]: </Bookmarks/Responsible\ Adults/>
`;
  const bookmarksList = new BookmarksList();
  bookmarksList.category = "Harry With Susan";
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
    title: "Harry and Susan",
    collection: "Bookmarks",
    description: "HP stories in which Harry is paired with Susan Bones",
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
