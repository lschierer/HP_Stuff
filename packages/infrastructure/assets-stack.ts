import * as aws from "@pulumi/aws";
import * as pulumi from "@pulumi/pulumi";
import path from "path";
import mime from "mime";
import { walkDirectory } from "./utils";

export interface AssetsStackOutputs {
  siteBucket: aws.s3.Bucket;
  bucketName: pulumi.Output<string>;
  bucketRegionalDomainName: pulumi.Output<string>;
  bucketArn: pulumi.Output<string>;
}

export class AssetsStack extends pulumi.ComponentResource {
  public readonly outputs: AssetsStackOutputs;

  constructor(name: string, opts?: pulumi.ComponentResourceOptions) {
    super("hp-stuff:AssetsStack", name, {}, opts);

    // Create an S3 bucket to host the static website
    const siteBucket = new aws.s3.Bucket(
      `${name}-site-bucket`,
      {
        website: {
          indexDocument: "index.html",
          errorDocument: "error.html",
        },
        // Add ACL to ensure the bucket is accessible
        acl: "private",
      },
      { parent: this }
    );

    // Upload the website files to the S3 bucket
    const siteDir = "../greenwood/public";

    pulumi.output(walkDirectory(siteDir)).apply((files) => {
      for (const filePath of files.sort()) {
        const relativeKey = path
          .relative(siteDir, filePath)
          .replace(/\\/g, "/");
        new aws.s3.BucketObject(
          relativeKey,
          {
            bucket: siteBucket,
            key: relativeKey,
            source: new pulumi.asset.FileAsset(filePath),
            contentType: mime.getType(filePath) || undefined,
            // Ensure objects are readable
            acl: "private",
          },
          { parent: this }
        );
      }
    });

    this.outputs = {
      siteBucket,
      bucketName: siteBucket.bucket,
      bucketRegionalDomainName: siteBucket.bucketRegionalDomainName,
      bucketArn: siteBucket.arn,
    };

    this.registerOutputs({
      bucketName: siteBucket.bucket,
      bucketRegionalDomainName: siteBucket.bucketRegionalDomainName,
      bucketArn: siteBucket.arn,
    });
  }
}
