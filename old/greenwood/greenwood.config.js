import { greenwoodPluginTypeScript } from "@greenwood/plugin-typescript";
import { greenwoodPluginPostCss } from "@greenwood/plugin-postcss";
import { greenwoodPluginGoogleAnalytics } from "@greenwood/plugin-google-analytics";

/*
 * this plugin appears to do more than I first understood from the documentation.
 * Once enabled, I it fully replaces WCC and I *think* you can no longer use html components at all.
 * More, you cannot use CSS style sheets in the Lit elements via import due to https://github.com/lit/lit/issues/2631
 * and since *everything* has to be some version of lit, this is unacceptable.  I would really rather prefer using
 * the recommended static styles method of styling the components per https://lit.dev/docs/components/styles/#external-stylesheet
 */
//import { greenwoodPluginRendererLit } from "@greenwood/plugin-renderer-lit";

import rehypeStringify from "rehype-stringify";
import remarkGfm from "remark-gfm";
import remarkParse from "remark-parse";
import remarkRehype from "remark-rehype";
import { unified } from "unified";

export default {
  activeContent: true,
  isolation: true,
  markdown: {
    plugins: ["remark-gfm"],
  },
  optimization: "none",
  plugins: [
    greenwoodPluginTypeScript({
      extendConfig: true,
    }),
    greenwoodPluginPostCss({
      extendConfig: true,
    }),
    greenwoodPluginGoogleAnalytics({
      analyticsId: "G-9KF1R3YFTZ",
    }),
  ],
};
