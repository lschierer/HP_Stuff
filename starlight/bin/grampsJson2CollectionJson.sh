#!/usr/bin/env bash -x

export JQ=`which jq`;

export CWD=`pwd`;
export full="$CWD/src/assets/potter_universe.json"

export target="$CWD/src/content/gedcom/";

if [ -d $target ]; then
  rm -rf $target
fi
mkdir $target

cat $full | $JQ -n '[inputs | select(."_class" == "Person")| with_entries(if .key == "gramps_id" then .key = "id" else . end)]' > $target/people.json
