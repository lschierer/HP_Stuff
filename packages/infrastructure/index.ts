import * as path from "node:path";
import process from "node:process";

const greenwoodPath = "../greenwood";
const greenwoodGraph = path.join(
  process.cwd(),
  greenwoodPath,
  "public/graph.json"
);
const greenwoodManifest = path.join(
  process.cwd(),
  greenwoodPath,
  "public/manifest.json"
);

console.log(`greenwoodGraph is at ${greenwoodGraph}`);
console.log(`greenwoodManifest is at ${greenwoodManifest}`);

import { GraphElement, Manifest, type ValueClass } from "@hp-stuff/schemas";

type Route = {
  url: string | $util.Output<string>;
  rewrite: {
    regex: string;
    to: string;
  };
};

const rootDomain = "schierer.org";
const domain = "hp-fan";

const api = new sst.aws.ApiGatewayV2("HP-Stuff-API", {});
const RUNTIME = "nodejs22.x";

const ssrRoutes: Map<string, Route> = new Map<string, Route>();

const manifestUrl = new URL(greenwoodManifest, import.meta.url);
const manifestImport = (await import(manifestUrl.pathname, {
  with: { type: "json" },
})) as object;

const v1 = Manifest.safeParse(
  manifestImport["default" as keyof typeof manifestImport]
);
if (v1.success) {
  for (const ar of v1.data.apis.value) {
    if (ar.length == 2) {
      const vc = ar[1];
      if (typeof vc !== "string") {
        const route = vc.route;
        const id = vc.id;
        const bundlePath = path.join(
          process.cwd(),
          greenwoodPath,
          ".aws-output/api",
          id
        );
        api.route(`ANY ${route}`, {
          bundle: bundlePath,
          handler: "index.handler",
          runtime: RUNTIME,
        });
      }
    }
  }
} else {
  console.error(`error parsing manifest.json: ${v1.error.message}`);
}

const graphUrl = new URL(greenwoodGraph, import.meta.url);
const graphImport = (await import(graphUrl.pathname, {
  with: { type: "json" },
})) as object;

const kvstore = new aws.cloudfront.KeyValueStore("HP-Stuff-Router-kv");

const valid = GraphElement.array().safeParse(
  graphImport["default" as keyof typeof graphImport]
);
if (valid.success) {
  console.log(`graph.json parsed successfully`);
  const ssrPages = valid.data.filter((page) => page.isSSR);

  for (const ssrPage of ssrPages) {
    const { route, id } = ssrPage;

    api.route(`GET /routes/${id}`, {
      bundle: path.join(greenwoodPath, `.aws-output/routes/${id}`),
      handler: "index.handler",
      runtime: RUNTIME,
    });

    ssrRoutes.set(route, {
      url: api.url,
      rewrite: {
        regex: `^${route}$`,
        to: `/routes/${id}`,
      },
    });

    console.log(`creating kvValue for key ${route} with value ${id}`);
    const kvValue = new aws.cloudfront.KeyvaluestoreKey(
      id.replaceAll("/", "-"),
      {
        keyValueStoreArn: kvstore.arn,
        key: route,
        value: id,
      }
    );
  }
} else {
  console.error(`error parsing graph.json: ${valid.error.message}}`);
}

export const router = new sst.aws.Router("HP-Stuff-Router", {
  domain: {
    name:
      $app.stage === "production"
        ? `${domain}.${rootDomain}`
        : `${$app.stage}.${domain}.${rootDomain}`,
    aliases: [`*.${$app.stage}.${domain}.${rootDomain}`],
  },
  invalidation: $app.stage === "production" ? true : false,
});

const frontend = new sst.aws.StaticSite("HP-Stuff-Static", {
  path: greenwoodPath,
  router: {
    instance: router,
  },
  build: {
    command: "echo 'build goes here'",
    output: "public",
  },
  transform: {
    cdn: {
      transform: {
        distribution: {
          priceClass: "PriceClass_100",
        },
      },
    },
  },
});

router.route("/api/*", api.url);

router.route("/*", frontend.url);
$resolve(frontend.url).apply((value) => {
  console.log(`frontend url is ${value}`);
});
