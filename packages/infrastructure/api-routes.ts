import { Manifest } from "manifestTypes";
import { GraphElement } from "graphTypes";

export const api = new sst.aws.ApiGatewayV2("Api");

const RUNTIME = "nodejs22.x";

// TODO need to handle basePath here?  (and / or all adapters?)
const apiRoutesImport = (await import(
  new URL("../../public/manifest.json", import.meta.url).pathname,
  {
    with: { type: "json" },
  }
)) as object;
const valid = Manifest.safeParse(
  apiRoutesImport["default" as keyof typeof apiRoutesImport]
);
if (valid.success) {
  const apiRoutes = valid.data.apis.value;

  const graphImport = (await import(
    new URL("../../public/graph.json", import.meta.url).pathname,
    {
      with: { type: "json" },
    }
  )) as object;
  const graphValidator = GraphElement.array().safeParse(
    graphImport["default" as keyof typeof graphImport]
  );
  const ssrPages = new Array<GraphElement>();

  if (graphValidator.success) {
    graphValidator.data.map((page) => {
      if (page.isSSR) {
        ssrPages.push(page);
      }
    });
  }

  // https://sst.dev/docs/component/aws/apigatewayv2
  // https://sst.dev/docs/component/aws/function
  ssrPages.forEach((page) => {
    const { id } = page;

    api.route(`GET /routes/${id}`, {
      bundle: `.aws-output/routes/${id}`,
      handler: "index.handler",
      runtime: RUNTIME,
    });
  });

  apiRoutes.forEach((apiRoute) => {
    const [route] = apiRoute;

    api.route(`ANY ${typeof route === "object" ? route.route : route}`, {
      bundle: `.aws-output/${typeof route === "object" ? route.route : route}`,
      handler: "index.handler",
      runtime: RUNTIME,
    });
  });
}
