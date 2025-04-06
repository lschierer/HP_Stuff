import { type Config } from "greenwoodspectrumtheme/config";

const repoPath = new URL(`file://${process.cwd()}/../../`).href;

const config: Config = {
  moduleName: "hp-stuff",
  siteTitle: "Luke's HP Fan Site",
  topLevelSections: ["Harrypedia", "Fan Fiction", "Searches", "Bookmarks"],
  privacyPolicy: false,
  authors: "git",
  repo: repoPath,
};

export default config;
