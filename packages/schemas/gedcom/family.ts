import * as z from "zod";

import { FamilyStrings, GedcomType, EventRefList } from "./common";

export const ChildRefListClass = z.enum(["ChildRef"]);
export type ChildRefListClass = z.infer<typeof ChildRefListClass>;

export const ChildRefList = z.object({
  _class: ChildRefListClass,
  private: z.boolean(),
  citation_list: z.array(z.string()),
  note_list: z.array(z.string()),
  ref: z.string(),
  frel: GedcomType,
  mrel: GedcomType,
});
export type ChildRefList = z.infer<typeof ChildRefList>;

export const GedcomElement = z.object({
  _class: FamilyStrings,
  handle: z.string(),
  change: z.number(),
  private: z.boolean(),
  tag_list: z.array(z.string()),
  gramps_id: z.string(),
  citation_list: z.array(z.string()),
  note_list: z.array(z.string()),
  media_list: z.array(z.any()),
  attribute_list: z.array(z.any()),
  lds_ord_list: z.array(z.any()),
  father_handle: z.union([z.null(), z.string()]),
  mother_handle: z.union([z.null(), z.string()]),
  child_ref_list: z.array(ChildRefList),
  type: GedcomType,
  event_ref_list: z.array(EventRefList),
  complete: z.number(),
});
export type GedcomElement = z.infer<typeof GedcomElement>;
