import { describe, test, expect, beforeEach, afterEach, mock } from 'bun:test';
import sinon from 'sinon';
import { JSDOM } from 'jsdom';
import { setupPopupTest, wait, createMockTab } from './utils/test-helpers.js';

describe('Integration Tests', () => {
  let chrome;
  let sandbox;

  // Setup before each test
  beforeEach(() => {
    sandbox = sinon.createSandbox();
    
    // Get the mocked chrome API
    chrome = global.chrome;
    
    // Reset chrome mocks
    chrome.runtime.sendMessage.reset();
    chrome.tabs.query.reset();
    chrome.storage.sync.get.reset();
    chrome.storage.sync.set.reset();
    chrome.scripting.executeScript.reset();
    
    // Clear runtime errors
    chrome.runtime.lastError = null;
  });

  // Cleanup after each test
  afterEach(() => {
    sandbox.restore();
  });

  describe('Popup to Background Communication', () => {
    test('popup sends execute_script message to background', async () => {
      // Create a mock message handler for the background script
      const backgroundMessageHandler = sandbox.stub();
      
      // Override chrome.runtime.sendMessage to simulate the background script receiving the message
      chrome.runtime.sendMessage.callsFake((message, callback) => {
        backgroundMessageHandler(message);
        if (callback) callback({ success: true });
        return Promise.resolve({ success: true });
      });
      
      // Create a function to simulate the popup sending a message to execute a script
      const executeScript = (tabId, code, library) => {
        return new Promise((resolve, reject) => {
          chrome.runtime.sendMessage({
            action: 'execute_script',
            tabId: tabId,
            code: code,
            library: library
          }, (response) => {
            if (chrome.runtime.lastError) {
              reject(chrome.runtime.lastError);
            } else {
              resolve(response);
            }
          });
        });
      };
      
      // Execute the function
      await executeScript(123, 'console.log("test")', 'jquery_3_3_1');
      
      // Verify the background message handler was called with the correct message
      expect(backgroundMessageHandler.calledOnce).toBe(true);
      expect(backgroundMessageHandler.firstCall.args[0]).toEqual({
        action: 'execute_script',
        tabId: 123,
        code: 'console.log("test")',
        library: 'jquery_3_3_1'
      });
    });

    test('background executes script in response to popup message', async () => {
      // Create a mock executeScriptInTab function for the background script
      const executeScriptInTab = sandbox.stub();
      
      // Create a mock message handler for the background script
      const onMessageHandler = (message, sender, sendResponse) => {
        if (message.action === 'execute_script') {
          executeScriptInTab(message.tabId, message.code, message.library);
          sendResponse({ success: true });
        }
        return true;
      };
      
      // Override chrome.runtime.sendMessage to simulate the background script handling the message
      chrome.runtime.sendMessage.callsFake((message, callback) => {
        const response = onMessageHandler(message, {}, callback);
        return Promise.resolve(response);
      });
      
      // Create a function to simulate the popup sending a message to execute a script
      const executeScript = (tabId, code, library) => {
        return new Promise((resolve, reject) => {
          chrome.runtime.sendMessage({
            action: 'execute_script',
            tabId: tabId,
            code: code,
            library: library
          }, (response) => {
            if (chrome.runtime.lastError) {
              reject(chrome.runtime.lastError);
            } else {
              resolve(response);
            }
          });
        });
      };
      
      // Execute the function
      await executeScript(123, 'console.log("test")', 'jquery_3_3_1');
      
      // Verify executeScriptInTab was called with the correct arguments
      expect(executeScriptInTab.calledOnce).toBe(true);
      expect(executeScriptInTab.calledWith(
        123,
        'console.log("test")',
        'jquery_3_3_1'
      )).toBe(true);
    });
  });

  describe('Content Script to Background Communication', () => {
    test('content script sends content_script_loaded message to background', async () => {
      // Create a mock message handler for the background script
      const backgroundMessageHandler = sandbox.stub();
      
      // Override chrome.runtime.sendMessage to simulate the background script receiving the message
      chrome.runtime.sendMessage.callsFake((message, callback) => {
        backgroundMessageHandler(message);
        if (callback) callback({ success: true });
        return Promise.resolve({ success: true });
      });
      
      // Create a function to simulate the content script sending a message
      const contentScriptLoaded = () => {
        return new Promise((resolve, reject) => {
          chrome.runtime.sendMessage({ action: 'content_script_loaded' }, (response) => {
            if (chrome.runtime.lastError) {
              reject(chrome.runtime.lastError);
            } else {
              resolve(response);
            }
          });
        });
      };
      
      // Execute the function
      await contentScriptLoaded();
      
      // Verify the background message handler was called with the correct message
      expect(backgroundMessageHandler.calledOnce).toBe(true);
      expect(backgroundMessageHandler.firstCall.args[0]).toEqual({
        action: 'content_script_loaded'
      });
    });

    test('background executes script for tab in response to content_script_loaded message', async () => {
      // Create a mock executeScriptForTab function for the background script
      const executeScriptForTab = sandbox.stub();
      
      // Create a mock message handler for the background script
      const onMessageHandler = (message, sender, sendResponse) => {
        if (message.action === 'content_script_loaded' && sender.tab) {
          executeScriptForTab(sender.tab);
          sendResponse({ success: true });
        }
        return true;
      };
      
      // Override chrome.runtime.sendMessage to simulate the background script handling the message
      chrome.runtime.sendMessage.callsFake((message, callback) => {
        const sender = { tab: { id: 123, url: 'https://example.com' } };
        const response = onMessageHandler(message, sender, callback);
        return Promise.resolve(response);
      });
      
      // Create a function to simulate the content script sending a message
      const contentScriptLoaded = () => {
        return new Promise((resolve, reject) => {
          chrome.runtime.sendMessage({ action: 'content_script_loaded' }, (response) => {
            if (chrome.runtime.lastError) {
              reject(chrome.runtime.lastError);
            } else {
              resolve(response);
            }
          });
        });
      };
      
      // Execute the function
      await contentScriptLoaded();
      
      // Verify executeScriptForTab was called with the correct tab
      expect(executeScriptForTab.calledOnce).toBe(true);
      expect(executeScriptForTab.firstCall.args[0]).toEqual({
        id: 123,
        url: 'https://example.com'
      });
    });
  });

  describe('End-to-End Workflow', () => {
    test('save script in popup and execute in tab', async () => {
      // Setup test environment
      const testEnv = setupPopupTest({
        tabData: { id: 123, url: 'https://example.com', active: true, currentWindow: true },
        storageData: {}
      });
      
      const document = testEnv.document;
      const editor = testEnv.editor;
      
      // Mock the ace editor
      global.ace = {
        edit: sandbox.stub().returns(editor)
      };
      
      // Create a mock executeScriptInTab function for the background script
      const executeScriptInTab = sandbox.stub();
      
      // Create a mock message handler for the background script
      const onMessageHandler = (message, sender, sendResponse) => {
        if (message.action === 'execute_script') {
          executeScriptInTab(message.tabId, message.code, message.library);
          sendResponse({ success: true });
        }
        return true;
      };
      
      // Override chrome.runtime.sendMessage to simulate the background script handling the message
      chrome.runtime.sendMessage.callsFake((message, callback) => {
        const response = onMessageHandler(message, {}, callback);
        return Promise.resolve(response);
      });
      
      // Setup the editor with test code
      editor.getValue.returns('console.log("test script")');
      
      // Select a jQuery library
      document.getElementById('slLibrary').value = 'jquery_3_3_1';
      
      // Create a function to simulate saving changes in the popup
      const saveChanges = () => {
        const _code = editor.getValue();
        const library = document.getElementById('slLibrary').value;
        const enabled = true;
        const host = 'example.com';
        
        const js = {'code': _code, 'enabled': enabled, 'library': library};
        const _data = {};
        _data['runjavascript_' + host] = js;
        
        return new Promise((resolve, reject) => {
          chrome.storage.sync.set(_data, () => {
            if (chrome.runtime.lastError) {
              reject(chrome.runtime.lastError);
            } else {
              chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
                if (tabs && tabs[0] && tabs[0].id) {
                  chrome.runtime.sendMessage({
                    action: 'execute_script',
                    tabId: tabs[0].id,
                    code: js.code,
                    library: library
                  }, (response) => {
                    resolve(response);
                  });
                } else {
                  reject(new Error('No active tab found'));
                }
              });
            }
          });
        });
      };
      
      // Execute the function
      await saveChanges();
      
      // Verify chrome.storage.sync.set was called with the correct data
      expect(chrome.storage.sync.set.calledOnce).toBe(true);
      
      // Get the first argument passed to chrome.storage.sync.set
      const setCall = chrome.storage.sync.set.getCall(0);
      expect(setCall).not.toBe(null);
      
      const setArg = setCall.args[0];
      console.log('Storage set argument:', JSON.stringify(setArg));
      
      // Check if the argument has the expected structure
      expect(typeof setArg).toBe('object');
      expect(Object.keys(setArg)).toContain('runjavascript_example.com');
      
      // Verify the content of the saved data
      const savedData = setArg['runjavascript_example.com'];
      expect(savedData).toEqual({
        code: 'console.log("test script")',
        enabled: true,
        library: 'jquery_3_3_1'
      });
      
      // Verify executeScriptInTab was called with the correct arguments
      expect(executeScriptInTab.calledOnce).toBe(true);
      expect(executeScriptInTab.calledWith(
        123,
        'console.log("test script")',
        'jquery_3_3_1'
      )).toBe(true);
    });

    test('load and execute script when tab is activated', async () => {
      // Setup storage with a test script
      chrome.storage.sync.get.callsFake((key, callback) => {
        if (key === 'runjavascript_example.com') {
          callback({
            'runjavascript_example.com': {
              code: 'console.log("activated tab script")',
              enabled: true,
              library: 'jquery_2_2_4'
            }
          });
        } else {
          callback({});
        }
        return Promise.resolve();
      });
      
      // Create a mock executeScriptInTab function
      const executeScriptInTab = sandbox.stub();
      
      // Create a function to extract hostname from URL
      const extractHostname = (url) => {
        if (!url) return;
        let hostname;
        if (url.indexOf("://") > -1) {
          hostname = url.split('/')[2];
        } else {
          hostname = url.split('/')[0];
        }
        hostname = hostname.split(':')[0];
        hostname = hostname.split('?')[0];
        return hostname;
      };
      
      // Create a function to process storage data
      const processBackgroundStorageData = (data, key, tab) => {
        const js = data[key];
        
        if (typeof js === 'undefined') {
          return;
        } else if (typeof js === 'string') {
          if (js) {
            executeScriptInTab(tab.id, js, '');
          }
        } else if (js.enabled && js.code) {
          executeScriptInTab(tab.id, js.code, js.library);
        }
      };
      
      // Create a function to execute script for a tab
      const executeScriptForTab = (tab) => {
        if (!tab.url) {
          return; // Skip if no URL
        }
        
        const host = extractHostname(tab.url);
        const key = 'runjavascript_' + host;
        
        chrome.storage.sync.get(key, (data) => {
          processBackgroundStorageData(data, key, tab);
        });
      };
      
      // Create a function to handle tab activation
      const onActivatedHandler = (activeInfo) => {
        chrome.tabs.get(activeInfo.tabId, (tab) => {
          executeScriptForTab(tab);
        });
      };
      
      // Setup chrome.tabs.get to return a mock tab
      chrome.tabs.get.callsFake((tabId, callback) => {
        callback({ id: tabId, url: 'https://example.com' });
        return Promise.resolve({ id: tabId, url: 'https://example.com' });
      });
      
      // Simulate tab activation
      onActivatedHandler({ tabId: 123 });
      
      // Wait for async operations to complete
      await wait(10);
      
      // Verify executeScriptInTab was called with the correct arguments
      expect(executeScriptInTab.calledOnce).toBe(true);
      expect(executeScriptInTab.calledWith(
        123,
        'console.log("activated tab script")',
        'jquery_2_2_4'
      )).toBe(true);
    });

    test('load and execute script when page is loaded', async () => {
      // Setup storage with a test script
      chrome.storage.sync.get.callsFake((key, callback) => {
        if (key === 'runjavascript_example.com') {
          callback({
            'runjavascript_example.com': {
              code: 'console.log("page loaded script")',
              enabled: true,
              library: 'jquery_1_12_4'
            }
          });
        } else {
          callback({});
        }
        return Promise.resolve();
      });
      
      // Create a mock executeScriptInTab function
      const executeScriptInTab = sandbox.stub();
      
      // Create a function to extract hostname from URL
      const extractHostname = (url) => {
        if (!url) return;
        let hostname;
        if (url.indexOf("://") > -1) {
          hostname = url.split('/')[2];
        } else {
          hostname = url.split('/')[0];
        }
        hostname = hostname.split(':')[0];
        hostname = hostname.split('?')[0];
        return hostname;
      };
      
      // Create a function to process storage data
      const processBackgroundStorageData = (data, key, tab) => {
        const js = data[key];
        
        if (typeof js === 'undefined') {
          return;
        } else if (typeof js === 'string') {
          if (js) {
            executeScriptInTab(tab.id, js, '');
          }
        } else if (js.enabled && js.code) {
          executeScriptInTab(tab.id, js.code, js.library);
        }
      };
      
      // Create a function to execute script for a tab
      const executeScriptForTab = (tab) => {
        if (!tab.url) {
          return; // Skip if no URL
        }
        
        const host = extractHostname(tab.url);
        const key = 'runjavascript_' + host;
        
        chrome.storage.sync.get(key, (data) => {
          processBackgroundStorageData(data, key, tab);
        });
      };
      
      // Create a function to handle tab updates
      const onUpdatedHandler = (tabId, changeInfo, tab) => {
        if (changeInfo.status === 'complete' && tab.url) {
          executeScriptForTab(tab);
        }
      };
      
      // Simulate tab update with complete status
      onUpdatedHandler(
        123,
        { status: 'complete' },
        { id: 123, url: 'https://example.com' }
      );
      
      // Wait for async operations to complete
      await wait(10);
      
      // Verify executeScriptInTab was called with the correct arguments
      expect(executeScriptInTab.calledOnce).toBe(true);
      expect(executeScriptInTab.calledWith(
        123,
        'console.log("page loaded script")',
        'jquery_1_12_4'
      )).toBe(true);
    });
  });

  describe('Error Handling', () => {
    test('handles storage errors gracefully', async () => {
      // Create a function to save data with error handling
      const saveWithErrorHandling = (key, data) => {
        const storageData = {};
        storageData[key] = data;
        
        return new Promise((resolve, reject) => {
          chrome.storage.sync.set(storageData, () => {
            if (chrome.runtime.lastError) {
              console.error('Error saving to sync storage:', chrome.runtime.lastError);
              
              // Fallback to local storage
              chrome.storage.local.set(storageData, () => {
                if (chrome.runtime.lastError) {
                  console.error('Error saving to local storage:', chrome.runtime.lastError);
                  reject(chrome.runtime.lastError);
                } else {
                  resolve({ source: 'local' });
                }
              });
            } else {
              resolve({ source: 'sync' });
            }
          });
        });
      };
      
      // Make sync.set fail with lastError
      chrome.storage.sync.set.callsFake((data, callback) => {
        // Set the lastError before calling the callback
        chrome.runtime.lastError = { message: 'Sync error' };
        
        // Call the callback with the error present
        if (callback) callback();
        
        // Reset lastError after callback is called
        setTimeout(() => {
          chrome.runtime.lastError = null;
        }, 0);
        
        return Promise.resolve();
      });
      
      // Make local.set succeed
      chrome.storage.local.set.callsFake((data, callback) => {
        // No error for local storage
        chrome.runtime.lastError = null;
        if (callback) callback();
        return Promise.resolve();
      });
      
      // Call the function
      const result = await saveWithErrorHandling('testKey', { value: 'test data' });
      
      // Verify chrome.storage.local.set was called as fallback
      expect(chrome.storage.local.set.calledOnce).toBe(true);
      
      // Verify the result indicates local storage was used
      expect(result).toEqual({ source: 'local' });
    });

    test('handles script execution errors gracefully', async () => {
      // Create a mock executeScriptInTab function with error handling
      const executeScriptInTab = async (tabId, code, library = '') => {
        try {
          if (library && library !== '') {
            await chrome.scripting.executeScript({
              target: { tabId: tabId },
              files: [`lib_${library}.js`],
              world: 'MAIN'
            });
          }
          
          await chrome.scripting.executeScript({
            target: { tabId: tabId },
            func: (userCode) => {
              try {
                eval(userCode);
              } catch (error) {
                console.error('Error executing user code:', error);
              }
            },
            args: [code],
            world: 'MAIN'
          });
          
          return { success: true };
        } catch (error) {
          console.error('Error in executeScriptInTab:', error);
          return { success: false, error: error.message };
        }
      };
      
      // Make scripting.executeScript fail
      chrome.scripting.executeScript.rejects(new Error('Script execution failed'));
      
      // Call the function
      const result = await executeScriptInTab(123, 'console.log("test")', 'jquery_3_3_1');
      
      // Verify the function handled the error gracefully
      expect(result).toEqual({
        success: false,
        error: 'Script execution failed'
      });
    });
  });
});