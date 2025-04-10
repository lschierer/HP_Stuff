import { z } from "zod";
import debugFunction from "@shared/debug";

const DEBUG = debugFunction(new URL(import.meta.url).pathname);

export const LayoutOptions = z.object({
  title: z.string().default(""),
  content: z.string().default("<span>No Page Content</span>"),
  markdownContent: z.boolean().default(false),
});
export type LayoutOptions = z.infer<typeof LayoutOptions>;

import { visit } from "unist-util-visit";
import type { Element, Root, Parent } from "hast";
import { unified } from "unified";
import rehypeParse from "rehype-parse";
import rehypeStringify from "rehype-stringify";
import remarkGfm from "remark-gfm";
import remarkParse from "remark-parse";
import remarkRehype from "remark-rehype";
import rehypeAddClasses from "rehype-class-names";

const processHtml = async (
  template: string,
  content: string,
  markdownContent: boolean = false
): Promise<string> => {
  // Define contentAst with the proper type
  let contentAst: Root;

  if (!markdownContent) {
    contentAst = unified().use(rehypeParse, { fragment: true }).parse(content);
  } else {
    // For markdown, we need to process it completely to get HTML AST
    const result = await unified()
      .use(remarkParse)
      .use(remarkGfm)
      .use(remarkRehype)
      .use(rehypeAddClasses, {
        "h1,h2,h3,h4,h5":
          "spectrum-Heading spectrum-Heading--serif spectrum-Heading--heavy",
        a: "spectrum-Link  spectrum-Link--primary",
        "p,li": "spectrum-Body spectrum-Body--serif spectrum-Body--sizeM",
        "blockquote,blockquote paragraph":
          "spectrum-Body spectrum-Body--serif spectrum-Body--sizeS",
      })
      .use(rehypeStringify)
      .process(content);

    // Parse the stringified HTML to get a proper HTML AST
    contentAst = unified()
      .use(rehypeParse, { fragment: true })
      .parse(String(result));
  }

  // Get the content children
  const contentChildren = contentAst.children;

  // Process the template and replace <page-outlet> with content
  const result = await unified()
    .use(rehypeParse)
    .use(() => (tree: Root) => {
      let replaced = false;

      visit(
        tree,
        "element",
        (
          node: Element,
          index: number | undefined,
          parent: Parent | undefined
        ) => {
          if (
            !replaced &&
            node.tagName === "page-outlet" &&
            parent &&
            typeof index === "number"
          ) {
            parent.children.splice(index, 1, ...contentChildren);
            replaced = true;
          }
        }
      );

      return tree;
    })
    .use(rehypeStringify)
    .process(template);

  return String(result);
};

export const defaultLayout = z
  .function()
  .args(LayoutOptions)
  .returns(z.string().promise())
  .implement(async (options: LayoutOptions) => {
    if (DEBUG) console.log(`Generating layout with title: ${options.title}`);

    const template = `
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

    return await processHtml(
      template,
      options.content,
      options.markdownContent
    );
  });
