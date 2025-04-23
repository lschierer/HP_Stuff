import * as aws from "@pulumi/aws";
import * as pulumi from "@pulumi/pulumi";
import * as fs from "node:fs";
import mime from "mime";

import { readdir, stat } from "node:fs/promises";
import path from "node:path";

const usEast1 = new aws.Provider("useast1", {
  region: "us-east-1",
});

// Create an S3 bucket to host the static website
const siteBucket = new aws.s3.Bucket("siteBucket", {
  website: {
    indexDocument: "index.html",
    errorDocument: "error.html",
  },
});

const config = new pulumi.Config();
const domainName = config.require("domainName");
const rootDomainName = config.require("rootDomainName");
const createHostedZone = config.getBoolean("createHostedZone") || false;
const logRetentionDays = config.getNumber("logRetentionDays") || 7; // Default to 7 days if not specified

// Upload the website files to the S3 bucket

const siteDir = "../greenwood/public";

const files = await walkDirectory(siteDir);

for (const filePath of files.sort()) {
  const relativeKey = path.relative(siteDir, filePath).replace(/\\/g, "/"); // <-- important!

  new aws.s3.BucketObject(relativeKey, {
    bucket: siteBucket,
    key: relativeKey,
    source: new pulumi.asset.FileAsset(filePath),
    contentType: mime.getType(filePath) || undefined,
  });
}

const oai = new aws.cloudfront.OriginAccessIdentity("cdn-oai", {
  comment: "Allow CloudFront to access S3",
});

const bucketPolicy = new aws.s3.BucketPolicy("bucketPolicy", {
  bucket: siteBucket.bucket,
  policy: pulumi
    .all([siteBucket.bucket, oai.iamArn])
    .apply(([bucketName, oaiArn]) =>
      JSON.stringify({
        Version: "2012-10-17",
        Statement: [
          {
            Effect: "Allow",
            Principal: {
              AWS: oaiArn,
            },
            Action: ["s3:GetObject"],
            Resource: [`arn:aws:s3:::${bucketName}/*`],
          },
        ],
      })
    ),
});

// Get or create Route53 hosted zone
let hostedZone: aws.route53.GetZoneResult | aws.route53.Zone;

if (createHostedZone) {
  hostedZone = new aws.route53.Zone("hosted-zone", {
    name: rootDomainName,
  });
} else {
  hostedZone = await aws.route53.getZone({
    name: rootDomainName,
  });
}

// Create an ACM certificate
const certificate = new aws.acm.Certificate(
  "certificate",
  {
    domainName: domainName,
    subjectAlternativeNames: [`www.${domainName}`], // Add www subdomain to certificate
    validationMethod: "DNS",
  },
  { provider: usEast1 }
);

// Create DNS records for certificate validation
const certificateValidationDomain = new aws.route53.Record(
  "certificate-validation-record",
  {
    name: certificate.domainValidationOptions[0].resourceRecordName,
    zoneId: createHostedZone
      ? (hostedZone as aws.route53.Zone).zoneId
      : (hostedZone as aws.route53.GetZoneResult).zoneId,
    type: certificate.domainValidationOptions[0].resourceRecordType,
    records: [certificate.domainValidationOptions[0].resourceRecordValue],
    ttl: 60,
  },
  { provider: usEast1 }
);

// Create DNS validation record for the www subdomain
const wwwCertificateValidationDomain = new aws.route53.Record(
  "www-certificate-validation-record",
  {
    name: certificate.domainValidationOptions[1].resourceRecordName,
    zoneId: createHostedZone
      ? (hostedZone as aws.route53.Zone).zoneId
      : (hostedZone as aws.route53.GetZoneResult).zoneId,
    type: certificate.domainValidationOptions[1].resourceRecordType,
    records: [certificate.domainValidationOptions[1].resourceRecordValue],
    ttl: 60,
  },
  { provider: usEast1 }
);

// Wait for certificate validation
const certificateValidation = new aws.acm.CertificateValidation(
  "certificate-validation",
  {
    certificateArn: certificate.arn,
    validationRecordFqdns: [
      certificateValidationDomain.fqdn,
      wwwCertificateValidationDomain.fqdn,
    ],
  },
  { provider: usEast1 }
);

const cfFunction = new aws.cloudfront.Function("myFunction", {
  name: "MyViewerRequestFunction",
  runtime: "cloudfront-js-1.0",
  comment: "Simple URL rewriting function",
  publish: true,
  code: `function handler(event) {
    var request = event.request;
    if (request.uri.endsWith("/")) {
      request.uri += "index.html";
    }
    return request;
  }`,
});

// Create a CloudFront distribution
const cdn = new aws.cloudfront.Distribution("cdn", {
  enabled: true,
  origins: [
    {
      domainName: siteBucket.bucketRegionalDomainName,
      originId: siteBucket.arn,
      s3OriginConfig: {
        originAccessIdentity: oai.cloudfrontAccessIdentityPath,
      },
    },
  ],

  defaultCacheBehavior: {
    targetOriginId: siteBucket.arn,
    viewerProtocolPolicy: "redirect-to-https",
    allowedMethods: ["GET", "HEAD"],
    cachedMethods: ["GET", "HEAD"],
    forwardedValues: {
      cookies: { forward: "none" },
      queryString: false,
    },
    functionAssociations: [
      {
        eventType: "viewer-request",
        functionArn: cfFunction.arn,
      },
    ],
  },
  viewerCertificate: {
    acmCertificateArn: certificateValidation.certificateArn,
    sslSupportMethod: "sni-only", // required
    minimumProtocolVersion: "TLSv1.2_2021", // optional, best practice
  },
  aliases: [domainName, `www.${domainName}`],
  defaultRootObject: "index.html",
  priceClass: "PriceClass_100",
  restrictions: {
    geoRestriction: {
      restrictionType: "none",
    },
  },
});

