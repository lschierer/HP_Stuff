import { z } from "zod";

import { GedcomPerson, GedcomFamily } from "./gedcom/index.ts";

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
});
export type ExternalPage = z.infer<typeof ExternalPage>;

const NavItemBase = ExternalPage.partial().extend({
  expanded: z.boolean().optional(),
});

export type NavigationItem = z.infer<typeof NavItemBase> & {
  children: NavigationItem[];
};

export const NavigationItem: z.ZodType<NavigationItem> = NavItemBase.extend({
  children: z.lazy(() => NavigationItem.array()),
});
