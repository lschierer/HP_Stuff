import { z } from "astro:content";

export const event = z.object({
  type: z.string(),
  blurb: z.string(),
  description: z.string().optional(),
  date: z.union([z.date(), z.number(), z.string()]).optional(),
  source: z.string().nullish(),
});

export type event = z.infer<typeof event>;
