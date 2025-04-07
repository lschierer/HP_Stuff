# HP Stuff Infrastructure

This package contains the AWS infrastructure code for deploying the HP Stuff website using SST v3 and the Greenwood AWS adapter plugin.

## Prerequisites

- AWS CLI configured with appropriate credentials
- Node.js v18 or later
- pnpm (or npm/yarn)

## Getting Started

To deploy the site with the AWS adapter:

```bash
# From the project root
just deploy
```

This will:
1. Run the parse scripts to generate necessary content
2. Build the Greenwood site with the AWS adapter enabled
3. Deploy the infrastructure using SST
4. Upload the site to S3 and configure CloudFront

## How It Works

The infrastructure is defined using SST v3, which is built on top of AWS CDK. The main components are:

- `sst.config.ts`: The entry point for SST configuration
- `stacks/HPStuffSite.ts`: Defines the AWS resources for hosting the site

The deployment process:

1. The Greenwood site is built with the AWS adapter plugin
2. SST creates/updates the AWS resources (S3 bucket, CloudFront distribution)
3. The built site is uploaded to S3 using CDK's BucketDeployment construct
4. CloudFront distribution is configured to serve the site

## Key Changes in SST v3

SST v3 has several changes from v2:

1. The `StaticSite` construct is no longer used - instead we use CDK's `BucketDeployment`
2. Stack functions now receive `{ stack }` as a parameter instead of a `StackContext`
3. The build process is separated from the deployment process

## Environment Variables

The following environment variables are used:

- `SITE_URL`: The CloudFront domain name
- `S3_BUCKET_NAME`: The name of the S3 bucket
- `CLOUDFRONT_DISTRIBUTION_ID`: The ID of the CloudFront distribution

## Integration with Greenwood

The Greenwood AWS adapter plugin (`@greenwood/plugin-adapter-aws`) is configured in the Greenwood config file to use the S3 bucket and CloudFront distribution created by SST.
