import { greenwoodPluginPostCss } from "@greenwood/plugin-postcss";
import type { Config } from "@greenwood/cli";

import { greenwoodSpectrumThemePack } from "greenwoodspectrumtheme";

import { GedcomPeopleSourcePlugin } from "./src/plugins/gramps/people.ts";
import { GedcomFamilySourcePlugin } from "./src/plugins/gramps/families.ts";

import {
  loadConfig,
  type Config as PackConfig,
} from "greenwoodspectrumtheme/config";
import localConfig from "./src/spectrum-theme.config.ts";

const config = loadConfig(localConfig) as PackConfig;

const gc: Config = {
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
  },
  plugins: [
    ...greenwoodSpectrumThemePack(config),
    GedcomPeopleSourcePlugin(),
    GedcomFamilySourcePlugin(),

    greenwoodPluginPostCss({
      extendConfig: true,
    }),
  ],
};
export default gc;
