import * as z from "zod";

export const EventTypeClass = z.enum(["AttributeType", "EventType"]);
export type EventTypeClass = z.infer<typeof EventTypeClass>;

export const EventStrings = z.enum([
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
export type EventStrings = z.infer<typeof EventStrings>;

export const TopLevelClass = z.enum(["Event"]);
export type TopLevelClass = z.infer<typeof TopLevelClass>;

export const DateClassEnum = z.enum(["Date"]);
export type DateClassEnum = z.infer<typeof DateClassEnum>;

const Description = z.enum(["", "Hogwarts"]);
type Description = z.infer<typeof Description>;

const Place = z.enum(["ed65c85d7b47cf245347468ab7d", ""]);
type Place = z.infer<typeof Place>;

const Type = z.object({
  _class: EventTypeClass,
  string: EventStrings,
});
type Type = z.infer<typeof Type>;

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

export const EventAttributeList = z.object({
  _class: z.string(),
  private: z.boolean(),
  type: Type,
  value: z.string(),
  citation_list: z.array(z.string()),
  note_list: z.array(z.any()),
});
export type EventAttributeList = z.infer<typeof EventAttributeList>;

export const GedcomElement = z.object({
  _class: TopLevelClass,
  handle: z.string(),
  change: z.number(),
  private: z.boolean(),
  tag_list: z.array(z.string()),
  gramps_id: z.string(),
  citation_list: z.array(z.string()),
  note_list: z.array(z.string()),
  media_list: z.array(z.any()),
  attribute_list: z.array(EventAttributeList),
  date: z.union([DateClass, z.null()]),
  place: Place,
  type: Type,
  description: Description,
});
export type GedcomElement = z.infer<typeof GedcomElement>;
