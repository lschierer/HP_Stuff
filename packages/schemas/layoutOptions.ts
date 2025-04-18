import { z } from "zod";

const CommonOptions = z.object({
  title: z.string(),
  route: z.string().optional(),
  sidebar: z.boolean().optional(),
});
type CommonOptions = z.infer<typeof CommonOptions>;

const HTMLOptions = CommonOptions.extend({
  content: z.string(),
}).strict();
type HTMLOptions = z.infer<typeof HTMLOptions>;

const MarkdownOptions = CommonOptions.extend({
  markdownContent: z.string(),
}).strict();
type MarkdownOptions = z.infer<typeof MarkdownOptions>;

export const LayoutOptions = z.union([HTMLOptions, MarkdownOptions]);
export type LayoutOptions = z.infer<typeof LayoutOptions>;
