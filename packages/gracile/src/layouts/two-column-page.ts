import { html } from "@gracile/gracile/server-html";
import { type TemplateResult } from "lit";

const template = (
  body: TemplateResult,
  url: URL = new URL("/", import.meta.url),
) => {
  return html`
    <script
      type="module"
      src=${new URL("./two-column-page.client.ts", import.meta.url).pathname}
    ></script>
    <sp-split-view resizable primary-size="20%">
      <div class="nav">
        <span>test</span>
        <side-nav route="${url.pathname.toString()}"></side-nav>
      </div>
      <div class="content">
        <main>${body}</main>
      </div>
    </sp-split-view>
  `;
};
export default template;
