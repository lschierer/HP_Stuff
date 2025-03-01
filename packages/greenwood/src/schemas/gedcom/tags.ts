import { z } from "zod";

export const GedcomElement = z.object({
  _class: z.string(),
  handle: z.string(),
  id: z.string(),
  change: z.number(),
  name: z.string(),
  color: z.string(),
  priority: z.number(),
});
export type GedcomElement = z.infer<typeof GedcomElement>;
