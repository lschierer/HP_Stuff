import { z } from "zod";
import { GedcomPerson } from "../../../schemas/gedcom/index.ts";
export async function handler(request: Request) {
  const params = new URLSearchParams(
    request.url.slice(request.url.indexOf("?"))
  );
  const id = params.has("id") ? params.get("id") : "";

  const peopleImport = await import("../../../assets/gedcom/people.json");
  const valid = z
    .array(GedcomPerson.GedcomElement)
    .safeParse(peopleImport.default);
  if (valid.success) {
    console.log(`successful parse`);
  } else {
    console.error(valid.error.message);
  }
  const people = valid.data;
  let body: GedcomPerson.GedcomElement | Object = {};
  if (people && people.length > 0 && id) {
    const person = people.find((p) => {
      return !p.id.localeCompare(id);
    });
    if (person) {
      body = person;
    }
  }

  return new Response(JSON.stringify(body), {
    headers: new Headers({
      "Content-Type": "application/json",
    }),
  });
}
