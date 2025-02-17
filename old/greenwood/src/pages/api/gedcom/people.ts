import { z } from "zod";
import { GedcomPerson } from "../../../schemas/gedcom/index.ts";
export async function handler(request: Request) {
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
  if (people && people.length > 0) {
    body = people;
  }

  return new Response(JSON.stringify(body), {
    headers: new Headers({
      "Content-Type": "application/json",
    }),
  });
}
