#!/usr/bin/env bash
set -euo pipefail

export PWD=`pwd`;

echo "🔧 Building global styles..."
./bin/build-css.sh

echo "🧠 Building client-side scripts..."
pnpm build:client

echo "🗂️  Preprocessing static HTML..."
./bin/build-Html.sh

pnpm dotenvx run -f .env.production -- tsx "$PWD/src/scripts/build-sidebar.ts" || exit 1

echo "⚙️  Bundling Lambda server code with esbuild..."

pnpm dotenvx run -f .env.production -- esbuild src/server/index.ts \
  --bundle \
  --platform=node \
  --target=node22 \
  --format=esm \
  --external:fsevents \
  --external:dotenv \
  --define:process.env.SITETITLE="\"Luke's HP Fan Site\"" \
  --define:process.env.TOPLEVELSECTIONS="\"Harrypedia,Fan Fiction,Searches,Bookmarks\"" \
  --define:process.env.BRANCH="\"customToolchain\"" \
  --define:process.env.PRIVACYPOLICY="false" \
  --define:process.env.REPO="\"file://../../\"" \
  --define:process.env.AUTHORS="\"git\"" \
  --define:process.env.NODE_ENV="\"production\"" \
  --outfile=dist/server/index.js

echo "📦 Preparing lambda-dist for deployment..."
tsx src/scripts/prepare-lambda-package.ts

echo '✅ Build complete. Lambda package is ready at ./lambda-dist'
