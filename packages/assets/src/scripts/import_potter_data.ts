import * as fs from "node:fs";
import * as path from "node:path";

import {
  GedcomEvent,
  GedcomFamily,
  GedcomPerson,
  FamilyStrings,
} from "@hp-stuff/schemas/gedcom";

const potterRawExport = path.join(process.cwd(), "potter_universe.json");

console.log(`potterRawExport is ${potterRawExport}`);

const inputFile = fs.readFileSync(potterRawExport, "utf8");

const lines = inputFile.trim().split("\n");
const jsonObjects = lines.map((line) => JSON.parse(line) as object);

// Filter and type the data
const rawEvents = jsonObjects.filter(
  (item) => item["_class" as keyof typeof item] === "Event"
);

const rawFamilies = jsonObjects.filter(
  (item) => item["_class" as keyof typeof item] === "Family"
);

const rawPersons = jsonObjects.filter(
  (item) => item["_class" as keyof typeof item] === "Person"
);

// Validate data against schemas (this will throw if validation fails)
// Note: You may need to adjust this based on your actual schema structure
const events: GedcomEvent.GedcomElement[] = rawEvents.map((event) =>
  GedcomEvent.GedcomElement.parse(event)
);

const families: GedcomFamily.GedcomElement[] = rawFamilies.map((family) =>
  GedcomFamily.GedcomElement.parse(family)
);
const persons = rawPersons.map((person) =>
  GedcomPerson.GedcomElement.parse(person)
);

console.log(
  `Loaded ${events.length} events, ${families.length} families, and ${persons.length} persons.`
);

// Function to find a person by handle
const findPersonByHandle = (
  handle: string
): GedcomPerson.GedcomElement | undefined => {
  return persons.find((p) => !p.handle.localeCompare(handle));
};

const findFatherForPerson = (person: GedcomPerson.GedcomElement) => {
  const result = person.parent_family_list
    .map((familyHandle: string) => {
      return families
        .map((f) => {
          if (f.handle === familyHandle) {
            return f.child_ref_list.map((cr) => {
              if (!cr.ref.localeCompare(person.handle)) {
                if (!cr.frel.string.localeCompare(FamilyStrings.Enum.Birth)) {
                  const p = findPersonByHandle(f.father_handle ?? "");
                  if (p) {
                    return p;
                  }
                }
              }
              return false;
            });
          }
          return false;
        })
        .flat();

      return false;
    })
    .flat()
    .filter((r) => !!r);
  if (result.length > 1) {
    console.error(`found too many fathers for ${person.gramps_id}`);
  }
  if (!result.length) {
    return null;
  }
  return result[0];
};

const findMotherForPerson = (person: GedcomPerson.GedcomElement) => {
  const result = person.parent_family_list
    .map((familyHandle: string) => {
      return families
        .map((f) => {
          if (f.handle === familyHandle) {
            return f.child_ref_list.map((cr) => {
              if (!cr.ref.localeCompare(person.handle)) {
                if (!cr.mrel.string.localeCompare(FamilyStrings.Enum.Birth)) {
                  const p = findPersonByHandle(f.mother_handle ?? "");
                  if (p) {
                    return p;
                  }
                }
              }
              return false;
            });
          }
          return false;
        })
        .flat();

      return false;
    })
    .flat()
    .filter((r) => !!r);
  if (result.length > 1) {
    console.error(`found too many mothers for ${person.gramps_id}`);
  }
  if (!result.length) {
    return null;
  }
  return result[0];
};

export {
  events,
  families,
  persons,
  findPersonByHandle,
  findFatherForPerson,
  findMotherForPerson,
};
