import { docsSchema } from "@astrojs/starlight/schema";
import { file } from "astro/loaders";

import { type SchemaContext, z, defineCollection } from "astro:content";
import { docsLoader } from "@astrojs/starlight/loaders";

import { Database } from "@lib/GrampsZodTypes";

import { GedcomPerson, GedcomEvent, GedcomFamily } from "@schemas/gedcom";

import { history } from "@schemas/index";
import { glob } from "astro/loaders";

const extendedDocs = (ctx: SchemaContext) =>
  docsSchema()(ctx).extend({
    grampsID: z.string().optional(),
    families: z.string().optional(),
    pageType: z.string().optional(),
    collection: z.string().optional(),
  });

export const collections = {
  docs: defineCollection({
    loader: docsLoader(),
    schema: extendedDocs,
  }),
  people: defineCollection({
    loader: file("src/content/gedcom/people.json"),
    schema: GedcomPerson.GedcomElement,
  }),
  events: defineCollection({
    loader: file("src/content/gedcom/events.json"),
    schema: GedcomEvent.GedcomElement,
  }),
  families: defineCollection({
    loader: file("src/content/gedcom/families.json"),
    schema: GedcomFamily.GedcomElement,
  }),
  history: defineCollection({
    loader: glob({
      pattern: "**/*.json",
      base: "./src/content/history",
    }),
    schema: history,
  }),
};
