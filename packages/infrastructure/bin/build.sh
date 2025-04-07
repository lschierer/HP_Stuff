#!/bin/bash

# Exit on error
set -e

# Get the directory of this script
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
INFRA_DIR="$(dirname "$SCRIPT_DIR")"
PROJECT_ROOT="$(dirname "$(dirname "$INFRA_DIR")")"
GREENWOOD_DIR="$PROJECT_ROOT/packages/greenwood"

pnpm exec quicktype "$GREENWOOD_DIR/.greenwood/graph.json -l typescript-zod > graphTypes.ts";
gsed -i -E 's#Schema##' graphTypes.ts

pnpm exec quicktype "$GREENWOOD_DIR/.greenwood/manifest.json -l typescript-zod > manifestTypes.ts";
gsed -i -E 's#Schema##' manifestTypes.ts
