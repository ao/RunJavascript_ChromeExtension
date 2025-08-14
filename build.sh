#!/bin/bash

# Chrome Extension Build Script
# Usage: ./build.sh [version_type] [options]
# Version types: patch, minor, major, or specific version (e.g., 5.1.2)
# Options: --skip-tests, --skip-lint, --force

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Configuration
EXTENSION_NAME="Run Javascript Chrome Extension"
BUILD_DIR="build"
DIST_DIR="dist"
TEMP_DIR="temp_build"

# Default options
SKIP_TESTS=false
SKIP_LINT=false
FORCE=false
VERSION_TYPE="patch"

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --skip-tests)
            SKIP_TESTS=true
            shift
            ;;
        --skip-lint)
            SKIP_LINT=true
            shift
            ;;
        --force)
            FORCE=true
            shift
            ;;
        patch|minor|major)
            VERSION_TYPE=$1
            shift
            ;;
        [0-9]*.[0-9]*.[0-9]*)
            VERSION_TYPE="specific"
            SPECIFIC_VERSION=$1
            shift
            ;;
        -h|--help)
            echo -e "${CYAN}Chrome Extension Build Script${NC}"
            echo ""
            echo "Usage: ./build.sh [version_type] [options]"
            echo ""
            echo "Version types:"
            echo "  patch     Increment patch version (5.0.0 -> 5.0.1)"
            echo "  minor     Increment minor version (5.0.0 -> 5.1.0)"
            echo "  major     Increment major version (5.0.0 -> 6.0.0)"
            echo "  X.Y.Z     Set specific version (e.g., 5.1.2)"
            echo ""
            echo "Options:"
            echo "  --skip-tests    Skip running tests"
            echo "  --skip-lint     Skip linting"
            echo "  --force         Force build even if working directory is dirty"
            echo "  -h, --help      Show this help message"
            echo ""
            echo "Examples:"
            echo "  ./build.sh patch              # Build with patch version bump"
            echo "  ./build.sh minor --skip-tests # Build with minor bump, skip tests"
            echo "  ./build.sh 5.2.0              # Build with specific version"
            exit 0
            ;;
        *)
            echo -e "${RED}Unknown option: $1${NC}"
            echo "Use --help for usage information"
            exit 1
            ;;
    esac
done

# Helper functions
log_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

log_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

log_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

log_error() {
    echo -e "${RED}❌ $1${NC}"
}

log_step() {
    echo -e "${PURPLE}🔄 $1${NC}"
}

# Check if required tools are installed
check_dependencies() {
    log_step "Checking dependencies..."
    
    if ! command -v bun &> /dev/null; then
        log_error "Bun is not installed. Please install Bun first."
        exit 1
    fi
    
    if ! command -v jq &> /dev/null; then
        log_warning "jq is not installed. Installing via brew..."
        if command -v brew &> /dev/null; then
            brew install jq
        else
            log_error "Please install jq manually for JSON processing"
            exit 1
        fi
    fi
    
    log_success "All dependencies are available"
}

# Check git status
check_git_status() {
    if [ "$FORCE" = false ]; then
        log_step "Checking git status..."
        
        if ! git diff-index --quiet HEAD --; then
            log_error "Working directory is not clean. Commit your changes first or use --force"
            git status --porcelain
            exit 1
        fi
        
        log_success "Working directory is clean"
    else
        log_warning "Skipping git status check (--force used)"
    fi
}

# Get current version from manifest.json
get_current_version() {
    if [ -f "manifest.json" ]; then
        CURRENT_VERSION=$(jq -r '.version' manifest.json)
        log_info "Current version: $CURRENT_VERSION"
    else
        log_error "manifest.json not found"
        exit 1
    fi
}

