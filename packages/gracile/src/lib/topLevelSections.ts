import { z } from "zod";

export const TopLevelSections = z.enum([
  "Harrypedia",
  "FanFiction",
  "Searches",
  "Bookmarks",
]);

export type TopLevelSections = z.infer<typeof TopLevelSections>;
