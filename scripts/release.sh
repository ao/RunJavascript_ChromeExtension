#!/bin/bash

# Release script for Chrome Extension
# Usage: ./scripts/release.sh [patch|minor|major]

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Default to patch if no argument provided
BUMP_TYPE=${1:-patch}

echo -e "${BLUE}🚀 Starting release process...${NC}"

# Check if we're on main branch
CURRENT_BRANCH=$(git branch --show-current)
if [ "$CURRENT_BRANCH" != "main" ]; then
    echo -e "${RED}❌ Error: You must be on the main branch to create a release${NC}"
    echo -e "${YELLOW}Current branch: $CURRENT_BRANCH${NC}"
    exit 1
fi

# Check if working directory is clean
if [ -n "$(git status --porcelain)" ]; then
    echo -e "${RED}❌ Error: Working directory is not clean${NC}"
    echo -e "${YELLOW}Please commit or stash your changes first${NC}"
    git status --short
    exit 1
fi

# Pull latest changes
echo -e "${BLUE}📥 Pulling latest changes...${NC}"
git pull origin main

# Get current version from manifest.json
CURRENT_VERSION=$(jq -r '.version' manifest.json)
echo -e "${BLUE}📋 Current version: $CURRENT_VERSION${NC}"

# Calculate new version
IFS='.' read -ra VERSION_PARTS <<< "$CURRENT_VERSION"
MAJOR=${VERSION_PARTS[0]}
MINOR=${VERSION_PARTS[1]}
PATCH=${VERSION_PARTS[2]}

case $BUMP_TYPE in
    major)
        MAJOR=$((MAJOR + 1))
        MINOR=0
        PATCH=0
        ;;
    minor)
        MINOR=$((MINOR + 1))
        PATCH=0
        ;;
    patch)
        PATCH=$((PATCH + 1))
        ;;
    *)
        echo -e "${RED}❌ Error: Invalid bump type. Use 'major', 'minor', or 'patch'${NC}"
        exit 1
        ;;
esac

NEW_VERSION="$MAJOR.$MINOR.$PATCH"
echo -e "${GREEN}🎯 New version: $NEW_VERSION${NC}"

# Confirm release
echo -e "${YELLOW}❓ Do you want to create release v$NEW_VERSION? (y/N)${NC}"
read -r CONFIRM
if [[ ! $CONFIRM =~ ^[Yy]$ ]]; then
    echo -e "${RED}❌ Release cancelled${NC}"
    exit 1
fi

# Update version in manifest.json
echo -e "${BLUE}📝 Updating manifest.json...${NC}"
jq ".version = \"$NEW_VERSION\"" manifest.json > manifest.json.tmp && mv manifest.json.tmp manifest.json

# Run tests
echo -e "${BLUE}🧪 Running tests...${NC}"
if ! bun test; then
    echo -e "${RED}❌ Tests failed! Reverting changes...${NC}"
    git checkout manifest.json
    exit 1
fi

# Create build to verify everything works
echo -e "${BLUE}🔨 Creating test build...${NC}"
mkdir -p build
cp manifest.json popup.html popup.js background.js inject.js storage.js build/
cp -r assets build/ 2>/dev/null || true

# Validate the build
if ! jq empty build/manifest.json; then
    echo -e "${RED}❌ Invalid manifest.json! Reverting changes...${NC}"
    git checkout manifest.json
    rm -rf build
    exit 1
fi

# Clean up test build
rm -rf build

# Commit version bump
echo -e "${BLUE}💾 Committing version bump...${NC}"
git add manifest.json
git commit -m "chore: bump version to v$NEW_VERSION"

# Create and push tag
echo -e "${BLUE}🏷️  Creating and pushing tag...${NC}"
git tag "v$NEW_VERSION"
git push origin main
git push origin "v$NEW_VERSION"

echo -e "${GREEN}✅ Release v$NEW_VERSION created successfully!${NC}"
echo -e "${BLUE}🔗 GitHub Actions will now build and publish the extension${NC}"
echo -e "${BLUE}📊 Check the progress at: https://github.com/$(git config --get remote.origin.url | sed 's/.*github.com[:/]\([^.]*\).*/\1/')/actions${NC}"

# Open GitHub Actions page (macOS only)
if [[ "$OSTYPE" == "darwin"* ]]; then
    REPO_URL=$(git config --get remote.origin.url | sed 's/git@github.com:/https:\/\/github.com\//' | sed 's/\.git$//')
    echo -e "${BLUE}🌐 Opening GitHub Actions page...${NC}"
    open "$REPO_URL/actions"
fi
