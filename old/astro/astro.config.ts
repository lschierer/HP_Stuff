import { defineConfig } from "astro/config";
import starlight from "@astrojs/starlight";
import starlightLinksValidator from "starlight-links-validator";
import "dotenv/config";

import lit from "@astrojs/lit";

import tailwind from "@astrojs/tailwind";

// https://astro.build/config
export default defineConfig({
  experimental: {
    globalRoutePriority: true,
  },

  site: "https://hpfan.schierer.org/",

  redirects: {
    "/harrypedia/magic/spells/patronus/":
      "/harrypedia/magic/spells/expecto_patronum/",
    "/harrypedia/culture/contracts/": "/harrypedia/magic/contracts/",
  },

  integrations: [
    starlight({
      plugins: [
        starlightLinksValidator({
          errorOnRelativeLinks: false,
        }),
      ],
      title: "Luke's HP Site",
      customCss: ["./src/styles/tailwind.css"],
      components: {
        Hero: "./src/components/PersonPage.astro",
      },
      defaultLocale: "root",
      locales: {
        root: {
          label: "English",
          lang: "en",
        },
      },
      logo: {
        src: "./src/assets/LukeHPSite.svg",
        replacesTitle: true,
      },
      lastUpdated: true,
      sidebar: [
        {
          label: "Encyclopedic Reference",
          autogenerate: {
            directory: "Harrypedia",
            collapsed: true,
          },
          collapsed: true,
        },
        {
          label: "Bookmarks",
          autogenerate: {
            directory: "Bookmarks",
            collapsed: true,
          },
          collapsed: true,
        },
        {
          label: "Searches",
          autogenerate: {
            directory: "Searches",
            collapsed: true,
          },
          collapsed: true,
        },
        {
          label: "Fan Fiction",
          collapsed: true,
          items: [
            {
              label: "Harry Potter - Nephilim",
              items: [
                {
                  label: "Introduction",
                  link: "/fanfiction/harry_potter_-_nephilim/introduction/",
                },
                {
                  label: "Prologue",
                  link: "/fanfiction/harry_potter_-_nephilim/prologue/",
                },
                {
                  label: "Chapters",
                  autogenerate: {
                    directory: "FanFiction/Harry_Potter_-_Nephilim/Chapters",
                  },
                },
                {
                  label: "Back Story",
                  autogenerate: {
                    directory: "FanFiction/Harry_Potter_-_Nephilim/backstory",
                  },
                  collapsed: true,
                },
                {
                  label: "Appendices",
                  autogenerate: {
                    directory: "FanFiction/Harry_Potter_-_Nephilim/Appendices",
                  },
                },
              ],
            },
          ],
        },
      ],
    }),
    lit(),
    tailwind({
      applyBaseStyles: false,
    }),
  ],

  // Process images with sharp: https://docs.astro.build/en/guides/assets/#using-sharp
  image: {
    service: {
      entrypoint: "astro/assets/services/sharp",
    },
  },

  vite: {
    assetsInclude: ["**/*.dsv"],
  },
});
