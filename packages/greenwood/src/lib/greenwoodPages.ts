import debugFunction from "./debug.ts";
const DEBUG = debugFunction(new URL(import.meta.url).pathname);

import { type Page } from "@greenwood/cli";

import { z } from "zod";

const baseSideBarEntry = z.object({
  name: z.string(),
  route: z.string(),
});

type baseSideBarEntry = z.infer<typeof baseSideBarEntry>;
export type SideBarEntry = z.infer<typeof baseSideBarEntry> & {
  children: SideBarEntry[];
};
export const SideBarEntry: z.ZodType<SideBarEntry> = baseSideBarEntry.extend({
  children: z.lazy(() => SideBarEntry.array()),
});

export const sortPages = (a: Page, b: Page) => {
  return sortbyContainsRoute(a, b)
    ? sortbyContainsRoute(a, b)
    : sortbyfrontmatter(a, b)
      ? sortbyfrontmatter(a, b)
      : sortbyTitle(a, b)
        ? sortbyTitle(a, b)
        : sortbylabel(a, b);
};

export const sortbyContainsRoute = (a: Page, b: Page) => {
  if (b.route.startsWith(a.route)) {
    return -1;
  } else if (a.route.startsWith(b.route)) {
    return 1;
  } else {
    return 0;
  }
};

export const sortbyfrontmatter = (a: Page, b: Page) => {
  let orderA = -100000;
  let orderB = -100000;

  if (a.data !== undefined && Object.keys(a.data).includes("sidebar")) {
    const sidebar: object = a.data["sidebar" as keyof typeof a.data];
    if (Object.keys(sidebar).includes("order")) {
      orderA = sidebar["order" as keyof typeof sidebar];
    }
  }

  if (b.data !== undefined && Object.keys(a.data).includes("sidebar")) {
    const sidebar: object = b.data["sidebar" as keyof typeof b.data];
    if (Object.keys(sidebar).includes("order")) {
      orderB = sidebar["order" as keyof typeof sidebar];
    }
  }
  if (DEBUG && (orderA != -100000 || orderB != -100000)) {
    console.log(`sorting by frontmatter order`);
  }
  if (orderA != -100000 && orderB != -100000) {
    return orderA < orderB ? -1 : orderA > orderB ? 1 : 0;
  } else if (orderA != -100000) {
    return -1;
  } else if (orderB != -100000) {
    return 1;
  } else {
    return 0;
  }
};

export const sortbyTitle = (a: Page, b: Page) => {
  if (a.title.length > 0) {
    if (b.title.length > 0) {
      return a.title.toLowerCase().localeCompare(b.title.toLowerCase());
    }
    return a.title.toLowerCase().localeCompare(b.label.toLowerCase());
  }
  if (b.title.length > 0) {
    return a.label.toLowerCase().localeCompare(b.title.toLowerCase());
  }
  return 0;
};

export const sortbylabel = (a: Page, b: Page) => {
  return a.label.toLowerCase().localeCompare(b.label.toLowerCase());
};
