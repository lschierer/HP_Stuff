export const prerender = true; // reduce the number of pages that the router needs to handle.

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
import bookmarksData from "@hp-stuff/assets/dist/Bookmarks/Anti-Dumbledore.json" with { type: "json" };

const getBody: (
  compilation: Compilation,
  page: Page,
  request: Request
) => string | Promise<string> = () => {
  const bodyText = `
These stories are reactions to the way that Mrs. Rowling essentially justified every bad decision that [Dumbledore] made by having [Harry] not only forgive him, but name a child after him.

[Dumbledore]: </Harrypedia/people/Dumbledore/Albus Percival Wulfric Brian/>
[Harry]: </Harrypedia/people/Potter/Harry James/>
`;

  const bookmarksList = new BookmarksList();
  bookmarksList.ParseBookmarks(bookmarksData);
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
    imports: ["/node_modules/@hp-stuff/assets/dist/styles/BookmarksList.css"],
    data: {},
  };
};

export { getFrontmatter, getBody };
