import { greenwoodPluginPostCss } from "@greenwood/plugin-postcss";
import { greenwoodPluginAdapterAws } from "@greenwood/plugin-adapter-aws";
import type { Config } from "@greenwood/cli";
import * as fs from "node:fs";
import { SiteConfig } from "@hp-stuff/schemas";

import yaml from "js-yaml";

import { TopHeaderSectionPlugin } from "topheader-plugin";
import { cosmiconfig } from "cosmiconfig";
const loadConfig = async () => {
  console.log(`loadConfig running`);

  const explorer = cosmiconfig("hp-stuff", {
    mergeSearchPlaces: true,
    searchStrategy: "global",
    loaders: {
      ".yaml": (filepath) => {
        console.log(`checking ${filepath}`);

        const valid = SiteConfig.safeParse(
          yaml.load(fs.readFileSync(filepath, "utf-8"))
        );
        if (valid.success) {
          console.log(`successful parse`);
          return valid.data;
        }

        console.error(
          `staticConfig could not parse ${filepath}: ${valid.error.message}`
        );

        return false;
      },
      ".yml": (filepath) => {
        const valid = SiteConfig.safeParse(
          yaml.load(fs.readFileSync(filepath, "utf-8"))
        );
        if (valid.success) {
          return valid.data;
        }
        return false;
      },
    },
  });

  const result = await explorer.search().catch((error: unknown) => {
    console.error(
      `failed to find result for config `,
      error instanceof Error ? error.message : JSON.stringify(error)
    );
  });
  console.log(`result is ${typeof result}`);
  if (result && !result.isEmpty) {
    return result;
  } else {
    console.log(`returning false for config`, JSON.stringify(result));
    return false;
  }
};

let config:
  | false
  | {
      config: Config;
      filepath: string;
      isEmpty?: boolean;
    }
  | Config = await loadConfig();
if (config) {
  console.log(`local config is ${JSON.stringify(config.config)}`);
  config = config.config;
} else {
  console.log(`No config available.`);
}
export const LocalConfig = config;

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
    TopHeaderSectionPlugin(LocalConfig),
  ],
};
export default gc;
