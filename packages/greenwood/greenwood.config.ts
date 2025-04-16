import { greenwoodPluginPostCss } from "@greenwood/plugin-postcss";
import { greenwoodPluginAdapterAws } from "@greenwood/plugin-adapter-aws";
import type { Config } from "@greenwood/cli";

const gc: Config = {
  useTsc: true,
  activeContent: true,
  isolation: true,
  optimization: "default",
  prerender: false,
  staticRouter: false,
  markdown: {
    plugins: [
      {
        name: "rehype-class-names",
        options: {
          "h1,h2,h3,h4,h5":
            "spectrum-Heading spectrum-Heading--serif spectrum-Heading--heavy",
          a: "spectrum-Link  spectrum-Link--primary",
          "p,li": "spectrum-Body spectrum-Body--serif spectrum-Body--sizeM",
          "blockquote,blockquote paragraph":
            "spectrum-Body spectrum-Body--serif spectrum-Body--sizeS",
        },
      },
      "rehype-autolink-headings",
      "remark-alerts",
      "remark-gfm",
      "remark-rehype",
    ],
  },
  plugins: [
    greenwoodPluginPostCss({
      extendConfig: true,
    }),
    greenwoodPluginAdapterAws(),
  ],
};
export default gc;
