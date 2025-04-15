#!/bin/bash

while getopts ":o:" opt; do
  case "$opt" in
    o)
      OUTPUTDIR="$OPTARG"
      shift 2
      continue
      ;;
    \?)
      echo "Unrecognized option '$1'"
      exit 2
      ;;
    :)
      echo "Option -$OPTARG requires an argument." >&2
      exit 1
      ;;
  esac
done

shift $((OPTIND - 1))

if [ -z OUTPUTDIR ]; then
  echo '-o is required' >&2
  exit 3
elif [ ! -d "$OUTPUTDIR" ]; then
  echo "OUTPUTDIR '$OUTPUTDIR' must exist"
  echo $(pwd)
  exit 4
else
  echo "OUTPUTDIR is '$OUTPUTDIR'"
fi

export YQ=$(which yq)

rm -rf "$OUTPUTDIR/history"
mkdir "$OUTPUTDIR/history"

find ./history -type f -iname '*.yaml' -print0 | while read -r -d '' file; do
  j=$(basename "$file" .yaml)
  $YQ eval -o=json "$file" > "$OUTPUTDIR/history/$j.json"
done
