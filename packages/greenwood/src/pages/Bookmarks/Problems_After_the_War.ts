export const prerender = true; // reduce the number of pages that the router needs to handle.

import {
  type Compilation,
  type Page,
  type GetFrontmatter,
} from "@greenwood/cli";
import "../../lib/BookmarksList.ts";
import BookmarksList from "../../lib/BookmarksList.ts";

import markdownTextProcessing from "../../lib/customMarkdownProcessing.ts";

import debugFunction from "../../lib/debug.ts";
const DEBUG = debugFunction(new URL(import.meta.url).pathname);
if (DEBUG) {
  console.log(`DEBUG enabled for ${new URL(import.meta.url).pathname}`);
}

import bookmarksData from "@hp-stuff/assets/Bookmarks/Problems After the War.json" with { type: "json" };

const getBody: (
  compilation: Compilation,
  page: Page,
  request: Request
) => string | Promise<string> = () => {
  const bodyText = `
In general I prefer to sort based on the relationships involved. Where that is not true, based on what is happening (in the story) with [Harry].

These stories are notable because you do not always have a happy ending.

[Harry]: </Harrypedia/people/Potter/Harry James/>
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
    title: "All was *Not* Well",
    collection: "Bookmarks",
    description: "HP stories featuring problems after the war",
    author: "Luke Schierer",
    layout: "standard",
    imports: ["/node_modules/@hp-stuff/assets/dist/styles/BookmarksList.css"],
    data: {},
  };
};

export { getFrontmatter, getBody };
