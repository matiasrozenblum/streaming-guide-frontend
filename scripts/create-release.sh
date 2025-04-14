#!/bin/bash

set -e

# Step 1: Ensure we're on develop
CURRENT_BRANCH=$(git rev-parse --abbrev-ref HEAD)

if [[ "$CURRENT_BRANCH" != "develop" ]]; then
  git checkout develop
fi

# Step 2: Pull latest changes
git pull origin develop

# Step 3: Bump version manually or infer last tag
echo "🔢 Current version tags:"
git tag -l | sort -V

read -p "👉 Enter new version (e.g., 1.2.3): " VERSION
RELEASE_BRANCH="release/$VERSION"
TAG="$VERSION"

# Step 5: Create release branch from develop
git checkout -b "$RELEASE_BRANCH"
git push -u origin "$RELEASE_BRANCH"

echo "✅ Branch '$RELEASE_BRANCH' created and pushed to origin."

# Step 6: Create and push tag
git tag "$TAG"
git push origin "$TAG"

echo "🏷  Git tag '$TAG' created and pushed."

# Step 7: Create Pull Request via GitHub CLI
if command -v gh &> /dev/null; then
  echo "🚀 Creating PR to main..."

  gh pr create \
    --base main \
    --head "$RELEASE_BRANCH" \
    --title "Release $VERSION" \
    --body "Versión $VERSION lista para ser publicada."

  echo "✅ Pull Request created!"
else
  echo "⚠️ GitHub CLI (gh) not installed. Skipping PR creation."
  echo "👉 You can install it from https://cli.github.com/"
fi

# Step 8: Return to develop
git checkout develop