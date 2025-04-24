import * as pulumi from "@pulumi/pulumi";
import { AssetsStack } from "./assets-stack";
import { MainStack } from "./main-stack";

// Get configuration
const config = new pulumi.Config();
const domainName = config.require("domainName");
const rootDomainName = config.require("rootDomainName");
const createHostedZone = config.getBoolean("createHostedZone") || false;

// Create the assets stack
const assetsStack = new AssetsStack(`${config.name}-assets`);

// Create the main stack
const mainStack = new MainStack(
  "main",
  {
    domainName,
    rootDomainName,
    createHostedZone,
  },
  assetsStack.outputs
);

// Export outputs
export const bucketName = assetsStack.outputs.bucketName;
export const cdnUrl = mainStack.outputs.cdnUrl;
export const finalCdnUrl = mainStack.outputs.finalCdnUrl;
