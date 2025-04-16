#!/bin/bash -x

find packages/greenwood/src/pages/Harrypedia/people -name '*.md' | while read src; do
  dest="packages/assets/pages${src#packages/greenwood/src/pages}"
  mkdir -p "$(dirname "$dest")"
  awk 'BEGIN{skip=0} /^---/ {skip = 1 - skip; next} !skip {print}' "$src" > "$dest"
  if grep -qv '[^[:space:]]' "$dest" || grep -qv '^### Analysis\s*$' "$dest" && ! grep -q '[^[:space:]]' <(grep -v '^### Analysis\s*$' "$dest"); then
    echo "🗑️  Deleting placeholder: $dest"
    rm "$dest"
  fi
done
