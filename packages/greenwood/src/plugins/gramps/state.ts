import { SignalMap } from "signal-utils/map";
import { SignalObject } from "signal-utils/object";

import {
  type GedcomEvent,
  GedcomFamily,
  GedcomPerson,
} from "../../schemas/gedcom/index.ts";

import debugFunction from "../../lib/debug.ts";

const DEBUG = debugFunction(new URL(import.meta.url).pathname);
if (DEBUG) {
  console.log(`DEBUG enabled for ${new URL(import.meta.url).pathname}`);
}

export const GrampsState = new SignalObject({
  people: new SignalMap<string, GedcomPerson.GedcomElement>(),

  families: new SignalMap<string, GedcomFamily.GedcomElement>(),

  events: new SignalMap<string, GedcomEvent.GedcomElement>(),
});

export const getGrampsData = async () => {
  const basePath = "../../assets/gedcom";
  if (!GrampsState.people.size) {
    const peoplePath = basePath.concat("/people.json");
    const peopleImport = (await import(peoplePath)) as object;
    const valid = GedcomPerson.GedcomElement.array().safeParse(
      peopleImport["default" as keyof typeof peopleImport]
    );
    if (!valid.success) {
      if (DEBUG) {
        console.error(valid.error.message);
      }
    } else {
      valid.data.map((p) => {
        if (!GrampsState.people.has(p.id)) {
          GrampsState.people.set(p.id, p);
        }
      });
    }
  }
  if (DEBUG) {
    console.log(
      `state.ts getGrampsData ending with people: ${GrampsState.people.size}`
    );
  }

  if (!GrampsState.families.size) {
    const familyPath = basePath.concat("/families.json");
    const familyImport = (await import(familyPath)) as object;
    const valid = GedcomFamily.GedcomElement.array().safeParse(
      familyImport["default" as keyof typeof familyImport]
    );
    if (!valid.success) {
      if (DEBUG) {
        console.error(valid.error.message);
      }
    } else {
      valid.data.map((f) => {
        if (!GrampsState.families.has(f.id)) {
          GrampsState.families.set(f.id, f);
        }
      });
    }
  }
};
