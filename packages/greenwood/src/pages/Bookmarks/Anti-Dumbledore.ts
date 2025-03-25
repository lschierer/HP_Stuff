import { type GetFrontmatter, type GetBody } from "@greenwood/cli";
import "../../lib/BookmarksList.ts";
import BookmarksList from "../../lib/BookmarksList.ts";

import markdownTextProcessing from "../../lib/customMarkdownProcessing.ts";

import debugFunction from "../../lib/debug.ts";
const DEBUG = debugFunction(new URL(import.meta.url).pathname);
if (DEBUG) {
  console.log(`DEBUG enabled for ${new URL(import.meta.url).pathname}`);
}

const getBody: GetBody = async () => {
  const bodyText = `
These stories are reactions to the way that Mrs. Rowling essentially justified every bad decision that [Dumbledore] made by having [Harry] not only forgive him, but name a child after him.

[Dumbledore]: /Harrypedia/people/Dumbledore/Albus_Percival_Wulfric_Brian/
[Harry]: /Harrypedia/people/Potter/Harry_James/
`;
  const bookmarksList = new BookmarksList();
  bookmarksList.category = "Anti-Dumbledore";
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
    title: "Anti-Dumbledore",
    collection: "Bookmarks",
    description: "HP Stories Notable for the Anti-Dumbledore Bias",
    author: "Luke Schierer",
    layout: "standard",
    data: {},
  };
};

import getLayout from "../../layouts/Bookmarks.ts";

export { getFrontmatter, getBody, getLayout };
