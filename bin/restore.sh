#!/bin/bash -x
git log --diff-filter=D --pretty=format:"%H %P" --name-only -- \
  packages/greenwood/src/pages/Harrypedia/people/**/*.md |
awk '
  NF==2 { commit=$1; parent=$2 }
  NF==1 && /\.md$/ {
    print commit, parent, $1
  }
' | while read commit parent path; do
  mkdir -p "$(dirname "$path")"
  echo "Restoring $path from before commit $commit"
  git show "$parent:$path" > "$path"
done
