#!/usr/bin/env bash

PWD=$(pwd)

# Check dist/filescreated directory
if [ -d "$PWD"/dist/filescreated ] && [ "$(ls -A "$PWD"/dist/filescreated/*.txt 2> /dev/null)" ]; then
  for f in "$PWD"/dist/filescreated/*.txt; do
    echo "cleaning files listed in $f"
    cat "$f" | xargs -I{} rm "{}"
    rm $f
  done
else
  echo "No files to clean in dist/filescreated"
fi

# Check assets/filescreated directory
if [ -d "$PWD"/assets ] && [ -d "$PWD"/assets/filescreated ] && [ "$(ls -A "$PWD"/assets/filescreated/*.txt 2> /dev/null)" ]; then
  for f in "$PWD"/assets/filescreated/*.txt; do
    echo "cleaning files listed in $f"
    cat "$f" | xargs -I{} rm "{}"
    rm $f
  done
else
  echo "No files to clean in assets/filescreated"
fi

# Check pages/filescreated directory
if [ -d "$PWD"/pages/filescreated ] && [ "$(ls -A "$PWD"/pages/filescreated/*.txt 2> /dev/null)" ]; then
  for f in "$PWD"/pages/filescreated/*.txt; do
    echo "cleaning files listed in $f"
    cat "$f" | xargs -I{} rm "{}"
    rm $f
  done
else
  echo "No files to clean in pages/filescreated"
fi

echo "Cleaning empty files and directories"
find . -path './**/.gitkeep' -prune -o -empty -print -delete

echo "Cleaning dist"
rm -rf "$PWD"/dist
echo "Cleaning Greenwood's pages dir"
find ../greenwood/src/pages -name '*.md'  -print -delete
