# HP Stuff Infrastructure

This package contains the infrastructure code for deploying the HP Stuff website to AWS.

## New CloudFront Routing Approach

To stay below CloudFront's route limits, we've implemented a new approach:

1. A CloudFront KeyValueStore contains mappings from the site's routes to their corresponding API Gateway paths
2. A CloudFront Function uses this KeyValueStore to route requests:
   - For static routes, it appends `index.html` to directory paths
   - For dynamic routes, it rewrites the request to the API Gateway
3. A single API Gateway with a Lambda integration handles all dynamic routes
4. The Lambda function loads the appropriate handler based on the request path

## Deployment Process

1. Build the site with Greenwood
   ```
   cd ../greenwood
   just build
   ```

2. Parse the `graph.json` file to generate route mappings
   ```
   npm run parse-graph
   ```

3. Deploy the infrastructure
   ```
   npm run deploy
   ```

4. Update the CloudFront KeyValueStore with the route mappings
   ```
   npm run update-kv -- <kv-store-id>
   ```
   Note: The KV store ID is output by the Pulumi deployment.

## Files

- `cf-routing-function.js` - CloudFront Function for routing requests
- `graph-parser.ts` - Parses the `graph.json` file to generate route mappings
- `api-gateway-handler.js` - Lambda function for handling all dynamic routes
- `update-kv-store.js` - Script for updating the CloudFront KeyValueStore
- `main-stack.ts` - Main Pulumi stack for deploying the infrastructure
