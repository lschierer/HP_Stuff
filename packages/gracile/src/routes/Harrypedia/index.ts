import { defineRoute } from "@gracile/gracile/route";

import { html } from "@gracile/gracile/server-html";

import { document } from "../../layouts/base";
import template from "../../layouts/two-column-page";

import { Harrypedia } from "../../content/content";

const slug = "/src/content/Harrypedia/index.md";

export default defineRoute({
  document: (context) =>
    document({
      ...context,
      title: String(Harrypedia[slug]?.meta.title),
    }),
  template: (context) =>
    template(Harrypedia[slug]?.body.lit ?? html``, context.url),
});
