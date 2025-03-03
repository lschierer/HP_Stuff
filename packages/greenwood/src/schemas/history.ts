import { z } from "zod";

import { event } from "./event";

export const history = z.object({
  events: z.union([event, z.array(event)]),
});

export type history = z.infer<typeof history>;
