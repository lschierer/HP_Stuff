#!/usr/bin/env bash

cat dist/generated_index_files.txt  | sort -u | while read -r line ; do echo "$line" ; rm "$line"; done

rm dist/generated_index_files.txt
