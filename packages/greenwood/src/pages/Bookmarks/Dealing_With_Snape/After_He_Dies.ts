export const prerender = true; // reduce the number of pages that the router needs to handle.

import {
  type Compilation,
  type Page,
  type GetFrontmatter,
} from "@greenwood/cli";
import "../../../lib/BookmarksList.ts";
import BookmarksList from "../../../lib/BookmarksList.ts";

import markdownTextProcessing from "../../../lib/customMarkdownProcessing.ts";

import debugFunction from "../../../lib/debug.ts";
const DEBUG = debugFunction(new URL(import.meta.url).pathname);
if (DEBUG) {
  console.log(`DEBUG enabled for ${new URL(import.meta.url).pathname}`);
}

import bookmarksData from "@hp-stuff/assets/dist/Bookmarks/Snape Dies.json" with { type: "json" };

const getBody: (
  compilation: Compilation,
  page: Page,
  request: Request
) => string | Promise<string> = () => {
  const bodyText = `
Let's take a look at what might have happened after [Snape] died.  Just because Mrs. Rowling gave him a total pass on his bad behavior does not mean we have to.

[Snape]: /Harrypedia/people/Snape/Severus/
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
    title: "After Snape Dies",
    collection: "Bookmarks",
    description:
      "HP stories focusing on Snape's death, judgement, or afterlife",
    author: "Luke Schierer",
    layout: "standard",
    imports: ["/node_modules/@hp-stuff/assets/dist/styles/BookmarksList.css"],
    data: {},
  };
};

export { getFrontmatter, getBody };
