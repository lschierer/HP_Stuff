import {
  type Compilation,
  type Page,
  type GetFrontmatter,
} from "@greenwood/cli";
import "../../../lib/BookmarksList.ts";
import BookmarksList from "../../../lib/BookmarksList.ts";

import { setTimeout } from "node:timers/promises";
import pTimeout from "p-timeout";

import markdownTextProcessing from "../../../lib/customMarkdownProcessing.ts";

import debugFunction from "../../../lib/debug.ts";
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
Let's take a look at what might have happened after [Snape] died.  Just because Mrs. Rowling gave him a total pass on his bad behavior does not mean we have to.

[Snape]: /Harrypedia/people/Snape/Severus/
`;
  const bookmarksList = new BookmarksList();
  bookmarksList.category = "Snape Dies";
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
    title: "After Snape Dies",
    collection: "Bookmarks",
    description:
      "HP stories focusing on Snape's death, judgement, or afterlife",
    author: "Luke Schierer",
    layout: "standard",
    data: {},
  };
};

import getLayout from "../../../layouts/Bookmarks.ts";
export { getFrontmatter, getBody, getLayout };
