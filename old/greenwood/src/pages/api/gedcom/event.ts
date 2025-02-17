import { z } from "zod";
import { GedcomEvent } from "../../../schemas/gedcom/index.ts";

export async function handler(request: Request) {
  const params = new URLSearchParams(
    request.url.slice(request.url.indexOf("?"))
  );
  const id = params.has("id") ? params.get("id") : "";

  const eventsImport = await import("../../../assets/gedcom/events.json");
  const valid = z
    .array(GedcomEvent.GedcomElement)
    .safeParse(eventsImport.default);
  if (valid.success) {
    console.log(`successful parse`);
  } else {
    console.error(valid.error.message);
  }
  const events = valid.data;
  let body: GedcomEvent.GedcomElement | Object = {};
  if (events && events.length > 0 && id) {
    const event = events.find((e) => {
      return !e.id.localeCompare(id);
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
