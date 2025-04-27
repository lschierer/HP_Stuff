import { GedcomFamily } from "@hp-stuff/schemas/gedcom";
import JsonFamilies from "@hp-stuff/assets/dist/gedcom/families.json" with { type: "JSON" };

import debugFunction from "../../../lib/debug.ts";
const DEBUG = debugFunction(new URL(import.meta.url).pathname);
if (DEBUG) {
  console.log(`DEBUG enabled for ${new URL(import.meta.url).pathname}`);
}

export async function handler() {
  /*start work around for GetFrontmatter requiring async */
  await new Promise((resolve) => setTimeout(resolve, 1));
  /* end workaround */

  const valid = GedcomFamily.GedcomElement.array().safeParse(JsonFamilies);
  if (valid.success) {
    if (DEBUG) {
      console.log(`successful parse`);
    }
  } else {
    if (DEBUG) {
      console.error(valid.error.message);
    }
  }
  const families = valid.data;
  let body: GedcomFamily.GedcomElement | object = {};
  if (families && families.length > 0) {
    body = families;
  }

  return new Response(JSON.stringify(body), {
    headers: new Headers({
      "Content-Type": "application/json",
    }),
  });
}
