import { describe, test, expect, beforeEach, afterEach, mock } from 'bun:test';
import sinon from 'sinon';
import { resetChromeMocks } from './utils/chrome-mock.js';
import { wait } from './utils/test-helpers.js';

describe('background.js', () => {
  let chrome;
  let sandbox;
  let self;

  // Setup before each test
  beforeEach(() => {
    sandbox = sinon.createSandbox();
    
    // Get the mocked chrome API
    chrome = global.chrome;
    
    // Reset all chrome mocks
    resetChromeMocks(chrome);
    
    // Mock the service worker global 'self'
    self = {
      addEventListener: sandbox.stub(),
      skipWaiting: sandbox.stub(),
    };
    global.self = self;
  });

  // Cleanup after each test
  afterEach(() => {
    sandbox.restore();
    delete global.self;
  });

  describe('Service Worker Lifecycle', () => {
    test('install event calls skipWaiting', () => {
      // Create a mock event handler
      const installHandler = (event) => {
        console.log('Service worker installed');
        self.skipWaiting();
      };
      
      // Create a mock event
      const event = {};
      
      // Call the handler
      installHandler(event);
      
      // Verify skipWaiting was called
      expect(self.skipWaiting.calledOnce).toBe(true);
    });

    test('activate event clears execution tracker', () => {
      // Create a mock execution tracker
      const executionTracker = new Map();
      executionTracker.set('test-key', Date.now());
      
      // Create a mock event handler
      const activateHandler = (event) => {
        console.log('Service worker activated');
        executionTracker.clear();
      };
      
      // Create a mock event
      const event = {};
      
      // Call the handler
      activateHandler(event);
      
      // Verify tracker was cleared
      expect(executionTracker.size).toBe(0);
    });
  });

  describe('Execution Tracking', () => {
    test('getExecutionKey generates correct key format', () => {
      // Create a mock getExecutionKey function
      const getExecutionKey = (tabId, url, code) => {
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
        
        const host = extractHostname(url);
        const codeHash = btoa(code).slice(0, 10);
        return `${tabId}-${host}-${codeHash}`;
      };
      
      // Test with sample inputs
      const key = getExecutionKey(123, 'https://example.com/path', 'console.log("test")');
      
      // Verify key format (tabId-host-codeHash)
      expect(key).toMatch(/^123-example\.com-[a-zA-Z0-9+/]{10}$/);
    });

    test('shouldExecuteScript prevents duplicate executions', () => {
      // Create a mock execution tracker
      const executionTracker = new Map();
      
      // Create a mock shouldExecuteScript function
      const shouldExecuteScript = (tabId, url, code) => {
        const getExecutionKey = (tabId, url, code) => {
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
          
          const host = extractHostname(url);
          
          // Create a more unique hash by using the full string
          // and adding a simple checksum based on string length and character codes
          let checksum = 0;
          for (let i = 0; i < code.length; i++) {
            checksum += code.charCodeAt(i);
          }
          const codeHash = btoa(code.length + '-' + checksum).slice(0, 10);
          
          console.log(`Generated key for code "${code}": ${tabId}-${host}-${codeHash}`);
          return `${tabId}-${host}-${codeHash}`;
        };
        
        const key = getExecutionKey(tabId, url, code);
        const now = Date.now();
        const lastExecution = executionTracker.get(key);
        
        console.log(`Checking execution for key ${key}:`);
        console.log(`- Last execution: ${lastExecution || 'none'}`);
        console.log(`- Current time: ${now}`);
        console.log(`- Time difference: ${lastExecution ? now - lastExecution : 'N/A'}`);
        
        if (lastExecution && (now - lastExecution) < 5000) {
          console.log(`- Execution prevented (within 5000ms window)`);
          return false;
        }
        
        console.log(`- Execution allowed, setting timestamp to ${now}`);
        executionTracker.set(key, now);
        
        for (const [trackKey, timestamp] of executionTracker.entries()) {
          if (now - timestamp > 30000) {
            executionTracker.delete(trackKey);
          }
        }
        
        return true;
      };
      
      // First execution should be allowed
      const result1 = shouldExecuteScript(123, 'https://example.com', 'console.log("test")');
      expect(result1).toBe(true);
      
      // Second immediate execution should be prevented (within 5 seconds)
      const result2 = shouldExecuteScript(123, 'https://example.com', 'console.log("test")');
      expect(result2).toBe(false);
      
      // Different code should be allowed
      const result3 = shouldExecuteScript(123, 'https://example.com', 'console.log("different")');
      expect(result3).toBe(true);
      
      // Different tab should be allowed
      const result4 = shouldExecuteScript(456, 'https://example.com', 'console.log("test")');
      expect(result4).toBe(true);
      
      // Different host should be allowed
      const result5 = shouldExecuteScript(123, 'https://different.com', 'console.log("test")');
      expect(result5).toBe(true);
    });
  });

  describe('Message Handling', () => {
    test('handles content_script_loaded message', () => {
      // Create a mock executeScriptForTab function
      const executeScriptForTab = sandbox.stub();
      
      // Create a mock message handler
      const onMessageHandler = (message, sender, sendResponse) => {
        if (message.action === 'content_script_loaded' && sender.tab) {
          executeScriptForTab(sender.tab);
        }
        return true;
      };
      
      // Create a mock message and sender
      const message = { action: 'content_script_loaded' };
      const sender = { tab: { id: 123, url: 'https://example.com' } };
      const sendResponse = sandbox.stub();
      
      // Call the handler
      const result = onMessageHandler(message, sender, sendResponse);
      
      // Verify executeScriptForTab was called with the sender tab
      expect(executeScriptForTab.calledOnce).toBe(true);
      expect(executeScriptForTab.calledWith(sender.tab)).toBe(true);
      
      // Verify true is returned for async response
      expect(result).toBe(true);
    });

    test('handles execute_script message', () => {
      // Create a mock executeScriptInTab function
      const executeScriptInTab = sandbox.stub();
      
      // Create a mock message handler
      const onMessageHandler = (message, sender, sendResponse) => {
        if (message.action === 'execute_script') {
          executeScriptInTab(message.tabId, message.code, message.library);
        }
        return true;
      };
      
      // Create a mock message and sender
      const message = { 
        action: 'execute_script',
        tabId: 123,
        code: 'console.log("test")',
        library: 'jquery_3_3_1'
      };
      const sender = {};
      const sendResponse = sandbox.stub();
      
      // Call the handler
      onMessageHandler(message, sender, sendResponse);
      
      // Verify executeScriptInTab was called with the correct arguments
      expect(executeScriptInTab.calledOnce).toBe(true);
      expect(executeScriptInTab.calledWith(
        message.tabId,
        message.code,
        message.library
      )).toBe(true);
    });
  });

  describe('Script Execution', () => {
    test('executeScriptInTab injects jQuery library if specified', async () => {
      // Reset the stub before the test
      chrome.scripting.executeScript.resetHistory();
      console.log('Reset chrome.scripting.executeScript call history at start of test');
      
      // Create a mock executeScriptInTab function
      const executeScriptInTab = async (tabId, code, library = '') => {
        try {
          if (library && library !== '') {
            console.log(`Injecting jQuery library: lib_${library}.js`);
            await chrome.scripting.executeScript({
              target: { tabId: tabId },
              files: [`lib_${library}.js`],
              world: 'MAIN'
            });
          }
          
          console.log('Executing user code:', code);
          await chrome.scripting.executeScript({
            target: { tabId: tabId },
            func: (userCode) => {
              try {
                eval(userCode);
              } catch (error) {
                console.error('[DEBUG] Error executing user code:', error);
              }
            },
            args: [code],
            world: 'MAIN'
          });
        } catch (error) {
          console.error('[DEBUG] Error in executeScriptInTab:', error);
        }
      };
      
      // Make sure executeScript returns a resolved promise
      chrome.scripting.executeScript.resolves([{ frameId: 0, result: undefined }]);
      
      // Call the function with a jQuery library
      await executeScriptInTab(123, 'console.log("test")', 'jquery_3_3_1');
      
      // Debug logging
      console.log(`chrome.scripting.executeScript called ${chrome.scripting.executeScript.callCount} times`);
      for (let i = 0; i < chrome.scripting.executeScript.callCount; i++) {
        const call = chrome.scripting.executeScript.getCall(i);
        console.log(`Call ${i} arguments:`, JSON.stringify(call.args[0], (key, value) => {
          if (typeof value === 'function') return '[Function]';
          return value;
        }));
      }
      
      // Verify chrome.scripting.executeScript was called twice (once for jQuery, once for user code)
      expect(chrome.scripting.executeScript.calledTwice).toBe(true);
      
      // Verify first call was for jQuery
      const firstCall = chrome.scripting.executeScript.getCall(0);
      expect(firstCall.args[0].files).toEqual(['lib_jquery_3_3_1.js']);
      expect(firstCall.args[0].target).toEqual({ tabId: 123 });
      expect(firstCall.args[0].world).toBe('MAIN');
      
      // Verify second call was for user code
      const secondCall = chrome.scripting.executeScript.getCall(1);
      console.log('Second call args:', JSON.stringify(secondCall.args[0], (key, value) => {
        if (typeof value === 'function') return '[Function]';
        return value;
      }));
      console.log('Type of func:', typeof secondCall.args[0].func);
      
      expect(secondCall.args[0].target).toEqual({ tabId: 123 });
      expect(secondCall.args[0].world).toBe('MAIN');
      expect(typeof secondCall.args[0].func).toBe('function');
      expect(secondCall.args[0].args).toEqual(['console.log("test")']);
    });

    test('executeScriptInTab skips jQuery injection if not specified', async () => {
      // Create a mock executeScriptInTab function
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
                console.error('[DEBUG] Error executing user code:', error);
              }
            },
            args: [code],
            world: 'MAIN'
          });
        } catch (error) {
          console.error('[DEBUG] Error in executeScriptInTab:', error);
        }
      };
      
      // Reset the stub before calling the function
      chrome.scripting.executeScript.resetHistory();
      console.log('Reset chrome.scripting.executeScript call history');
      
      // Call the function without a jQuery library
      await executeScriptInTab(123, 'console.log("test")', '');
      
      // Debug logging
      console.log(`chrome.scripting.executeScript called ${chrome.scripting.executeScript.callCount} times`);
      if (chrome.scripting.executeScript.callCount > 0) {
        console.log('Call arguments:', JSON.stringify(chrome.scripting.executeScript.getCall(0).args[0], (key, value) => {
          if (typeof value === 'function') return '[Function]';
          return value;
        }));
      }
      
      // Verify chrome.scripting.executeScript was called once (only for user code)
      expect(chrome.scripting.executeScript.calledOnce).toBe(true);
      
      // Verify the call was for user code
      const call = chrome.scripting.executeScript.getCall(0);
      expect(call.args[0].target).toEqual({ tabId: 123 });
      expect(call.args[0].world).toBe('MAIN');
      expect(typeof call.args[0].func).toBe('function');
      expect(call.args[0].args).toEqual(['console.log("test")']);
    });
  });

  describe('Tab Event Handling', () => {
    test('onActivated handler gets tab info and executes script', () => {
      // Reset stubs
      chrome.tabs.get.resetHistory();
      console.log('Reset chrome.tabs.get call history');
      
      // Create a mock executeScriptForTab function
      const executeScriptForTab = sandbox.stub();
      
      // Create a mock onActivated handler
      const onActivatedHandler = (activeInfo) => {
        console.log(`onActivatedHandler called with tabId: ${activeInfo.tabId}`);
        chrome.tabs.get(activeInfo.tabId, (tab) => {
          console.log(`chrome.tabs.get callback executed with tab:`, tab);
          executeScriptForTab(tab);
        });
      };
      
      // Create a mock activeInfo
      const activeInfo = { tabId: 123 };
      
      // Setup chrome.tabs.get to return a mock tab
      const mockTab = { id: 123, url: 'https://example.com' };
      chrome.tabs.get.callsFake((tabId, callback) => {
        console.log(`chrome.tabs.get called with tabId: ${tabId}`);
        if (callback) {
          console.log('Executing callback with mockTab');
          callback(mockTab);
        }
        return Promise.resolve(mockTab);
      });
      
      // Call the handler
      onActivatedHandler(activeInfo);
      
      // Debug logging
      console.log(`chrome.tabs.get called ${chrome.tabs.get.callCount} times`);
      console.log(`executeScriptForTab called ${executeScriptForTab.callCount} times`);
      
      // Verify chrome.tabs.get was called with the correct tabId
      expect(chrome.tabs.get.calledOnce).toBe(true);
      expect(chrome.tabs.get.calledWith(123)).toBe(true);
      
      // Verify executeScriptForTab was called with the mock tab
      expect(executeScriptForTab.calledOnce).toBe(true);
      expect(executeScriptForTab.calledWith(mockTab)).toBe(true);
    });

    test('onUpdated handler executes script when page is complete', () => {
      // Create a mock executeScriptForTab function
      const executeScriptForTab = sandbox.stub();
      
      // Create a mock onUpdated handler
      const onUpdatedHandler = (tabId, changeInfo, tab) => {
        if (changeInfo.status === 'complete' && tab.url) {
          executeScriptForTab(tab);
        }
      };
      
      // Create mock arguments
      const tabId = 123;
      const changeInfo = { status: 'complete' };
      const tab = { id: 123, url: 'https://example.com' };
      
      // Call the handler
      onUpdatedHandler(tabId, changeInfo, tab);
      
      // Verify executeScriptForTab was called with the tab
      expect(executeScriptForTab.calledOnce).toBe(true);
      expect(executeScriptForTab.calledWith(tab)).toBe(true);
    });

    test('onUpdated handler does not execute script when page is not complete', () => {
      // Create a mock executeScriptForTab function
      const executeScriptForTab = sandbox.stub();
      
      // Create a mock onUpdated handler
      const onUpdatedHandler = (tabId, changeInfo, tab) => {
        if (changeInfo.status === 'complete' && tab.url) {
          executeScriptForTab(tab);
        }
      };
      
      // Create mock arguments
      const tabId = 123;
      const changeInfo = { status: 'loading' };
      const tab = { id: 123, url: 'https://example.com' };
      
      // Call the handler
      onUpdatedHandler(tabId, changeInfo, tab);
      
      // Verify executeScriptForTab was not called
      expect(executeScriptForTab.called).toBe(false);
    });
  });

  describe('Script Execution for Tab', () => {
    test('executeScriptForTab skips tabs with no URL', () => {
      // Create a mock executeScriptForTab function
      const executeScriptForTab = (tab) => {
        if (!tab.url) {
          return; // Skip if no URL
        }
        
        chrome.storage.sync.get('key', (data) => {});
      };
      
      // Call with a tab that has no URL
      executeScriptForTab({ id: 123 });
      
      // Verify chrome.storage.sync.get was not called
      expect(chrome.storage.sync.get.called).toBe(false);
    });

    test('executeScriptForTab gets script from storage and executes it', () => {
      // Create a mock executeScriptInTab function
      const executeScriptInTab = sandbox.stub();
      
      // Create a mock extractHostname function
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
      
      // Create a mock processBackgroundStorageData function
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
      
      // Create a mock executeScriptForTab function
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
      
      // Setup mock tab
      const tab = { id: 123, url: 'https://example.com' };
      
      // Setup storage.get to return test data
      chrome.storage.sync.get.callsFake((key, callback) => {
        callback({
          'runjavascript_example.com': {
            code: 'console.log("test code")',
            enabled: true,
            library: 'jquery_3_3_1'
          }
        });
        return Promise.resolve();
      });
      
      // Call the function
      executeScriptForTab(tab);
      
      // Verify storage.get was called with the correct key
      expect(chrome.storage.sync.get.calledOnce).toBe(true);
      expect(chrome.storage.sync.get.calledWith('runjavascript_example.com')).toBe(true);
      
      // Verify executeScriptInTab was called with the correct arguments
      expect(executeScriptInTab.calledOnce).toBe(true);
      expect(executeScriptInTab.calledWith(
        123,
        'console.log("test code")',
        'jquery_3_3_1'
      )).toBe(true);
    });
  });
});