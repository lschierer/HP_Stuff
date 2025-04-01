import {
  type Compilation,
  type Page,
  type GetFrontmatter,
} from "@greenwood/cli";
import "../../../../lib/BookmarksList.ts";
import BookmarksList from "../../../../lib/BookmarksList.ts";

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
While [Ginny] has flaws, I remain partial to this pairing. Unfortunately fan fiction rarely does it justice.

[Ginny]: /Harrypedia/people/Weasley/Ginevra_Molly/
`;
  const bookmarksList = new BookmarksList();
  bookmarksList.category = "Harry With Ginny";
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
    title: "Harry With Ginny",
    collection: "Bookmarks",
    description: "HP stories with Harry and Ginny paired",
    author: "Luke Schierer",
    layout: "standard",
    data: {},
  };
};

import getLayout from "../../../../layouts/Bookmarks.ts";

export { getFrontmatter, getBody, getLayout };
