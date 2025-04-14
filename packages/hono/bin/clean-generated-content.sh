#!/usr/bin/env bash

# Script to clean generated content from ./src/Pages based on .gitignore files

# Find all directories with .gitignore files
find src/Pages -name .gitignore | while read -r IGNORE_FILE; do
  DIR=$(dirname "$IGNORE_FILE")
  echo "Processing directory: $DIR"

  # Read each line from the .gitignore file
  while read -r PATTERN; do
    # Skip empty lines and comments
    if [[ -z "$PATTERN" || "$PATTERN" == \#* ]]; then
      continue
    fi

    # Handle patterns with wildcards
    if [[ "$PATTERN" == *"*"* ]]; then
      echo "  Removing files matching pattern: $PATTERN"
      find "$DIR" -maxdepth 1 -name "$PATTERN" -type f -print -delete
    else
      # Handle exact file matches
      if [[ -f "$DIR/$PATTERN" ]]; then
        echo "  Removing file: $DIR/$PATTERN"
        rm -f "$DIR/$PATTERN"
      fi
    fi
  done < "$IGNORE_FILE"
done

if [ -f "dist/generated_index_files.txt" ]; then
  echo "Cleaning up generated index files..."

  # Create a unique list of files to remove
  sort -u dist/generated_index_files.txt > dist/generated_index_files_unique.txt

  # Show the files that will be removed
  echo "The following generated files will be removed:"
  cat dist/generated_index_files_unique.txt

  # Remove each file in the list
  while read -r file; do
    if [ -f "$file" ]; then
      echo "Removing: $file"
      rm -f "$file"
    else
      echo "File not found: $file (already removed)"
    fi
  done < dist/generated_index_files_unique.txt

  # Clean up the temporary file
  rm -f dist/generated_index_files_unique.txt

  # Clear the generated files list
  > dist/generated_index_files.txt
  echo "Generated files list cleared."
else
  echo "No generated_index_files.txt found. Nothing to clean."
fi

echo "Cleanup complete!"
