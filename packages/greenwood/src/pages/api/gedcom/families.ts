import { z } from "zod";
import { GedcomFamily } from "../../../schemas/gedcom/index.ts";

import debugFunction from "../../../lib/debug.ts";
const DEBUG = debugFunction(new URL(import.meta.url).pathname);
if (DEBUG) {
  console.log(`DEBUG enabled for ${new URL(import.meta.url).pathname}`);
}

export async function handler() {
  const familiesImport = await import("../../../assets/gedcom/families.json");
  const valid = z
    .array(GedcomFamily.GedcomElement)
    .safeParse(familiesImport.default);
  if (valid.success) {
    if(DEBUG) {
      console.log(`successful parse`);
    }
  } else {
    if(DEBUG) {
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
