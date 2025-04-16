import * as fs from "node:fs";
import * as path from "node:path";

import {
  GedcomEvent,
  GedcomFamily,
  GedcomPerson,
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

export { events, families, persons };
