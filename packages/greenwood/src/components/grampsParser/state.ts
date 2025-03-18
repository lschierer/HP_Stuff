import { SignalMap } from "signal-utils/map";
import { SignalSet } from "signal-utils/set";
import { SignalObject } from "signal-utils/object";

import {
  GedcomEvent,
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
        if (!GrampsState.families.has(f.id)) {
          GrampsState.families.set(f.id, f);
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
        if (!GrampsState.events.has(event.id)) {
          GrampsState.events.set(event.id, event);
        }
      });
    }
  }
};

export const findFatherForChild = (child: GedcomPerson.GedcomElement) => {
  if (DEBUG) {
    console.log(`findFatherForChild for child ${child.id}`);
  }
  let family_id: string = "";
  /* eslint-disable-next-line @typescript-eslint/no-unused-vars */
  for (const [k2, f] of GrampsState.families) {
    if (!family_id.length) {
      if (f.child_ref_list.length) {
        f.child_ref_list.forEach((crl) => {
          if (!crl.ref.localeCompare(child.handle)) {
            if (DEBUG) {
              console.log(`found matching family ${f.id}`);
            }
            family_id = f.id;
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
            console.log(`found father ${pp.id}`);
          }
          father_id = pp.id;
        }
      });
      if (father_id.length) {
        return GrampsState.people.get(father_id);
      }
    }
  }
};

export const findMotherForChild = (child: GedcomPerson.GedcomElement) => {
  if (DEBUG) {
    console.log(`findMotherForChild for child ${child.id}`);
  }
  let family_id: string = "";
  /* eslint-disable-next-line @typescript-eslint/no-unused-vars */
  for (const [k2, f] of GrampsState.families) {
    if (!family_id.length) {
      if (f.child_ref_list.length) {
        f.child_ref_list.forEach((crl) => {
          if (!crl.ref.localeCompare(child.handle)) {
            if (DEBUG) {
              console.log(`found matching family ${f.id}`);
            }
            family_id = f.id;
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
            console.log(`found father ${pp.id}`);
          }
          mother_id = pp.id;
        }
      });
      if (mother_id.length) {
        return GrampsState.people.get(mother_id);
      }
    }
  }
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
};

export const findBirthLastName = (person: GedcomPerson.GedcomElement) => {
  const lastnameObject = person.primary_name.surname_list.find((sn) => {
    if (sn.surname.length) {
      if (
        !person.primary_name.type.string.localeCompare(
          GedcomPerson.StringEnum.Enum["Birth Name"]
        )
      ) {
        if (DEBUG) {
          console.log(`${person.id} has a birth name ${sn.surname}`);
        }
        return sn.surname;
      }
      if (
        !person.primary_name.type.string.localeCompare(
          GedcomPerson.StringEnum.Enum.Given
        )
      ) {
        if (DEBUG) {
          console.log(`${person.id} has a given name ${sn.surname}`);
        }
        return sn.surname;
      }
      if (
        !sn.origintype.string.localeCompare(
          GedcomPerson.StringEnum.Enum["Birth Name"]
        )
      ) {
        if (DEBUG) {
          console.log(
            `${person.id} has surname with type Birth Name: ${sn.surname}`
          );
        }
      }
      if (
        !sn.origintype.string.localeCompare(GedcomPerson.StringEnum.Enum.Given)
      ) {
        if (DEBUG) {
          console.log(
            `${person.id} has surname with type Given: ${sn.surname}`
          );
        }
      }
    }

    return false;
  });

  if (lastnameObject) {
    const lastname = lastnameObject.surname;
    if (DEBUG) {
      console.log(`found lastname ${lastname} for ${person.id}`);
    }
    return lastname;
  }
  return "Unknown";
};
