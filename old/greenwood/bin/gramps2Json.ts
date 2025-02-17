import { XMLParser } from "fast-xml-parser";
import * as fs from "fs";
import * as path from "path";
import { unzip } from "node:zlib";
import { type ZodError } from "zod";
import { delay } from "nanodelay";

import {
  Export as zodExport,
  Database,
  Person,
  Family,
} from "../src/lib/GrampsZodTypes";

import * as process from "process";

const grampsPath = path.join(
  process.cwd(),
  "src/assets/potter_universe.gramps",
);

console.log(`cwd is ${process.cwd()}, path is ${grampsPath}`);
const buffer = fs.readFileSync(grampsPath);
let data: zodExport | null = null;
unzip(buffer, (err, buffer) => {
  console.log(`in the unzip callback`);
  if (err) {
    console.error(`an error has occured decompressing`, err);
    process.exit(1);
  }
  const gramps = buffer.toString();

  if (gramps !== "") {
    const options = {
      ignoreAttributes: false,
      attributeNamePrefix: "",
      parseAttributeValue: true,
      allowBooleanAttributes: true,
    };
    const parser = new XMLParser(options);
    let jObj = parser.parse(gramps);
    if (jObj) {
      console.log(`state dataFetcher jObj populated `);
      const result:
        | { success: true; data: zodExport }
        | { success: false; error: ZodError } = zodExport.safeParse(jObj);
      if (result.success) {
        data = result.data;
        console.log(`successfully parsed`);
      } else {
        console.error(`zod safeParse failed`);
        process.exit(2);
      }
    } else {
      console.error`XML Parser failed`;
      process.exit(3);
    }
  } else {
    console.log(`readsync did not error, but gramps is still empty`);
    process.exit(4);
  }
});
console.log(`zlib complete`);

let i = 0;
while (!data) {
  console.log(`waiting ${i++}`);
  await delay(300);
}

const db = (data as zodExport).database;

/*
 * I will need two things.
 * 1) I need a copy of the entire database for things like family tree pages
 * 2) I need smaller files with subsets of the data that are easier to process for individual pages
 *    the smaller files improve performance because there is less to iterate over when I have
 *    to repeatedly filter the database.
 */

//first output, the full db
const fullDBPath = path.join(
  process.cwd(),
  "src/assets/gramps/",
  "gramps.json",
);
const fullDBFile = fs.openSync(fullDBPath, "w", 0o600);
const validation = Database.safeParse(db);
if (validation.success) {
  fs.writeSync(fullDBFile, JSON.stringify(validation.data));
  fs.closeSync(fullDBFile);
} else {
  console.error(`${validation.error.toString()}`);
}

//second split it up for individual pages
db.people.person.forEach((p) => {
  let toExport: Database = {
    header: db.header,
    tags: db.tags,
    events: db.events,
    families: { family: [] },
    people: { person: [p] },
    citations: db.citations,
    sources: db.sources,
    places: db.places,
    repositories: db.repositories,
    notes: db.notes,
    xmlns: db.xmlns,
  };
  //I need at most the 3rd generation above the current person
  for (let gen = 0; gen <= 3; gen++) {
    toExport.people.person.forEach((p) => {
      const result = getRelations(p);
      if (result !== null) {
        const { people, families } = result;
        if (people.length > 0) {
          toExport.people.person = toExport.people.person.concat(people);
        }
        if (families.length > 0) {
          toExport.families.family = toExport.families.family.concat(families);
        }
      }
    });
    toExport.people.person = Array.from(
      new Set(toExport.people.person.map((item) => item)),
    );
    toExport.families.family = Array.from(
      new Set(toExport.families.family.map((item) => item)),
    );
  }
  const personPath = path.join(
    process.cwd(),
    "src/assets/gramps/",
    p.id.concat(".json"),
  );
  const personFile = fs.openSync(personPath, "w", 0o600);
  const validation = Database.safeParse(toExport);
  if (validation.success) {
    fs.writeSync(personFile, JSON.stringify(toExport));
    fs.closeSync(personFile);
  } else {
    console.error(`${validation.error.toString()}`);
  }
});

