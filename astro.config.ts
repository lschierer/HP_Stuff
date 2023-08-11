import {defineConfig} from 'astro/config';
import starlight from '@astrojs/starlight';

import lit from "@astrojs/lit";

// https://astro.build/config
export default defineConfig({
  site: "https://hpfan.schierer.org/",
  integrations: [
    starlight({
      title: "Luke's HP Site",
      logo: {
        src: './src/assets/LukeHPSite.svg',
        replacesTitle: true,
      },
      lastUpdated: true,
      sidebar: [
        {
          label: "Encyclopedic Reference",
          autogenerate: {
            directory: 'Harrypedia',
            collapsed: true,
          },
          collapsed: true,
        },
        {
          label: "Bookmarks",
          autogenerate: {
            directory: 'Bookmarks',
            collapsed: true,
          },
          collapsed: true,
        },
        {
          label: 'Fan Fiction',
          collapsed: true,
          items: [
            {
              label: 'Harry Potter - Nephilim',
              items:[
                {
                  label: 'Introduction',
                  link: '/fanfiction/harry_potter_-_nephilim/introduction/'
                },
                {
                  label: 'Prologue',
                  link: '/fanfiction/harry_potter_-_nephilim/prologue/'
                },
                {
                  label: 'Chapters',
                  autogenerate: {
                    directory: 'FanFiction/Harry_Potter_-_Nephilim/Chapters',
                  },
                },
                {
                  label: 'Back Story',
                  autogenerate: {
                    directory: 'FanFiction/Harry_Potter_-_Nephilim/backstory',
                  },
                  collapsed: true,
                },
                {
                  label: 'Appendices',
                  autogenerate: {
                    directory: 'FanFiction/Harry_Potter_-_Nephilim/Appendices',
                  },
                },
              ]
            }
          ]
        }]
    }),
    lit()
  ],
  // Process images with sharp: https://docs.astro.build/en/guides/assets/#using-sharp
  image: {
    service: {
      entrypoint: 'astro/assets/services/sharp'
    }
  }
});