import { z } from "zod";

export const FamilyStrings = z.enum([
  "Birth",
  "Civil Union",
  "Family",
  "Foster",
  "Married",
  "Unknown",
  "Unmarried",
]);
export type FamilyStrings = z.infer<typeof FamilyStrings>;

export const PersonStrings = z.enum([
  "Also Known As",
  "Birth Name",
  "Bride",
  "",
  "Given",
  "Groom",
  "Location",
  "Married Name",
  "Primary",
  "Taken",
  "Unknown",
]);
export type PersonStrings = z.infer<typeof PersonStrings>;

export const PurpleClass = z.enum([
  "ChildRefType",
  "EventRoleType",
  "FamilyRelType",
]);
export type PurpleClass = z.infer<typeof PurpleClass>;

export const PersonTypeClass = z.enum([
  "EventRoleType",
  "NameOriginType",
  "NameType",
]);
export type PersonTypeClass = z.infer<typeof PersonTypeClass>;

export const GedcomType = z.union([
  z.object({
    _class: PurpleClass,
    string: FamilyStrings,
  }),
  z.object({
    _class: PersonTypeClass,
    string: PersonStrings,
  }),
]);
export type GedcomType = z.infer<typeof GedcomType>;

export const EventRefListClass = z.enum(["EventRef"]);
export type EventRefListClass = z.infer<typeof EventRefListClass>;

export const EventRefList = z.object({
  _class: EventRefListClass,
  private: z.boolean(),
  note_list: z.array(z.any()),
  attribute_list: z.array(z.any()),
  ref: z.string(),
  role: GedcomType,
});
export type EventRefList = z.infer<typeof EventRefList>;
