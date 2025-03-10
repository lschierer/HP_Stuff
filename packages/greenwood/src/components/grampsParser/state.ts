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

const GrampsState = new SignalObject({
  people: new SignalMap<string, GedcomPerson.GedcomElement>(),

  families: new SignalMap<string, GedcomFamily.GedcomElement>(),

  events: new SignalMap<string, GedcomEvent.GedcomElement>(),
});

export default GrampsState;

export const familyListDisplayedIds = new SignalSet<string>();

export const getGrampsData = async (base: string) => {
  const peopleURL = new URL("/api/gedcom/people", base);
  const peopleResponce = await fetch(peopleURL);
  if (peopleResponce.ok) {
    const data = (await peopleResponce.json()) as object;
    const valid = GedcomPerson.GedcomElement.array().safeParse(data);
    if (valid.success) {
      valid.data.map((p) => {
        if (!GrampsState.people.has(p.id)) {
          GrampsState.people.set(p.id, p);
        }
      });
      if (DEBUG) {
        console.log(`starting with ${GrampsState.people.length} people`);
      }
    } else {
      if (DEBUG) {
        console.error(`error fetching people in state`, valid.error.message);
      }
    }
  }

  const familyURL = new URL("/api/gedcom/families", base);
  const familyResponse = await fetch(familyURL);
  if (familyResponse.ok) {
    const data = (await familyResponse.json()) as object;
    const valid = GedcomFamily.GedcomElement.array().safeParse(data);
    if (valid.success) {
      valid.data.map((f) => {
        if (!GrampsState.families.has(f.id)) {
          GrampsState.families.set(f.id, f);
        }
      });
      if (DEBUG) {
        console.log(`starting with ${GrampsState.families.length} families`);
      }
    } else {
      if (DEBUG) {
        console.error(`error fetching families in state`, valid.error.message);
      }
    }
  }

  const eventsURL = new URL("/api/gedcom/events", base);
  const eventsResponse = await fetch(eventsURL);
  if (eventsResponse.ok) {
    const data = (await eventsResponse.json()) as object;
    const valid = GedcomEvent.GedcomElement.array().safeParse(data);
    if (valid.success) {
      valid.data.map((event) => {
        if (!GrampsState.events.has(event.id)) {
          GrampsState.events.set(event.id, event);
        }
      });
      if (DEBUG) {
        console.log(`starting with ${GrampsState.events.size} events`);
      }
    } else {
      if (DEBUG) {
        console.error(`error fetching events in state`, valid.error.message);
      }
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
