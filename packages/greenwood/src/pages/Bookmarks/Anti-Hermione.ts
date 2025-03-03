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
These stories are reactions to the way that Mrs. Rowling allowed [Hermione] to eclipse
both [Ron] and [Harry] in the latter books, and/or to the way in which some fans take this
to an even greater extreme.

[Hermione]: /Harrypedia/people/Granger/Hermione_Jean/
[Ron]: /Harrypedia/people/Weasley/Ronald_Bilius/
[Harry]: /Harrypedia/people/Potter/Harry_James/
`;
  const bookmarksList = new BookmarksList();
  bookmarksList.category = "Anti-Hermione";
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
    title: "Anti-Hermione",
    collection: "Bookmarks",
    description: "HP Stories Notable for the Anti-Hermione Bias",
    author: "Luke Schierer",
    data: {},
  };
};

import getLayout from "../../layouts/Bookmarks.ts";

export { getFrontmatter, getBody, getLayout };
