import { describe, test, expect, beforeEach, afterEach, mock } from 'bun:test';
import sinon from 'sinon';
import { createMockStorage } from './utils/test-helpers.js';

describe('Chrome Storage Operations', () => {
  let chrome;
  let sandbox;

  // Setup before each test
  beforeEach(() => {
    sandbox = sinon.createSandbox();
    
    // Get the mocked chrome API
    chrome = global.chrome;
    
    // Reset chrome.storage mocks
    chrome.storage.sync.get.reset();
    chrome.storage.sync.set.reset();
    chrome.storage.local.get.reset();
    chrome.storage.local.set.reset();
    
    // Restore default behavior after reset
    chrome.storage.sync.set.callsFake((items, callback) => {
      if (typeof callback === 'function') {
        callback();
      }
      return Promise.resolve();
    });
    
    chrome.storage.sync.get.callsFake((keys, callback) => {
      if (typeof callback === 'function') {
        callback({});
      }
      return Promise.resolve({});
    });
    
    chrome.storage.local.set.callsFake((items, callback) => {
      if (typeof callback === 'function') {
        callback();
      }
      return Promise.resolve();
    });
    
    chrome.storage.local.get.callsFake((keys, callback) => {
      if (typeof callback === 'function') {
        callback({});
      }
      return Promise.resolve({});
    });
    
    // Clear runtime errors
    chrome.runtime.lastError = null;
  });

  // Cleanup after each test
  afterEach(() => {
    sandbox.restore();
  });

  describe('Saving Data', () => {
    test('saves data to chrome.storage.sync', () => {
      // Create a function to save data to storage
      const saveToStorage = (key, data) => {
        const storageData = {};
        storageData[key] = data;
        
        return new Promise((resolve, reject) => {
          chrome.storage.sync.set(storageData, () => {
            if (chrome.runtime.lastError) {
              reject(chrome.runtime.lastError);
            } else {
              resolve();
            }
          });
        });
      };
      
      // Call the function
      const promise = saveToStorage('testKey', { value: 'test data' });
      
      // Verify chrome.storage.sync.set was called with the correct data
      expect(chrome.storage.sync.set.calledOnce).toBe(true);
      expect(chrome.storage.sync.set.firstCall.args[0]).toEqual({
        testKey: { value: 'test data' }
      });
      
      // Verify the promise resolves
      return expect(promise).resolves.toBeUndefined();
    });

    test('falls back to chrome.storage.local if sync fails', () => {
      // Create a function to save data with fallback
      const saveWithFallback = (key, data) => {
        const storageData = {};
        storageData[key] = data;
        
        return new Promise((resolve, reject) => {
          chrome.storage.sync.set(storageData, () => {
            if (chrome.runtime.lastError) {
              // Fallback to local storage
              chrome.storage.local.set(storageData, () => {
                if (chrome.runtime.lastError) {
                  reject(chrome.runtime.lastError);
                } else {
                  resolve('saved to local');
                }
              });
            } else {
              resolve('saved to sync');
            }
          });
        });
      };
      
      // Set up the error scenario before calling the function
      chrome.runtime.lastError = { message: 'Sync error' };
      
      // Override the sync.set implementation to maintain lastError during callback
      chrome.storage.sync.set = sandbox.stub().callsFake((data, callback) => {
        if (callback) {
          // Call the callback with lastError still set
          callback();
        }
        return Promise.resolve();
      });
      
      // Make sure local.set works properly and clears lastError
      chrome.storage.local.set = sandbox.stub().callsFake((data, callback) => {
        // Clear lastError before calling the local storage callback
        chrome.runtime.lastError = null;
        if (callback) callback();
        return Promise.resolve();
      });
      
      // Call the function
      const promise = saveWithFallback('testKey', { value: 'test data' });
      
      // Verify chrome.storage.local.set was called with the correct data
      expect(chrome.storage.local.set.calledOnce).toBe(true);
      expect(chrome.storage.local.set.firstCall.args[0]).toEqual({
        testKey: { value: 'test data' }
      });
      
      // Verify the promise resolves with the correct value
      return expect(promise).resolves.toBe('saved to local');
    });

    test('handles nested objects and arrays', () => {
      // Create a function to save data to storage
      const saveToStorage = (key, data) => {
        const storageData = {};
        storageData[key] = data;
        
        return new Promise((resolve, reject) => {
          chrome.storage.sync.set(storageData, () => {
            if (chrome.runtime.lastError) {
              reject(chrome.runtime.lastError);
            } else {
              resolve();
            }
          });
        });
      };
      
      // Create complex nested data
      const complexData = {
        string: 'test',
        number: 123,
        boolean: true,
        array: [1, 2, 3, { nested: 'value' }],
        object: {
          a: 1,
          b: [4, 5, 6],
          c: { deeper: { evenDeeper: 'value' } }
        }
      };
      
      // Call the function
      const promise = saveToStorage('complexKey', complexData);
      
      // Verify chrome.storage.sync.set was called with the correct data
      expect(chrome.storage.sync.set.calledOnce).toBe(true);
      expect(chrome.storage.sync.set.firstCall.args[0]).toEqual({
        complexKey: complexData
      });
      
      // Verify the promise resolves
      return expect(promise).resolves.toBeUndefined();
    });
  });

  describe('Loading Data', () => {
    test('loads data from chrome.storage.sync', () => {
      // Create a function to load data from storage
      const loadFromStorage = (key) => {
        return new Promise((resolve, reject) => {
          chrome.storage.sync.get(key, (result) => {
            if (chrome.runtime.lastError) {
              reject(chrome.runtime.lastError);
            } else {
              resolve(result[key]);
            }
          });
        });
      };
      
      // Setup chrome.storage.sync.get to return test data
      chrome.storage.sync.get.callsFake((key, callback) => {
        callback({ testKey: { value: 'test data' } });
        return Promise.resolve({ testKey: { value: 'test data' } });
      });
      
      // Call the function
      const promise = loadFromStorage('testKey');
      
      // Verify chrome.storage.sync.get was called with the correct key
      expect(chrome.storage.sync.get.calledOnce).toBe(true);
      expect(chrome.storage.sync.get.firstCall.args[0]).toBe('testKey');
      
      // Verify the promise resolves with the correct data
      return expect(promise).resolves.toEqual({ value: 'test data' });
    });

    test('falls back to chrome.storage.local if sync fails', () => {
      // Create a function to load data with fallback
      const loadWithFallback = (key) => {
        return new Promise((resolve, reject) => {
          chrome.storage.sync.get(key, (result) => {
            if (chrome.runtime.lastError) {
              // Fallback to local storage
              chrome.storage.local.get(key, (localResult) => {
                if (chrome.runtime.lastError) {
                  reject(chrome.runtime.lastError);
                } else {
                  resolve({ source: 'local', data: localResult[key] });
                }
              });
            } else {
              resolve({ source: 'sync', data: result[key] });
            }
          });
        });
      };
      
      // Create a controlled test environment
      let syncCallback;
      let localCallback;
      
      // Override sync.get to capture the callback but not execute it immediately
      chrome.storage.sync.get = sandbox.stub().callsFake((key, callback) => {
        syncCallback = callback;
        return Promise.resolve({});
      });
      
      // Override local.get to capture its callback
      chrome.storage.local.get = sandbox.stub().callsFake((key, callback) => {
        localCallback = callback;
        return Promise.resolve({ testKey: { value: 'local data' } });
      });
      
      // Call the function to test
      const loadPromise = loadWithFallback('testKey');
      
      // Now execute the callbacks in sequence with appropriate error states
      // First, execute sync.get callback with an error
      chrome.runtime.lastError = { message: 'Sync error' };
      syncCallback({});
      
      // Then execute local.get callback with success
      chrome.runtime.lastError = null;
      localCallback({ testKey: { value: 'local data' } });
      
      // Setup chrome.storage.local.get to return test data
      chrome.storage.local.get.callsFake((key, callback) => {
        callback({ testKey: { value: 'local data' } });
        return Promise.resolve({ testKey: { value: 'local data' } });
      });
      
      // Call the function
      const promise = loadWithFallback('testKey');
      
      // Verify chrome.storage.local.get was called with the correct key
      expect(chrome.storage.local.get.calledOnce).toBe(true);
      expect(chrome.storage.local.get.firstCall.args[0]).toBe('testKey');
      
      // Verify the promise resolves with the correct data
      return expect(loadPromise).resolves.toEqual({
        source: 'local',
        data: { value: 'local data' }
      });
    });

    test('loads all data when no key is specified', () => {
      // Create a function to load all data from storage
      const loadAllFromStorage = () => {
        return new Promise((resolve, reject) => {
          chrome.storage.sync.get(null, (result) => {
            if (chrome.runtime.lastError) {
              reject(chrome.runtime.lastError);
            } else {
              resolve(result);
            }
          });
        });
      };
      
      // Setup chrome.storage.sync.get to return test data
      const testData = {
        key1: { value: 'data1' },
        key2: { value: 'data2' },
        key3: { value: 'data3' }
      };
      
      chrome.storage.sync.get.callsFake((key, callback) => {
        callback(testData);
        return Promise.resolve(testData);
      });
      
      // Call the function
      const promise = loadAllFromStorage();
      
      // Verify chrome.storage.sync.get was called with null
      expect(chrome.storage.sync.get.calledOnce).toBe(true);
      expect(chrome.storage.sync.get.firstCall.args[0]).toBe(null);
      
      // Verify the promise resolves with all data
      return expect(promise).resolves.toEqual(testData);
    });
  });

  describe('Storage Quotas and Limits', () => {
    test('checks storage usage with getBytesInUse', () => {
      // Create a function to check storage usage
      const checkStorageUsage = () => {
        return new Promise((resolve, reject) => {
          chrome.storage.sync.getBytesInUse(null, (bytesInUse) => {
            if (chrome.runtime.lastError) {
              reject(chrome.runtime.lastError);
            } else {
              resolve(bytesInUse);
            }
          });
        });
      };
      
      // Setup chrome.storage.sync.getBytesInUse to return a value
      chrome.storage.sync.getBytesInUse.callsFake((key, callback) => {
        callback(1024); // 1KB
        return Promise.resolve(1024);
      });
      
      // Call the function
      const promise = checkStorageUsage();
      
      // Verify chrome.storage.sync.getBytesInUse was called
      expect(chrome.storage.sync.getBytesInUse.calledOnce).toBe(true);
      
      // Verify the promise resolves with the correct value
      return expect(promise).resolves.toBe(1024);
    });

    test('handles QUOTA_BYTES_PER_ITEM exceeded error', () => {
      // Create a function to save data to storage with size check
      const saveWithSizeCheck = (key, data) => {
        const storageData = {};
        storageData[key] = data;
        
        // Convert to JSON to check size
        const jsonData = JSON.stringify(storageData);
        const byteSize = new TextEncoder().encode(jsonData).length;
        
        // Chrome's QUOTA_BYTES_PER_ITEM is 8192 bytes
        const QUOTA_BYTES_PER_ITEM = 8192;
        
        if (byteSize > QUOTA_BYTES_PER_ITEM) {
          return Promise.reject(new Error('QUOTA_BYTES_PER_ITEM exceeded'));
        }
        
        return new Promise((resolve, reject) => {
          chrome.storage.sync.set(storageData, () => {
            if (chrome.runtime.lastError) {
              reject(chrome.runtime.lastError);
            } else {
              resolve();
            }
          });
        });
      };
      
      // Create a large data object that exceeds the quota
      const largeData = { value: 'x'.repeat(10000) }; // More than 8KB
      
      // Call the function
      const promise = saveWithSizeCheck('largeKey', largeData);
      
      // Verify the promise rejects with the correct error
      return expect(promise).rejects.toThrow('QUOTA_BYTES_PER_ITEM exceeded');
    });
  });

  describe('Data Format Handling', () => {
    test('handles legacy string format', () => {
      // Create a function to process storage data
      const processStorageData = (data, key) => {
        const js = data[key];
        
        // Normalize data structure - handle legacy formats
        if (typeof js === 'string') {
          // Legacy string format
          return { code: js, enabled: true, library: '' };
        } else if (typeof js === 'undefined' || js === null) {
          // No data found
          return { code: '', enabled: true, library: '' };
        } else if (typeof js === 'object') {
          // Ensure all required properties exist with defaults
          return {
            code: js.code || '',
            enabled: js.enabled !== undefined ? js.enabled : true,
            library: js.library || ''
          };
        }
        
        return js;
      };
      
      // Test with legacy string format
      const legacyData = { 'runjavascript_example.com': 'console.log("legacy code")' };
      const processed = processStorageData(legacyData, 'runjavascript_example.com');
      
      // Verify the result
      expect(processed).toEqual({
        code: 'console.log("legacy code")',
        enabled: true,
        library: ''
      });
    });

    test('handles missing data', () => {
      // Create a function to process storage data
      const processStorageData = (data, key) => {
        const js = data[key];
        
        // Normalize data structure - handle legacy formats
        if (typeof js === 'string') {
          // Legacy string format
          return { code: js, enabled: true, library: '' };
        } else if (typeof js === 'undefined' || js === null) {
          // No data found
          return { code: '', enabled: true, library: '' };
        } else if (typeof js === 'object') {
          // Ensure all required properties exist with defaults
          return {
            code: js.code || '',
            enabled: js.enabled !== undefined ? js.enabled : true,
            library: js.library || ''
          };
        }
        
        return js;
      };
      
      // Test with missing data
      const emptyData = {};
      const processed = processStorageData(emptyData, 'runjavascript_example.com');
      
      // Verify the result
      expect(processed).toEqual({
        code: '',
        enabled: true,
        library: ''
      });
    });

    test('handles object format with missing properties', () => {
      // Create a function to process storage data
      const processStorageData = (data, key) => {
        const js = data[key];
        
        // Normalize data structure - handle legacy formats
        if (typeof js === 'string') {
          // Legacy string format
          return { code: js, enabled: true, library: '' };
        } else if (typeof js === 'undefined' || js === null) {
          // No data found
          return { code: '', enabled: true, library: '' };
        } else if (typeof js === 'object') {
          // Ensure all required properties exist with defaults
          return {
            code: js.code || '',
            enabled: js.enabled !== undefined ? js.enabled : true,
            library: js.library || ''
          };
        }
        
        return js;
      };
      
      // Test with object format missing properties
      const partialData = { 'runjavascript_example.com': { code: 'console.log("test")' } };
      const processed = processStorageData(partialData, 'runjavascript_example.com');
      
      // Verify the result
      expect(processed).toEqual({
        code: 'console.log("test")',
        enabled: true,
        library: ''
      });
    });

    test('handles string boolean values', () => {
      // Create a function to process storage data
      const processStorageData = (data, key) => {
        const js = data[key];
        
        // Normalize data structure - handle legacy formats
        if (typeof js === 'string') {
          // Legacy string format
          return { code: js, enabled: true, library: '' };
        } else if (typeof js === 'undefined' || js === null) {
          // No data found
          return { code: '', enabled: true, library: '' };
        } else if (typeof js === 'object') {
          // Ensure all required properties exist with defaults
          const result = {
            code: js.code || '',
            enabled: js.enabled !== undefined ? js.enabled : true,
            library: js.library || ''
          };
          
          // Convert string boolean to actual boolean for enabled flag
          if (result.enabled === 'true') result.enabled = true;
          if (result.enabled === 'false') result.enabled = false;
          
          return result;
        }
        
        return js;
      };
      
      // Test with string boolean values
      const stringBooleanData = { 
        'runjavascript_example.com': { 
          code: 'console.log("test")',
          enabled: 'true',
          library: 'jquery_3_3_1'
        } 
      };
      const processed = processStorageData(stringBooleanData, 'runjavascript_example.com');
      
      // Verify the result
      expect(processed).toEqual({
        code: 'console.log("test")',
        enabled: true,
        library: 'jquery_3_3_1'
      });
      
      // Test with string 'false'
      const stringFalseData = { 
        'runjavascript_example.com': { 
          code: 'console.log("test")',
          enabled: 'false',
          library: 'jquery_3_3_1'
        } 
      };
      const processedFalse = processStorageData(stringFalseData, 'runjavascript_example.com');
      
      // Verify the result
      expect(processedFalse).toEqual({
        code: 'console.log("test")',
        enabled: false,
        library: 'jquery_3_3_1'
      });
    });
  });

  describe('Integration with Extension', () => {
    test('saves and loads script for a domain', async () => {
      // Create a mock storage
      const mockStorage = createMockStorage();
      
      // Override chrome.storage methods
      chrome.storage.sync.get.callsFake(mockStorage.get);
      chrome.storage.sync.set.callsFake(mockStorage.set);
      
      // Create functions to save and load scripts
      const saveScript = (host, code, enabled = true, library = '') => {
        const key = 'runjavascript_' + host;
        const data = { [key]: { code, enabled, library } };
        
        return new Promise((resolve, reject) => {
          chrome.storage.sync.set(data, () => {
            if (chrome.runtime.lastError) {
              reject(chrome.runtime.lastError);
            } else {
              resolve();
            }
          });
        });
      };
      
      const loadScript = (host) => {
        const key = 'runjavascript_' + host;
        
        return new Promise((resolve, reject) => {
          chrome.storage.sync.get(key, (result) => {
            if (chrome.runtime.lastError) {
              reject(chrome.runtime.lastError);
            } else {
              resolve(result[key]);
            }
          });
        });
      };
      
      // Save a script
      await saveScript('example.com', 'console.log("test script")', true, 'jquery_3_3_1');
      
      // Load the script
      const loadedScript = await loadScript('example.com');
      
      // Verify the loaded script matches what was saved
      expect(loadedScript).toEqual({
        code: 'console.log("test script")',
        enabled: true,
        library: 'jquery_3_3_1'
      });
    });
  });
});