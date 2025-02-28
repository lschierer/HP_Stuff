import { type Compilation, type Route } from "../../lib/greenwoodPages.ts";
import "../../lib/BookmarksList.ts";
import BookmarksList from "../../lib/BookmarksList.ts";

import markdownTextProcessing from "../../lib/customMarkdownProcessing.ts";

import debugFunction from "../../lib/debug.ts";
const DEBUG = debugFunction(new URL(import.meta.url).pathname);
if (DEBUG) {
  console.log(`DEBUG enabled for ${new URL(import.meta.url).pathname}`);
}

async function getBody() {
  const bodyText = `
[Ginny]'s missed birthday irks me.  It might just be the third person limited narration, but it fits a pattern I dislike. These stories are not necessarily notable in themselves, and while I did not want a full category page for them, they do not fit elsewhere. I want to call out that I am not the first or only person to note this problem.
* _[The Forgotten Day](https://www.fanfiction.net/s/13183663)_ by
  [BlockPlacer](https://www.fanfiction.net/u/8570749/BlockPlacer)
* _[Fireworks](https://www.fanfiction.net/s/7537726)_ by
  [ashfordpines](https://www.fanfiction.net/u/2919392/ashfordpines)
* _[The Forgotten Summer Birthday](https://www.siye.co.uk/siye/viewstory.php?sid=130062)_ by [CharmHazel](https://www.siye.co.uk/siye/viewuser.php?uid=209861)


[Ginny]: /Harrypedia/people/Potter/Harry_James/
`;
  return markdownTextProcessing(bodyText);
}

function getFrontmatter() {
  return {
    title: "The Missed Birthday",
    collection: "Bookmarks",
    description:
      "Several Authors have noted that Ginny's Birthday is a problem in canon",
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
