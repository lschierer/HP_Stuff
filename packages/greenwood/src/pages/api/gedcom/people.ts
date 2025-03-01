import { z } from "zod";
import { GedcomPerson } from "../../../schemas/gedcom/index.ts";

import debugFunction from "../../../lib/debug.ts";
const DEBUG = debugFunction(new URL(import.meta.url).pathname);
if (DEBUG) {
  console.log(`DEBUG enabled for ${new URL(import.meta.url).pathname}`);
}

export async function handler() {
  const peopleImport = await import("../../../assets/gedcom/people.json");
  const valid = z
    .array(GedcomPerson.GedcomElement)
    .safeParse(peopleImport.default);
  if (valid.success) {
    if (DEBUG) {
      console.log(`successful parse`);
    }
  } else {
    console.error(valid.error.message);
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