// Create Route53 record for the domain pointing to the ALB
const dnsRecord = new aws.route53.Record("dns-record", {
  zoneId: createHostedZone
    ? (hostedZone as aws.route53.Zone).zoneId
    : (hostedZone as aws.route53.GetZoneResult).zoneId,
  name: domainName,
  type: "A",
  aliases: [
    {
      name: cdn.domainName,
      zoneId: cdn.hostedZoneId,
      evaluateTargetHealth: true,
    },
  ],
});

// Create www alias record if this is the root domain
const isRootDomain = domainName === rootDomainName;
const wwwDomainName = isRootDomain
  ? `www.${rootDomainName}`
  : `www.${domainName}`;

const wwwDnsRecord = new aws.route53.Record("www-dns-record", {
  zoneId: createHostedZone
    ? (hostedZone as aws.route53.Zone).zoneId
    : (hostedZone as aws.route53.GetZoneResult).zoneId,
  name: wwwDomainName,
  type: "A",
  aliases: [
    {
      name: cdn.domainName,
      zoneId: cdn.hostedZoneId,
      evaluateTargetHealth: true,
    },
  ],
});

// Create a DNS record for the CloudFront distribution
const cdnRecord = new aws.route53.Record("cdnRecord", {
  name: hostedZone.name,
  zoneId: hostedZone.zoneId,
  type: "A",
  aliases: [
    {
      name: cdn.domainName,
      zoneId: cdn.hostedZoneId,
      evaluateTargetHealth: false,
    },
  ],
});

// Export the bucket name and CloudFront URL
export const bucketName = siteBucket.bucket;
export const cdnUrl = cdn.domainName;

const AWS_OUTPUT_PATH = path.resolve("../greenwood/.aws-output"); // or replace if bundled elsewhere
const ROUTES_DIR = path.join(AWS_OUTPUT_PATH, "routes");
const API_DIR = path.join(AWS_OUTPUT_PATH, "api");

export async function* getStaticRoutes() {
  const files = await walkDirectory(ROUTES_DIR);
  for (const filePath of files) {
    yield {
      key: "routes/" + path.relative(ROUTES_DIR, filePath),
      path: filePath,
      contentType: mime.getType(filePath) || undefined,
    };
  }
}

export async function* getApiFunctions() {
  const apis = await readdir(API_DIR);
  for (const name of apis) {
    const entry = path.join(API_DIR, name, "index.js");
    try {
      const stats = await stat(entry);
      if (stats.isFile()) {
        yield {
          name,
          entry,
        };
      }
    } catch {
      // skip missing or invalid entries
    }
  }
}

async function walkDirectory(dir: string): Promise<string[]> {
  const result: string[] = [];
  const items = await readdir(dir, { withFileTypes: true });
  for (const item of items) {
    const fullPath = path.join(dir, item.name);
    if (item.isDirectory()) {
      const sub = await walkDirectory(fullPath);
      result.push(...sub);
    } else if (item.isFile()) {
      result.push(fullPath);
    }
  }
  return result;
}

async function integrateRoutesAndApis(
  bucket: aws.s3.Bucket,
  distribution: aws.cloudfront.Distribution
) {
  for await (const { key, path: filePath, contentType } of getStaticRoutes()) {
    new aws.s3.BucketObject(key, {
      key,
      bucket,
      source: new pulumi.asset.FileArchive(filePath),
      contentType,
    });
  }
  const lambdaRole = new aws.iam.Role("lambda-role", {
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
  });

  for await (const { name, entry } of getApiFunctions()) {
    const lambdaFunc = new aws.lambda.Function(name, {
      runtime: "nodejs22.x",
      role: lambdaRole.arn,
      handler: "index.handler",
      code: new pulumi.asset.AssetArchive({
        ".": new pulumi.asset.FileArchive(path.dirname(entry)),
      }),
    });

    new aws.lambda.Permission(`${name}-permission`, {
      action: "lambda:InvokeFunction",
      function: lambdaFunc.name,
      principal: "cloudfront.amazonaws.com",
      sourceArn: distribution.arn,
    });

    // You could add to distribution.defaultCacheBehavior or behaviors list here
    // Needs a distribution config update pattern
  }
}

interface LambdaBehavior {
  pathPattern: string;
  lambdaFunction: aws.lambda.Function;
}

export async function getApiCacheBehaviors(
  bucket: aws.s3.Bucket,
  lambdaRole: aws.iam.Role
): Promise<LambdaBehavior[]> {
  const behaviors: LambdaBehavior[] = [];

  for await (const { name, entry } of getApiFunctions()) {
    const lambdaFunc = new aws.lambda.Function(name, {
      runtime: "nodejs18.x",
      role: lambdaRole.arn,
      handler: "index.handler",
      code: new pulumi.asset.AssetArchive({
        ".": new pulumi.asset.FileArchive(path.dirname(entry)),
      }),
      timeout: 10,
    });

    new aws.lambda.Permission(`${name}-permission`, {
      action: "lambda:InvokeFunction",
      function: lambdaFunc.name,
      principal: "cloudfront.amazonaws.com",
      sourceArn: pulumi.interpolate`${bucket.arn}/*`, // fallback; customize if needed
    });

    behaviors.push({
      pathPattern: `/api/${name}/*`,
      lambdaFunction: lambdaFunc,
    });
  }

  return behaviors;
}
