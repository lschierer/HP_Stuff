const configPath = "../spectrum-theme.config.ts";

import debugFunction from "./debug.ts";
const DEBUG = debugFunction(new URL(import.meta.url).pathname);
if (DEBUG) {
  console.log(`DEBUG enabled for ${new URL(import.meta.url).pathname}`);
}

import { Config } from "greenwoodspectrumtheme/config";

export async function loadConfig(): Promise<Config> {
  if (DEBUG) {
    console.log(`loadConfig start`);
  }
  const module = (await import(
    new URL(configPath, import.meta.url).href
  )) as object;
  const config = "default" in module ? module.default : module;
  const parsed = Config.safeParse(config);

  if (!parsed.success) {
    throw new Error("Invalid config");
  }

  return parsed.data;
}
