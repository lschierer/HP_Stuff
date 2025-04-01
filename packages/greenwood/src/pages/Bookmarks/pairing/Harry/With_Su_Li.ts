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

import getLayout from "../../../../layouts/Bookmarks.ts";

const getBody: (
  compilation: Compilation,
  page: Page,
  request: Request
) => string | Promise<string> = async () => {
  const bodyText = `
For some reason this pairing is incredibly rare, and even more rarely are these stories actually finished. I am unsure why, as [Cho]'s character in the cannon books is clearly not a good romantic match for [Harry], and yet the introduction of chinese culture, or even psuedo-chinese culture allows for some interesting crossovers, or at least minor additions to the canon universe (cameos within the universe as it were).

[Cho]: /Harrypedia/people/Chang/Cho/
[Harry]: /Harrypedia/people/Potter/Harry_James/
`;
  const bookmarksList = new BookmarksList();
  bookmarksList.category = "Harry With Su Li";
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
    title: "Harry and Su Li",
    collection: "Bookmarks",
    description: "HP stories in which Harry is paired with Su Li",
    author: "Luke Schierer",
    layout: "standard",
    data: {},
  };
};

export { getFrontmatter, getBody, getLayout };
