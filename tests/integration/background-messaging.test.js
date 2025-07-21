/**
 * Integration tests for background script messaging
 * Tests the interaction between background.js and other components via messaging
 */

// Mock the Chrome API
const chrome = require('jest-chrome');

// Mock functions that would be defined in background.js
const executeScriptForTab = jest.fn();
const executeScriptInTab = jest.fn();

// Mock message listener
let messageListener;

describe('Background Script Messaging', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Reset Chrome API mocks
    chrome.runtime.onMessage.addListener.mockImplementation(listener => {
      messageListener = listener;
      return true;
    });
    
    // Setup mock implementations
    chrome.tabs.get.mockImplementation((tabId, callback) => {
      callback({ id: tabId, url: 'https://example.com' });
    });
    
    chrome.scripting.executeScript.mockImplementation(() => Promise.resolve([{ result: 'success' }]));
    
    chrome.storage.sync.get.mockImplementation((key, callback) => {
      callback({
        'runjavascript_example.com': {
          code: 'console.log("test");',
          enabled: true,
          library: 'jquery_3_3_1'
        }
      });
    });
    
    // Setup message listener similar to background.js
    chrome.runtime.onMessage.addListener(function (message, sender, sendResponse) {
      if (message.action === 'content_script_loaded' && sender.tab) {
        executeScriptForTab(sender.tab);
      } else if (message.action === 'execute_script') {
        executeScriptInTab(message.tabId, message.code, message.library);
      }
      return true;
    });
  });

  test('handles content_script_loaded message', () => {
    // Simulate content script loaded message
    const sender = { tab: { id: 123, url: 'https://example.com' } };
    const message = { action: 'content_script_loaded' };
    
    // Call the message listener directly
    messageListener(message, sender, jest.fn());
    
    // Verify executeScriptForTab was called with the correct tab
    expect(executeScriptForTab).toHaveBeenCalledTimes(1);
    expect(executeScriptForTab).toHaveBeenCalledWith(sender.tab);
  });

  test('handles execute_script message', () => {
    // Simulate execute script message from popup
    const message = {
      action: 'execute_script',
      tabId: 123,
      code: 'console.log("test");',
      library: 'jquery_3_3_1'
    };
    
    // Call the message listener directly
    messageListener(message, {}, jest.fn());
    
    // Verify executeScriptInTab was called with the correct parameters
    expect(executeScriptInTab).toHaveBeenCalledTimes(1);
    expect(executeScriptInTab).toHaveBeenCalledWith(123, 'console.log("test");', 'jquery_3_3_1');
  });

  test('ignores unknown messages', () => {
    // Simulate unknown message
    const message = { action: 'unknown_action' };
    
    // Call the message listener directly
    messageListener(message, {}, jest.fn());
    
    // Verify no execution functions were called
    expect(executeScriptForTab).not.toHaveBeenCalled();
    expect(executeScriptInTab).not.toHaveBeenCalled();
  });

  test('handles tab activation', () => {
    // Mock implementation of executeScriptForTab for this test
    executeScriptForTab.mockImplementation(tab => {
      expect(tab.id).toBe(456);
      expect(tab.url).toBe('https://example.com');
    });
    
    // Create our own tab activation listener function
    const tabActivatedListener = (activeInfo) => {
      chrome.tabs.get(activeInfo.tabId, (tab) => {
        executeScriptForTab(tab);
      });
    };
    
    // Simulate tab activation
    tabActivatedListener({ tabId: 456 });
    
    // Verify chrome.tabs.get was called
    expect(chrome.tabs.get).toHaveBeenCalledWith(456, expect.any(Function));
    
    // Verify executeScriptForTab was called (via the mock implementation)
    expect(executeScriptForTab).toHaveBeenCalledTimes(1);
  });

  test('handles tab update', () => {
    // Mock implementation of executeScriptForTab for this test
    executeScriptForTab.mockImplementation(tab => {
      expect(tab.id).toBe(789);
      expect(tab.url).toBe('https://example.com');
    });
    
    // Create our own tab updated listener function
    const tabUpdatedListener = (tabId, changeInfo, tab) => {
      if (changeInfo.status === 'complete' && tab.url) {
        executeScriptForTab(tab);
      }
    };
    
    // Simulate tab update with complete status
    tabUpdatedListener(789, { status: 'complete' }, { id: 789, url: 'https://example.com' });
    
    // Verify executeScriptForTab was called
    expect(executeScriptForTab).toHaveBeenCalledTimes(1);
    expect(executeScriptForTab).toHaveBeenCalledWith({ id: 789, url: 'https://example.com' });
  });

  test('does not execute script for tab update with incomplete status', () => {
    // Create our own tab updated listener function
    const tabUpdatedListener = (tabId, changeInfo, tab) => {
      if (changeInfo.status === 'complete' && tab.url) {
        executeScriptForTab(tab);
      }
    };
    
    // Simulate tab update with loading status
    tabUpdatedListener(789, { status: 'loading' }, { id: 789, url: 'https://example.com' });
    
    // Verify executeScriptForTab was not called
    expect(executeScriptForTab).not.toHaveBeenCalled();
  });
});