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

import bookmarksData from "@hp-stuff/assets/dist/Bookmarks/Time Travel.json" with { type: "json" };

const getBody: (
  compilation: Compilation,
  page: Page,
  request: Request
) => string | Promise<string> = () => {
  const bodyText = `
[Harry] is not the only character to go back in time in Fan Fiction.

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
    title: "Time Travel",
    collection: "Bookmarks",
    description: "HP stories focusing on travels through time",
    imports: ["/node_modules/@hp-stuff/assets/dist/styles/BookmarksList.css"],
    author: "Luke Schierer",
    layout: "standard",
    data: {},
  };
};

export { getFrontmatter, getBody };
