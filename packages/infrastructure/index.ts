import * as aws from "@pulumi/aws";
import * as pulumi from "@pulumi/pulumi";

// Create an S3 bucket to host the static website
const staticSiteBucket = new aws.s3.Bucket("staticSiteBucket", {
  website: {
    indexDocument: "index.html",
    errorDocument: "404.html",
  },
});

// Upload static files to the S3 bucket
const staticFiles = new aws.s3.BucketObject("index.html", {
  bucket: staticSiteBucket,
  source: new pulumi.asset.FileAsset("../hono/dist/index.html"),
  contentType: "text/html",
});

const lambdaRole = new aws.iam.Role("lambdaRole", {
  assumeRolePolicy: aws.iam.assumeRolePolicyForPrincipal({
    Service: "lambda.amazonaws.com",
  }),
});

const lambdaRolePolicyAttachment = new aws.iam.RolePolicyAttachment(
  "lambdaRolePolicy",
  {
    role: lambdaRole.name,
    policyArn: aws.iam.ManagedPolicies.AWSLambdaBasicExecutionRole,
  }
);

// Create a Lambda function for the dynamic pages
const dynamicFunction = new aws.lambda.Function("dynamicFunction", {
  runtime: "nodejs22.x",
  code: new pulumi.asset.AssetArchive({
    ".": new pulumi.asset.FileArchive("../hono/dist/"),
  }),
  handler: "server.handler",
  role: lambdaRole.arn,
});

// Create an API Gateway Rest API
const restApi = new aws.apigateway.RestApi("restApi", {
  description: "API for dynamic content",
});

// Create a resource for the root path
const rootResource = new aws.apigateway.Resource("rootResource", {
  restApi: restApi.id,
  parentId: restApi.rootResourceId,
  pathPart: "",
});

// Create a resource for the dynamic path
const dynamicResource = new aws.apigateway.Resource("dynamicResource", {
  restApi: restApi.id,
  parentId: rootResource.id,
  pathPart: "dynamic",
});

// Create a GET method for the dynamic resource
const getMethod = new aws.apigateway.Method("getMethod", {
  restApi: restApi.id,
  resourceId: dynamicResource.id,
  httpMethod: "GET",
  authorization: "NONE",
  apiKeyRequired: false,
  requestModels: {},
});

// Integrate the Lambda function with the GET method
const lambdaIntegration = new aws.apigateway.Integration("lambdaIntegration", {
  restApi: restApi.id,
  resourceId: dynamicResource.id,
  httpMethod: getMethod.httpMethod,
  integrationHttpMethod: "POST",
  type: "AWS_PROXY",
  uri: dynamicFunction.invokeArn,
});

// Deploy the API
const deployment = new aws.apigateway.Deployment("deployment", {
  restApi: restApi.id,
  stageName: "prod",
});

// Export the URLs
export const staticSiteUrl = staticSiteBucket.websiteEndpoint;
export const apiUrl = pulumi.interpolate`${deployment.invokeUrl}/dynamic`;
