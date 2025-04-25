#!/usr/bin/env node --import tsx

/**
 * This script updates the CloudFront KeyValueStore with route mappings
 * It should be run after the graph.json is generated and before deployment
 */

import { parseGraphJson, generateKvConfig } from "./graph-parser";
import { exec } from "child_process";
import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";
import { dirname } from "path";
import {
  CloudFrontKeyValueStoreClient,
  PutKeyCommand,
} from "@aws-sdk/client-cloudfront-keyvaluestore";
import "@aws-sdk/signature-v4-crt";

// Define __dirname equivalent for ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function main() {
  // Parse command line arguments
  const args = process.argv.slice(2);
  const kvStoreId = args[0];

  if (!kvStoreId) {
    console.error("Usage: npm run update-kv -- <kv-store-id>");
    process.exit(1);
  } else {
    console.log(`kvStoreId is ${kvStoreId}`);
  }

  // Paths
  const greenwoodDir = path.resolve(__dirname, "../greenwood");
  const graphJsonPath = path.join(greenwoodDir, "public/graph.json");
  const kvConfigPath = path.join(__dirname, "kv-config.json");

  try {
    // Generate KV config
    console.log(`Parsing graph.json from ${graphJsonPath}`);

    // Update the KV store using AWS CLI
    console.log(`Updating CloudFront KeyValueStore ${kvStoreId}`);

    // CloudFront KV store has a limit of 50 items per batch, so we need to chunk
    const routeMappings = parseGraphJson(kvConfigPath);
    const client = new CloudFrontKeyValueStoreClient({
      region: "us-east-2",
    });
    let etag = "E3UN6WX5RRO2AG";
    for (const [key, value] of routeMappings) {
      const input = {
        // PutKeyRequest
        Key: key,
        Value: JSON.stringify(value),
        KvsARN:
          "arn:aws:cloudfront::699040795025:key-value-store/b68c5b73-702c-41cb-8f54-3df5c67a40b3", // required
        IfMatch: etag, // required
      };
      const command = new PutKeyCommand(input);
      const response = await client.send(command);
      if (response.ETag) {
        etag = response.ETag;
      }
    }

    console.log("KeyValueStore update complete");
  } catch (error) {
    console.error("Error updating KeyValueStore:", error);
    process.exit(1);
  }
}

main().catch(console.error);
