import "../components/my-greetings.js";
import { defineRoute } from "@gracile/gracile/route";

import { html } from "@gracile/gracile/server-html";

import { document } from "../layouts/base";

import indexDoc from "../content/index.md";

export default defineRoute({
  document: (context) =>
    document({ ...context, title: String(indexDoc.meta.frontmatter.title) }),

  template: () => html`
    <main>
      <div class="content">${indexDoc.body.lit}</div>
      <h2>Next Steps</h2>
      <top-cardgrid></top-cardgrid>
    </main>
  `,
});
