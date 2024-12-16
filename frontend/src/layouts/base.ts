import { html } from "@gracile/gracile/server-html";
import { createMetadata } from "@gracile/metadata";

import { SITE_TITLE } from "../lib/globals";

export const document = (props: {
  url: URL;
  title?: string | null;
  description?: string | null;
}) => html`
  <!doctype html>
  <html lang="en" dir="ltr" class="spectrum spectrum--medium spectrum--light">
    <head>
      <!-- Global assets -->
      <link
        rel="stylesheet"
        href=${new URL("./base.css", import.meta.url).pathname}
      />
      <script
        type="module"
        src=${new URL("./base.client.ts", import.meta.url).pathname}
      ></script>

      <!-- SEO and page metadata -->
      ${createMetadata({
        siteTitle: SITE_TITLE,
        pageTitle: `${SITE_TITLE} | ${props.title || "Home"}`,
        faviconUrl: "/public/favicon.svg",
        pageDescription: `${props.description || "Luke's Harry Potter Fan Site"}`,
      })}
    </head>
    <body>
      <sp-theme
        system="spectrum"
        color="light"
        scale="medium"
        style="background-color: var(--spectrum-gray-100)"
      >
        <route-template-outlet></route-template-outlet>
      </sp-theme>
    </body>
  </html>
`;
