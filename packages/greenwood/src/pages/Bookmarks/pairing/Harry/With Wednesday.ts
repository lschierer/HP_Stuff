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
Harry Potter almost begs for a crossover with the Addams family, despite the
differences in timelines in any iteration of the Addams family. If you are
going to do such a crossover, pairing [Harry] with Wednesday is, or should be, a
foregone conclusion. Some of these stories are just stupid, slash and similar
themes abound, despite the fact that it is entirely unnecessary, and, frankly,
contrary to the original Addams source material. Despite that, there are some
real gems, some of which are even finished.

[Harry]: /Harrypedia/people/Potter/Harry_James/

`;
  const bookmarksList = new BookmarksList();
  bookmarksList.category = "Harry With Wednesday";
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
    title: "Harry With Wednesday Addams",
    collection: "Bookmarks",
    description: "HP stories with Harry and Wednesday Addams paired",
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
