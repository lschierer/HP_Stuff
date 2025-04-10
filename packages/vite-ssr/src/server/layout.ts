import { z } from "zod";
import debugFunction from "@shared/debug";

const DEBUG = debugFunction(new URL(import.meta.url).pathname);

export const LayoutOptions = z.object({
  title: z.string().default(""),
});
export type LayoutOptions = z.infer<typeof LayoutOptions>;

export const defaultLayout = z
  .function()
  .args(LayoutOptions)
  .returns(z.string())
  .implement((options) => {
    if (DEBUG) console.log(`Generating layout with title: ${options.title}`);

    return `
  <!doctype html>
  <html lang="en" class="spectrum spectrum-Typography">
    <head>
      <meta charset="utf-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1" />
      <title>Luke's HP Site${options.title.length ? ` - ${options.title}` : ""}</title>
      <meta name="description" content="Luke's Harry Potter Fan Site" />
      <link rel="stylesheet" href="/styles/global.css" />
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
      <link
        href="https://fonts.googleapis.com/css2?family=Inconsolata:wght@200..900&family=Micro+5&display=swap"
        rel="stylesheet"
      />
      ${
        import.meta.env.PROD
          ? `
      <script
        type="module"
        src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-8360834774752607"
      ></script>
      `
          : ""
      }

      <meta name="google-adsense-account" content="ca-pub-8360834774752607" />
    </head>
    <body>
      <sp-theme class="spectrum-Typography">
        <page-outlet></page-outlet>
      </sp-theme>
    </body>
  </html>
  `;
  });
