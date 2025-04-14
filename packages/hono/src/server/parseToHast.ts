import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkGfm from "remark-gfm";
import remarkRehype from "remark-rehype";
import rehypeParse from "rehype-parse";
import remarkFrontmatter from "remark-frontmatter";
import rehypeAddClasses from "rehype-class-names";
import type { Root } from "hast";

const classMap = {
  "h1,h2,h3,h4,h5":
    "spectrum-Heading spectrum-Heading--serif spectrum-Heading--heavy",
  a: "spectrum-Link  spectrum-Link--primary",
  "p,li": "spectrum-Body spectrum-Body--serif spectrum-Body--sizeM",
  "blockquote,blockquote paragraph":
    "spectrum-Body spectrum-Body--serif spectrum-Body--sizeS",
};

export async function parseMarkdownToHast(markdown: string): Promise<Root> {
  const processor = unified()
    .use(remarkParse)
    .use(remarkFrontmatter)
    .use(remarkGfm)
    .use(remarkRehype)
    .use(rehypeAddClasses, classMap);

  const hast = await processor.run(processor.parse(markdown));
  return hast;
}

export function parseHtmlToHast(html: string): Root {
  return unified()
    .use(rehypeParse, { fragment: true })
    .use(rehypeAddClasses, classMap)
    .parse(html);
}
