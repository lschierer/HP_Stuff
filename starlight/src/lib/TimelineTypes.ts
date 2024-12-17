import { z } from "zod";

export const Event = z.object({
  type: z.string(),
  blurb: z.string(),
  description: z.string().optional(),
  date: z.union([z.date(), z.number(), z.string()]).optional(),
  source: z.string().nullish(),
});
export type Event = z.infer<typeof Event>;

export const Events = z.object({
  events: z.array(Event),
});
export type Events = z.infer<typeof Events>;

export const DisplayableEvent = Event.extend({
  date: z.date(),
});

export type DisplayableEvent = z.infer<typeof DisplayableEvent>;
