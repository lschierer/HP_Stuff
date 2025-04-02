import { greenwoodPluginPostCss } from "@greenwood/plugin-postcss";

import { greenwoodSpectrumThemePack } from "greenwoodspectrumtheme";

import { GedcomPeopleSourcePlugin } from "./src/plugins/gramps/people.ts";
import { GedcomFamilySourcePlugin } from "./src/plugins/gramps/families.ts";

import type { Config } from "@greenwood/cli";

import { loadConfig } from "greenwoodspectrumtheme/config";
const localConfig = "./src/spectrum-theme.config.ts";

const config = await loadConfig(localConfig);

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
