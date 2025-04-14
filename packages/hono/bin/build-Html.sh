#!/usr/bin/env bash

export PWD=`pwd`;

rsync -av --include='*/' --include='*.html' --exclude='*' ${PWD}/src/ ${PWD}/dist/ || exit 1

pnpm tsx ${PWD}/src/scripts/gedcomExportToHtml.ts || exit 2

pnpm tsx "$PWD/src/scripts/build-sidebar.ts" || exit 3
