import { z } from "zod";
import { GedcomEvent } from "../../../schemas/gedcom/index.ts";

import debugFunction from "../../../lib/debug.ts";
const DEBUG = debugFunction(new URL(import.meta.url).pathname);
if (DEBUG) {
  console.log(`DEBUG enabled for ${new URL(import.meta.url).pathname}`);
}

export async function handler() {
  const eventsImport = await import("../../../assets/gedcom/events.json");
  const valid = z
    .array(GedcomEvent.GedcomElement)
    .safeParse(eventsImport.default);
  if (valid.success) {
    if (DEBUG) {
      console.log(`successful parse`);
    }
  } else {
    if (DEBUG) {
      console.error(valid.error.message);
    }
  }
  const events = valid.data;
  let body: GedcomEvent.GedcomElement | object = {};
  if (events && events.length > 0) {
    body = events;
  }

  return new Response(JSON.stringify(body), {
    headers: new Headers({
      "Content-Type": "application/json",
    }),
  });
}
