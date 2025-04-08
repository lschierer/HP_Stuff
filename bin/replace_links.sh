#!/bin/bash

# Check if at least two arguments are provided
if [ $# -lt 2 ]; then
    echo "Usage: $0 from_pattern to_pattern [directories...]"
    echo "Example: $0 '/nuttley/' '/Nuttley/' assets/Bookmarks/ packages/greenwood/src/pages/"
    echo "If no directories are specified, the default set will be used."
    exit 1
fi

FROM_PATTERN="$1"
TO_PATTERN="$2"
shift 2

# Use default directories if none provided
if [ $# -eq 0 ]; then
    DIRS=("assets/Bookmarks" "assets/people" "packages/greenwood/src/pages")
else
    DIRS=("$@")
fi

# Escape any special characters in the FROM_PATTERN for grep
GREP_PATTERN=$(echo "$FROM_PATTERN" | sed 's/[\/&]/\\&/g')

# Count files that will be modified
FILE_COUNT=$(grep -rl "$GREP_PATTERN" "${DIRS[@]}" | wc -l)

echo "Found $FILE_COUNT files containing '$FROM_PATTERN'"
echo "Replacing '$FROM_PATTERN' with '$TO_PATTERN'"
echo "In directories: ${DIRS[*]}"

# Confirm before proceeding
read -p "Proceed with replacement? (y/n): " CONFIRM
if [[ "$CONFIRM" != "y" && "$CONFIRM" != "Y" ]]; then
    echo "Operation cancelled."
    exit 0
fi

# Perform the replacement
grep -rl "$GREP_PATTERN" "${DIRS[@]}" | while read -r line; do
    echo "Processing: $line"
    gsed -i -E "s#$FROM_PATTERN#$TO_PATTERN#g" "$line"
done

echo "Replacement complete."
