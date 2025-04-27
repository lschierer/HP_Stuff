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

import bookmarksData from "@hp-stuff/assets/dist/Bookmarks/Harry With Gabrielle.json" with { type: "json" };

const getBody: (
  compilation: Compilation,
  page: Page,
  request: Request
) => string | Promise<string> = () => {
  const bodyText = `
This pairing has to be *very* carefully handled to not simply come across as creepy. While no one blinks at a five year age gap between people in their thirties, even a two year age gap will get a second look when dealing with high school students. While we do not know how old [Gabrielle] is with any true certainty, it is safe to say that she is way too young for fourteen year old [Harry] when they first meet.

[Harry]: </Harrypedia/people/Potter/Harry James/>
[Gabrielle]: /Harrypedia/people/Delacour/Gabrielle/
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
    title: "Harry With Gabrielle",
    collection: "Bookmarks",
    description: "HP stories with Harry and Gabrielle paired",
    author: "Luke Schierer",
    layout: "standard",
    imports: ["/styles/BookmarksList.css"],
    data: {},
  };
};

export { getFrontmatter, getBody };
