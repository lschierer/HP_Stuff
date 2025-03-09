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
  let family_id: string = "";
  /* eslint-disable-next-line @typescript-eslint/no-unused-vars */
  for (const [k2, f] of GrampsState.families) {
    if (f.child_ref_list.length) {
      child.parent_family_list.map((pf) => {
        const match = f.child_ref_list.find((crle) => {
          return crle.ref.localeCompare(pf);
        });
        if (match) {
          family_id = f.id;
        }
      });
    }
  }
  let found = false;
  /* eslint-disable-next-line @typescript-eslint/no-unused-vars */
  for (const [k, p] of GrampsState.people) {
    /* eslint-disable-next-line @typescript-eslint/no-unnecessary-condition */
    if (!found) {
      if (family_id.length) {
        const family = GrampsState.families.get(family_id);
        if (family) {
          if (family.father_handle) {
            if (!family.father_handle.localeCompare(p.handle)) {
              found = true;
              return p;
            }
          }
        }
      }
    }
  }
};

export const findMotherForChild = (child: GedcomPerson.GedcomElement) => {
  let family_id: string = "";
  /* eslint-disable-next-line @typescript-eslint/no-unused-vars */
  for (const [k2, f] of GrampsState.families) {
    if (f.child_ref_list.length) {
      child.parent_family_list.map((pf) => {
        const match = f.child_ref_list.find((crle) => {
          return crle.ref.localeCompare(pf);
        });
        if (match) {
          family_id = f.id;
        }
      });
    }
  }
  let found = false;
  /* eslint-disable-next-line @typescript-eslint/no-unused-vars */
  for (const [k, p] of GrampsState.people) {
    /* eslint-disable-next-line @typescript-eslint/no-unnecessary-condition */
    if (!found) {
      if (family_id.length) {
        const family = GrampsState.families.get(family_id);
        if (family) {
          if (family.mother_handle) {
            if (!family.mother_handle.localeCompare(p.handle)) {
              found = true;
              return p;
            }
          }
        }
      }
    }
  }
};
