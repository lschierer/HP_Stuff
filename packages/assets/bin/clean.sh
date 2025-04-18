#!/usr/bin/env bash

PWD=$(pwd)

for f in "$PWD"/dist/filescreated/*.txt; do
  echo "cleaning files listed in $f"
  cat "$f" | xargs -I{} rm "{}"
  rm $f
done

for f in "$PWD"/pages/filescreated/*.txt; do
  echo "cleaning files listed in $f"
  cat "$f" | xargs -I{} rm "{}"
  rm $f
done

echo "Cleaning empty files and directories"
find . -path './**/.gitkeep' -prune -o -empty -print -delete

echo "Cleaning dist"
rm -rf "$PWD"/dist
