import { z } from "zod";

import { GedcomPerson } from "../../../schemas/gedcom/index.ts";

export const TreePerson = z.object({
  name: z.string(),
  id: z.string(),
  generation: z.number(),
  data: GedcomPerson.GedcomElement,
  parentId: z.string().array().nullable(),
});
export type TreePerson = z.infer<typeof TreePerson>;
