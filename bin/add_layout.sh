#!/bin/bash

# Find all markdown files in the specified directory
find packages/greenwood/src/pages/ -name "*.md" | while read -r file; do
    # Check if the file has front matter (starts with ---)
    if grep -q "^---" "$file"; then
        # Check if the file already has a layout specified
        if ! grep -q "layout:" "$file"; then
            echo "Adding layout to $file"
            
            # Use gsed to add layout: standard after the first --- line
            # This assumes the front matter starts with --- on its own line
            gsed -i '0,/^---/{s/^---/---\nlayout: standard/}' "$file"
        else
            echo "File already has layout: $file"
        fi
    else
        echo "File has no front matter: $file"
    fi
done

