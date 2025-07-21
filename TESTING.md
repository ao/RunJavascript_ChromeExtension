# Testing Documentation for Run Javascript Chrome Extension

This document provides comprehensive information about the testing infrastructure for the Run Javascript Chrome Extension. It covers how to run tests, the testing architecture, and guidelines for writing new tests.

## Table of Contents

- [Testing Documentation for Run Javascript Chrome Extension](#testing-documentation-for-run-javascript-chrome-extension)
  - [Table of Contents](#table-of-contents)
  - [Testing Setup](#testing-setup)
  - [Running Tests](#running-tests)
  - [Test Types](#test-types)
    - [Unit Tests](#unit-tests)
    - [Integration Tests](#integration-tests)
    - [End-to-End Tests](#end-to-end-tests)
    - [CSP Tests](#csp-tests)
  - [Continuous Integration](#continuous-integration)
  - [Writing New Tests](#writing-new-tests)
  - [Known Issues and Regression Tests](#known-issues-and-regression-tests)
    - [Facebook CSP Issue](#facebook-csp-issue)

## Testing Setup

The testing infrastructure uses the following technologies:

- **Jest**: Main testing framework for all test types
- **jest-chrome**: For mocking Chrome extension APIs
- **Puppeteer**: For browser automation in E2E and CSP tests
- **http-server**: For serving test pages with custom CSP headers

To set up the testing environment:

```bash
# Install dependencies using the setup script
npm run setup
```

> **Note**: We're using Jest v27.0.0 because jest-chrome v0.8.0 has a peer dependency on Jest v26.0.1 or v27.0.0. The setup script uses the `--legacy-peer-deps` flag to handle this dependency constraint.

## Running Tests

You can run different types of tests using the following npm scripts:

```bash
# Run all tests
npm test

# Run unit tests only
npm run test:unit

# Run integration tests only
npm run test:integration

# Run end-to-end tests only
npm run test:e2e

# Run CSP tests only
npm run test:csp

# Generate coverage report
npm run test:coverage
```

## Test Types

### Unit Tests

Unit tests focus on testing individual functions and components in isolation. They use mocked dependencies to ensure that only the specific unit of code is being tested.

**Location**: `tests/unit/`

**Key files**:
- `extractHostname.test.js`: Tests for the hostname extraction function
- `background.test.js`: Tests for background script functions
- `popup.test.js`: Tests for popup script functions

**Example**:

```javascript
// Example unit test
describe('extractHostname function', () => {
  test('extracts hostname from full URL', () => {
    expect(extractHostname('https://www.example.com/path?query=1')).toBe('www.example.com');
  });
});
```

### Integration Tests

Integration tests verify that different parts of the extension work together correctly. They focus on the interactions between components, such as messaging between the background script and popup.

**Location**: `tests/integration/`

**Key files**:
- `background-messaging.test.js`: Tests for messaging between components
- `storage-operations.test.js`: Tests for storage operations across components

**Example**:

```javascript
// Example integration test
test('handles content_script_loaded message', () => {
  const sender = { tab: { id: 123, url: 'https://example.com' } };
  const message = { action: 'content_script_loaded' };
  
  messageListener(message, sender, jest.fn());
  
  expect(executeScriptForTab).toHaveBeenCalledWith(sender.tab);
});
```

### End-to-End Tests

End-to-end tests verify the extension's functionality in a real browser environment. They use Puppeteer to automate Chrome with the extension loaded and test the full user experience.

**Location**: `tests/e2e/`

**Setup**: These tests require a special setup to load the extension in Puppeteer. See `tests/e2e/setup.js` for details.

**Example**:

```javascript
// Example E2E test
test('can enter and save code', async () => {
  await extensionPage.type('#editor', 'console.log("Hello World")');
  await extensionPage.click('#runJavascript');
  
  // Verify the code was saved and executed
  // ...
});
```

### CSP Tests

Content Security Policy (CSP) tests specifically target the extension's behavior with different CSP configurations. They are crucial for ensuring the extension works on websites with strict security policies.

**Location**: `tests/csp/`

**Key files**:
- `facebook-csp.test.js`: Tests for the Facebook CSP issue

**Example**:

```javascript
// Example CSP test
test('executes script via script tag with nonce', async () => {
  await testPage.goto('http://localhost:8080/facebook-like.html');
  
  const scriptResult = await testPage.evaluate(() => {
    // Extract nonce and inject script
    // ...
  });
  
  expect(scriptResult.success).toBe(true);
});
```

## Continuous Integration

This project uses GitHub Actions for continuous integration. The workflow is defined in `.github/workflows/test.yml` and includes the following jobs:

1. **unit-and-integration-tests**: Runs unit and integration tests
2. **e2e-tests**: Runs end-to-end tests
3. **csp-tests**: Runs CSP tests
4. **publish-test-results**: Publishes test results and coverage reports

The CI workflow runs on every push to main/master and on pull requests.

## Writing New Tests

When writing new tests, follow these guidelines:

1. **Choose the right test type**: Determine whether your test should be a unit, integration, E2E, or CSP test.
2. **Use the appropriate mocks**: For unit and integration tests, use jest-chrome to mock Chrome APIs.
3. **Follow the existing patterns**: Look at existing tests for examples of how to structure your tests.
4. **Test both success and failure cases**: Ensure your tests cover both expected behavior and error handling.
5. **Keep tests focused**: Each test should verify a specific piece of functionality.

## Known Issues and Regression Tests

The testing suite includes regression tests for known issues to prevent them from recurring in future updates.

### Facebook CSP Issue

The extension has an issue with Facebook's strict Content Security Policy, which blocks the use of `eval()`. The regression tests in `tests/csp/facebook-csp.test.js` verify that the proposed solution (using script tags with nonces) works correctly.

**Current status**: The test `extension injects script correctly with Facebook CSP` is expected to fail until the issue is fixed. When the fix is implemented, this test should pass.

**Proposed solution**: Use script tags with nonces extracted from the page instead of `eval()` for script execution on pages with strict CSPs.