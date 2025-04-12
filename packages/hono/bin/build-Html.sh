#!/usr/bin/env bash

export PWD=`pwd`;


rsync -av --include='*/' --include='*.html' --exclude='*' ${PWD}/src/ ${PWD}/dist/

pnpm tsx ${PWD}/src/scripts/gedcomExportToHtml.ts;
