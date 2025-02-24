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
I really feel that [Hannah] is an under utilised character in fan fiction. Sure she backs down from her defence of him in second year and ends up wearing a badge in fourth, but both of these essentially boil down to the fact that sheis a [Hufflepuff] and not a [Gryffindor] - she _isn't_ brave, and getting along with (showing loyalty to) her housemates is _massively_ important to her. The latter however can easily be transferred to [Harry] by a romantic attachment overriding the House loyalty, as my first entry in this category does.

[Hannah]: /Harrypedia/people/Abbott/Hannah/
[Harry]: /Harrypedia/people/Potter/Harry_James/
[Hufflepuff]: /Harrypedia/Hogwarts/Hufflepuff/
[Gryffindor]: /Harrypedia/Hogwarts/Gryffindor/

`;
  const bookmarksList = new BookmarksList();
  bookmarksList.category = "Harry With Hannah";
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
    title: "Harry With Hannah Abbott",
    collection: "Bookmarks",
    description: "HP stories with Harry and Hannah Abbott paired",
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
