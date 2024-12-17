#!/usr/bin/env bash -x

export YQ=`which yq`;

rm -rf ./src/content/history;
mkdir ./src/content/history;

find ./src/assets/history -type f -iname '*.yaml' -print0 | while read -r -d '' file; do
  j=`basename "$file" .yaml`;
  $YQ eval -o=json "$file" > "./src/content/history/$j.json"
done
