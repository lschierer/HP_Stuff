import { z } from "zod";

export const Bookmark = z.object({
  title: z.object({
    name: z.string(),
    link: z.string().url().optional(),
  }),
  author: z.object({
    name: z.string(),
    link: z.string().url().optional(),
  }),
  dates: z.object({
    published: z.string().date().optional(),
    updated: z.string().date().optional(),
    completed: z.union([z.string().date(), z.boolean()]).optional(),
  }),
  comments: z.string(),
});
export type Bookmark = z.infer<typeof Bookmark>;
