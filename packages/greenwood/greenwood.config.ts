import { greenwoodPluginPostCss } from "@greenwood/plugin-postcss";
import { greenwoodPluginGoogleAnalytics } from "@greenwood/plugin-google-analytics";
import { greenwoodPluginAdapterAws } from "@greenwood/plugin-adapter-aws";

import { DirectoryIndexSourcePlugin } from "./src/plugins/DirectoryIndex.ts";
import { GedcomPeopleSourcePlugin } from "./src/plugins/gramps/people.ts";
import { GedcomFamilySourcePlugin } from "./src/plugins/gramps/families.ts";

import type { Compilation, Resource } from "@greenwood/cli";

import process from "node:process";

//begin work around for https://github.com/TanStack/table/pull/5373

class ProcessEnvReplaceResource implements Resource {
  private options: object;
  private compilation: Compilation;

  constructor(compilation: Compilation, options: object) {
    this.options = options;
    this.compilation = compilation;
  }

  async shouldIntercept(url: URL) {
    /*start work around for GetFrontmatter requiring async */
    await new Promise((resolve) => setTimeout(resolve, 1));
    /* end workaround */

    // your custom condition goes here
    return url.pathname.includes("tanstack");
  }

  async intercept(url: URL, request: Request, response: Response) {
    const body = await response.text();
    const env =
      process.env.__GWD_COMMAND__ === "develop" ? "development" : "production";
    const contents = body.replace(/process.env.NODE_ENV/g, `"${env}"`);

    return new Response(contents, {
      headers: new Headers({
        "Content-Type": "text/javascript",
      }),
    });
  }
}

//end workaround

export default {
  useTsc: true,
  activeContent: true,
  isolation: true,
  optimization: "default",
  prerender: false,
  staticRouter: false,
  markdown: {
    plugins: [
      "rehype-autolink-headings",
      "remark-alerts",
      "remark-gfm",
      "remark-rehype",
    ],
    settings: {
      commonmark: true,
    },
  },
  plugins: [
    DirectoryIndexSourcePlugin(),
    GedcomPeopleSourcePlugin(),
    GedcomFamilySourcePlugin(),
    {
      //include the workaround from above.
      type: "resource",
      name: "process-env-replace",
      provider: (compilation: Compilation, options: object) =>
        new ProcessEnvReplaceResource(compilation, options),
    },
    greenwoodPluginAdapterAws({
      preset: "sst",
    }),
    greenwoodPluginPostCss({
      extendConfig: true,
    }),
    greenwoodPluginGoogleAnalytics({
      analyticsId: "G-9KF1R3YFTZ",
    }),
  ],
};
