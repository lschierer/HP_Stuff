#!/usr/bin/env bash

export NPM=`which npm`
export NPX=`which npx`
export TEMPDIR=`mktemp -d`
export JUST="${NPX} just"
export CWD=`pwd`

echo "{\"CWD\":\"./\"}" > $CWD/src/lib/root.json

#this will set up a collection with
#json files for both the full db
#and optimized files for individual pages
$NPX tsx  $CWD/bin/gramps2Json.ts

rm -rf ${TEMPDIR}
