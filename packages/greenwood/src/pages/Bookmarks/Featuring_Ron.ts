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

import bookmarksData from "@hp-stuff/assets/dist/Bookmarks/Featuring Ron.json" with { type: "json" };

const getBody: (
  compilation: Compilation,
  page: Page,
  request: Request
) => string | Promise<string> = () => {
  const bodyText = `
I have made no secret of the fact that [Ron] is not my most favourite character in the series. These stories highlight what could have been.

[Ron]: </Harrypedia/people/Weasley/Ronald Bilius/>
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
    title: "Featuring Ron",
    collection: "Bookmarks",
    description: "HP stories in which Ron is key",
    author: "Luke Schierer",
    layout: "standard",
    imports: ["/node_modules/@hp-stuff/assets/dist/styles/BookmarksList.css"],
    data: {},
  };
};

export { getFrontmatter, getBody };
