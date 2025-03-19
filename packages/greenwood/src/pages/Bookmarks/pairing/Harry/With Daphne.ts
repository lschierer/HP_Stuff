import {
  type Compilation,
  type Page,
  type GetFrontmatter,
} from "@greenwood/cli";
import "../../../../lib/BookmarksList.ts";
import BookmarksList from "../../../../lib/BookmarksList.ts";

import { setTimeout } from "node:timers/promises";
import pTimeout from "p-timeout";

import markdownTextProcessing from "../../../../lib/customMarkdownProcessing.ts";

import debugFunction from "../../../../lib/debug.ts";
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
[Daphne] is one of those blank slate characters that authors can do anything
with. Sure enough, they certainly have, though there do tend to be patterns.
Most of them are not worth reading, but enough are that this becomes a category
to watch.

[Daphne]: /Harrypedia/people/Greengrass/Daphne/

`;
  const bookmarksList = new BookmarksList();
  bookmarksList.category = "Harry With Daphne";
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
  const delayedPromise = setTimeout(1);
  await pTimeout(delayedPromise, {
    milliseconds: 1,
  });
  /* end workaround */

  return {
    title: "Harry With Daphne Greengrass",
    collection: "Bookmarks",
    description: "HP stories with Harry and Daphne Greengrass paired",
    author: "Luke Schierer",
    layout: "standard",
    data: {},
  };
};

import getLayout from "../../../../layouts/Bookmarks.ts";
export { getFrontmatter, getBody, getLayout };
