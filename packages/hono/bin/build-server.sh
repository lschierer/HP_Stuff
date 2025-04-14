#!/usr/bin/env bash

export PWD=`pwd`;

pnpm tsx "$PWD/src/scripts/build-sidebar.ts" || exit 1

pnpm tsc -p . || exit 2

pnpm tsc-alias || exit 3
