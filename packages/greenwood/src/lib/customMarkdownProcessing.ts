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
      a: "spectrum-Link spectrum-Link--quiet spectrum-Link--primary",
      p: "spectrum-Body spectrum-Body--serif spectrum-Body--sizeM",
    })
    .use(rehypeStringify)
    .processSync(rawText)
    .toString();
};

export default markdownTextProcessing;
