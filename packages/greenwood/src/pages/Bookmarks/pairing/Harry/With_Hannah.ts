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

import bookmarksData from "@hp-stuff/assets/dist/Bookmarks/Harry With Hannah.json" with { type: "json" };

const getBody: (
  compilation: Compilation,
  page: Page,
  request: Request
) => string | Promise<string> = () => {
  const bodyText = `
I really feel that [Hannah] is an under utilised character in fan fiction. Sure she backs down from her defence of him in second year and ends up wearing a badge in fourth, but both of these essentially boil down to the fact that sheis a [Hufflepuff] and not a [Gryffindor] - she _isn't_ brave, and getting along with (showing loyalty to) her housemates is _massively_ important to her. The latter however can easily be transferred to [Harry] by a romantic attachment overriding the House loyalty, as my first entry in this category does.

[Hannah]: /Harrypedia/people/Abbott/Hannah/
[Harry]: </Harrypedia/people/Potter/Harry James/>
[Hufflepuff]: /Harrypedia/Hogwarts/Hufflepuff/
[Gryffindor]: /Harrypedia/Hogwarts/Gryffindor/

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
    title: "Harry With Hannah Abbott",
    collection: "Bookmarks",
    description: "HP stories with Harry and Hannah Abbott paired",
    author: "Luke Schierer",
    layout: "standard",
    imports: ["/styles/BookmarksList.css"],
    data: {},
  };
};

export { getFrontmatter, getBody };
