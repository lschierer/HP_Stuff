import { docsSchema } from "@astrojs/starlight/schema";

import { type SchemaContext, z, defineCollection } from "astro:content";
import { docsLoader } from "@astrojs/starlight/loaders";

import { Database } from "@lib/GrampsZodTypes";

import { history } from "@schemas/index";
import { glob } from "astro/loaders";

const HeroSchema = (ctx: SchemaContext) => docsSchema()(ctx).shape.hero;

const extendedDocs = (ctx: SchemaContext) =>
  docsSchema()(ctx).extend({
    hero: z.union([z.string(), HeroSchema(ctx)]).optional(),
  });

export const collections = {
  docs: defineCollection({
    loader: docsLoader(),
    schema: extendedDocs,
  }),
  history: defineCollection({
    loader: glob({
      pattern: "**/*.json",
      base: "./src/content/history",
    }),
    schema: history,
  }),
};
