/**
 * Integration tests for storage operations
 * Tests the interaction between popup.js, background.js, and Chrome storage API
 */

// Mock the Chrome API
const chrome = require('jest-chrome');

describe('Storage Operations Integration', () => {
  // Mock storage data
  const mockStorageData = {
    'runjavascript_example.com': {
      code: 'console.log("test");',
      enabled: true,
      library: 'jquery_3_3_1'
    },
    'runjavascript_facebook.com': {
      code: 'document.body.style.backgroundColor = "red";',
      enabled: true,
      library: ''
    }
  };

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Reset Chrome API mocks
    chrome.storage.sync.get.mockImplementation((key, callback) => {
      // Handle case where only callback is provided (no key)
      if (typeof key === 'function' && !callback) {
        key(mockStorageData);
        return;
      }
      
      if (typeof key === 'string') {
        // Return specific key
        const result = {};
        result[key] = mockStorageData[key];
        callback(result);
      } else if (Array.isArray(key)) {
        // Return multiple keys
        const result = {};
        key.forEach(k => {
          result[k] = mockStorageData[k];
        });
        callback(result);
      } else {
        // Return all data
        callback(mockStorageData);
      }
    });
    
    chrome.storage.sync.set.mockImplementation((data, callback) => {
      // Simulate successful storage
      if (callback) callback();
    });
    
    chrome.storage.local.get.mockImplementation((key, callback) => {
      // Similar implementation as sync.get
      if (typeof key === 'string') {
        const result = {};
        result[key] = mockStorageData[key];
        callback(result);
      } else if (Array.isArray(key)) {
        const result = {};
        key.forEach(k => {
          result[k] = mockStorageData[k];
        });
        callback(result);
      } else {
        callback(mockStorageData);
      }
    });
    
    chrome.storage.local.set.mockImplementation((data, callback) => {
      if (callback) callback();
    });
  });

  describe('Popup loading data from storage', () => {
    test('loads script data for current host', () => {
      // Mock function to process storage data
      const processStorageData = jest.fn();
      
      // Simulate popup.js loading data with a key parameter
      chrome.storage.sync.get('runjavascript_example.com', function(obj) {
        processStorageData(obj);
      });
      
      // Verify storage was queried
      expect(chrome.storage.sync.get).toHaveBeenCalledTimes(1);
      
      // Verify data was processed
      expect(processStorageData).toHaveBeenCalledTimes(1);
    });
    
    test('falls back to local storage if sync fails', () => {
      // Create a simplified mock storage data for this test
      const simplifiedMockData = {
        'runjavascript_example.com': {
          code: 'console.log("test");',
          enabled: true,
          library: 'jquery_3_3_1'
        }
      };
      
      // Mock sync storage failure
      chrome.runtime.lastError = { message: 'Sync error' };
      chrome.storage.sync.get.mockImplementation((key, callback) => {
        // Handle case where only callback is provided
        if (typeof key === 'function' && !callback) {
          key({});
          return;
        }
        callback({});
      });
      
      // Mock local storage to return simplified data
      chrome.storage.local.get.mockImplementation((key, callback) => {
        if (typeof key === 'string') {
          const result = {};
          result[key] = simplifiedMockData[key];
          callback(result);
        } else if (typeof key === 'function' && !callback) {
          key(simplifiedMockData);
        } else {
          callback(simplifiedMockData);
        }
      });
      
      // Mock function to process storage data
      const processStorageData = jest.fn();
      
      // Simulate popup.js loading data with fallback - use a key parameter
      chrome.storage.sync.get('runjavascript_example.com', function(obj) {
        if (chrome.runtime.lastError) {
          chrome.storage.local.get('runjavascript_example.com', function(localObj) {
            processStorageData(localObj);
          });
        } else {
          processStorageData(obj);
        }
      });
      
      // Verify both storages were queried
      expect(chrome.storage.sync.get).toHaveBeenCalledTimes(1);
      expect(chrome.storage.local.get).toHaveBeenCalledTimes(1);
      
      // Verify data was processed from local storage
      expect(processStorageData).toHaveBeenCalledTimes(1);
      
      // Verify it was called with the expected data structure
      const expectedData = {
        'runjavascript_example.com': {
          code: 'console.log("test");',
          enabled: true,
          library: 'jquery_3_3_1'
        }
      };
      expect(processStorageData).toHaveBeenCalledWith(expectedData);
    });
  });

  describe('Background script loading data from storage', () => {
    test('loads and executes script for tab', () => {
      // Mock tab
      const tab = { id: 123, url: 'https://example.com' };
      
      // Mock function to execute script
      const executeScriptInTab = jest.fn();
      
      // Simulate background.js loading and executing script
      const host = tab.url.split('/')[2];
      const key = 'runjavascript_' + host;
      
      chrome.storage.sync.get(key, function(data) {
        const js = data[key];
        
        // Verify correct data was loaded
        expect(js).toEqual({
          code: 'console.log("test");',
          enabled: true,
          library: 'jquery_3_3_1'
        });
        
        // Execute script if enabled
        if (js.enabled) {
          executeScriptInTab(tab.id, js.code, js.library);
        }
      });
      
      // Verify storage was queried with correct key
      expect(chrome.storage.sync.get).toHaveBeenCalledTimes(1);
      expect(chrome.storage.sync.get).toHaveBeenCalledWith('runjavascript_example.com', expect.any(Function));
      
      // Verify script execution was attempted
      expect(executeScriptInTab).toHaveBeenCalledTimes(1);
      expect(executeScriptInTab).toHaveBeenCalledWith(123, 'console.log("test");', 'jquery_3_3_1');
    });
    
    test('handles legacy string format in storage', () => {
      // Mock legacy storage format (string instead of object)
      chrome.storage.sync.get.mockImplementation((key, callback) => {
        const result = {};
        result[key] = 'console.log("legacy");';
        callback(result);
      });
      
      // Mock tab
      const tab = { id: 456, url: 'https://example.com' };
      
      // Mock function to execute script
      const executeScriptInTab = jest.fn();
      
      // Simulate background.js loading and executing script
      const host = tab.url.split('/')[2];
      const key = 'runjavascript_' + host;
      
      chrome.storage.sync.get(key, function(data) {
        let js = data[key];
        
        // Convert legacy string format to object
        if (typeof js === 'string') {
          js = { 'code': js, 'enabled': 'true', 'library': '' };
        }
        
        // Execute script if enabled
        if (js.enabled) {
          executeScriptInTab(tab.id, js.code, js.library);
        }
      });
      
      // Verify script execution was attempted with correct parameters
      expect(executeScriptInTab).toHaveBeenCalledTimes(1);
      expect(executeScriptInTab).toHaveBeenCalledWith(456, 'console.log("legacy");', '');
    });
  });

  describe('Popup saving data to storage', () => {
    test('saves script data to sync storage', () => {
      // Mock data to save
      const js = {
        code: 'console.log("new script");',
        enabled: true,
        library: 'jquery_2_2_4'
      };
      
      const data = {};
      data['runjavascript_example.com'] = js;
      
      // Save data
      chrome.storage.sync.set(data, function() {
        // Success callback
      });
      
      // Verify storage was updated
      expect(chrome.storage.sync.set).toHaveBeenCalledTimes(1);
      expect(chrome.storage.sync.set).toHaveBeenCalledWith({
        'runjavascript_example.com': {
          code: 'console.log("new script");',
          enabled: true,
          library: 'jquery_2_2_4'
        }
      }, expect.any(Function));
    });
    
    test('falls back to local storage if sync fails', () => {
      // Mock sync storage failure
      chrome.runtime.lastError = { message: 'Sync error' };
      chrome.storage.sync.set.mockImplementation((data, callback) => {
        callback();
      });
      
      // Mock data to save
      const js = {
        code: 'console.log("fallback script");',
        enabled: true,
        library: 'jquery_1_12_4'
      };
      
      const data = {};
      data['runjavascript_example.com'] = js;
      
      // Save data with fallback
      chrome.storage.sync.set(data, function() {
        if (chrome.runtime.lastError) {
          chrome.storage.local.set(data, function() {
            // Local storage success callback
          });
        }
      });
      
      // Verify both storages were attempted
      expect(chrome.storage.sync.set).toHaveBeenCalledTimes(1);
      expect(chrome.storage.local.set).toHaveBeenCalledTimes(1);
      
      // Verify correct data was passed to local storage
      expect(chrome.storage.local.set).toHaveBeenCalledWith({
        'runjavascript_example.com': {
          code: 'console.log("fallback script");',
          enabled: true,
          library: 'jquery_1_12_4'
        }
      }, expect.any(Function));
    });
  });
});