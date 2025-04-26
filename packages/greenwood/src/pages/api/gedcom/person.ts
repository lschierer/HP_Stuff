import { GedcomPerson } from "@hp-stuff/schemas/gedcom";

import debugFunction from "../../../lib/debug.ts";

const FILENAME = new URL(import.meta.url).pathname;
const DEBUG = debugFunction(FILENAME);
if (DEBUG) {
  console.log(`DEBUG enabled for ${new URL(import.meta.url).pathname}`);
}

export async function handler(request: Request) {
  const params = new URLSearchParams(
    request.url.slice(request.url.indexOf("?"))
  );
  const id = params.has("id") ? params.get("id") : "";
  let body: GedcomPerson.GedcomElement | object = {};
  const jsonFile = new URL("/assets/gedcom/people.json", import.meta.url);
  const peoplereq = await fetch(jsonFile);
  if (peoplereq.ok) {
    const peopleImport = (await peoplereq.json()) as object;

    const valid = GedcomPerson.GedcomElement.array().safeParse(
      peopleImport["default" as keyof typeof peopleImport]
    );
    if (valid.success) {
      if (DEBUG) {
        console.log(`${FILENAME} has a successful parse of ${jsonFile}`);
      }
    } else {
      if (DEBUG) {
        console.error(valid.error.message);
      }
    }
    const people = valid.data;
    if (DEBUG) {
      console.log(
        `${FILENAME} has ${people ? people.length : 0} people, I will now look for id "${id}"`
      );
    }

    if (people && people.length > 0 && id) {
      const person = people.find((p) => {
        return !p.gramps_id.localeCompare(id);
      });
      if (person) {
        body = person;
      } else {
        console.error(`${FILENAME} failed to find person for ${id}`);
      }
    }
  }

  return new Response(JSON.stringify(body), {
    headers: new Headers({
      "Content-Type": "application/json",
    }),
  });
}
