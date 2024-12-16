import "../components/my-greetings.js";

import { defineRoute } from "@gracile/gracile/route";
import { html } from "@gracile/gracile/server-html";

import { document } from "../document.js";

export default defineRoute({
  document: (context) => document({ ...context, title: "Gracile - Home" }),

  template: (context) => html`
    <h1><img src="/favicon.svg" height="25" /> - Hello Gracile</h1>

    <h2>${context.url}</h2>

    <dl>
      <dt>Gracile</dt>
      <dd>
        <a href="https://gracile.js.org" target="_blank">Documentation</a>
      </dd>

      <dt>Custom Element</dt>
      <dd><my-greetings></my-greetings></dd>

      <dt>Dummy page</dt>
      <dd><a href="/about/">About page</a></dd>
    </dl>
  `,
});
