import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkGfm from "remark-gfm";
import remarkRehype from "remark-rehype";
import remarkFrontmatter from "remark-frontmatter";
import rehypeParse from "rehype-parse";
import rehypeAddClasses from "rehype-class-names";
import rehypeStringify from "rehype-stringify";
import { visit } from "unist-util-visit";
import type { Root } from "hast";
import { z } from "zod";
import matter from "gray-matter";

import TopHeaderSection from "@server/TopHeader";
import FooterHeaderSection from "@server/FooterSection";

//central control over whether or not to output debugging
import debugFunction from "@shared/debug";
const DEBUG = debugFunction(new URL(import.meta.url).pathname);

import { FrontMatter, ParsedResult } from "@schemas/page";

const classMap = {
  "h1,h2,h3,h4,h5":
    "spectrum-Heading spectrum-Heading--serif spectrum-Heading--heavy",
  a: "spectrum-Link  spectrum-Link--primary",
  "p,li": "spectrum-Body spectrum-Body--serif spectrum-Body--sizeM",
  "blockquote,blockquote paragraph":
    "spectrum-Body spectrum-Body--serif spectrum-Body--sizeS",
};

const processHtml = async (
  options: LayoutOptions,
  template?: string
): Promise<ParsedResult> => {
  let frontMatter: FrontMatter = {
    title: "",
  };
  try {
    let contentAst: Root;

    if ("markdownContent" in options) {
      if (DEBUG) {
        console.log(`building content from markdown string`);
      }

      const { data, content } = matter(options.markdownContent);

      const fileFM = FrontMatter.safeParse(data);
      if (fileFM.success) {
        frontMatter = fileFM.data;
      }
      if (DEBUG) {
        console.log(`Extracted frontmatter:`, JSON.stringify(fileFM.data));
      }

      // Create a complete processor pipeline that outputs a string
      const processor = unified()
        .use(remarkParse)
        .use(remarkFrontmatter) // Add support for frontmatter
        .use(remarkGfm)
        .use(remarkRehype)
        .use(rehypeAddClasses, classMap)
        .use(rehypeStringify);

      // Process the markdown to HTML string
      const file = await processor.process(content);

      // Parse the resulting HTML string back to an AST
      contentAst = unified()
        .use(rehypeParse, { fragment: true })
        .parse(String(file));
    } else {
      if (DEBUG) {
        console.log(`building content from html string`);
      }
      // Extract front matter using gray-matter
      const { data: rawFrontmatter, content } = matter(options.content);

      // Parse frontmatter with Zod schema
      const fileFM = FrontMatter.safeParse(rawFrontmatter);
      if (fileFM.success) {
        frontMatter = fileFM.data;
      }

      contentAst = unified()
        .use(rehypeParse, { fragment: true })
        .use(rehypeAddClasses, classMap)
        .parse(content);
    }

    const contentChildren = contentAst.children;

    if (template === undefined) {
      options.title = frontMatter.title;
      template = getTemplate(options);
    }

    const ast = unified().use(rehypeParse).parse(template);

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

    const topHeader = new TopHeaderSection();
    const footerSection = new FooterHeaderSection();
    if (options.route) {
      topHeader.route = options.route;
    }
    topHeader.intercept(ast);
    await footerSection.intercept(ast);
    return {
      frontMatter,
      html: unified().use(rehypeStringify).stringify(ast),
    };
  } catch (err) {
    if (DEBUG) console.error("Layout render error:", err);
    return {
      frontMatter,
      html: `<html><body><h1>Error rendering page</h1><pre>${JSON.stringify(err)}</pre></body></html>`,
    };
  }
};

//exported to allow other files to ensure they send the right kind of object to defaultLayout

const CommonOptions = z.object({
  title: z.string(),
  route: z.string().optional(),
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

        <script type="module" src="/client/entry-client.js "></script>
        <script type="module" src="/client/theme.js"></script>

      </head>
      <body>

        <sp-theme class="spectrum-Typography">
          <header>
            <div class="topHeader" ></div>
            <theme-provider></theme-provider>
          </header>
          <page-outlet></page-outlet>
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

const renderLayout = async (options: LayoutOptions): Promise<ParsedResult> => {
  if (DEBUG) {
    console.log(`in layout.ts renderLayout`);
  }
  return await processHtml(options);
};

export const defaultLayout = z
  .function()
  .args(LayoutOptions)
  .returns(ParsedResult.promise())
  .implement(renderLayout);
