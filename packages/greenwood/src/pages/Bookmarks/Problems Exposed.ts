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
While The Harry Potter universe offers a great foundation for building on, it also has plenty
of places where Mrs. Rowling has left us with inconsistencies, contradictions, and other plot
holes. These stories, often through the use of satire and/or farce, expose some of those.
`;
  const bookmarksList = new BookmarksList();
  bookmarksList.category = "Problems Exposed";
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
    title: "Exposing Plot Holes",
    collection: "Bookmarks",
    description: "HP stories HP stories that expose plot holes in the original",
    author: "Luke Schierer",
    data: {},
  };
};

import getLayout from "../../layouts/Bookmarks.ts";

export { getFrontmatter, getBody, getLayout };
