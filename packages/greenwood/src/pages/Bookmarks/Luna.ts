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

const getBody: (
  compilation: Compilation,
  page: Page,
  request: Request
) => string | Promise<string> = async () => {
  const bodyText = `
In general I feel that while [Luna] and [Harry] will almost always be friends, that unless you change one or the other significantly, they will never be more than that. Still, there are some stories where she is the main character that are worth remembering.

[Harry]: </Harrypedia/people/Potter/Harry James/>
[Luna]: /Harrypedia/people/Lovegood/Luna/
`;
  const bookmarksList = new BookmarksList();
  bookmarksList.category = "Luna";
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
};

const getFrontmatter: GetFrontmatter = async () => {
  /*start work around for GetFrontmatter requiring async */
  await new Promise((resolve) => setTimeout(resolve, 1));
  /* end workaround */

  return {
    title: "All About Luna",
    collection: "Bookmarks",
    description: "HP stories with Luna as a primary character",
    author: "Luke Schierer",
    layout: "standard",
    data: {},
  };
};

import getLayout from "../../layouts/Bookmarks.ts";

export { getFrontmatter, getBody, getLayout };
