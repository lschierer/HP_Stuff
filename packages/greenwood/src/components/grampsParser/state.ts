import { SignalMap } from "signal-utils/map";
import { SignalSet } from "signal-utils/set";
import { SignalObject } from "signal-utils/object";

import {
  GedcomEvent,
  GedcomFamily,
  GedcomPerson,
  PersonStrings,
} from "@hp-stuff/schemas/gedcom";

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

export const familyListDisplayedIds = new SignalSet<string>();

export const familyPagesCreated = new SignalSet<string>();

export const getGrampsData = async () => {
  const basePath = "../../assets/gedcom";
  if (!GrampsState.people.size) {
    const peoplePath = basePath.concat("/people.json");
    const peopleImport = (await import(peoplePath, {
      with: { type: "json" },
    })) as object;
    const valid = GedcomPerson.GedcomElement.array().safeParse(
      peopleImport["default" as keyof typeof peopleImport]
    );
    if (!valid.success) {
      if (DEBUG) {
        console.error(valid.error.message);
      }
    } else {
      valid.data.map((p) => {
        if (!GrampsState.people.has(p.gramps_id)) {
          GrampsState.people.set(p.gramps_id, p);
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
    const familyImport = (await import(familyPath, {
      with: { type: "json" },
    })) as object;
    const valid = GedcomFamily.GedcomElement.array().safeParse(
      familyImport["default" as keyof typeof familyImport]
    );
    if (!valid.success) {
      if (DEBUG) {
        console.error(valid.error.message);
      }
    } else {
      valid.data.map((f) => {
        if (!GrampsState.families.has(f.gramps_id)) {
          GrampsState.families.set(f.gramps_id, f);
        }
      });
    }
  }

  if (!GrampsState.events.size) {
    const eventsPath = basePath.concat("/events.json");
    const eventsImport = (await import(eventsPath, {
      with: { type: "json" },
    })) as object;
    const valid = GedcomEvent.GedcomElement.array().safeParse(
      eventsImport["default" as keyof typeof eventsImport]
    );
    if (!valid.success) {
      if (DEBUG) {
        console.error(valid.error.message);
      }
    } else {
      valid.data.map((event) => {
        if (!GrampsState.events.has(event.gramps_id)) {
          GrampsState.events.set(event.gramps_id, event);
        }
      });
    }
  }
};

export const findFatherForChild = (child: GedcomPerson.GedcomElement) => {
  if (DEBUG) {
    console.log(`findFatherForChild for child ${child.gramps_id}`);
  }
  let family_id: string = "";

  for (const [k2, f] of GrampsState.families) {
    if (DEBUG) {
      console.log(`processing key ${k2}`);
    }
    if (!family_id.length) {
      if (f.child_ref_list.length) {
        f.child_ref_list.forEach((crl) => {
          if (!crl.ref.localeCompare(child.handle)) {
            if (DEBUG) {
              console.log(`found matching family ${f.gramps_id}`);
            }
            family_id = f.gramps_id;
          }
        });
      }
    }
  }
  const family = GrampsState.families.get(family_id);
  let father_id = "";
  if (family) {
    if (family.father_handle) {
      const parent_handle = family.father_handle;
      GrampsState.people.forEach((pp) => {
        if (!father_id.length && !pp.handle.localeCompare(parent_handle)) {
          if (DEBUG) {
            console.log(`found father ${pp.gramps_id}`);
          }
          father_id = pp.gramps_id;
        }
      });
      if (father_id.length) {
        return GrampsState.people.get(father_id);
      }
    }
  }
  return undefined;
};

export const findMotherForChild = (child: GedcomPerson.GedcomElement) => {
  if (DEBUG) {
    console.log(`findMotherForChild for child ${child.id}`);
  }
  let family_id: string = "";

  for (const [k2, f] of GrampsState.families) {
    if (DEBUG) {
      console.log(`processing key ${k2}`);
    }
    if (!family_id.length) {
      if (f.child_ref_list.length) {
        f.child_ref_list.forEach((crl) => {
          if (!crl.ref.localeCompare(child.handle)) {
            if (DEBUG) {
              console.log(`found matching family ${f.gramps_id}`);
            }
            family_id = f.gramps_id;
          }
        });
      }
    }
  }
  const family = GrampsState.families.get(family_id);
  let mother_id = "";
  if (family) {
    if (family.mother_handle) {
      const parent_handle = family.mother_handle;
      GrampsState.people.forEach((pp) => {
        if (!mother_id.length && !pp.handle.localeCompare(parent_handle)) {
          if (DEBUG) {
            console.log(`found father ${pp.gramps_id}`);
          }
          mother_id = pp.gramps_id;
        }
      });
      if (mother_id.length) {
        return GrampsState.people.get(mother_id);
      }
    }
  }
  return undefined;
};

export const findPersonByHandle = (handle: string) => {
  if (GrampsState.people.size) {
    for (const [key, person] of GrampsState.people) {
      if (DEBUG) {
        console.log(`inspecting ${key}`);
      }
      if (!person.handle.localeCompare(handle)) {
        return person;
      }
    }
  }
  return undefined;
};

export const findBirthLastName = (
  person: GedcomPerson.GedcomElement,
  forLink: boolean = false
) => {
  const lastnameObject = person.primary_name.surname_list.find((sn) => {
    if (sn.surname.length) {
      if (
        !person.primary_name.type.string.localeCompare(
          PersonStrings.Enum["Birth Name"]
        )
      ) {
        if (DEBUG) {
          console.log(`${person.gramps_id} has a birth name ${sn.surname}`);
        }
        let prefix: string = sn.prefix;
        prefix = !prefix.localeCompare("of") ? "of " : prefix;
        return `${prefix}${sn.surname}`;
      }
      if (
        !person.primary_name.type.string.localeCompare(PersonStrings.Enum.Given)
      ) {
        if (DEBUG) {
          console.log(`${person.gramps_id} has a given name ${sn.surname}`);
        }
        let prefix: string = sn.prefix;
        prefix = !prefix.localeCompare("of") ? "of " : prefix;
        return `${prefix}${sn.surname}`;
      }
      if (
        !sn.origintype.string.localeCompare(PersonStrings.Enum["Birth Name"])
      ) {
        if (DEBUG) {
          console.log(
            `${person.gramps_id} has surname with type Birth Name: ${sn.surname}`
          );
        }
      }
      if (!sn.origintype.string.localeCompare(PersonStrings.Enum.Given)) {
        if (DEBUG) {
          console.log(
            `${person.gramps_id} has surname with type Given: ${sn.surname}`
          );
        }
      }
    }

    return false;
  });

  if (lastnameObject) {
    const lastname = lastnameObject.surname;
    if (DEBUG) {
      console.log(`found lastname ${lastname} for ${person.gramps_id}`);
    }
    if (forLink) {
      return lastname;
    }
    return lastname;
  }
  return "Unknown";
};

export const findAnyLastName = (
  person: GedcomPerson.GedcomElement,
  forLink: boolean = false
) => {
  // First try to find a birth name
  const birthLastName = findBirthLastName(person, forLink);

  // If we found a valid birth last name, return it
  if (birthLastName !== "Unknown") {
    return birthLastName;
  }

  // Otherwise, look for any surname in the primary_name
  if (person.primary_name.surname_list.length > 0) {
    for (const surname of person.primary_name.surname_list) {
      if (surname.surname && surname.surname.length > 0) {
        if (DEBUG) {
          console.log(
            `${person.gramps_id} has a non-birth surname ${surname.surname}`
          );
        }
        let prefix: string = surname.prefix;
        if (forLink) {
          prefix = !prefix.localeCompare("of") ? "of " : prefix;
          return `${prefix}${surname.surname}`;
        }
        prefix = !prefix.localeCompare("of") ? "of " : prefix;
        return `${prefix}${surname.surname}`;
      }
    }
  }

  // If no surname found, return "Unknown"
  return "Unknown";
};
