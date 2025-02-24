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
This pairing has to be *very* carefully handled to not simply come across as creepy. While no one blinks at a five year age gap between people in their thirties, even a two year age gap will get a second look when dealing with high school students. While we do not know how old [Gabrielle] is with any true certainty, it is safe to say that she is way too young for fourteen year old [Harry] when they first meet.

[Harry]: /Harrypedia/people/Potter/Harry_James/
[Gabrielle]: /Harrypedia/people/Delacour/Gabrielle/
`;
  const bookmarksList = new BookmarksList();
  bookmarksList.category = "Harry With Gabrielle";
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
    title: "Harry With Gabrielle",
    collection: "Bookmarks",
    description: "HP stories with Harry and Gabrielle paired",
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
