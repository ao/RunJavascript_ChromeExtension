# Project Overview
## Run Javascript Chrome Extension

## What is this project?

A Chrome extension that allows users to run custom JavaScript on websites they visit. It supports multiple jQuery versions and provides a built-in code editor with syntax highlighting.

## Current Status

The extension is functional with core features implemented. The project is currently in active development with a comprehensive roadmap for future enhancements.

## Key Features

### ✅ Currently Available
- Run custom JavaScript on any website automatically
- Choose from multiple jQuery versions (1.12.4, 2.2.4, 3.3.1) or use no library
- Enable/disable scripts per domain with a single click
- Built-in code editor with syntax highlighting (Ace Editor)
- Persistent storage of scripts across browser sessions
- Full Manifest V3 compatibility
- Secure script execution using sandboxed iframe approach

### 🚧 In Development
See [ROADMAP.md](ROADMAP.md) for detailed development plans organized into 4 phases.

## Quick Start

### For Users
1. Install the extension from Chrome Web Store
2. Navigate to any website
3. Click the extension icon
4. Write your JavaScript code in the editor
5. Choose a library (optional)
6. Click "Save & Run" to execute

### For Developers
1. Clone the repository
2. Install dependencies: `bun install`
3. Run tests: `bun test`
4. Load extension in Chrome developer mode

## Project Structure

```
├── docs/                    # 📚 All documentation
│   ├── ROADMAP.md          # Development roadmap with checkboxes
│   ├── IMPLEMENTATION_GUIDE.md # Technical implementation details
│   ├── FEATURE_SPECIFICATIONS.md # Detailed feature specs
│   └── PROJECT_OVERVIEW.md # This file
├── tests/                   # 🧪 Test files
├── background.js           # Extension background script
├── popup.html             # Extension popup interface
├── popup.js               # Extension popup logic
├── inject.js              # Content script for injection
├── storage.js             # Storage management
├── manifest.json          # Extension manifest
└── README.md              # Main project documentation
```

## Technology Stack

- **Runtime**: Bun (JavaScript runtime for testing and building)
- **Testing**: Bun's built-in test runner with JSDOM and Sinon
- **Editor**: Ace Editor for syntax highlighting
- **Storage**: Chrome Extension Storage API
- **Architecture**: Manifest V3 with service workers

## Development Phases

1. **Phase 1: Core Enhancements** (3-4 months)
   - Script library/repository, manual triggers, debugging tools, dark mode

2. **Phase 2: Functional Expansion** (4-5 months)
   - Conditional execution, import/export, additional libraries

3. **Phase 3: Advanced Features** (5-6 months)
   - Script versioning, code snippets, custom libraries, scheduling

4. **Phase 4: Community & Ecosystem** (6-9 months)
   - Script sharing platform, collaborative editing, enhanced security

## Contributing

This project follows a structured development approach with comprehensive documentation. All features are planned and specified before implementation.

## License

MIT License - see the main README.md for details.
