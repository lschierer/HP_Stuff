import * as aws from "@pulumi/aws";
import * as pulumi from "@pulumi/pulumi";
import { type RoutesResult } from "./types";
import { integrateRoutesAndApis } from "./routes";
import { type AssetsStackOutputs } from "./assets-stack";

export interface MainStackConfig {
  domainName: string;
  rootDomainName: string;
  createHostedZone: boolean;
}

export class MainStack extends pulumi.ComponentResource {
  private hostedZone: aws.route53.Zone | aws.route53.GetZoneResult | null =
    null;

  private certificate: aws.acm.Certificate | null = null;

  private certificateValidationDomain: aws.route53.Record | null = null;
  private wwwCertificateValidationDomain: aws.route53.Record | null = null;

  private certificateValidation: aws.acm.CertificateValidation | null = null;

  private cdn: aws.cloudfront.Distribution | null = null;

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
    assetsOutputs: AssetsStackOutputs,
    oai: aws.cloudfront.OriginAccessIdentity
  ) => {
    // Create a CloudFront distribution
    // Use a consistent origin ID
    const originId = "s3-origin";
    if (this.certificateValidation) {
      this.cdn = new aws.cloudfront.Distribution(
        "site-cdn",
        {
          enabled: true,
          origins: [
            {
              domainName: assetsOutputs.bucketRegionalDomainName,
              originId: originId,
              s3OriginConfig: {
                originAccessIdentity: oai.cloudfrontAccessIdentityPath,
              },
            },
          ],
          defaultCacheBehavior: {
            targetOriginId: originId,
            viewerProtocolPolicy: "redirect-to-https",
            allowedMethods: ["GET", "HEAD"],
            cachedMethods: ["GET", "HEAD"],
            forwardedValues: {
              cookies: { forward: "none" },
              queryString: false,
            },
            functionAssociations: [],
          },
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

    // Set up CloudFront OAI
    const oai = new aws.cloudfront.OriginAccessIdentity(
      "hp-stuff-cdn-oai",
      {
        comment: "Allow CloudFront to access S3",
      },
      { parent: this }
    );

    // Set up bucket policy with more explicit permissions
    const bucketPolicy = new aws.s3.BucketPolicy(
      "hp-stuff-bucket-policy",
      {
        bucket: assetsOutputs.bucketName,
        policy: pulumi
          .all([assetsOutputs.bucketName, oai.iamArn])
          .apply(([bucketName, oaiArn]) =>
            JSON.stringify({
              Version: "2012-10-17",
              Statement: [
                {
                  Sid: "1",
                  Effect: "Allow",
                  Principal: {
                    AWS: oaiArn,
                  },
                  Action: "s3:GetObject",
                  Resource: `arn:aws:s3:::${bucketName}/*`,
                },
              ],
            })
          ),
      },
      { parent: this }
    );

    // Log the bucket policy for debugging
    pulumi
      .all([assetsOutputs.bucketName, oai.iamArn])
      .apply(([bucketName, oaiArn]) => {
        console.log(`Bucket: ${bucketName}, OAI ARN: ${oaiArn}`);
      });

    // Get or create Route53 hosted zone
    await this.getR53Zone(config);

    // Create an ACM certificate
    this.setCertificate(config, usEast1);

    // Set up certificate validation
    this.setCertificateValidationDomains(config, usEast1);
    this.setCertificateValidation(config, usEast1);

    this.setCdn(config, assetsOutputs, oai);

    if (this.cdn) {
      const routesResult = integrateRoutesAndApis(
        assetsOutputs.siteBucket,
        this.cdn,
        usEast1
      );

      // Add the CloudFront function to the default cache behavior
      if (Array.isArray(this.cdn.defaultCacheBehavior.functionAssociations)) {
        this.cdn.defaultCacheBehavior.functionAssociations.push({
          eventType: "viewer-request",
          functionArn: routesResult.cfFunction.arn,
        });
      }

      this.finalCdnUrl = this.cdn.domainName;

      // Use apply to handle the async result
      const cacheBehaviors = routesResult.cacheBehaviors;
      const cfFunction = routesResult.cfFunction;

      if (cacheBehaviors.length > 0) {
        this.cdn.defaultCacheBehavior.viewerProtocolPolicy =
          pulumi.Output.create<string>("redirect-to-https");
      }

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
