import { docsSchema } from "@astrojs/starlight/schema";

import { type SchemaContext, z, defineCollection } from "astro:content";
import { docsLoader } from "@astrojs/starlight/loaders";

import { Database } from "@lib/GrampsZodTypes";

import { history, event } from "@schemas/index";

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
};
