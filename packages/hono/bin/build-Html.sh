#!/usr/bin/env bash

export PWD=`pwd`;

rsync -av --include='*/' --include='*.html' --exclude='*' ${PWD}/src/ ${PWD}/dist/ || exit 1

pnpm tsx ${PWD}/src/scripts/gedcomExportToHtml.ts || exit 2

pnpm tsx "$PWD/src/scripts/build-sidebar.ts" || exit 3

find ./src/Pages -type d | while read -r dir; do
  if [ ! -e "$dir/index.md" ] && [ ! -e "$dir/index.html" ]; then
    echo "$dir/index.md" >> dist/generated_index_files.txt

    # Only add to .gitignore if it's not already there
    if [ -e "$dir/.gitignore" ]; then
      if ! grep -q "^index.md$" "$dir/.gitignore"; then
        echo "index.md" >> "$dir/.gitignore"
      fi
    else
      echo "index.md" >> "$dir/.gitignore"
    fi
    DIRNAME=`basename "$dir"`;
    echo '---' > "$dir/index.md"
    echo "title: >-" >> "$dir/index.md"
    /bin/echo -n '  ' >> "$dir/index.md"
    echo "$DIRNAME" >> "$dir/index.md"
    echo "layout: standard" >> "$dir/index.md"
    echo '---' >> "$dir/index.md"
    echo >> "$dir/index.md"
    echo "<directory-index></directory-index>" >> "$dir/index.md"
  fi
done
