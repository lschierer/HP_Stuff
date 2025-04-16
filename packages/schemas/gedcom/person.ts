import * as z from "zod";

import { EventRefList, GedcomType } from "./common";

export const PrimaryNameClass = z.enum(["Name"]);
export type PrimaryNameClass = z.infer<typeof PrimaryNameClass>;

export const Suffix = z.enum(["", "II", "III", "IV", "Junior", "V"]);
export type Suffix = z.infer<typeof Suffix>;

export const SurnameListClass = z.enum(["Surname"]);
export type SurnameListClass = z.infer<typeof SurnameListClass>;

export const Prefix = z.enum(["", "of"]);
export type Prefix = z.infer<typeof Prefix>;

export const Title = z.enum([
  "",
  "Lord",
  "Madam",
  "Mrs.",
  "Professor",
  "Reverend",
]);
export type Title = z.infer<typeof Title>;

export const TopLevelClass = z.enum(["Person"]);
export type TopLevelClass = z.infer<typeof TopLevelClass>;

export const AddressList = z.object({
  _class: z.string(),
  private: z.boolean(),
  citation_list: z.array(z.string()),
  note_list: z.array(z.any()),
  date: z.null(),
  street: z.string(),
  locality: z.string(),
  city: z.string(),
  county: z.string(),
  state: z.string(),
  country: z.string(),
  postal: z.string(),
  phone: z.string(),
});
export type AddressList = z.infer<typeof AddressList>;

export const PersonRefList = z.object({
  _class: z.string(),
  private: z.boolean(),
  citation_list: z.array(z.any()),
  note_list: z.array(z.any()),
  ref: z.string(),
  rel: z.string(),
});
export type PersonRefList = z.infer<typeof PersonRefList>;

export const SurnameList = z.object({
  _class: SurnameListClass,
  surname: z.string(),
  prefix: Prefix,
  primary: z.boolean(),
  origintype: GedcomType,
  connector: z.string(),
});
export type SurnameList = z.infer<typeof SurnameList>;

export const Name = z.object({
  _class: PrimaryNameClass,
  private: z.boolean(),
  surname_list: z.array(SurnameList),
  citation_list: z.array(z.string()),
  note_list: z.array(z.any()),
  date: z.null(),
  first_name: z.string(),
  suffix: Suffix,
  title: Title,
  type: GedcomType,
  group_as: z.string(),
  sort_as: z.number(),
  display_as: z.number(),
  call: z.string(),
  nick: z.string(),
  famnick: z.string(),
});
export type Name = z.infer<typeof Name>;

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
  attribute_list: z.array(z.any()),
  address_list: z.array(AddressList),
  urls: z.array(z.any()),
  lds_ord_list: z.array(z.any()),
  primary_name: Name,
  event_ref_list: z.array(EventRefList),
  family_list: z.array(z.string()),
  parent_family_list: z.array(z.string()),
  alternate_names: z.array(Name),
  person_ref_list: z.array(PersonRefList),
  death_ref_index: z.number(),
  birth_ref_index: z.number(),
  gender: z.number(),
});
export type GedcomElement = z.infer<typeof GedcomElement>;
