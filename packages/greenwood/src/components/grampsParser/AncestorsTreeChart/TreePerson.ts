import { z } from "zod";

import { GedcomPerson } from "../../../schemas/gedcom/index.ts";

export const TreePerson = z.object({
  name: z.string(),
  id: z.string(),
  generation: z.number().optional(),
  data: GedcomPerson.GedcomElement,
  parents: z.string().array(),
});
export type TreePerson = z.infer<typeof TreePerson>;
