import * as aws from "@pulumi/aws";
import * as pulumi from "@pulumi/pulumi";
import { type RoutesResult } from "./types";
import { integrateRoutesAndApis } from "./routes";
import { type AssetsStackOutputs } from "./assets-stack";
import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";
import { dirname } from "path";

// Define __dirname equivalent for ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export interface MainStackConfig {
  domainName: string;
  rootDomainName: string;
  createHostedZone: boolean;
  kvStoreId: string;
}

export class MainStack extends pulumi.ComponentResource {
  private hostedZone: aws.route53.Zone | aws.route53.GetZoneResult | null =
    null;

  private certificate: aws.acm.Certificate | null = null;

  private certificateValidationDomain: aws.route53.Record | null = null;
  private wwwCertificateValidationDomain: aws.route53.Record | null = null;

  private certificateValidation: aws.acm.CertificateValidation | null = null;

  private cdn: aws.cloudfront.Distribution | null = null;
  private kvStore: aws.cloudfront.KeyValueStore | null = null;
  private routingFunction: aws.cloudfront.Function | null = null;

  private finalCdnUrl: pulumi.Output<string> = pulumi.Output.create<string>("");

  public readonly outputs: {
    cdnUrl: pulumi.Output<string>;
    finalCdnUrl: pulumi.Output<string>;
  };

  protected getR53Zone = async (config: MainStackConfig) => {
    if (config.createHostedZone) {
      this.hostedZone = new aws.route53.Zone(
        "hosted-zone",
        {
          name: config.rootDomainName,
        },
        { parent: this }
      );
    } else {
      this.hostedZone = await aws.route53.getZone({
        name: config.rootDomainName,
      });
    }
  };

  protected setCertificate = (
    config: MainStackConfig,
    provider: aws.Provider
  ) => {
    this.certificate = new aws.acm.Certificate(
      "hp-stuff-site-certificate",
      {
        domainName: config.domainName,
        subjectAlternativeNames: [`www.${config.domainName}`],
        validationMethod: "DNS",
      },
      { provider: provider, parent: this }
    );
  };

  protected setCertificateValidationDomains = (
    config: MainStackConfig,
    provider: aws.Provider
  ) => {
    if (this.hostedZone && this.certificate) {
      this.certificateValidationDomain = new aws.route53.Record(
        "site-certificate-validation-record",
        {
          name: this.certificate.domainValidationOptions[0].resourceRecordName,
          zoneId: pulumi
            .output(this.hostedZone)
            .apply((hz) =>
              config.createHostedZone
                ? (hz as aws.route53.Zone).zoneId
                : (hz as aws.route53.GetZoneResult).zoneId
            ),
          type: this.certificate.domainValidationOptions[0].resourceRecordType,
          records: [
            this.certificate.domainValidationOptions[0].resourceRecordValue,
          ],
          ttl: 60,
        },
        { provider: provider, parent: this }
      );

      this.wwwCertificateValidationDomain = new aws.route53.Record(
        "www-site-certificate-validation-record",
        {
          name: this.certificate.domainValidationOptions[1].resourceRecordName,
          zoneId: pulumi
            .output(this.hostedZone)
            .apply((hz) =>
              config.createHostedZone
                ? (hz as aws.route53.Zone).zoneId
                : (hz as aws.route53.GetZoneResult).zoneId
            ),
          type: this.certificate.domainValidationOptions[1].resourceRecordType,
          records: [
            this.certificate.domainValidationOptions[1].resourceRecordValue,
          ],
          ttl: 60,
        },
        { provider: provider, parent: this }
      );
    }
  };

  protected setCertificateValidation = (
    config: MainStackConfig,
    provider: aws.Provider
  ) => {
    if (
      this.certificate &&
      this.certificateValidationDomain &&
      this.wwwCertificateValidationDomain
    ) {
      this.certificateValidation = new aws.acm.CertificateValidation(
        "site-certificate-validation",
        {
          certificateArn: this.certificate.arn,
          validationRecordFqdns: [
            this.certificateValidationDomain.fqdn,
            this.wwwCertificateValidationDomain.fqdn,
          ],
        },
        { provider: provider, parent: this }
      );
    }
  };

