#!/bin/bash

# Loop through all .yaml and .yml files in the current directory
for file in *.yaml *.yml; do
  # Check if the file exists (to avoid errors when no .yaml or .yml files are found)
  if [ -f "$file" ]; then
    echo "Deleting resources in $file..."
    kubectl delete -f "$file"
  fi
done

echo "Deletion of all resources in YAML files completed."

