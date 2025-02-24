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
It is relatively rare to find this as a primary pairing, most often these stories feature some type of revenge on [Draco] instead of a positive relationship between these two as a primary pairing. I am not interested in violating marriage vows as a form of revenge, momentary
pleasure, or drunkenness.

These stories will focus on a version of [Astoria] that build off of the _lack_ of detail we have about her character. Mrs. Rowling's descriptions about the decision process that, in the cannon material, lead to her marriage is incredibly vague and in some ways even suggestive.
These stories take that vague suggestion and run with it.

[Draco]: /Harrypedia/people/Malfoy/Draco_Lucius/
[Astoria]: /Harrypedia/people/Greengrass/Astoria/

`;
  const bookmarksList = new BookmarksList();
  bookmarksList.category = "Harry With Astoria";
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
    title: "Harry With Astoria Greengrass",
    collection: "Bookmarks",
    description: "HP stories with Harry and Astoria Greengrass paired",
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