  protected setCdn = (
    config: MainStackConfig,
    assetsOutputs: AssetsStackOutputs
  ) => {
    // Create a CloudFront distribution

    // Create an Origin Access Control (OAC) for CloudFront
    const originAccessControl = new aws.cloudfront.OriginAccessControl(
      "originAccessControl",
      {
        name: "S3 OriginAccessControl",
        signingBehavior: "always",
        signingProtocol: "sigv4",
        originAccessControlOriginType: "s3",
      },
      { parent: this }
    );

    // Attach a bucket policy to allow access only from CloudFront
    const bucketPolicy = new aws.s3.BucketPolicy(
      "bucketPolicy",
      {
        bucket: assetsOutputs.siteBucket.bucket,
        policy: assetsOutputs.siteBucket.bucket.apply((bucketName) =>
          JSON.stringify({
            Version: "2012-10-17",
            Statement: [
              {
                Effect: "Allow",
                Principal: {
                  Service: "cloudfront.amazonaws.com",
                },
                Action: "s3:GetObject",
                Resource: `arn:aws:s3:::${bucketName}/*`,
                Condition: {
                  StringEquals: {
                    "AWS:SourceArn": originAccessControl.arn,
                  },
                },
              },
            ],
          })
        ),
      },
      { parent: this }
    );

    // Create a KeyValueStore for route mappings
    this.kvStore = new aws.cloudfront.KeyValueStore(
      "route-mappings-store",
      {
        name: "route-mappings-store",
        comment: "Route mappings for HP Stuff site",
      },
      { parent: this }
    );

    // Create the routing function
    this.routingFunction = new aws.cloudfront.Function(
      "routingFunction",
      {
        name: "RoutingFunction",
        runtime: "cloudfront-js-2.0",
        code: fs.readFileSync(
          path.join(__dirname, "cf-routing-function.js"),
          "utf8"
        ),
        publish: true,
        keyValueStoreAssociations: [this.kvStore.arn],
      },
      { parent: this }
    );

    // Create API Gateway for dynamic routes
    const apiGateway = new aws.apigateway.RestApi(
      "hp-stuff-api",
      {
        name: "HP Stuff API",
        description: "API for HP Stuff dynamic routes",
      },
      { parent: this }
    );

    // Create Lambda role for API Gateway integration
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
                Service: ["lambda.amazonaws.com", "apigateway.amazonaws.com"],
              },
            },
          ],
        }),
      },
      { parent: this }
    );

    new aws.iam.RolePolicyAttachment(
      "lambda-s3-access",
      {
        role: lambdaRole.name,
        policyArn: "arn:aws:iam::aws:policy/AmazonS3ReadOnlyAccess",
      },
      { parent: this }
    );

    // Attach basic Lambda execution policy
    new aws.iam.RolePolicyAttachment(
      "lambda-basic-execution",
      {
        role: lambdaRole.name,
        policyArn:
          "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole",
      },
      { parent: this }
    );

    // Create a Lambda function for handling all dynamic routes
    const dynamicRoutesLambda = new aws.lambda.Function(
      "dynamic-routes-handler",
      {
        runtime: "nodejs22.x",
        role: lambdaRole.arn,
        handler: "api-gateway-handler.handler",
        code: new pulumi.asset.AssetArchive({
          ".": new pulumi.asset.FileArchive(
            path.join(__dirname, "../greenwood/.aws-output")
          ),
          "api-gateway-handler.js": new pulumi.asset.FileAsset(
            path.join(__dirname, "api-gateway-handler.js")
          ),
        }),
        timeout: 30,
        memorySize: 1024,
        environment: {
          variables: {
            NODE_ENV: "production",
            STATIC_BUCKET_NAME: assetsOutputs.siteBucket.bucket,
          },
        },
      },
      { parent: this }
    );

    // Create a catch-all resource and method for the API Gateway
    const apiResource = new aws.apigateway.Resource(
      "api-resource",
      {
        restApi: apiGateway.id,
        parentId: apiGateway.rootResourceId,
        pathPart: "{proxy+}",
      },
      { parent: this }
    );

    const apiMethod = new aws.apigateway.Method(
      "api-method",
      {
        restApi: apiGateway.id,
        resourceId: apiResource.id,
        httpMethod: "ANY",
        authorization: "NONE",
        requestParameters: {
          "method.request.path.proxy": true,
        },
      },
      { parent: this }
    );

    // Integrate the Lambda with the API Gateway
    const apiIntegration = new aws.apigateway.Integration(
      "api-integration",
      {
        restApi: apiGateway.id,
        resourceId: apiResource.id,
        httpMethod: apiMethod.httpMethod,
        integrationHttpMethod: "POST",
        type: "AWS_PROXY",
        uri: dynamicRoutesLambda.invokeArn,
      },
      { parent: this }
    );

    // Deploy the API Gateway
    const apiDeployment = new aws.apigateway.Deployment(
      "api-deployment",
      {
        restApi: apiGateway.id,
        // Ensure the deployment happens after the integration
        triggers: {
          redeployment: pulumi.interpolate`${apiMethod.id}${apiIntegration.id}`,
        },
      },
      { parent: this }
    );

    const apiStage = new aws.apigateway.Stage(
      "api-stage",
      {
        deployment: apiDeployment.id,
        restApi: apiGateway.id,
        stageName: "prod",
      },
      { parent: this }
    );

    // Allow Lambda to be invoked by API Gateway
    new aws.lambda.Permission(
      "api-gateway-lambda-permission",
      {
        action: "lambda:InvokeFunction",
        function: dynamicRoutesLambda.name,
        principal: "apigateway.amazonaws.com",
        sourceArn: pulumi.interpolate`${apiGateway.executionArn}/*/*`,
      },
      { parent: this }
    );

    if (this.certificateValidation) {
      this.cdn = new aws.cloudfront.Distribution(
        "site-cdn",
        {
          enabled: true,
          origins: [
            // API Gateway origin for all content
            {
              originId: "api-origin",
              domainName: pulumi.interpolate`${apiGateway.id}.execute-api.${aws.config.region}.amazonaws.com`,
              customOriginConfig: {
                httpPort: 80,
                httpsPort: 443,
                originProtocolPolicy: "https-only",
                originSslProtocols: ["TLSv1.2"],
              },
              originPath: "/prod",
            },
          ],
          // Default behavior for static content
          defaultCacheBehavior: {
            targetOriginId: "api-origin",
            viewerProtocolPolicy: "redirect-to-https",
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
              cookies: { forward: "all" },
              queryString: true,
              headers: [
                "Authorization",
                "Origin",
                "Content-Type",
                "x-original-uri",
                "x-route-context",
              ],
            },
            functionAssociations: [
              {
                eventType: "viewer-request",
                functionArn: this.routingFunction.arn,
              },
            ],
            minTtl: 0,
            defaultTtl: 0,
            maxTtl: 86400,
          },

          // not needed - let the function decide
          orderedCacheBehaviors: [],
          viewerCertificate: {
            acmCertificateArn: this.certificateValidation.certificateArn,
            sslSupportMethod: "sni-only",
            minimumProtocolVersion: "TLSv1.2_2021",
          },
          aliases: [config.domainName, `www.${config.domainName}`],
          defaultRootObject: "index.html",
          priceClass: "PriceClass_100",
          restrictions: {
            geoRestriction: {
              restrictionType: "none",
            },
          },
          customErrorResponses: [
            {
              errorCode: 404,
              responseCode: 404,
              responsePagePath: "/404.html",
            },
          ],
        },
        { parent: this }
      );
    }
  };

  protected setup = async (
    name: string,
    config: MainStackConfig,
    assetsOutputs: AssetsStackOutputs,
    opts?: pulumi.ComponentResourceOptions
  ) => {
    // Create AWS provider for us-east-1 (required for Lambda@Edge)
    const usEast1 = new aws.Provider(
      "hp-stuff-useast1",
      {
        profile: aws.config.profile,
        region: "us-east-1",
      },
      { parent: this }
    );

    // Get or create Route53 hosted zone
    await this.getR53Zone(config);

    // Create an ACM certificate
    this.setCertificate(config, usEast1);

    // Set up certificate validation
    this.setCertificateValidationDomains(config, usEast1);
    this.setCertificateValidation(config, usEast1);

    this.setCdn(config, assetsOutputs);

    if (this.cdn) {
      this.finalCdnUrl = this.cdn.domainName;

      // Use apply to handle the async result

      if (this.hostedZone) {
        const dnsRecord = new aws.route53.Record(
          "dns-record",
          {
            zoneId: pulumi
              .output(this.hostedZone)
              .apply((hz) =>
                config.createHostedZone
                  ? (hz as aws.route53.Zone).zoneId
                  : (hz as aws.route53.GetZoneResult).zoneId
              ),
            name: config.domainName,
            type: aws.route53.RecordType.A,
            aliases: [
              {
                name: this.cdn.domainName,
                zoneId: this.cdn.hostedZoneId,
                evaluateTargetHealth: true,
              },
            ],
          },
          { parent: this }
        );

        // Create www alias record if this is the root domain
        const isRootDomain = config.domainName === config.rootDomainName;
        const wwwDomainName = isRootDomain
          ? `www.${config.rootDomainName}`
          : `www.${config.domainName}`;

        const wwwDnsRecord = new aws.route53.Record(
          "www-dns-record",
          {
            zoneId: pulumi
              .output(this.hostedZone)
              .apply((hz) =>
                config.createHostedZone
                  ? (hz as aws.route53.Zone).zoneId
                  : (hz as aws.route53.GetZoneResult).zoneId
              ),
            name: wwwDomainName,
            records: [dnsRecord.fqdn],
            type: aws.route53.RecordType.CNAME,
            weightedRoutingPolicies: [
              {
                weight: 90,
              },
            ],
            ttl: 1,
            setIdentifier: "live",
          },
          { parent: this }
        );

        this.registerOutputs({
          cdnUrl: this.cdn.domainName,
          finalCdnUrl: this.finalCdnUrl,
          kvStoreId: this.kvStore?.id,
        });
      }
    }
  };

  protected getCdnDomainName = () => {
    if (this.cdn) {
      return this.cdn.domainName;
    } else return pulumi.Output.create<string>("");
  };
  constructor(
    name: string,
    config: MainStackConfig,
    assetsOutputs: AssetsStackOutputs,
    opts?: pulumi.ComponentResourceOptions
  ) {
    super("hp-stuff:MainStack", name, {}, opts);
    void this.setup(name, config, assetsOutputs, opts);
    this.outputs = {
      cdnUrl: this.getCdnDomainName(),
      finalCdnUrl: this.finalCdnUrl,
    };
  }
}
