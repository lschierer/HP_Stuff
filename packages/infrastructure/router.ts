import { frontend } from "./static.ts";
import { api } from "./api-routes.ts";

import { GraphElement } from "graphTypes.ts";
type SsrRoute = {
  url: string | $util.Output<string>;
  rewrite: {
    regex: string;
    to: string;
  };
};
type RouteArray = [string, SsrRoute];

const greenwoodGraph = "../greenwood/public/graph.json";
const graphPath = new URL(greenwoodGraph, import.meta.url).pathname;

const graphImport = (await import(graphPath, {
  with: { type: "json" },
})) as object;

const valid = GraphElement.array().safeParse(
  graphImport["default" as keyof typeof graphImport]
);

const ssrRoutes = new Array<RouteArray>();
if (valid.success) {
  const ssrPages = valid.data.filter((page) => page.isSSR);

  // TODO handle base path
  ssrPages.forEach((page) => {
    const { route, id } = page;

    ssrRoutes.push([
      route,
      {
        url: api.url,
        rewrite: {
          regex: `^${route}$`,
          to: `/routes/${id}`,
        },
      },
    ]);
  });
}

// https://sst.dev/docs/component/aws/router
export const router = new sst.aws.Router("HPStuffRouter", {
  routes: {
    "/api/*": api.url,
    ...Object.fromEntries(ssrRoutes),
    "/*": frontend.url,
  },
  invalidation: true,
});
