import {
  type Compilation,
  type Route,
} from "../../../../lib/greenwoodPages.ts";
import "../../lib/BookmarksList.ts";
import BookmarksList from "../../../../lib/BookmarksList.ts";

import markdownTextProcessing from "../../../../lib/customMarkdownProcessing.ts";

import debugFunction from "../../../../lib/debug.ts";
const DEBUG = debugFunction(new URL(import.meta.url).pathname);
if (DEBUG) {
  console.log(`DEBUG enabled for ${new URL(import.meta.url).pathname}`);
}

async function getBody() {
  const bodyText = `
For some reason this pairing is incredibly rare, and even more rarely are these stories actually finished. I am unsure why, as [Cho]'s character in the cannon books is clearly not a good romantic match for [Harry], and yet the introduction of chinese culture, or even psuedo-chinese culture allows for some interesting crossovers, or at least minor additions to the canon universe (cameos within the universe as it were).

[Cho]: /Harrypedia/people/Chang/Cho/
[Harry]: /Harrypedia/people/Potter/Harry_James/
`;
  const bookmarksList = new BookmarksList();
  bookmarksList.category = "Harry With Su Li";
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
    title: "Harry and Su Li",
    collection: "Bookmarks",
    description: "HP stories in which Harry is paired with Su Li",
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
