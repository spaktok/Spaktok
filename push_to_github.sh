#!/bin/bash

# Navigate to the Spaktok project directory
cd ~/Spaktok || { echo "Error: Spaktok directory not found. Please update the path in the script."; exit 1; }

echo "--- Starting Git Automation Script for Spaktok ---"

# Add all changes to the staging area
echo "Adding all changes to Git..."
git add .

# Check if there are any changes to commit
if git diff-index --quiet HEAD;
then
    echo "No changes to commit. Skipping commit step."
else
    # Commit changes
    echo "Committing changes..."
    git commit -m "Automated commit by Manus AI: Updates and fixes" || { echo "Error: Failed to commit changes."; exit 1; }
fi

# Pull latest changes from remote to avoid conflicts
echo "Pulling latest changes from origin/main..."
git pull origin main || { echo "Error: Failed to pull changes. Please resolve any merge conflicts manually."; exit 1; }

# Push changes to remote
echo "Pushing changes to origin/main..."
git push origin main || { echo "Error: Failed to push changes. Please ensure you are authenticated and have permissions."; exit 1; }

echo "--- Git Automation Script Finished ---"
