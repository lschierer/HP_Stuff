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

export JQ=$(which jq)

export CWD=$(pwd)
export full="$CWD/potter_universe.json"

export target="$OUTPUTDIR/gedcom/"

if [ -d $target ]; then
  rm -rf $target
fi
mkdir $target

cat $full | $JQ -n 'inputs | ."_class"' | sort -u | tr -d '"' | sort | while read line; do

  if [[ "$line" == 'Person' ]]; then
    export targetfile=$target$(echo people | tr '[:upper:]' '[:lower:]').json
  elif [[ "$line" == 'Family' ]]; then
    export targetfile=$target$(echo families | tr '[:upper:]' '[:lower:]').json
  else
    export targetfile=$target$(echo $line | tr '[:upper:]' '[:lower:]')s.json
  fi
  export field=$(echo $line | tr -d '[:blank:]')

  cat $full | $JQ -n "[inputs | select(.\"_class\" == \"$field\")  ]" > $targetfile

done