# Calculate new version
calculate_new_version() {
    if [ "$VERSION_TYPE" = "specific" ]; then
        NEW_VERSION=$SPECIFIC_VERSION
    else
        IFS='.' read -ra VERSION_PARTS <<< "$CURRENT_VERSION"
        MAJOR=${VERSION_PARTS[0]}
        MINOR=${VERSION_PARTS[1]}
        PATCH=${VERSION_PARTS[2]}
        
        case $VERSION_TYPE in
            "patch")
                PATCH=$((PATCH + 1))
                ;;
            "minor")
                MINOR=$((MINOR + 1))
                PATCH=0
                ;;
            "major")
                MAJOR=$((MAJOR + 1))
                MINOR=0
                PATCH=0
                ;;
        esac
        
        NEW_VERSION="$MAJOR.$MINOR.$PATCH"
    fi
    
    log_info "New version will be: $NEW_VERSION"
}

# Update version in files
update_version() {
    log_step "Updating version to $NEW_VERSION..."
    
    # Update manifest.json
    jq ".version = \"$NEW_VERSION\"" manifest.json > manifest.json.tmp && mv manifest.json.tmp manifest.json
    log_success "Updated manifest.json"
    
    # Update package.json if it exists
    if [ -f "package.json" ]; then
        jq ".version = \"$NEW_VERSION\"" package.json > package.json.tmp && mv package.json.tmp package.json
        log_success "Updated package.json"
    fi
}

# Run tests
run_tests() {
    if [ "$SKIP_TESTS" = false ]; then
        log_step "Running tests..."
        if bun test; then
            log_success "All tests passed"
        else
            log_error "Tests failed"
            exit 1
        fi
    else
        log_warning "Skipping tests"
    fi
}

# Run linting
run_lint() {
    if [ "$SKIP_LINT" = false ]; then
        log_step "Running linter..."
        if bun run lint; then
            log_success "Linting passed"
        else
            log_error "Linting failed"
            exit 1
        fi
    else
        log_warning "Skipping linting"
    fi
}

# Clean previous builds
clean_build() {
    log_step "Cleaning previous builds..."
    rm -rf "$BUILD_DIR" "$DIST_DIR" "$TEMP_DIR"
    rm -f *.zip
    log_success "Cleaned build directories"
}

# Create build directory structure
create_build_structure() {
    log_step "Creating build structure..."
    mkdir -p "$TEMP_DIR"
    log_success "Build structure created"
}

# Copy extension files
copy_extension_files() {
    log_step "Copying extension files..."
    
    # Essential extension files
    cp manifest.json "$TEMP_DIR/"
    cp popup.html "$TEMP_DIR/"
    cp popup.js "$TEMP_DIR/"
    cp background.js "$TEMP_DIR/"
    cp inject.js "$TEMP_DIR/"
    cp storage.js "$TEMP_DIR/"
    cp styles.css "$TEMP_DIR/"
    cp sandbox.html "$TEMP_DIR/"
    cp ace.js "$TEMP_DIR/"
    
    # jQuery libraries
    cp lib_jquery_*.js "$TEMP_DIR/"
    
    # Icons
    cp icon*.png "$TEMP_DIR/"
    
    # Assets if they exist
    if [ -d "assets" ]; then
        cp -r assets "$TEMP_DIR/"
    fi
    
    log_success "Extension files copied"
}

# Validate extension structure
validate_extension() {
    log_step "Validating extension structure..."
    
    # Check required files
    required_files=("manifest.json" "popup.html" "popup.js" "background.js" "inject.js")
    
    for file in "${required_files[@]}"; do
        if [ ! -f "$TEMP_DIR/$file" ]; then
            log_error "Required file missing: $file"
            exit 1
        fi
    done
    
    # Validate manifest.json
    if ! jq empty "$TEMP_DIR/manifest.json" 2>/dev/null; then
        log_error "Invalid JSON in manifest.json"
        exit 1
    fi
    
    # Check manifest version
    MANIFEST_VERSION=$(jq -r '.version' "$TEMP_DIR/manifest.json")
    if [ "$MANIFEST_VERSION" != "$NEW_VERSION" ]; then
        log_error "Version mismatch in manifest.json"
        exit 1
    fi
    
    log_success "Extension structure validated"
}

