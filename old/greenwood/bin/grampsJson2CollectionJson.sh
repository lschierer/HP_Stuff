#!/usr/bin/env bash -x

export JQ=`which jq`;

export CWD=`pwd`;
export full="$CWD/src/assets/potter_universe.json"

export target="$CWD/src/assets/gedcom/";

if [ -d $target ]; then
  rm -rf $target
fi
mkdir -p $target

cat $full | $JQ -n 'inputs | ."_class"' | sort -u  | tr -d '"' |sort | while read line; do

if [[ "$line" == 'Person' ]]; then
  export targetfile=$target`echo people | tr '[:upper:]' '[:lower:]'`.json
elif [[ "$line" == 'Family' ]]; then
  export targetfile=$target`echo families | tr '[:upper:]' '[:lower:]'`.json
else
  export targetfile=$target`echo $line | tr '[:upper:]' '[:lower:]'`s.json
fi
export field=`echo $line | tr -d '[:blank:]'`

cat $full | $JQ -n "[inputs | select(.\"_class\" == \"$field\") | with_entries(if .key == \"gramps_id\" then .key = \"id\" else . end) ]" > $targetfile

done

gsed -i -E '/handle/{p;s/handle/id/;}' "$CWD/src/assets/gedcom/tags.json"
