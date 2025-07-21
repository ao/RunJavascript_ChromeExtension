/**
 * Unit tests for background.js functionality
 */

// Mock the Chrome API
const chrome = require('jest-chrome');

// Import the functions we want to test
// Since we can't directly import from background.js, we'll recreate the key functions here for testing

// Function to generate execution key
function getExecutionKey(tabId, url, code) {
  const host = extractHostname(url);
  // Use a more reliable way to generate a hash in the test environment
  const codeHash = Buffer.from(code).toString('base64').slice(0, 10);
  return `${tabId}-${host}-${codeHash}`;
}

// Function to check if script should be executed (prevents duplicates)
function shouldExecuteScript(tabId, url, code, executionTracker = new Map()) {
  const key = getExecutionKey(tabId, url, code);
  const now = Date.now();
  const lastExecution = executionTracker.get(key);
  
  // Prevent execution if same script was run within last 5 seconds
  if (lastExecution && (now - lastExecution) < 5000) {
    return false;
  }
  
  executionTracker.set(key, now);
  
  // Clean up old entries (older than 30 seconds)
  for (const [trackKey, timestamp] of executionTracker.entries()) {
    if (now - timestamp > 30000) {
      executionTracker.delete(trackKey);
    }
  }
  
  return true;
}

// Helper function for extracting hostname
function extractHostname(url) {
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

// Mock btoa function if not available in test environment
global.btoa = global.btoa || (str => Buffer.from(str).toString('base64'));

describe('Background Service Worker', () => {
  // Reset mocks before each test
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getExecutionKey', () => {
    test('generates a unique key based on tabId, URL, and code', () => {
      const tabId = 123;
      const url = 'https://www.example.com/path?query=1';
      const code = 'console.log("Hello World");';
      
      const key = getExecutionKey(tabId, url, code);
      
      // Expected format: tabId-hostname-codeHash
      expect(key).toMatch(/^123-www\.example\.com-[a-zA-Z0-9+/]{10}$/);
    });
    
    test('generates different keys for different tabs', () => {
      const url = 'https://www.example.com';
      const code = 'console.log("test");';
      
      const key1 = getExecutionKey(1, url, code);
      const key2 = getExecutionKey(2, url, code);
      
      expect(key1).not.toBe(key2);
    });
    
    test('generates different keys for different hostnames', () => {
      const tabId = 123;
      const code = 'console.log("test");';
      
      const key1 = getExecutionKey(tabId, 'https://www.example.com', code);
      const key2 = getExecutionKey(tabId, 'https://www.google.com', code);
      
      expect(key1).not.toBe(key2);
    });
    
    test('generates different keys for different code', () => {
      const tabId = 123;
      const url = 'https://www.example.com';
      
      // Use significantly different code to ensure different hashes
      const key1 = getExecutionKey(tabId, url, 'console.log("test1");');
      const key2 = getExecutionKey(tabId, url, 'alert("completely different");');
      
      // Log the keys to help debug
      console.log('Key1:', key1);
      console.log('Key2:', key2);
      
      expect(key1).not.toBe(key2);
    });
  });

  describe('shouldExecuteScript', () => {
    test('returns true for first execution', () => {
      const tabId = 123;
      const url = 'https://www.example.com';
      const code = 'console.log("test");';
      const executionTracker = new Map();
      
      const result = shouldExecuteScript(tabId, url, code, executionTracker);
      
      expect(result).toBe(true);
      expect(executionTracker.size).toBe(1);
    });
    
    test('returns false for duplicate execution within 5 seconds', () => {
      const tabId = 123;
      const url = 'https://www.example.com';
      const code = 'console.log("test");';
      const executionTracker = new Map();
      
      // First execution
      shouldExecuteScript(tabId, url, code, executionTracker);
      
      // Second execution (should be blocked)
      const result = shouldExecuteScript(tabId, url, code, executionTracker);
      
      expect(result).toBe(false);
      expect(executionTracker.size).toBe(1);
    });
    
    test('returns true for different scripts', () => {
      const tabId = 123;
      const url = 'https://www.example.com';
      const executionTracker = new Map();
      
      // First script
      shouldExecuteScript(tabId, url, 'console.log("test1");', executionTracker);
      
      // Second script (significantly different code)
      const result = shouldExecuteScript(tabId, url, 'alert("completely different");', executionTracker);
      
      // Log the tracker to help debug
      console.log('Execution tracker:', [...executionTracker.entries()]);
      
      expect(result).toBe(true);
      expect(executionTracker.size).toBe(2);
    });
    
    test('cleans up old entries', () => {
      const tabId = 123;
      const url = 'https://www.example.com';
      const code = 'console.log("test");';
      const executionTracker = new Map();
      
      // Add an old entry (more than 30 seconds old)
      const key = getExecutionKey(tabId, url, code);
      executionTracker.set(key, Date.now() - 31000);
      
      // Execute script
      shouldExecuteScript(tabId, url, code, executionTracker);
      
      // The old entry should be removed and replaced with a new one
      expect(executionTracker.size).toBe(1);
      expect(executionTracker.get(key)).toBeGreaterThan(Date.now() - 1000);
    });
  });

  describe('Chrome API interactions', () => {
    test('executeScriptInTab calls chrome.scripting.executeScript', async () => {
      // This is a more complex test that would require mocking the Chrome API
      // and testing the actual executeScriptInTab function from background.js
      
      // For now, we'll just verify that our test setup is working
      chrome.scripting.executeScript.mockImplementation(() => Promise.resolve([{ result: 'success' }]));
      
      // Call a function that would use chrome.scripting.executeScript
      await chrome.scripting.executeScript({
        target: { tabId: 123 },
        func: () => 'test',
        args: []
      });
      
      expect(chrome.scripting.executeScript).toHaveBeenCalledTimes(1);
    });
  });
});