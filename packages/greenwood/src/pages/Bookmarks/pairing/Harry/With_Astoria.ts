export const prerender = true; // reduce the number of pages that the router needs to handle.

import {
  type Compilation,
  type Page,
  type GetFrontmatter,
} from "@greenwood/cli";
import "../../../../lib/BookmarksList.ts";
import BookmarksList from "../../../../lib/BookmarksList.ts";

import markdownTextProcessing from "../../../../lib/customMarkdownProcessing.ts";

import debugFunction from "../../../../lib/debug.ts";
const DEBUG = debugFunction(new URL(import.meta.url).pathname);
if (DEBUG) {
  console.log(`DEBUG enabled for ${new URL(import.meta.url).pathname}`);
}
import bookmarksData from "@hp-stuff/assets/dist/Bookmarks/Harry With Astoria.json" with { type: "json" };

const getBody: (
  compilation: Compilation,
  page: Page,
  request: Request
) => string | Promise<string> = () => {
  const bodyText = `
It is relatively rare to find this as a primary pairing, most often these stories feature some type of revenge on [Draco] instead of a positive relationship between these two as a primary pairing. I am not interested in violating marriage vows as a form of revenge, momentary
pleasure, or drunkenness.

These stories will focus on a version of [Astoria] that build off of the _lack_ of detail we have about her character. Mrs. Rowling's descriptions about the decision process that, in the cannon material, lead to her marriage is incredibly vague and in some ways even suggestive.
These stories take that vague suggestion and run with it.

[Draco]: </Harrypedia/people/Malfoy/Draco Lucius/>
[Astoria]: /Harrypedia/people/Greengrass/Astoria/

`;
  const dataArray = bookmarksData;

  const bookmarksList = new BookmarksList();
  bookmarksList.ParseBookmarks(dataArray);
  return markdownTextProcessing(bodyText).concat(`
    <dl>
      ${bookmarksList.listBookMarks()}
    </dl>
    `);
};

const getFrontmatter: GetFrontmatter = async () => {
  /*start work around for GetFrontmatter requiring async */
  await new Promise((resolve) => setTimeout(resolve, 1));
  /* end workaround */

  return {
    title: "Harry With Astoria Greengrass",
    collection: "Bookmarks",
    description: "HP stories with Harry and Astoria Greengrass paired",
    author: "Luke Schierer",
    layout: "standard",
    imports: ["/styles/BookmarksList.css"],
    data: {},
  };
};

export { getFrontmatter, getBody };
