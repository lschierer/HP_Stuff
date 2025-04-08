#!/bin/bash

# Default to dry run
DRY_RUN=true

# Check for --apply flag
if [ "$1" == "--apply" ]; then
    DRY_RUN=false
fi

# Directories to search
DIRS=("packages/greenwood/src/pages/" "assets/Bookmarks/" "assets/people/")

echo "Scanning for markdown files with spaces in links..."

# Process each directory
for DIR in "${DIRS[@]}"; do
    if [ -d "$DIR" ]; then
        echo "Searching in $DIR"

        # Use find with -print0 and while read with -d '' to handle filenames with spaces
        find "$DIR" -name "*.md" -print0 | while IFS= read -r -d '' file; do
            # Create a temporary file for comparison
            cp "$file" "$file.tmp"

            # Fix inline markdown links with spaces using perl
            perl -i -pe 's/\[([^\]]+)\]\(([^<][^)]*\s[^)]*)\)/[\1](<\2>)/g' "$file.tmp"

            # Fix reference-style link definitions with spaces using perl
            # This pattern specifically targets reference links [label]: url
            # and avoids footnotes [^label]: text
            perl -i -pe 's/^\[(?!\^)([^\]]+)\]: ([^<][^\s]*\s[^\s].*?)$/[\1]: <\2>/g' "$file.tmp"

            # Check if any changes were made
            if ! cmp -s "$file" "$file.tmp"; then
                echo "Would fix links in: $file"

                # Show the differences
                diff -u "$file" "$file.tmp" | grep -E "^\+|\-" | grep -v "^--- " | grep -v "^+++ "

                # Only make changes if not in dry run mode
                if [ "$DRY_RUN" = false ]; then
                    mv "$file.tmp" "$file"
                    echo "  ✓ Links fixed"
                else
                    rm "$file.tmp"
                fi
            else
                rm "$file.tmp"
            fi
        done
    else
        echo "Directory not found: $DIR"
    fi
done

if [ "$DRY_RUN" = true ]; then
    echo ""
    echo "This was a dry run. No files were modified."
    echo "Run with --apply to make the changes."
fi
