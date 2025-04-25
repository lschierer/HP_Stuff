import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";
import { dirname } from "path";
import { argv } from "process";

// Define __dirname equivalent for ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

interface RouteMapping {
  route: string; // Original route from graph.json
  apiPath: string; // Path to the API Gateway resource
  isSSR: boolean; // Whether this is a server-side rendered route
  context?: unknown; // Any additional context needed by the Lambda
}

import { GraphElement } from "@hp-stuff/schemas";

/**
 * Parse the graph.json file and generate route mappings for the CloudFront KeyValueStore
 */
export function parseGraphJson(
  graphJsonPath: string
): Map<string, RouteMapping> {
  // Read the graph.json file
  const graphJson = JSON.parse(
    fs.readFileSync(graphJsonPath, "utf8")
  ) as object;
  // Create a map of routes to their API paths
  const routeMappings: Map<string, RouteMapping> = new Map<
    string,
    RouteMapping
  >();

  const valid = GraphElement.array().safeParse(graphJson);
  if (valid.success) {
    const graph = valid.data;

    for (const entry of graph) {
      const route = entry.route.endsWith("/")
        ? entry.route.slice(0, -1)
        : entry.route;

      if (entry.isSSR) {
        const outputPath = entry.outputHref
          ? path.basename(entry.outputHref, ".route.js")
          : route.replace(/\//g, "-");

        routeMappings.set(route, {
          route,
          apiPath: `/${outputPath}`,
          isSSR: true,
          context: {
            id: entry.id,
            title: entry.title,
          },
        });
      } else {
        routeMappings.set(route, {
          route,
          apiPath: route,
          isSSR: false,
        });
      }
    }
  }

  return routeMappings;
}

/**
 * Generate a CloudFront KeyValueStore configuration file
 */
export function generateKvConfig(
  routeMappings: Map<string, RouteMapping>,
  outputPath: string
): void {
  // Format the mappings for the KV store
  const kvEntries: Record<string, string> = {};

  for (const [route, mapping] of Object.entries(routeMappings)) {
    // Store each route with a prefix to avoid collisions
    kvEntries[`route:${route}`] = JSON.stringify(mapping);
  }

  // Write the KV config to a file
  fs.writeFileSync(outputPath, JSON.stringify(kvEntries, null, 2));

  console.log(
    `Generated KV config with ${Object.keys(kvEntries).length} entries at ${outputPath}`
  );
}

// If this script is run directly, parse the graph.json and generate the KV config
const currentFilePath = fileURLToPath(import.meta.url);

if (argv[1] === currentFilePath) {
  // This module is the main entry point
  console.log("This is the main module");
  const greenwoodDir = path.resolve(__dirname, "../greenwood");
  const graphJsonPath = path.join(greenwoodDir, "public/graph.json");
  const kvConfigPath = path.join(__dirname, "kv-config.json");

  const routeMappings = parseGraphJson(graphJsonPath);
  generateKvConfig(routeMappings, kvConfigPath);
} else {
  // This module is being imported
  console.log("This is not the main module");
}