# Create zip package
create_package() {
    log_step "Creating zip package..."
    
    ZIP_NAME="v${NEW_VERSION}.zip"
    
    # Create zip from temp directory
    cd "$TEMP_DIR"
    zip -r "../$ZIP_NAME" . -x "*.DS_Store" "*.git*" "node_modules/*" "tests/*" "docs/*" "*.md" "*.sh" "package*.json" "bun.lock" "*.toml" "*.bak" ".husky*/*"
    cd ..
    
    # Get file size
    FILE_SIZE=$(du -h "$ZIP_NAME" | cut -f1)
    
    log_success "Package created: $ZIP_NAME ($FILE_SIZE)"
}

# Generate build report
generate_report() {
    log_step "Generating build report..."
    
    REPORT_FILE="build-report-${NEW_VERSION}.txt"
    
    cat > "$REPORT_FILE" << EOF
🚀 Chrome Extension Build Report
================================

Extension: $EXTENSION_NAME
Version: $NEW_VERSION
Build Date: $(date)
Build Type: $VERSION_TYPE

📦 Package Information:
- File: v${NEW_VERSION}.zip
- Size: $(du -h "v${NEW_VERSION}.zip" | cut -f1)
- Files: $(unzip -l "v${NEW_VERSION}.zip" | tail -1 | awk '{print $2}') files

🔧 Build Configuration:
- Tests: $([ "$SKIP_TESTS" = true ] && echo "Skipped" || echo "Passed")
- Linting: $([ "$SKIP_LINT" = true ] && echo "Skipped" || echo "Passed")
- Force mode: $([ "$FORCE" = true ] && echo "Enabled" || echo "Disabled")

📋 Included Files:
$(unzip -l "v${NEW_VERSION}.zip" | head -n -2 | tail -n +4)

✅ Build completed successfully!

Next steps:
1. Test the extension by loading it in Chrome developer mode
2. Upload to Chrome Web Store if ready for release
3. Create a git tag: git tag v${NEW_VERSION}
4. Push changes: git push origin main --tags

EOF

    log_success "Build report generated: $REPORT_FILE"
}

# Cleanup temporary files
cleanup() {
    log_step "Cleaning up temporary files..."
    rm -rf "$TEMP_DIR"
    log_success "Cleanup completed"
}

# Commit version changes
commit_version() {
    if [ "$FORCE" = false ]; then
        log_step "Committing version changes..."
        git add manifest.json package.json 2>/dev/null || true
        git commit -m "Bump version to $NEW_VERSION" || log_warning "No changes to commit"
        log_success "Version changes committed"
    else
        log_warning "Skipping git commit (--force used)"
    fi
}

# Main build process
main() {
    echo -e "${CYAN}"
    echo "🚀 Chrome Extension Build Script"
    echo "================================="
    echo -e "${NC}"
    
    check_dependencies
    check_git_status
    get_current_version
    calculate_new_version
    
    # Confirm build
    echo -e "${YELLOW}About to build $EXTENSION_NAME${NC}"
    echo -e "${YELLOW}Version: $CURRENT_VERSION → $NEW_VERSION${NC}"
    echo ""
    read -p "Continue? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        log_info "Build cancelled"
        exit 0
    fi
    
    update_version
    run_tests
    run_lint
    clean_build
    create_build_structure
    copy_extension_files
    validate_extension
    create_package
    generate_report
    cleanup
    commit_version
    
    echo ""
    echo -e "${GREEN}🎉 Build completed successfully!${NC}"
    echo -e "${GREEN}📦 Package: v${NEW_VERSION}.zip${NC}"
    echo -e "${GREEN}📊 Report: build-report-${NEW_VERSION}.txt${NC}"
    echo ""
    echo -e "${CYAN}Next steps:${NC}"
    echo "1. Test the extension: Load 'v${NEW_VERSION}.zip' in Chrome developer mode"
    echo "2. Create git tag: git tag v${NEW_VERSION} && git push origin v${NEW_VERSION}"
    echo "3. Upload to Chrome Web Store if ready for release"
}

# Run main function
main "$@"
