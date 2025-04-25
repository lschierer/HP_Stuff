#!/usr/bin/env node --import tsx

/**
 * This script updates the CloudFront KeyValueStore with route mappings
 * It should be run after the graph.json is generated and before deployment
 */

import { parseGraphJson, generateKvConfig } from "./graph-parser.js";
import { exec } from "child_process";
import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";
import { dirname } from "path";

// Define __dirname equivalent for ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Promisify exec
function execPromise(
  command: string
): Promise<{ stdout: string; stderr: string }> {
  return new Promise((resolve, reject) => {
    exec(command, (error, stdout, stderr) => {
      if (error) {
        reject(error);
        return;
      }
      resolve({ stdout, stderr });
    });
  });
}

async function main() {
  // Parse command line arguments
  const args = process.argv.slice(2);
  const kvStoreId = args[0];

  if (!kvStoreId) {
    console.error("Usage: npm run update-kv -- <kv-store-id>");
    process.exit(1);
  }

  // Paths
  const greenwoodDir = path.resolve(__dirname, "../greenwood");
  const graphJsonPath = path.join(greenwoodDir, "public/graph.json");
  const kvConfigPath = path.join(__dirname, "kv-config.json");

  try {
    // Generate KV config
    console.log(`Parsing graph.json from ${graphJsonPath}`);
    const routeMappings = parseGraphJson(graphJsonPath);
    generateKvConfig(routeMappings, kvConfigPath);

    // Update the KV store using AWS CLI
    console.log(`Updating CloudFront KeyValueStore ${kvStoreId}`);

    // CloudFront KV store has a limit of 50 items per batch, so we need to chunk
    const kvItems = JSON.parse(fs.readFileSync(kvConfigPath, "utf8"));
    const chunkSize = 50;
    const chunks: Record<string, string>[] = [];

    // Create chunks of KV items
    Object.entries(kvItems).forEach(([key, value], i) => {
      const chunkIndex = Math.floor(i / chunkSize);
      if (!chunks[chunkIndex]) chunks[chunkIndex] = {};
      chunks[chunkIndex][key] = value;
    });

    // Update each chunk
    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i];
      console.log(
        `Updating chunk ${i + 1} of ${chunks.length} (${Object.keys(chunk).length} items)`
      );

      // Create a temporary file for this chunk
      const chunkPath = path.join(__dirname, `kv-config-chunk-${i}.json`);
      fs.writeFileSync(chunkPath, JSON.stringify(chunk, null, 2));

      try {
        // Use AWS CLI to update the KV store
        const { stdout, stderr } = await execPromise(
          `aws cloudfront put-key-value-store-items --key-value-store-id ${kvStoreId} --items file://${chunkPath}`
        );

        if (stdout) console.log(stdout);
        if (stderr) console.error(stderr);

        console.log(`Successfully updated chunk ${i + 1}`);
      } catch (error) {
        console.error(`Error updating chunk ${i + 1}:`, error);
      } finally {
        // Clean up the temporary file
        fs.unlinkSync(chunkPath);
      }
    }

    console.log("KeyValueStore update complete");
  } catch (error) {
    console.error("Error updating KeyValueStore:", error);
    process.exit(1);
  }
}

main().catch(console.error);
