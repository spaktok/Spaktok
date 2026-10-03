#!/bin/bash

# Spaktok GitHub Push Script
# This script commits and pushes all changes to the GitHub repository

set -e

echo "🚀 Starting Spaktok GitHub Push..."
echo ""

# Ensure we're on the correct branch
CURRENT_BRANCH=$(git rev-parse --abbrev-ref HEAD)
TARGET_BRANCH="social-media-app"

if [ "$CURRENT_BRANCH" != "$TARGET_BRANCH" ]; then
  echo "Checking out $TARGET_BRANCH branch..."
  git checkout $TARGET_BRANCH || git checkout -b $TARGET_BRANCH
fi

echo "📦 Current branch: $(git rev-parse --abbrev-ref HEAD)"
echo ""

# Stage all changes
echo "📝 Staging all changes..."
git add -A

# Check if there are changes to commit
if git diff-index --quiet HEAD --; then
  echo "✅ No changes to commit"
  exit 0
fi

# Create a comprehensive commit message
COMMIT_MESSAGE="feat: Complete Spaktok implementation with all core features

- Implemented authentication system with JWT, OAuth, and biometric support
- Built video feed system with personalized algorithm and infinite scroll
- Created TikTok-like Reels with double-tap likes and comment system
- Implemented Snapchat-style messaging with auto-deleting messages
- Added Stories system with 24-hour auto-deletion
- Integrated Agora for live streaming with real-time chat and gifts
- Created advanced AR filter system with face detection
- Integrated Stripe and PayPal payment systems
- Implemented gift system and monetization
- Added comprehensive moderation and safety features
- Built sharing and collaboration system
- Integrated advertising platform
- Created profile management system
- Added comprehensive documentation and API guides"

echo ""
echo "💬 Commit message:"
echo "$COMMIT_MESSAGE"
echo ""

# Commit changes
echo "✅ Committing changes..."
git commit -m "$COMMIT_MESSAGE"

# Push to remote
echo ""
echo "🌐 Pushing to GitHub..."
git push -u origin $TARGET_BRANCH

echo ""
echo "✅ Successfully pushed to GitHub!"
echo "📊 Repository: spaktok/Spaktok"
echo "🌳 Branch: $TARGET_BRANCH"
echo ""
echo "🎉 Spaktok deployment ready!"
