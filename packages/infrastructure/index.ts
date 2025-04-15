import * as aws from "@pulumi/aws";
import * as path from "path";
import * as fs from "fs";

import * as pulumi from "@pulumi/pulumi";

import { execSync } from "child_process";

// 🔁 Run the build script in the hono package
const honoDir = path.resolve(__dirname, "..", "hono");

console.log("🔨 Building Hono Lambda...");
execSync("pnpm build", {
  cwd: honoDir,
  stdio: "inherit", // stream output live
});

console.log("✅ Hono build complete.");

// 🧠 Path to your built app entry point
const lambdaPath = path.resolve(
  __dirname,
  "..",
  "hono",
  "dist",
  "server",
  "server.js"
);

const role = new aws.iam.Role("lambdaRole", {
  assumeRolePolicy: aws.iam.assumeRolePolicyForPrincipal({
    Service: "lambda.amazonaws.com",
  }),
});

new aws.iam.RolePolicyAttachment("lambdaFullAccess", {
  role: role.name,
  policyArn: aws.iam.ManagedPolicy.AWSLambdaBasicExecutionRole,
});

const lambdaFileArchive = new pulumi.asset.FileArchive(
  path.resolve(__dirname, "..", "hono", "lambda-dist")
);

const honoLambda = new aws.lambda.Function("honoHandler", {
  runtime: "nodejs22.x",
  code: new pulumi.asset.AssetArchive({
    ".": lambdaFileArchive,
  }),
  handler: "index.handler", // You’ll need to export handler in server.js!
  role: role.arn,
  memorySize: 512,
  timeout: 10,
  environment: {
    variables: {
      NODE_ENV: "production",
    },
  },
});

const api = new aws.apigatewayv2.Api("honoApi", {
  protocolType: "HTTP",
});

const honoIntegration = new aws.apigatewayv2.Integration("honoIntegration", {
  apiId: api.id,
  integrationType: "AWS_PROXY",
  integrationUri: honoLambda.invokeArn,
  integrationMethod: "POST",
  payloadFormatVersion: "2.0",
});

new aws.apigatewayv2.Route("honoRoute", {
  apiId: api.id,
  routeKey: "$default",
  target: pulumi.interpolate`integrations/${honoIntegration.id}`,
});

new aws.apigatewayv2.Stage("defaultStage", {
  apiId: api.id,
  name: "$default",
  autoDeploy: true,
});

new aws.lambda.Permission("apiPermission", {
  action: "lambda:InvokeFunction",
  function: honoLambda.name,
  principal: "apigateway.amazonaws.com",
  sourceArn: pulumi.interpolate`${api.executionArn}/*/*`,
});

export const endpoint = api.apiEndpoint;
