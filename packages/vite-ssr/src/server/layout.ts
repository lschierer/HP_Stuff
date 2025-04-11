import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkGfm from "remark-gfm";
import remarkRehype from "remark-rehype";
import rehypeParse from "rehype-parse";
import rehypeAddClasses from "rehype-class-names";
import rehypeStringify from "rehype-stringify";
import { visit } from "unist-util-visit";
import type { Root } from "hast";
import { z } from "zod";

//central control over whether or not to output debugging
import debugFunction from "@shared/debug";
const DEBUG = debugFunction(new URL(import.meta.url).pathname);

const classMap = {
  "h1,h2,h3,h4,h5":
    "spectrum-Heading spectrum-Heading--serif spectrum-Heading--heavy",
  a: "spectrum-Link  spectrum-Link--primary",
  "p,li": "spectrum-Body spectrum-Body--serif spectrum-Body--sizeM",
  "blockquote,blockquote paragraph":
    "spectrum-Body spectrum-Body--serif spectrum-Body--sizeS",
};

const processHtml = async (
  template: string,
  options: LayoutOptions
): Promise<string> => {
  try {
    let contentAst: Root;

    if ("markdownContent" in options) {
      const file = await unified()
        .use(remarkParse)
        .use(remarkGfm)
        .use(remarkRehype)
        .use(rehypeAddClasses, classMap)
        .process(options.markdownContent);

      contentAst = file.result as Root;
    } else {
      if (DEBUG) {
        console.log(`building content from html string`);
      }
      contentAst = unified()
        .use(rehypeParse, { fragment: true })
        .use(rehypeAddClasses, classMap)
        .parse(options.content);
    }

    const contentChildren = contentAst.children;

    const ast = unified().use(rehypeParse, { fragment: true }).parse(template);

    visit(ast, "element", (node, index, parent) => {
      if (
        node.tagName === "page-outlet" &&
        parent &&
        Array.isArray(parent.children)
      ) {
        const outletIndex = parent.children.indexOf(node);
        if (outletIndex !== -1) {
          parent.children.splice(outletIndex, 1, ...contentChildren);
        }
      }
    });

    return unified().use(rehypeStringify).stringify(ast);
  } catch (err) {
    if (DEBUG) console.error("Layout render error:", err);
    return `<html><body><h1>Error rendering page</h1><pre>${JSON.stringify(err)}</pre></body></html>`;
  }
};

//exported to allow other files to ensure they send the right kind of object to defaultLayout

const CommonOptions = z.object({
  title: z.string(),
});
type CommonOptions = z.infer<typeof CommonOptions>;

const HTMLOptions = CommonOptions.extend({
  content: z.string(),
}).strict();
type HTMLOptions = z.infer<typeof HTMLOptions>;

const MarkdownOptions = CommonOptions.extend({
  markdownContent: z.string(),
}).strict();
type MarkdownOptions = z.infer<typeof MarkdownOptions>;

export const LayoutOptions = z.union([HTMLOptions, MarkdownOptions]);
export type LayoutOptions = z.infer<typeof LayoutOptions>;

// default template for my site
const getTemplate = (options: LayoutOptions) => {
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
      </head>
      <body>
        <sp-theme class="spectrum-Typography">
          <page-outlet></page-outlet>
        </sp-theme>
      </body>
    </html>
  `;
};

const renderLayout = async (options: LayoutOptions): Promise<string> => {
  //if (DEBUG) {
  console.log(`in layout.ts renderLayout`);
  //}
  return await processHtml(getTemplate(options), options);
};

export const defaultLayout = z
  .function()
  .args(LayoutOptions)
  .returns(z.string().promise())
  .implement(renderLayout);
