export const prerender = true; // reduce the number of pages that the router needs to handle.

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

import bookmarksData from "@hp-stuff/assets/dist/Bookmarks/Harry With Su Li.json" with { type: "json" };

const getBody: (
  compilation: Compilation,
  page: Page,
  request: Request
) => string | Promise<string> = () => {
  const bodyText = `
For some reason this pairing is incredibly rare, and even more rarely are these stories actually finished. I am unsure why, as [Cho]'s character in the cannon books is clearly not a good romantic match for [Harry], and yet the introduction of chinese culture, or even psuedo-chinese culture allows for some interesting crossovers, or at least minor additions to the canon universe (cameos within the universe as it were).

[Cho]: /Harrypedia/people/Chang/Cho/
[Harry]: </Harrypedia/people/Potter/Harry James/>
`;
  const dataArray = bookmarksData;

  const bookmarksList = new BookmarksList();
  bookmarksList.ParseBookmarks(dataArray);
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
    imports: ["/styles/BookmarksList.css"],
    data: {},
  };
};

export { getFrontmatter, getBody };
