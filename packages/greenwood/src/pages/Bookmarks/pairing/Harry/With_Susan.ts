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
Many of these stories happen when [Amelia] [Bones] steps in to, you know, actually do her job as a law enforcement official, and thus belong in the [Responsible Adult] category. While that might happen in a few of these, it is not why they are included.

[Amelia]: /Harrypedia/people/Bones/Amelia_Susan/
[Bones]: /Harrypedia/people/Bones/
[Responsible Adult]: </Bookmarks/Responsible_Adults/>
`;
  const bookmarksList = new BookmarksList();
  bookmarksList.category = "Harry With Susan";
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
    title: "Harry and Susan",
    collection: "Bookmarks",
    description: "HP stories in which Harry is paired with Susan Bones",
    author: "Luke Schierer",
    layout: "standard",
    data: {},
  };
};

import getLayout from "../../../../layouts/Bookmarks.ts";

export { getFrontmatter, getBody, getLayout };
