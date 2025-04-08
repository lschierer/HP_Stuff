import { greenwoodPluginPostCss } from "@greenwood/plugin-postcss";
import { greenwoodPluginAdapterAws } from "@greenwood/plugin-adapter-aws";
import type { Config } from "@greenwood/cli";

import { exit } from "node:process";

import { greenwoodSpectrumThemePack } from "greenwoodspectrumtheme";

import { GedcomSourcePlugin } from "./src/plugins/gramps.ts";

import { Config as PackConfig } from "greenwoodspectrumtheme/config";

import localConfig from "./src/spectrum-theme.config.ts";

const valid = PackConfig.safeParse(localConfig);
if (!valid.success) {
  console.error(valid.error.message);
  throw new Error(valid.error.message);
  exit(1);
}
const config = valid.data;

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
    ...greenwoodSpectrumThemePack(config),
    GedcomSourcePlugin(),
    greenwoodPluginPostCss({
      extendConfig: true,
    }),
    greenwoodPluginAdapterAws(),
  ],
};
export default gc;
