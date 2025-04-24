import * as aws from "@pulumi/aws";
import * as pulumi from "@pulumi/pulumi";
import { fileURLToPath } from "url";
import { dirname } from "path";
import path from "path";
import fs from "node:fs";
import { getStaticRoutes, getApiFunctions } from "./utils";
import type { RoutesResult, LambdaRoute, Route } from "./types";

// Define __dirname equivalent for ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export function integrateRoutesAndApis(
  bucket: aws.s3.Bucket,
  distribution: aws.cloudfront.Distribution,
  usEast1: aws.Provider
): RoutesResult {
  const lambdaRole = new aws.iam.Role(
    "hp-stuff-lambda-role",
    {
      assumeRolePolicy: JSON.stringify({
        Version: "2012-10-17",
        Statement: [
          {
            Action: "sts:AssumeRole",
            Effect: "Allow",
            Principal: {
              Service: ["lambda.amazonaws.com", "edgelambda.amazonaws.com"],
            },
          },
        ],
      }),
    },
    { provider: usEast1 }
  );

  // Create the CloudFront Function for request rewriting
  const edgeHandlerPath = path.join(__dirname, "edge-handler");
  const cfFunctionCode = fs.readFileSync(
    path.join(edgeHandlerPath, "cloudfront-function.js"),
    "utf8"
  );

  const cfFunction = new aws.cloudfront.Function("hp-stuff-request-rewrite", {
    name: "HPStuffRequestRewriteFunction",
    runtime: "cloudfront-js-2.0",
    comment: "URL rewriting function for clean URLs",
    publish: true,
    code: cfFunctionCode,
  });

  // Process routes
  const cacheBehaviors: aws.types.input.cloudfront.DistributionOrderedCacheBehavior[] =
    [];

  // Group routes by their top-level path
  const routeGroups = new Map<string, LambdaRoute[]>();

  // This is now synchronous because we're using Pulumi's apply pattern
  const staticRoutes = pulumi.output(getStaticRoutesArray());

  staticRoutes.apply((routes) => {
    for (const route of routes) {
      if (route.type === "static") {
        // Handle static routes as before
        new aws.s3.BucketObject(route.key, {
          key: route.key,
          bucket,
          source: new pulumi.asset.FileAsset(route.path),
          contentType: route.contentType,
          acl: "private",
        });
      } else if (route.type === "lambda") {
        // Group Lambda routes by their top-level path
        const topLevelPath = route.pathPattern.split("/")[1] || "root";
        if (!routeGroups.has(topLevelPath)) {
          routeGroups.set(topLevelPath, []);
        }

        (routeGroups.get(topLevelPath) as LambdaRoute[]).push(route);
      }
    }

    // Create a Lambda function for each group
    for (const [groupName, routes] of routeGroups.entries()) {
      console.log(
        `Creating Lambda function for group: ${groupName} with ${routes.length} routes`
      );

      // Create a single Lambda function for this group
      const lambdaFunc = new aws.lambda.Function(
        `${groupName}-group`,
        {
          runtime: "nodejs22.x",
          role: lambdaRole.arn,
          handler: "index.handler",
          code: new pulumi.asset.AssetArchive({
            ".": new pulumi.asset.FileArchive(routes[0].path), // Use the first route's path as a base
          }),
          publish: true,
          timeout: 10,
        },
        { provider: usEast1 }
      );

      new aws.lambda.Permission(
        `${groupName}-group-permission`,
        {
          action: "lambda:InvokeFunction",
          function: lambdaFunc.name,
          principal: "cloudfront.amazonaws.com",
          sourceArn: distribution.arn,
        },
        { provider: usEast1 }
      );

      // Add a single cache behavior for this group
      cacheBehaviors.push({
        pathPattern: `/${groupName}/*`,
        targetOriginId: "s3-origin",
        allowedMethods: ["GET", "HEAD", "OPTIONS"],
        cachedMethods: ["GET", "HEAD"],
        forwardedValues: {
          queryString: true,
          cookies: { forward: "none" },
          headers: [
            "Host",
            "Origin",
            "Referer",
          ],
        },
        lambdaFunctionAssociations: [
          {
            eventType: "origin-request",
            lambdaArn: lambdaFunc.qualifiedArn,
            includeBody: true,
          },
        ],
        viewerProtocolPolicy: "redirect-to-https",
      });
    }
  });

  // Process API functions - also synchronous with Pulumi's apply pattern
  const apiGroups = new Map<string, { name: string; entry: string }[]>();

  const apiFunctions = pulumi.output(
    getApiFunctionsArray() as Promise<object[]>
  );

  apiFunctions.apply((apis) => {
    for (const apiFunc of apis) {
      // Group APIs by first letter to reduce number of cache behaviors
      const firstLetter = (apiFunc["name" as keyof typeof apiFunc] as string)
        .charAt(0)
        .toLowerCase();
      if (!apiGroups.has(firstLetter)) {
        apiGroups.set(firstLetter, []);
      }
      if (firstLetter) {
        const ag = apiGroups.get(firstLetter);
        if (ag) {
          ag.push(apiFunc as { name: string; entry: string });
        }
      }
    }

    // Create a Lambda function for each API group
    for (const [groupKey, apis] of apiGroups.entries()) {
      if (apis.length === 0) continue;

      // Use the first API's code as the base
      const firstApi = apis[0];

      const lambdaFunc = new aws.lambda.Function(
        `api-group-${groupKey}`,
        {
          runtime: "nodejs22.x",
          role: lambdaRole.arn,
          handler: "index.handler",
          code: new pulumi.asset.AssetArchive({
            ".": new pulumi.asset.FileArchive(path.dirname(firstApi.entry)),
          }),
          publish: true,
          timeout: 10,
        },
        { provider: usEast1 }
      );

      new aws.lambda.Permission(
        `api-group-${groupKey}-permission`,
        {
          action: "lambda:InvokeFunction",
          function: lambdaFunc.name,
          principal: "cloudfront.amazonaws.com",
          sourceArn: distribution.arn,
        },
        { provider: usEast1 }
      );

      // Add cache behavior for this API group
      cacheBehaviors.push({
        pathPattern: `/api/${groupKey}*`,
        targetOriginId: "s3-origin",
        allowedMethods: [
          "GET",
          "HEAD",
          "OPTIONS",
          "PUT",
          "POST",
          "PATCH",
          "DELETE",
        ],
        cachedMethods: ["GET", "HEAD"],
        forwardedValues: {
          queryString: true,
          cookies: { forward: "none" },
          headers: ["Authorization", "Origin", "Content-Type"],
        },
        lambdaFunctionAssociations: [
          {
            eventType: "origin-request",
            lambdaArn: lambdaFunc.qualifiedArn,
            includeBody: true,
          },
        ],
        viewerProtocolPolicy: "redirect-to-https",
      });
    }
  });

  console.log(`Total cache behaviors: ${cacheBehaviors.length}`);

  return {
    cacheBehaviors,
    cfFunction,
  };
}

// Helper functions to convert AsyncGenerator to array
async function getStaticRoutesArray() {
  const routes = new Array<Route>();
  const sr = await getStaticRoutes();
  for (const route of sr) {
    routes.push(route);
  }
  return routes;
}

async function getApiFunctionsArray() {
  const apis = [];
  const af = await getApiFunctions();
  for (const api of af) {
    apis.push(api);
  }
  return apis;
}
