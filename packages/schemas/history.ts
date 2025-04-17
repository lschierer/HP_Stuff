import { z } from "zod";

export const HistoryEvent = z.object({
  type: z.string(),
  blurb: z.string(),
  description: z.string().optional(),
  date: z.union([z.date(), z.number(), z.string()]).optional(),
  source: z.string().nullish(),
});

export type HistoryEvent = z.infer<typeof HistoryEvent>;

export const History = z.object({
  events: z.union([HistoryEvent, z.array(HistoryEvent)]),
});

export type History = z.infer<typeof History>;

export const DisplayableEvent = HistoryEvent.extend({
  date: z.union([z.date(), z.literal("unknown date")]),
});

export type DisplayableEvent = z.infer<typeof DisplayableEvent>;
