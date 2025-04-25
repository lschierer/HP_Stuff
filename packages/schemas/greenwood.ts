import * as z from "zod";

export const Author = z.enum([
  "Luke Scheirer",
  "Luke Schierer",
  "Matthew Schocke",
  "Peach Wookiee",
  "privacypolicy.com",
  "Worfe",
]);
export type Author = z.infer<typeof Author>;

export const CollectionEnum = z.enum([
  "Bookmarks",
  "nephilim",
  "FanFiction",
  "Harrypedia",
  "Nephilim",
  "Searches",
]);
export type CollectionEnum = z.infer<typeof CollectionEnum>;

export const Type = z.enum(["potion", "spell"]);
export type Type = z.infer<typeof Type>;

export const Layout = z.enum([
  "page",
  "splash",
  "standard",
  "standard Life Expectancy",
  "standard Magical Beings",
  "standard Magical Contracts",
  "standard Non-Mendelian Inheritance",
  "standard Points of Divergence",
  "standard Relative Power Levels",
  "standard Rules of Magic",
  "standard Soteriology, Missiology and Ecclesiology",
  "standard The Veela Curse",
  "standard What are the Nephilim",
]);
export type Layout = z.infer<typeof Layout>;

export const DataData = z.object({
  author: Author.optional(),
  tableOfContents: z.string().optional(),
});
export type DataData = z.infer<typeof DataData>;

export const Sidebar = z.object({
  order: z.number(),
});
export type Sidebar = z.infer<typeof Sidebar>;

export const GraphData = z.object({
  collection: z.union([z.array(z.string()), CollectionEnum]).optional(),
  description: z.string().optional(),
  author: z.union([Author, z.null()]).optional(),
  imports: z.array(z.string()).optional(),
  data: DataData.optional(),
  tocHeading: z.number().optional(),
  tableOfContents: z.array(z.any()).optional(),
  sidebar: Sidebar.optional(),
  type: Type.optional(),
  spells: z.string().optional(),
  gramps_id: z.string().optional(),
});
export type GraphData = z.infer<typeof GraphData>;

export const GraphElement = z.object({
  id: z.string(),
  label: z.string(),
  title: z.union([z.null(), z.string()]),
  route: z.string(),
  layout: z.union([Layout, z.null()]).optional(),
  data: GraphData,
  imports: z.array(z.string()),
  resources: z.array(z.string()),
  pageHref: z.string(),
  outputHref: z.string(),
  isSSR: z.boolean().optional(),
  prerender: z.boolean(),
  isolation: z.boolean(),
  hydration: z.boolean().optional(),
  servePage: z.null().optional(),
  path: z.string().optional(),
});
export type GraphElement = z.infer<typeof GraphElement>;

export const ValueClass = z.object({
  id: z.string(),
  pageHref: z.string(),
  outputHref: z.string(),
  route: z.string(),
  assets: z.array(z.string()),
});
export type ValueClass = z.infer<typeof ValueClass>;

export const Apis = z.object({
  dataType: z.string(),
  value: z.array(z.array(z.union([ValueClass, z.string()]))),
});
export type Apis = z.infer<typeof Apis>;

export const Manifest = z.object({
  apis: Apis,
});
export type Manifest = z.infer<typeof Manifest>;
