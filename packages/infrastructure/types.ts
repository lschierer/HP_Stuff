import type * as aws from "@pulumi/aws";
import * as pulumi from "@pulumi/pulumi";

export interface StaticRoute {
  type: "static";
  key: string;
  path: string;
  contentType: string;
}

export interface LambdaRoute {
  type: "lambda";
  pathPattern: string;
  path: string;
  handler: string;
}

export type Route = StaticRoute | LambdaRoute;

export interface RoutesResult {
  cacheBehaviors: aws.types.input.cloudfront.DistributionOrderedCacheBehavior[];
}
