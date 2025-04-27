import { GedcomEvent } from "@hp-stuff/schemas/gedcom";
import JsonEvents from "@hp-stuff/assets/dist/gedcom/events.json" with { type: "JSON" };

import debugFunction from "../../../lib/debug.ts";
const DEBUG = debugFunction(new URL(import.meta.url).pathname);
if (DEBUG) {
  console.log(`DEBUG enabled for ${new URL(import.meta.url).pathname}`);
}

export async function handler(request: Request) {
  /*start work around for GetFrontmatter requiring async */
  await new Promise((resolve) => setTimeout(resolve, 1));
  /* end workaround */

  const params = new URLSearchParams(
    request.url.slice(request.url.indexOf("?"))
  );
  const id = params.has("id") ? params.get("id") : "";

  const valid = GedcomEvent.GedcomElement.array().safeParse(JsonEvents);
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
  if (events && events.length > 0 && id) {
    const event = events.find((e) => {
      return !e.gramps_id.localeCompare(id);
    });
    if (event) {
      body = event;
    }
  }

  return new Response(JSON.stringify(body), {
    headers: new Headers({
      "Content-Type": "application/json",
    }),
  });
}
