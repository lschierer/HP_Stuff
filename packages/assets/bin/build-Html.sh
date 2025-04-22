#!/usr/bin/env bash

export PWD=$(pwd)

export STEP=1

mkdir -p ./dist/assets ./dist/styles

if [ ! -e "./src/shared/sidebar-routes.json" ]; then
  echo '{}' > ./src/shared/sidebar-routes.json
fi

./bin/copyHPNOFP -i node_modules/hpnofp-ebook.git/src/OEBPS/ -o "./pages/FanFiction/" -a ./dist/assets -s ./dist/styles

#copy the directory structure
find ${PWD}/pages -type d | gsed -E "s#${PWD}/pages(.*)#${PWD}/dist\1#" | xargs -I{} mkdir -p {} || exit $STEP
STEP=$((STEP + 1))

cat potter_universe.json | jq -sS --indent 2 -M '.' > ${PWD}/dist/potter_universe.json || exit $STEP
STEP=$((STEP + 1))

pnpm tsx ${PWD}/src/scripts/gedcomExportToHtml.ts || exit $STEP
STEP=$((STEP + 1))

# Copy only .html files that are not .fragment.html files
find ${PWD}/pages -name "*.html" -not -name "*.fragment.html" | while read file; do
  dest=$(echo "$file" | gsed -E "s#${PWD}/pages(.*)#${PWD}/dist\1#") || exit $STEP
  STEP=$((STEP + 1))
  cp "$file" "$dest"
done || exit $STEP
STEP=$((STEP + 1))

rsync -amv --exclude='styles' --exclude='routes' --exclude='filescreated' --exclude='assets' dist/ ../greenwood/src/pages/ --delete --delete-excluded

rsync -av dist/styles/ ../greenwood/src/styles/

rsync -av dist/assets/ ../greenwood/src/assets/

#pnpm tsx "$PWD/src/scripts/build-sidebar.ts" || exit 3
#
#find ./pages -type d | while read -r dir; do
#  if [ ! -e "$dir/index.md" ] && [ ! -e "$dir/index.html" ]; then
#    echo "$dir/index.md" >> dist/generated_index_files.txt
#
#    # Only add to .gitignore if it's not already there
#    if [ -e "$dir/.gitignore" ]; then
#      if ! grep -q "^index.md$" "$dir/.gitignore"; then
#        echo "index.md" >> "$dir/.gitignore"
#      fi
#    else
#      echo "index.md" >> "$dir/.gitignore"
#    fi
#    DIRNAME=`basename "$dir"`;
#    echo '---' > "$dir/index.md"
#    echo "title: >-" >> "$dir/index.md"
#    /bin/echo -n '  ' >> "$dir/index.md"
#    echo "$DIRNAME" >> "$dir/index.md"
#    echo "layout: standard" >> "$dir/index.md"
#    echo '---' >> "$dir/index.md"
#    echo >> "$dir/index.md"
#    echo "<directory-index></directory-index>" >> "$dir/index.md"
#  fi
#done
