import rehypeStringify from "rehype-stringify";
import remarkGfm from "remark-gfm";
import remarkParse from "remark-parse";
import remarkRehype from "remark-rehype";
import rehypeAddClasses from "rehype-class-names";
import { unified } from "unified";

const markdownTextProcessing = (rawText: string) => {
  return unified()
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
    .processSync(rawText)
    .toString();
};

export default markdownTextProcessing;
