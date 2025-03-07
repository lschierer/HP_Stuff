import { z } from "zod";

export const TreePerson = z.object({
  name: z.string(),
  id: z.string(),
  parentId: z.string(),
});
export type TreePerson = z.infer<typeof TreePerson>;
