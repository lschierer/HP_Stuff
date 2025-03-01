import * as z from "zod";

export const TypeClass = z.enum(["AttributeType", "EventType"]);
export type TypeClass = z.infer<typeof TypeClass>;

export const StringEnum = z.enum([
  "Birth",
  "Death",
  "Education",
  "Elected",
  "Engagement",
  "Hogwarts Sorting",
  "Marriage",
  "Number of Children",
  "Retirement",
]);
export type StringEnum = z.infer<typeof StringEnum>;

export const GedcomClass = z.enum(["Event"]);
export type GedcomClass = z.infer<typeof GedcomClass>;

export const DateClassEnum = z.enum(["Date"]);
export type DateClassEnum = z.infer<typeof DateClassEnum>;

export const Description = z.enum(["", "Hogwarts"]);
export type Description = z.infer<typeof Description>;

export const Place = z.enum(["ed65c85d7b47cf245347468ab7d", ""]);
export type Place = z.infer<typeof Place>;

export const Type = z.object({
  _class: TypeClass,
  string: StringEnum,
});
export type Type = z.infer<typeof Type>;

export const DateClass = z.object({
  _class: DateClassEnum,
  format: z.null(),
  calendar: z.number(),
  modifier: z.number(),
  quality: z.number(),
  dateval: z.array(z.union([z.boolean(), z.number()])),
  text: z.string(),
  sortval: z.number(),
  newyear: z.number(),
});
export type DateClass = z.infer<typeof DateClass>;

export const Attribute = z.object({
  _class: z.string(),
  private: z.boolean(),
  type: Type,
  value: z.string(),
  citation_list: z.array(z.string()),
  note_list: z.array(z.any()),
});
export type Attribute = z.infer<typeof Attribute>;

export const GedcomElement = z.object({
  _class: GedcomClass,
  handle: z.string(),
  change: z.number(),
  private: z.boolean(),
  tag_list: z.array(z.string()),
  id: z.string(),
  citation_list: z.array(z.string()),
  note_list: z.array(z.string()),
  media_list: z.array(z.any()),
  attribute_list: z.array(Attribute),
  date: z.union([DateClass, z.null()]),
  place: Place,
  type: Type,
  description: Description,
});
export type GedcomElement = z.infer<typeof GedcomElement>;
