import { SignalArray } from "signal-utils/array";
import { SignalObject } from "signal-utils/object";

import {
  type GedcomEvent,
  type GedcomFamily,
  type GedcomPerson,
} from "../../schemas/gedcom/index.ts";

const GrampsState = new SignalObject({
  people: new SignalArray<GedcomPerson.GedcomElement>(),
  families: new SignalArray<GedcomFamily.GedcomElement>(),
  events: new SignalArray<GedcomEvent.GedcomElement>(),
});

export default GrampsState;
