import { type GetFrontmatter, type GetBody } from "@greenwood/cli";
import markdownTextProcessing from "../../lib/customMarkdownProcessing.ts";

import debugFunction from "../../lib/debug.ts";
const DEBUG = debugFunction(new URL(import.meta.url).pathname);
if (DEBUG) {
  console.log(`DEBUG enabled for ${new URL(import.meta.url).pathname}`);
}

const getBody: GetBody = async () => {
  /*start work around for GetFrontmatter requiring async */
  await new Promise((resolve) => setTimeout(resolve, 1));
  /* end workaround */

  const bodyText = `
[Ginny]'s missed birthday irks me.  It might just be the third person limited narration, but it fits a pattern I dislike. These stories are not necessarily notable in themselves, and while I did not want a full category page for them, they do not fit elsewhere. I want to call out that I am not the first or only person to note this problem.
* _[The Forgotten Day](https://www.fanfiction.net/s/13183663)_ by
  [BlockPlacer](https://www.fanfiction.net/u/8570749/BlockPlacer)
* _[Fireworks](https://www.fanfiction.net/s/7537726)_ by
  [ashfordpines](https://www.fanfiction.net/u/2919392/ashfordpines)
* _[The Forgotten Summer Birthday](https://www.siye.co.uk/siye/viewstory.php?sid=130062)_ by [CharmHazel](https://www.siye.co.uk/siye/viewuser.php?uid=209861)


[Ginny]: </Harrypedia/people/Potter/Harry James/>
`;
  return markdownTextProcessing(bodyText);
};

const getFrontmatter: GetFrontmatter = async () => {
  /*start work around for GetFrontmatter requiring async */
  await new Promise((resolve) => setTimeout(resolve, 1));
  /* end workaround */

  return {
    title: "The Missed Birthday",
    collection: "Bookmarks",
    description:
      "Several Authors have noted that Ginny's Birthday is a problem in canon",
    author: "Luke Schierer",
    layout: "standard",
    data: {},
  };
};

import getLayout from "../../layouts/Bookmarks.ts";
export { getFrontmatter, getBody, getLayout };