function getRelations(individual: Person) {
  if (db && individual !== null && individual !== undefined) {
    let peopleToExport = new Array<Person>();
    let familiesToExport = new Array<Family>();
    if (individual.handle) {
      if (individual.childof) {
        const families = getFamilyAsChild(individual);
        if (families && families.length > 0) {
          familiesToExport = familiesToExport.concat(families);
          families.forEach((nf) => {
            const parents = getParentsOfFamily(nf);
            if (parents !== null && parents.length > 0) {
              peopleToExport = peopleToExport.concat(parents);
            }
            const children = getChildrenOfFamily(nf);
            if (children != null && children.length > 0) {
              peopleToExport = peopleToExport.concat(children);
            }
          });
        }
      }
      if (individual.parentin) {
        const families = getFamilyAsSpouse(individual);
        if (families && families.length > 0) {
          families.forEach((f) => {
            const parents = getParentsOfFamily(f);
            if (parents !== null && parents.length > 0) {
              peopleToExport = peopleToExport.concat(parents);
            }
            const children = getChildrenOfFamily(f);
            if (children != null && children.length > 0) {
              peopleToExport = peopleToExport.concat(children);
            }
          });
          familiesToExport = familiesToExport.concat(families);
        }
      }
    }
    if (peopleToExport.length > 0 || familiesToExport.length > 0) {
      return {
        people: peopleToExport,
        families: familiesToExport,
      };
    }
  }
  return null;
}

function getChildrenOfFamily(family: Family) {
  if (db && family !== null && family !== undefined) {
    let result = new Array<Person>();
    if (family.childref) {
      const childref = [family.childref].flat().map((c) => {
        return c.hlink;
      });
      if (childref && childref.length > 0) {
        childref.forEach((c) => {
          const nc = db.people.person.filter((p) => {
            if (p && p.handle) {
              return !p.handle.localeCompare(c, undefined, {
                sensitivity: "base",
              });
            }
            return false;
          });
          if (nc && nc.length > 0) {
            result = result.concat(nc);
          }
        });
      }
    }
    if (result.length > 0) {
      return result;
    }
  }
  return null;
}

function getFamilyAsSpouse(individual: Person) {
  if (db) {
    const personValidation = Person.safeParse(individual);
    if (personValidation.success) {
      let results = new Set<Family>();
      if (individual.parentin !== null && individual.parentin !== undefined) {
        const familyRefs = [individual.parentin].flat().map((c) => {
          return c.hlink;
        });
        familyRefs.forEach((fref) => {
          if (fref) {
            const families = db.families.family.filter((f) => {
              if (f.handle) {
                return !f.handle.localeCompare(fref, undefined, {
                  sensitivity: "base",
                });
              }
              return false;
            });
            if (
              families !== null &&
              families !== undefined &&
              families.length > 0
            ) {
              families.map((f) => {
                results.add(f);
              });
            }
          }
        });
      }
      if (results.size > 0) {
        return Array.from(results);
      }
    }
  }
  return null;
}

function getFamilyAsChild(individual: Person) {
  if (db) {
    const personValidation = Person.safeParse(individual);
    if (personValidation.success) {
      let results = new Set<Family>();
      if (individual.childof !== null && individual.childof !== undefined) {
        const childof = [individual.childof].flat().map((c) => {
          return c.hlink;
        });
        childof.forEach((fref) => {
          if (fref) {
            const families = db.families.family.filter((f) => {
              if (f.handle) {
                return !f.handle.localeCompare(fref, undefined, {
                  sensitivity: "base",
                });
              }
              return false;
            });
            if (
              families !== null &&
              families !== undefined &&
              families.length > 0
            ) {
              families.map((f) => {
                results.add(f);
              });
            }
          }
        });
      }
      if (results.size > 0) {
        return Array.from(results);
      }
    }
  }
  return null;
}

function getParentsOfFamily(family: Family) {
  if (db) {
    const familyValidation = Family.safeParse(family);
    if (familyValidation.success) {
      let result = new Array<Person>();
      if (family.father !== null && family.father !== undefined) {
        const fatherRef = [family.father].flat().map((f) => f.hlink);
        if (fatherRef !== undefined && fatherRef.length > 0) {
          fatherRef.forEach((fr) => {
            const toAdd = db.people.person.filter((p) => {
              if (p && p.handle) {
                return !p.handle.localeCompare(fr, undefined, {
                  sensitivity: "base",
                });
              }
              return false;
            });
            result = result.concat(toAdd);
          });
        }
        if (family.mother !== null && family.mother !== undefined) {
          const motherRef = [family.mother].flat().map((m) => m.hlink);
          if (motherRef !== undefined && motherRef.length > 0) {
            motherRef.forEach((mr) => {
              const toAdd = db.people.person.filter((p) => {
                if (p && p.handle) {
                  return !p.handle.localeCompare(mr, undefined, {
                    sensitivity: "base",
                  });
                }
                return false;
              });
              result = result.concat(toAdd);
            });
          }
        }
      }
      if (result.length > 0) {
        return result;
      }
    } else {
      console.log(`getParentsOfFamily; family validation failed`);
    }
  } else {
    console.log(`getParentsOfFamily; no db`);
  }
  return null;
}
