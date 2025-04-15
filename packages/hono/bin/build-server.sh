#!/usr/bin/env bash
set -euo pipefail

export PWD=`pwd`;

echo "🔧 Building global styles..."
./bin/build-css.sh

echo "🧠 Building client-side scripts..."
pnpm build:client

echo "🗂️  Preprocessing static HTML..."
./bin/build-Html.sh

pnpm tsx "$PWD/src/scripts/build-sidebar.ts" || exit 1

echo "⚙️  Bundling Lambda server code with esbuild..."

pnpm tsx esbuild.config.mjs

echo "📦 Preparing lambda-dist for deployment..."
tsx src/scripts/prepare-lambda-package.ts

echo '✅ Build complete. Lambda package is ready at ./lambda-dist'
