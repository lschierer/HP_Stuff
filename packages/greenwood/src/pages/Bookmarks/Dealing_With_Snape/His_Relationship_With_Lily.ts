import {
  type Compilation,
  type Page,
  type GetFrontmatter,
} from "@greenwood/cli";
import "../../../lib/BookmarksList.ts";
import BookmarksList from "../../../lib/BookmarksList.ts";

import markdownTextProcessing from "../../../lib/customMarkdownProcessing.ts";

import debugFunction from "../../../lib/debug.ts";
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
It irks me that any number of people seem to assume that [Snape] and [Lily] were on the path to a successful romantic relationship until their fight in fifth year; that [James] (or [Dumbledore]) must have drugged, tricked, or trapped her into a marriage, and that without interferance, she would be happy with [Snape].  Let's address that.

[Snape]: /Harrypedia/people/Snape/Severus/
[Lily]: /Harrypedia/people/Evans/Lily_J/
[James]: /Harrypedia/people/Potter/James/
[Dumbledore]: /Harrypedia/people/Dumbledore/Albus_Percival_Wulfric_Brian/
`;
  const bookmarksList = new BookmarksList();
  bookmarksList.category = "Snape And Lily";
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
    title: "Snape's Relationship With Lily",
    collection: "Bookmarks",
    description: "HP stories about Snape's relationship with Lily",
    author: "Luke Schierer",
    layout: "standard",
    data: {},
  };
};

import getLayout from "../../../layouts/Bookmarks.ts";

export { getFrontmatter, getBody, getLayout };
