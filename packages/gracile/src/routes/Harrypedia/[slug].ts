import { defineRoute } from "@gracile/gracile/route";

import { document } from "../../layouts/base";

import template from "../../layouts/two-column-page";

import { Harrypedia } from "../../content/content";

export default defineRoute({
  staticPaths: () =>
    Object.values(Harrypedia).map((page) => ({
      params: { slug: page.meta.slug },
      props: {
        title: page.meta.title
          ? page.meta.title
          : page.meta.frontmatter.title
            ? page.meta.frontmatter.title
            : "",
        content: page.body.lit,
        toc: page.meta.tableOfContents,
        page: `${JSON.stringify(page)}`,
      },
    })),
  document: (context) =>
    document({ ...context, title: String(context.props.title) }),
  template: (context) => template(context.props.content),
});
