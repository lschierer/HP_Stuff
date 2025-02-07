import { defineConfig } from "astro/config";
import starlight from "@astrojs/starlight";

import { TopLevelSections } from "./src/lib/topLevelSections";

import mdx from "@astrojs/mdx";

// https://astro.build/config
export default defineConfig({
  site: "https://hp-fan.schierer.org",
  redirects: {
    "/harrypedia/people/peverell/ignatius/":
      "/harrypedia/people/peverell/ignotus/",
  },
  trailingSlash: "always",
  integrations: [
    starlight({
      title: "Luke's HP Site",
      logo: {
        src: "./src/assets/LukeHPSite.svg",
        replacesTitle: true,
      },
      social: {
        github: "https://github.com/lschierer/HP_Stuff",
      },
      tableOfContents: { minHeadingLevel: 2, maxHeadingLevel: 4 },
      pagefind: false,
      customCss: [
        "@spectrum-css/tokens/dist/index.css",
        "@spectrum-css/typography/dist/index.css",
        "@spectrum-css/link/dist/index.css",
        "@spectrum-css/page/dist/index.css",
        "./src/styles/global.css",
      ],
      components: {
        Header: "./src/components/Header.astro",
        ThemeProvider: "./src/components/ThemeProvider.astro",
        PageFrame: "./src/components/PageFrame.astro",
        PageTitle: "./src/components/PageTitle.astro",
      },
      sidebar: TopLevelSections.options.map((section) => {
        return {
          label: section.replaceAll("_", " "),
          autogenerate: {
            directory: section.replaceAll(" ", ""),
            collapsed: true,
          },
          collapsed: true,
        };
      }),
    }),
    mdx(),
  ],
});
