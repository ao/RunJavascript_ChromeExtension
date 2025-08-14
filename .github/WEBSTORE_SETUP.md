# Chrome Web Store GitHub Actions Setup

This document explains how to set up automated publishing to the Chrome Web Store using GitHub Actions.

## Required GitHub Secrets

You need to configure the following secrets in your GitHub repository settings:

### 1. Chrome Extension ID
- **Secret Name**: `CHROME_EXTENSION_ID`
- **Value**: Your extension's ID from the Chrome Web Store
- **How to find**: Go to your extension's page in the Chrome Web Store, the ID is in the URL: `https://chrome.google.com/webstore/detail/[EXTENSION_ID]`

### 2. Chrome Web Store API Credentials

You need to create a Google Cloud Project and enable the Chrome Web Store API:

#### Step 1: Create Google Cloud Project
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable the Chrome Web Store API

#### Step 2: Create OAuth 2.0 Credentials
1. Go to "APIs & Services" > "Credentials"
2. Click "Create Credentials" > "OAuth 2.0 Client IDs"
3. Choose "Desktop application" as application type
4. Note down the Client ID and Client Secret

#### Step 3: Get Refresh Token
Run this script locally to get your refresh token:

```bash
# Install dependencies
npm install -g chrome-webstore-upload-cli

# Get refresh token (replace with your credentials)
chrome-webstore-upload-cli \
  --source ./build \
  --extension-id YOUR_EXTENSION_ID \
  --client-id YOUR_CLIENT_ID \
  --client-secret YOUR_CLIENT_SECRET \
  --auto-publish
```

Follow the OAuth flow and copy the refresh token from the output.

### 3. Configure GitHub Secrets

Go to your GitHub repository > Settings > Secrets and variables > Actions, and add:

- **`CHROME_EXTENSION_ID`**: Your extension ID
- **`CHROME_CLIENT_ID`**: OAuth 2.0 Client ID
- **`CHROME_CLIENT_SECRET`**: OAuth 2.0 Client Secret  
- **`CHROME_REFRESH_TOKEN`**: Refresh token from step 3

## Workflow Triggers

The workflow runs on:

- **Push to main/develop**: Builds and tests the extension
- **Pull requests**: Runs tests only
- **Tags starting with 'v'**: Builds, tests, creates release, and publishes to Web Store
- **Manual trigger**: Can be run manually from GitHub Actions tab

## Publishing Process

### Automatic Publishing (Recommended)
1. Update version in `manifest.json`
2. Commit and push changes
3. Create and push a git tag: `git tag v1.2.3 && git push origin v1.2.3`
4. GitHub Actions will automatically build and publish to Chrome Web Store

### Manual Publishing
1. Go to GitHub Actions tab
2. Select "Build Chrome Extension" workflow
3. Click "Run workflow"
4. Download the built extension from artifacts
5. Manually upload to Chrome Web Store

## Build Artifacts

The workflow creates:
- **ZIP file**: Ready-to-upload extension package
- **GitHub Release**: Automatic release with changelog
- **Artifacts**: Available for 30 days for manual download

## Troubleshooting

### Common Issues

1. **Invalid manifest.json**: Check JSON syntax and required fields
2. **Missing secrets**: Ensure all 4 secrets are configured correctly
3. **API quota exceeded**: Chrome Web Store API has daily limits
4. **Version conflicts**: Ensure version in manifest.json is higher than published version

### Debug Steps

1. Check GitHub Actions logs for detailed error messages
2. Verify all secrets are set correctly
3. Test locally by building the extension manually
4. Ensure your Google Cloud Project has Chrome Web Store API enabled

## Security Notes

- Never commit API credentials to your repository
- Use GitHub Secrets for all sensitive information
- Regularly rotate your OAuth credentials
- Monitor your Google Cloud Project for unusual activity

## Manual Build Commands

For local testing:

```bash
# Install dependencies
bun install

# Run tests
bun test

# Create build directory and copy files
mkdir -p build
cp manifest.json popup.html popup.js background.js inject.js storage.js build/
cp -r assets build/ 2>/dev/null || true

# Create ZIP package
cd build && zip -r ../extension.zip . && cd ..
```
