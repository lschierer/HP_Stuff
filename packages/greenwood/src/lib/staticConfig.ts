import yaml from "js-yaml";
import { Config } from "@hp-stuff/schemas";
import * as fs from "node:fs";
import { cosmiconfig } from "cosmiconfig";

import debugFunction from "./debug.ts";
const DEBUG = debugFunction(new URL(import.meta.url).pathname);
console.log(`DEBUG for ${new URL(import.meta.url).pathname} is ${DEBUG}`);

const loadConfig = async () => {
  if (DEBUG) {
    console.log(`loadConfig running`);
  }
  const explorer = cosmiconfig("hp-stuff", {
    mergeSearchPlaces: true,
    searchStrategy: "global",
    loaders: {
      ".yaml": (filepath) => {
        if (DEBUG) {
          console.log(`checking ${filepath}`);
        }
        const valid = Config.safeParse(
          yaml.load(fs.readFileSync(filepath, "utf-8"))
        );
        if (valid.success) {
          if (DEBUG) {
            console.log(`successful parse`);
          }
          return valid.data;
        }
        if (DEBUG) {
          console.error(
            `staticConfig could not parse ${filepath}: ${valid.error.message}`
          );
        }
        return false;
      },
      ".yml": (filepath) => {
        const valid = Config.safeParse(
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
    if (DEBUG) {
      console.error(
        `failed to find result for config `,
        error instanceof Error ? error.message : JSON.stringify(error)
      );
    }
  });
  if (DEBUG) {
    console.log(`result is ${typeof result}`);
  }
  if (result && !result.isEmpty) {
    return result;
  } else {
    if (DEBUG) {
      console.log(`returning false for config`, JSON.stringify(result));
    }
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
  if (DEBUG) {
    console.log(`local config is ${JSON.stringify(config.config)}`);
  }
  config = config.config;
} else {
  if (DEBUG) {
    console.log(`No config available.`);
  }
}
export const LocalConfig = config;
