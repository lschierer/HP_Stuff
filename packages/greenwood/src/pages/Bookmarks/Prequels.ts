import {
  type Compilation,
  type Page,
  type GetFrontmatter,
} from "@greenwood/cli";
import "../../lib/BookmarksList.ts";
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
Stories that predate our [primary canon].

[primary canon]: /Harrypedia/#primary-sources/
`;
  const bookmarksList = new BookmarksList();
  bookmarksList.category = "Prequels";
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

const getFrontmatter: GetFrontmatter = () => {
  return {
    title: "Prequels",
    collection: "Bookmarks",
    description: "HP stories predating our primary canon",
    author: "Luke Schierer",
    data: {},
  };
};

import getLayout from "../../layouts/Bookmarks.ts";

export { getFrontmatter, getBody, getLayout };
