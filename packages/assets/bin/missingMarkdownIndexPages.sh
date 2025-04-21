#!/usr/bin/env bash

find pages -type d -not -path "pages/filescreated" -not -path "pages/filescreated/*" | while read -r line; do
  if [ ! -e "$line/index.md" ]; then
    echo "---" > "$line/index.md"
    BASE=$(basename "$line")
    echo "title: >-" >> "$line/index.md"
    echo "  $BASE" >> "$line/index.md"
    echo "author: Luke Schierer" >> "$line/index.md"
    echo "layout: standard" >> "$line/index.md"
    echo "---" >> "$line/index.md"
    echo "\n" >> "$line/index.md"
    echo "<directory-index></directory-index>" >> "$line/index.md"
    echo "$line/index.md" >> pages/filescreated/scriptedIndexes.txt
  fi
done
