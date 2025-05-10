#!/usr/bin/env bash

if [ ! -d pages/filescreated ]; then
  mkdir pages/filescreated
fi
find dist/pages -type d -not -path "pages/filescreated" -not -path "pages/filescreated/*" | while read -r line; do
  if [ ! -e "$line/index.md" ]; then
    echo "---" > "$line/index.md"
    BASE=$(basename "$line")
    echo "title: >-" >> "$line/index.md"
    echo "  $BASE" >> "$line/index.md"
    echo "author: Luke Schierer" >> "$line/index.md"
    echo "layout: standard" >> "$line/index.md"
    echo "imports: " >> "$line/index.md"
    echo "  - /components/DirectoryIndex.ts type=\"module\"" >> "$line/index.md"
    echo "---" >> "$line/index.md"
    echo "" >> "$line/index.md"
    WEBDIR=`echo "$line" | gsed -E 's#pages(.+)#\1/#'`
    echo "<directory-index directory=\"$WEBDIR\"></directory-index>" >> "$line/index.md"
  fi
done
