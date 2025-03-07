import { z } from "zod";

import { GedcomPerson } from "../../../schemas/gedcom/index.ts";

export const TreePerson = z.object({
  name: z.string(),
  id: z.string(),
  data: GedcomPerson.GedcomElement,
  parentId: z.string().optional(),
});
export type TreePerson = z.infer<typeof TreePerson>;
