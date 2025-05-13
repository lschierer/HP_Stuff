export const prerender = true;
import {
  type Compilation,
  type Page,
  type GetFrontmatter,
} from "@greenwood/cli";
import "../../lib/BookmarksList.ts";
import BookmarksList from "../../lib/BookmarksList.ts";

import debugFunction from "../../lib/debug.ts";
const DEBUG = debugFunction(new URL(import.meta.url).pathname);
if (DEBUG) {
  console.log(`DEBUG enabled for ${new URL(import.meta.url).pathname}`);
}

import bookmarksData from "@hp-stuff/assets/Bookmarks/ResponsibleAdults.json" with { type: "json" };

const getBody: (
  compilation: Compilation,
  page: Page,
  request: Request
) => string | Promise<string> = () => {
  const dataArray = bookmarksData;

  const bookmarksList = new BookmarksList();
  bookmarksList.ParseBookmarks(dataArray);

  return `
  <p>
    So often children's literature is possible because the adults in those stories
    are incompetent. Sometimes they are well-meaning, sometimes they are not,
    sometimes they are _trying_ and failing, other times they are effectively
    negligent. Sometimes they are simply effectively absent. Irregardless, the
    story is only possible because children are doing things that adults should
    have taken care of. The Harry Potter series is no exception, though it differs
    from many in that it features adults in _all_ of these categories.
  </p>
  <p>
    This is a collection of fan fiction stories that are note-worthy primarily
    because they showcase some aspect of adults being … adults.
  </p>
  <dl>
    ${bookmarksList.listBookMarks()}
  </dl>
  `;
};

const getFrontmatter: GetFrontmatter = async () => {
  /*start work around for GetFrontmatter requiring async */
  await new Promise((resolve) => setTimeout(resolve, 1));
  /* end workaround */

  return {
    title: "Adults Adulting",
    collection: "Bookmarks",
    description: "HP stories with responsible adults",
    author: "Luke Schierer",
    layout: "standard",
    imports: ["/node_modules/@hp-stuff/assets/dist/styles/BookmarksList.css"],
    data: {},
  };
};

export { getFrontmatter, getBody };
