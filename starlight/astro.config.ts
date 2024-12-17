// @ts-check
import { defineConfig } from "astro/config";
import starlight from "@astrojs/starlight";

// https://astro.build/config
export default defineConfig({
  site: "https://hp-fan.schierer.org",
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
        "@spectrum-css/page/dist/index.css",
        "./src/styles/global.css",
      ],
      components: {
        Header: "./src/components/Header.astro",
        ThemeProvider: "./src/components/ThemeProvider.astro",
        PageFrame: "./src/components/PageFrame.astro",
      },
      sidebar: [
        {
          label: "Guides",
          items: [
            // Each item here is one entry in the navigation menu.
            { label: "Example Guide", slug: "guides/example" },
          ],
        },
        {
          label: "Reference",
          autogenerate: { directory: "reference" },
        },
      ],
    }),
  ],
});
