export const prerender = false;
import { type Compilation, type Route } from "../../lib/greenwoodPages.ts";
import "../../lib/BookmarksList.ts";
import BookmarksList from "../../lib/BookmarksList.ts";

import debugFunction from "../../lib/debug.ts";
const DEBUG = debugFunction(new URL(import.meta.url).pathname);
if (DEBUG) {
  console.log(`DEBUG enabled for ${new URL(import.meta.url).pathname}`);
} else {
  console.log(`DEBUG not enabled for ${new URL(import.meta.url).pathname}`);
}

async function getBody() {
  const bookmarksList = new BookmarksList();
  bookmarksList.category = "ResponsibleAdults";
  await bookmarksList.ParseBookmarks().then(() => {
    if (DEBUG) {
      console.log(
        `after parsing getBody sees ${bookmarksList.bookmarks.length} bookmarks`
      );
    }
  });
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
}

function getFrontmatter() {
  return {
    title: "Adults Adulting",
    collection: "Bookmarks",
    description: "HP stories with responsible adults",
    author: "Luke Schierer",
  };
}

function getLayout(compilation: Compilation, route: Route) {
  return `
  <body>
    <header>
      <h1 class="spectrum-Heading spectrum-Heading--sizeXXL">
        ${route.title ? route.title : route.label}
      </h1>
    </header>

    <div class="main">
      <div class="content">
        <content-outlet></content-outlet>

      </div>
    </div>
  </body>
  `;
}
export { getFrontmatter, getBody, getLayout };

/*---
title: Adults Adulting
collection: Bookmarks
description: HP stories with responsible adults
author: "Luke Schierer"
layout: bookmarks
---

So often children's literature is possible because the adults in those stories
are incompetent. Sometimes they are well-meaning, sometimes they are not,
sometimes they are _trying_ and failing, other times they are effectively
negligent. Sometimes they are simply effectively absent. Irregardless, the
story is only possible because children are doing things that adults should
have taken care of. The Harry Potter series is no exception, though it differs
from many in that it features adults in _all_ of these categories.

This is a collection of fan fiction stories that are note-worthy primarily
because they showcase some aspect of adults being … adults.

<bookmarks-list category="ResponsibleAdults"></bookmarks-list>



[Elle Woods]: https://www.imdb.com/title/tt0250494/characters/nm0000702?ref_=tt_cl_c_1

[^221214-2]:
[Amelia]: /Harrypedia/people/bones/amelia_susan/
[Arthur]: /Harrypedia/people/weasley/arthur/
[Azkaban]: /Harrypedia/azkaban/
[Bill]: /Harrypedia/people/weasley/william_arthur/
[Dark Magic]: /Harrypedia/magic/dark/
[Dumbledore]: /Harrypedia/people/dumbledore/albus_percival_wulfric_brian/
[Dursleys]: /Harrypedia/people/dursley/
[Harry]: /Harrypedia/people/Potter/Harry_James/
[Hermione]: /Harrypedia/people/granger/hermione_jean/
[Hogwarts]: /Harrypedia/hogwarts/
[Hufflepuff]: /Harrypedia/hogwarts/hufflepuff/
[James]: /Harrypedia/people/Potter/James/
[Lily]: /Harrypedia/people/evans/lily_j/
[Lupin]: /Harrypedia/people/lupin/remus_john/
[Malfoy]: /Harrypedia/people/malfoy/draco_lucius/
[McGonagall]: /Harrypedia/people/mcgonagall/minerva/
[Molly]: /Harrypedia/people/prewett/molly/
[Neville]: /Harrypedia/people/longbottom/neville/
[Riddle]: /Harrypedia/people/riddle/tom_marvolo/
[Ron]: /Harrypedia/people/weasley/ronald_bilius/
[Sirius]: /Harrypedia/people/black/sirius_iii/
[Slytherin]: /Harrypedia/hogwarts/slytherin/
[Snape]: /Harrypedia/people/snape/severus/
[Sprout]: /Harrypedia/people/sprout/pomona/
[Statute of Secrecy]: /Harrypedia/culture/international_statute_of_secrecy/
[Umbridge]: /Harrypedia/people/umbridge/dolores_jane/
[Vernon]: /Harrypedia/people/dursley/vernon/
[basilisk]: /Harrypedia/animals/basilisk/
[typical adult]: /Harrypedia/people/adults/
[egoist]:

[^lbcx]: including but not limited to
    - _[Who Let Her In Here?](https://archiveofourown.org/works/19495357)_
      by [Space_Girl44](https://archiveofourown.org/users/Space_Girl44/pseuds/Space_Girl44)
      (I can't put my finger on it, but the characterisation seems slightly off)
    - _[Good Pink vs Bad Pink](https://www.fanfiction.net/s/13193971/)_
      by [Singstar4](https://www.fanfiction.net/u/4265633/Singstar4)
      (incomplete)

[The Boy Who Never Knew]: https://www.fanfiction.net/s/6681967
[HPGSTCC14]: https://archiveofourown.org/works/19162495/chapters/47889940

[^240916-1]: [YoullNeverCatchMeAliveSaidHe]. _[Harry Potter gets smart and takes control - The Goblet]_, "[Chapter 17: Results and Revelations](https://archiveofourown.org/works/19162495/chapters/48546074)" Published: 2022-04-09. Updated: 2022-08-15.

[YoullNeverCatchMeAliveSaidHe]: https://archiveofourown.org/users/YoullNeverCatchMeAliveSaidHe/pseuds/YoullNeverCatchMeAliveSaidHe

[FMPtrumpets]: https://archiveofourown.org/users/FMPtrumpets/pseuds/FMPtrumpets

*/
