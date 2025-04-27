import { GedcomPerson } from "@hp-stuff/schemas/gedcom";
import JsonPeople from "@hp-stuff/assets/dist/gedcom/people.json" with { type: "JSON" };

import debugFunction from "../../../lib/debug.ts";
const DEBUG = debugFunction(new URL(import.meta.url).pathname);
if (DEBUG) {
  console.log(`DEBUG enabled for ${new URL(import.meta.url).pathname}`);
}

export async function handler() {
  /*start work around for GetFrontmatter requiring async */
  await new Promise((resolve) => setTimeout(resolve, 1));
  /* end workaround */

  const valid = GedcomPerson.GedcomElement.array().safeParse(JsonPeople);

  if (valid.success) {
    if (DEBUG) {
      console.log(`successful parse`);
    }
  } else {
    if (DEBUG) {
      console.error(valid.error.message);
    }
  }
  const people = valid.data;
  let body: GedcomPerson.GedcomElement | object = {};
  if (people && people.length > 0) {
    body = people;
  }

  return new Response(JSON.stringify(body), {
    headers: new Headers({
      "Content-Type": "application/json",
    }),
  });
}
