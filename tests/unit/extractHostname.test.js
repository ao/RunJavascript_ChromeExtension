/**
 * Unit tests for extractHostname function
 * This function is used in background.js, popup.js, and inject.js
 */

// Import the function from each file to test all implementations
// Since we can't directly import from the extension files, we'll copy the function here

// Function from background.js
function extractHostnameBackground(url) {
  if (!url) return;
  var hostname;
  if (url.indexOf("://") > -1) {
      hostname = url.split('/')[2];
  } else {
      hostname = url.split('/')[0];
  }
  hostname = hostname.split(':')[0];
  hostname = hostname.split('?')[0];
  return hostname;
}

// Function from popup.js
function extractHostnamePopup(url) {
  var hostname;
  if (url.indexOf("://") > -1) {
      hostname = url.split('/')[2];
  } else {
      hostname = url.split('/')[0];
  }
  hostname = hostname.split(':')[0];
  hostname = hostname.split('?')[0];
  return hostname;
}

// Function from inject.js
function extractHostnameInject(url) {
  var hostname;
  if (url.indexOf("://") > -1) {
      hostname = url.split('/')[2];
  } else {
      hostname = url.split('/')[0];
  }
  hostname = hostname.split(':')[0];
  hostname = hostname.split('?')[0];
  return hostname;
}

// Test cases for all implementations
describe('extractHostname function', () => {
  // Test data
  const testCases = [
    { input: 'https://www.example.com/path?query=1', expected: 'www.example.com' },
    { input: 'http://example.com:8080/path', expected: 'example.com' },
    { input: 'example.com/path', expected: 'example.com' },
    { input: 'https://subdomain.example.co.uk/path?query=1#hash', expected: 'subdomain.example.co.uk' },
    { input: 'https://www.facebook.com/profile', expected: 'www.facebook.com' },
    { input: 'http://localhost:3000', expected: 'localhost' },
    { input: 'https://192.168.1.1:8080', expected: '192.168.1.1' }
  ];

  // Test background.js implementation
  describe('background.js implementation', () => {
    testCases.forEach(({ input, expected }) => {
      test(`extracts "${expected}" from "${input}"`, () => {
        expect(extractHostnameBackground(input)).toBe(expected);
      });
    });

    test('handles undefined input', () => {
      expect(extractHostnameBackground(undefined)).toBeUndefined();
    });
  });

  // Test popup.js implementation
  describe('popup.js implementation', () => {
    testCases.forEach(({ input, expected }) => {
      test(`extracts "${expected}" from "${input}"`, () => {
        expect(extractHostnamePopup(input)).toBe(expected);
      });
    });

    // Note: popup.js implementation doesn't handle undefined input
  });

  // Test inject.js implementation
  describe('inject.js implementation', () => {
    testCases.forEach(({ input, expected }) => {
      test(`extracts "${expected}" from "${input}"`, () => {
        expect(extractHostnameInject(input)).toBe(expected);
      });
    });

    // Note: inject.js implementation doesn't handle undefined input
  });

  // Test consistency across implementations
  describe('consistency across implementations', () => {
    testCases.forEach(({ input }) => {
      test(`all implementations return the same result for "${input}"`, () => {
        const backgroundResult = extractHostnameBackground(input);
        const popupResult = extractHostnamePopup(input);
        const injectResult = extractHostnameInject(input);
        
        expect(popupResult).toBe(backgroundResult);
        expect(injectResult).toBe(backgroundResult);
      });
    });
  });
});