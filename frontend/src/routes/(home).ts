import { defineRoute } from "@gracile/gracile/route";

import { html } from "@gracile/gracile/server-html";

import { document, type documentProps } from "../layouts/base";

import { indexDoc } from "../content/content";
interface Context {
  url: URL;
  props: documentProps;
  params: {};
}
export default defineRoute({
  document: (context: Context) =>
    document({
      ...context,
      title:
        indexDoc.meta.frontmatter != undefined &&
        indexDoc.meta.frontmatter != null &&
        indexDoc.meta.frontmatter.title != undefined &&
        indexDoc.meta.frontmatter.title != null
          ? String(indexDoc.meta.frontmatter.title)
          : "",
    }),

  template: () => html`
    <main>
      <script
        type="module"
        src=${new URL("./(home).client.ts", import.meta.url).pathname}
      ></script>
      <div class="content">${indexDoc.body.lit}</div>
      <h2>Next Steps</h2>
      <top-cardgrid></top-cardgrid>
    </main>
  `,
});
