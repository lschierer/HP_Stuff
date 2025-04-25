#!/usr/bin/env node

/**
 * This script updates the CloudFront KeyValueStore with route mappings
 * It should be run after the graph.json is generated and before deployment
 */

const { parseGraphJson, generateKvConfig } = require('./graph-parser');
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Parse command line arguments
const args = process.argv.slice(2);
const kvStoreId = args[0];

if (!kvStoreId) {
  console.error('Usage: node update-kv-store.js <kv-store-id>');
  process.exit(1);
}

// Paths
const greenwoodDir = path.resolve(__dirname, '../greenwood');
const graphJsonPath = path.join(greenwoodDir, 'public/graph.json');
const kvConfigPath = path.join(__dirname, 'kv-config.json');

// Generate KV config
console.log(`Parsing graph.json from ${graphJsonPath}`);
const routeMappings = parseGraphJson(graphJsonPath);
generateKvConfig(routeMappings, kvConfigPath);

// Update the KV store using AWS CLI
console.log(`Updating CloudFront KeyValueStore ${kvStoreId}`);

// CloudFront KV store has a limit of 50 items per batch, so we need to chunk
const kvItems = JSON.parse(fs.readFileSync(kvConfigPath, 'utf8'));
const chunkSize = 50;
const chunks = Object.entries(kvItems).reduce((acc, [key, value], i) => {
  const chunkIndex = Math.floor(i / chunkSize);
  if (!acc[chunkIndex]) acc[chunkIndex] = {};
  acc[chunkIndex][key] = value;
  return acc;
}, []);

// Update each chunk
chunks.forEach((chunk, i) => {
  console.log(`Updating chunk ${i+1} of ${chunks.length} (${Object.keys(chunk).length} items)`);
  
  // Create a temporary file for this chunk
  const chunkPath = path.join(__dirname, `kv-config-chunk-${i}.json`);
  fs.writeFileSync(chunkPath, JSON.stringify(chunk, null, 2));
  
  try {
    // Use AWS CLI to update the KV store
    execSync(`aws cloudfront put-key-value-store-items --key-value-store-id ${kvStoreId} --items file://${chunkPath}`, 
      { stdio: 'inherit' });
    console.log(`Successfully updated chunk ${i+1}`);
  } catch (error) {
    console.error(`Error updating chunk ${i+1}:`, error);
  } finally {
    // Clean up the temporary file
    fs.unlinkSync(chunkPath);
  }
});

console.log('KeyValueStore update complete');
