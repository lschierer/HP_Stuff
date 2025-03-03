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
These stories that are really about [Fred] and [George], more than they are about [Harry] himself.

[Fred]: /Harrypedia/people/Weasley/Fred/
[George]: /Harrypedia/people/Weasley/George/
[Harry]: /Harrypedia/people/Potter/Harry_James/
`;
  const bookmarksList = new BookmarksList();
  bookmarksList.category = "Fred and George";
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
    title: "Featuring Fred and George",
    collection: "Bookmarks",
    description: "HP Stories featuring Fred and George as main characters",
    author: "Luke Schierer",
    data: {},
  };
};

import getLayout from "../../layouts/Bookmarks.ts";

export { getFrontmatter, getBody, getLayout };
