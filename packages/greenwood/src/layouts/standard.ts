import type { GetLayout, Compilation } from "@greenwood/cli";

import { type LayoutOptions } from "@hp-stuff/schemas";

import debugFunction from "../lib/debug.ts";
const DEBUG = debugFunction(new URL(import.meta.url).pathname);

const getTemplate = (options: LayoutOptions) => {
  const isMarkdown = "markdownContent" in options;
  const isSplash = !isMarkdown || options.route === "/" || !options.sidebar;
  const useStandard = (isMarkdown && !isSplash) || options.sidebar;
  if (DEBUG) {
    console.log(
      `getTemplate: isMarkdown: ${isMarkdown}; isSplash: ${isSplash}; useStandard: ${useStandard}`
    );
  }
  return `
    <!doctype html>
    <html lang="en" class="spectrum spectrum-Typography">
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>
          Luke's HP Site${options.title.length ? ` - ${options.title}` : ""}
        </title>
        <meta name="description" content="Luke's Harry Potter Fan Site" />
        <link rel="stylesheet" href="/styles/global.css" />
        <link rel="stylesheet" href="/styles/${useStandard ? "standard.css" : "splash.css"}" />

        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
        <link
          href="https://fonts.googleapis.com/css2?family=Inconsolata:wght@200..900&family=Micro+5&display=swap"
          rel="stylesheet"
        />
        ${
          process.env.NODE_ENV === "production"
            ? `
        <script
          type="module"
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-8360834774752607"
        ></script>
        `
            : ""
        }

        <meta name="google-adsense-account" content="ca-pub-8360834774752607" />

        <script type="module" src="/components/Spectrum/Base.ts"></script>

      </head>
      <body>

        <sp-theme class="spectrum-Typography">
          <header>
            <div class="topHeader" ></div>
            <theme-provider></theme-provider>
          </header>

          ${
            useStandard
              ? `
            <div class="title-section">
              <h1 class="spectrum-Heading spectrum-Heading--sizeXXL">
                ${options.title}
              </h1>
            </div>
            <sp-split-view resizable primary-size="20%">
            <div class="nav"></div>
            <div class="main">
              <main>
                <page-outlet></page-outlet>
              </main>
            </div>
            </sp-split-view>
          `
              : `
            <page-outlet></page-outlet>
          `
          }

          <footer class="footer">
            <span
              id="copyright"
              class="copyright spectrum-Detail spectrum-Detail--serif spectrum-Detail--sizeM spectrum-Detail--light"
            >
              COPYRIGHTPLACEHOLDER
            </span>
          </footer>

        </sp-theme>
      </body>
    </html>
  `;
};

const standardLayout: GetLayout = async (
  compilation: Compilation,
  route: string | object
): Promise<string> => {
  /*start work around for  requiring async */
  await new Promise((resolve) => setTimeout(resolve, 1));
  /* end workaround */

  let html = "";

  console.log(`route is ${JSON.stringify(route)}`);
  const actualRoute: string =
    typeof route === "string"
      ? route
      : (route["route" as keyof typeof route] as string);

  const page = compilation.graph.find((page) => page.route === actualRoute);
  const title = page ? (page.title ? page.title : "") : "";
  if (
    !actualRoute.includes("Harry Potter and the Nightmares of Futures Past")
  ) {
    if (page) {
      const lo: LayoutOptions = {
        title,
        markdownContent: "<content-outlet></content-outlet>",
        route: actualRoute,
        sidebar: true,
      };
      html = getTemplate(lo);
    }
  }

  return html;
};

export { standardLayout as getLayout };
export default standardLayout;
