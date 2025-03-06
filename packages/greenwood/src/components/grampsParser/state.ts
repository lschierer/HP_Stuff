import { SignalArray } from "signal-utils/array";
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
  people: new SignalArray<GedcomPerson.GedcomElement>(),
  peopleIDs: new SignalSet<string>(),

  families: new SignalArray<GedcomFamily.GedcomElement>(),
  familyIds: new SignalSet<string>(),

  events: new SignalArray<GedcomEvent.GedcomElement>(),
  eventIds: new SignalSet<string>(),
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
        if (!GrampsState.peopleIDs.has(p.id)) {
          GrampsState.people.push(p);
          GrampsState.peopleIDs.add(p.id);
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
        if (!GrampsState.familyIds.has(f.id)) {
          GrampsState.families.push(f);
          GrampsState.familyIds.add(f.id);
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
        if (!GrampsState.eventIds.has(event.id)) {
          GrampsState.events.push(event);
          GrampsState.eventIds.add(event.id);
        }
      });
      if (DEBUG) {
        console.log(`starting with ${GrampsState.events.length} events`);
      }
    } else {
      if (DEBUG) {
        console.error(`error fetching events in state`, valid.error.message);
      }
    }
  }
};
