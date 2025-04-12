import { z } from "zod";

export const ChildRefClass = z.enum(["ChildRef"]);
export type ChildRefClass = z.infer<typeof ChildRefClass>;

export const PurpleClass = z.enum([
  "ChildRefType",
  "EventRoleType",
  "FamilyRelType",
]);
export type PurpleClass = z.infer<typeof PurpleClass>;

export const StringEnum = z.enum([
  "Birth",
  "Civil Union",
  "Family",
  "Foster",
  "Married",
  "Unknown",
  "Unmarried",
]);
export type StringEnum = z.infer<typeof StringEnum>;

export const EventRefClass = z.enum(["EventRef"]);
export type EventRefClass = z.infer<typeof EventRefClass>;

export const Type = z.object({
  _class: PurpleClass,
  string: StringEnum,
});
export type Type = z.infer<typeof Type>;

export const EventRef = z.object({
  _class: EventRefClass,
  private: z.boolean(),
  note_list: z.array(z.any()),
  attribute_list: z.array(z.any()),
  ref: z.string(),
  role: Type,
});
export type EventRef = z.infer<typeof EventRef>;

export const ChildRef = z.object({
  _class: ChildRefClass,
  private: z.boolean(),
  citation_list: z.array(z.string()),
  note_list: z.array(z.string()),
  ref: z.string(),
  frel: Type,
  mrel: Type,
});
export type ChildRef = z.infer<typeof ChildRef>;

export const GedcomElement = z.object({
  _class: StringEnum,
  handle: z.string(),
  change: z.number(),
  private: z.boolean(),
  tag_list: z.array(z.string()),
  id: z.string(),
  citation_list: z.array(z.string()),
  note_list: z.array(z.string()),
  media_list: z.array(z.any()),
  attribute_list: z.array(z.any()),
  lds_ord_list: z.array(z.any()),
  father_handle: z.union([z.null(), z.string()]),
  mother_handle: z.union([z.null(), z.string()]),
  child_ref_list: z.array(ChildRef),
  type: Type,
  event_ref_list: z.array(EventRef),
  complete: z.number(),
});
export type GedcomElement = z.infer<typeof GedcomElement>;
