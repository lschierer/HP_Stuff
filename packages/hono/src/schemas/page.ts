import { z } from "zod";

import { GedcomPerson, GedcomFamily } from "@schemas/gedcom";

const persondata = z.object({
  gedcomclass: z.literal("person"),
  person: GedcomPerson.GedcomElement,
});
const familydata = z.object({
  gedcomclass: z.literal("family"),
  family: GedcomFamily.GedcomElement,
});
export const FrontMatter = z.object({
  title: z.string(),
  author: z.union([z.string(), z.array(z.string())]).optional(),
  collection: z.union([z.string(), z.array(z.string())]).optional(),
  layout: z.union([z.literal("splash"), z.literal("standard")]).optional(),
  gedcom: z
    .discriminatedUnion("gedcomclass", [persondata, familydata])
    .optional(),
  sidebar: z
    .object({
      order: z.number(),
    })
    .optional(),
});
export type FrontMatter = z.infer<typeof FrontMatter>;

export const ParsedResult = z.object({
  frontMatter: FrontMatter,
  html: z.string(),
});
export type ParsedResult = z.infer<typeof ParsedResult>;

export const ExternalPage = z.object({
  title: z.string(),
  route: z.string(),
  html: z.string(),
  children: z.any(),
});
export type ExternalPage = z.infer<typeof ExternalPage>;

const NavItemBase = ExternalPage.partial();

export type NavigatonItem = z.infer<typeof NavItemBase> & {
  children: NavigatonItem[];
};

export const NavigatonItem: z.ZodType<NavigatonItem> = NavItemBase.extend({
  children: z.lazy(() => NavigatonItem.array()),
});
