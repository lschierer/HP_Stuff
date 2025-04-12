#!/usr/bin/env bash

export PWD=`pwd`;

pnpm postcss  -d $PWD/dist/styles/ src/styles/*.css || exit 2;
