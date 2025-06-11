# Run Javascript Chrome Extension

A powerful Chrome extension that allows you to run custom JavaScript code automatically each time you visit specific websites. Perfect for web developers, testers, and power users who need to customize their browsing experience.

![Run Javascript Icon](icon-128.png)

## Features

- Run custom JavaScript on any website automatically
- Choose from multiple jQuery versions (1.12.4, 2.2.4, 3.3.1) or use no library
- Enable/disable scripts per domain with a single click
- Built-in code editor with syntax highlighting
- Persistent storage of your scripts across browser sessions
- Full Manifest V3 compatibility for enhanced security and performance

## Installation

### From Chrome Web Store

1. Visit the [Run Javascript extension page](https://chrome.google.com/webstore/detail/run-javascript/lmilalhkkdhfieeienjbiicclobibjao) in the Chrome Web Store
2. Click "Add to Chrome"
3. Confirm the installation when prompted

### Manual Installation (Developer Mode)

1. Download or clone this repository
2. Open Chrome and navigate to `chrome://extensions/`
3. Enable "Developer mode" using the toggle in the top-right corner
4. Click "Load unpacked" and select the extension directory
5. The extension should now appear in your browser toolbar

## Usage Guide

### Basic Usage

1. Navigate to any website where you want to run custom JavaScript
2. Click the Run Javascript extension icon in your browser toolbar
3. Enter your JavaScript code in the editor
4. Select a jQuery version from the dropdown menu (or choose "Don't use a library")
5. Click "Save & Run" to execute your code
6. Toggle the "Enable on [domain]" checkbox to automatically run your script whenever you visit this domain

### Example Scripts

**Add a Dark Mode to Any Website**
```javascript
// Simple dark mode implementation
document.body.style.backgroundColor = '#222';
document.body.style.color = '#eee';
const links = document.querySelectorAll('a');
links.forEach(link => {
  link.style.color = '#5af';
});
```

**Auto-Fill Forms**
```javascript
// Fill out common form fields
$('input[name="email"]').val('your-email@example.com');
$('input[name="name"]').val('Your Name');
// Click submit button after a delay
setTimeout(() => {
  $('input[type="submit"]').click();
}, 500);
```

**Remove Annoying Elements**
```javascript
// Remove ads, popups, or other unwanted elements
$('.ad-container, .popup, .newsletter-signup').remove();
```

## Manifest V3 Migration Notes

This extension has been fully migrated from Manifest V2 to Manifest V3 to comply with Chrome's latest security requirements. Key changes include:

- Replaced background page with service worker
- Removed deprecated APIs like `chrome.browserAction`
- Implemented more secure code execution methods
- Updated content security policy
- Improved permission handling

### Technical Details

#### Service Worker Implementation

The extension now uses a persistent service worker instead of a background page. The service worker handles:

- Script injection into tabs
- Storage management
- Cross-extension messaging

#### Secure Script Execution

Scripts are executed using a sandboxed iframe approach to comply with Manifest V3's strict Content Security Policy (CSP) requirements:

```javascript
// Create a sandboxed iframe with its own CSP
let sandbox = document.createElement('iframe');
sandbox.id = 'runjavascript-sandbox';
sandbox.sandbox = 'allow-scripts allow-same-origin';
sandbox.src = chrome.runtime.getURL('sandbox.html');
document.body.appendChild(sandbox);

// Execute code in the sandbox via postMessage
sandbox.contentWindow.postMessage({
    code: userCode,
    library: selectedLibrary
}, '*');
```

This approach provides several benefits:
- Allows execution of arbitrary JavaScript without violating CSP restrictions
- Maintains full compatibility with existing user scripts
- Provides proper isolation for script execution
- Supports all jQuery versions as before

#### Permission Model

The extension now uses these permissions:
- `storage`: For saving your scripts
- `activeTab`: For executing scripts in the current tab
- `scripting`: For injecting code into web pages
- `host_permissions`: For automatically running scripts on specific domains

## Troubleshooting

### Common Issues

**Scripts Not Running Automatically**
- Ensure the "Enable on [domain]" checkbox is checked
- Verify that the domain matches exactly (subdomains are treated as separate domains)
- Check the browser console for any JavaScript errors

**jQuery Not Working**
- Make sure you've selected the correct jQuery version from the dropdown
- Some websites may have conflicts with jQuery - try using vanilla JavaScript instead
- Check if the website's Content Security Policy (CSP) is blocking external scripts

**Extension Not Saving Scripts**
- Check if you have sufficient storage space
- Try clearing the extension's storage data and re-entering your scripts

### Getting Help

If you encounter any issues not covered here, please visit our [help page](https://ataiva.com/run-javascript-chrome-extension-help/) or [submit an issue](https://github.com/ao/RunJavascript_ChromeExtension/issues) on GitHub.

## Version History

### v3.0.2 (Current)
- Implemented sandboxed iframe approach for secure script execution
- Fixed CSP issues in Manifest V3
- Enhanced error handling and reporting
- Updated documentation with technical details

### v3.0.1
- Fixed library dropdown visibility
- Removed unused analytics code
- Cleaned up legacy code
- Improved documentation

### v3.0.0
- Major update to Manifest V3
- Replaced background page with service worker
- Updated to use modern Chrome APIs
- Improved security with better code execution methods

### v2.x
- Manifest V2 implementation
- Basic functionality for running JavaScript on websites
- jQuery library integration

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Credits

Developed and maintained by [Ataiva](https://ataiva.com/).
