import * as z from "zod";

export const PrimaryNameClass = z.enum(["Name"]);
export type PrimaryNameClass = z.infer<typeof PrimaryNameClass>;

export const Nick = z.string();
export type Nick = z.infer<typeof Nick>;

export const Suffix = z.enum(["", "II", "III", "IV", "Junior", "V"]);
export type Suffix = z.infer<typeof Suffix>;

export const SurnameListClass = z.enum(["Surname"]);
export type SurnameListClass = z.infer<typeof SurnameListClass>;

export const TypeClass = z.enum([
  "EventRoleType",
  "NameOriginType",
  "NameType",
]);
export type TypeClass = z.infer<typeof TypeClass>;

export const StringEnum = z.enum([
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
export type StringEnum = z.infer<typeof StringEnum>;

export const Title = z.enum([
  "",
  "Lord",
  "Madam",
  "Mrs.",
  "Professor",
  "Reverend",
]);
export type Title = z.infer<typeof Title>;

export const GedcomClass = z.enum(["Person"]);
export type GedcomClass = z.infer<typeof GedcomClass>;

export const EventRefClass = z.enum(["EventRef"]);
export type EventRefClass = z.infer<typeof EventRefClass>;

export const TagList = z.enum([
  "ed5f283475c2bd8d650cc02c9c8",
  "ed5f2929ec81c675417baaa694a",
  "ed5f294a35f37f5bdc6b68379cc",
  "ed5f2966ec73e6e477d5090556e",
  "ed628949497529bfaef5db0538d",
  "ed628bd2be366112813f145329a",
  "ed62c39607a2cb2656c75897b21",
  "eddda14cf1f4caf95fb695d72b5",
  "f162104040b1b4732e179856e89",
]);
export type TagList = z.infer<typeof TagList>;

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

export const Type = z.object({
  _class: TypeClass,
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

export const PersonRefList = z.object({
  _class: z.string(),
  private: z.boolean(),
  citation_list: z.array(z.any()),
  note_list: z.array(z.any()),
  ref: z.string(),
  rel: z.string(),
});
export type PersonRefList = z.infer<typeof PersonRefList>;

export const Surname = z.object({
  _class: SurnameListClass,
  surname: z.string(),
  prefix: z.string(),
  primary: z.boolean(),
  origintype: Type,
  connector: z.string(),
});
export type Surname = z.infer<typeof Surname>;

export const Name = z.object({
  _class: PrimaryNameClass,
  private: z.boolean(),
  surname_list: z.array(Surname),
  citation_list: z.array(z.string()),
  note_list: z.array(z.any()),
  date: z.null(),
  first_name: z.string(),
  suffix: Suffix,
  title: Title,
  type: Type,
  group_as: z.string(),
  sort_as: z.number(),
  display_as: z.number(),
  call: z.string(),
  nick: Nick,
  famnick: z.string(),
});
export type Name = z.infer<typeof Name>;

export const GedcomElement = z.object({
  _class: GedcomClass,
  handle: z.string(),
  change: z.number(),
  private: z.boolean(),
  tag_list: z.array(z.string().min(20).max(30)),
  id: z.string(),
  citation_list: z.array(z.string()),
  note_list: z.array(z.string()),
  media_list: z.array(z.any()),
  attribute_list: z.array(z.any()),
  address_list: z.array(AddressList),
  urls: z.array(z.any()),
  lds_ord_list: z.array(z.any()),
  primary_name: Name,
  event_ref_list: z.array(EventRef),
  family_list: z.array(z.string()),
  parent_family_list: z.array(z.string()),
  alternate_names: z.array(Name),
  person_ref_list: z.array(PersonRefList),
  death_ref_index: z.number(),
  birth_ref_index: z.number(),
  gender: z.number(),
});
export type GedcomElement = z.infer<typeof GedcomElement>;
