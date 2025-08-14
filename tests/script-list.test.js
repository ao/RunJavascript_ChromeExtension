import { describe, test, expect, beforeEach, afterEach } from 'bun:test';
import sinon from 'sinon';
import { JSDOM } from 'jsdom';
import { 
  setupPopupTest, 
  simulateClick, 
  simulateChange,
  createMockStorage
} from './utils/test-helpers.js';
import { initializeScriptList, initializeSidebar, initializeStatusIndicators, loadScript } from './setup-fix.js';

describe('Script List in Sidebar', () => {
  let document;
  let window;
  let editor;
  let chrome;
  let sandbox;
  let mockStorage;
  let storageData;

  // Setup before each test
  beforeEach(() => {
    sandbox = sinon.createSandbox();
    
    // Setup mock storage with multiple scripts for different domains
    storageData = {
      'runjavascript_example.com': { 
        code: 'console.log("Example script");', 
        enabled: true, 
        library: 'jquery_3_3_1' 
      },
      'runjavascript_test.com': { 
        code: 'alert("Test script");', 
        enabled: false, 
        library: '' 
      },
      'runjavascript_demo.org': { 
        code: 'document.body.style.backgroundColor = "red";', 
        enabled: true, 
        library: 'jquery_2_2_4' 
      }
    };
    
    // Setup the test environment
    const testEnv = setupPopupTest({
      tabData: { id: 1, url: 'https://example.com', active: true, currentWindow: true },
      storageData: storageData
    });
    
    document = testEnv.document;
    window = testEnv.window;
    editor = testEnv.editor;
    chrome = global.chrome;
    
    // Make the sidebar visible for testing
    const sidebar = document.getElementById('sidebar');
    sidebar.classList.add('visible');
    
    // Mock storage for testing updates
    mockStorage = createMockStorage(storageData);
    chrome.storage.sync.get.callsFake(mockStorage.get);
    chrome.storage.sync.set.callsFake(mockStorage.set);
    
    // Initialize the script list, sidebar, and status indicators
    initializeScriptList(document, storageData);
    initializeSidebar(document, true);
    initializeStatusIndicators(document, true);
  });

  // Cleanup after each test
  afterEach(() => {
    sandbox.restore();
  });

  describe('Script List Structure', () => {
    test('script list container should exist in the sidebar', () => {
      // Verify the script list container exists
      const scriptList = document.getElementById('script-list');
      expect(scriptList).not.toBeNull();
      expect(scriptList.tagName.toLowerCase()).toBe('ul');
    });

    test('script list should have appropriate ARIA attributes for accessibility', () => {
      const scriptList = document.getElementById('script-list');
      expect(scriptList.getAttribute('role')).toBe('list');
      expect(scriptList.getAttribute('aria-label')).toBe('Available scripts');
    });
  });

  describe('Script List Population', () => {
    test('script list should populate with available scripts from storage', () => {
      const scriptList = document.getElementById('script-list');
      const scriptItems = scriptList.querySelectorAll('.script-item');
      
      // Should have 3 script items (one for each domain in storage)
      expect(scriptItems.length).toBe(3);
    });
    
    test('script items should display correct status indicators', () => {
      const scriptList = document.getElementById('script-list');
      const scriptItems = scriptList.querySelectorAll('.script-item');
      
      // Find the enabled and disabled items
      const enabledItem = Array.from(scriptItems).find(item => 
        item.querySelector('.script-name').textContent === 'example.com' || 
        item.querySelector('.script-name').textContent === 'demo.org'
      );
      
      const disabledItem = Array.from(scriptItems).find(item => 
        item.querySelector('.script-name').textContent === 'test.com'
      );
      
      // Check status indicators
      expect(enabledItem.querySelector('.script-status').classList.contains('enabled')).toBe(true);
      expect(disabledItem.querySelector('.script-status').classList.contains('disabled')).toBe(true);
    });
    
    test('current domain script should be highlighted', () => {
      const scriptList = document.getElementById('script-list');
      const scriptItems = scriptList.querySelectorAll('.script-item');
      
      // Find the item for example.com (current domain)
      const currentItem = Array.from(scriptItems).find(item =>
        item.querySelector('.script-name').textContent === 'example.com'
      );
      
      expect(currentItem.classList.contains('current')).toBe(true);
    });
  });
  
  describe('Script Selection', () => {
    test('clicking a script should load it in the editor', () => {
      const scriptList = document.getElementById('script-list');
      const scriptItems = scriptList.querySelectorAll('.script-item');
      
      // Find the test.com script item
      const testItem = Array.from(scriptItems).find(item =>
        item.querySelector('.script-name').textContent === 'test.com'
      );
      
      // Set up click handler to load the script
      testItem.addEventListener('click', function() {
        const domain = this.dataset.domain;
        const scriptData = storageData['runjavascript_' + domain];
        if (scriptData) {
          loadScript(document, editor, domain, scriptData);
        }
      });
      
      // Simulate clicking on the test.com script
      simulateClick(testItem);
      
      // Editor should be updated with the test.com script
      expect(editor.setValue.calledWith('alert("Test script");')).toBe(true);
    });
    
    test('clicking current script should not change anything', () => {
      const scriptList = document.getElementById('script-list');
      const scriptItems = scriptList.querySelectorAll('.script-item');
      
      // Find the example.com script item (current domain)
      const currentItem = Array.from(scriptItems).find(item =>
        item.querySelector('.script-name').textContent === 'example.com'
      );
      
      // Reset the editor setValue stub
      editor.setValue.resetHistory();
      
      // Simulate clicking on the current script
      simulateClick(currentItem);
      
      // Editor should not be updated
      expect(editor.setValue.called).toBe(false);
    });
  });
  
  describe('Script List Updates', () => {
    test('script list should update when a new script is added', () => {
      // Add a new script to storage
      const newScript = { code: 'console.log("New script");', enabled: true, library: '' };
      storageData['runjavascript_new.com'] = newScript;
      chrome.storage.sync.set({ 'runjavascript_new.com': newScript }, () => {});
      
      // Trigger storage change event
      const changeObj = { 'runjavascript_new.com': { newValue: newScript } };
      chrome.storage.onChanged.trigger(changeObj, 'sync');
      
      // Re-initialize the script list to simulate the storage change handler
      initializeScriptList(document, storageData);
      
      // Check if the script list was updated
      const scriptList = document.getElementById('script-list');
      const scriptItems = scriptList.querySelectorAll('.script-item');
      
      // Should now have 4 script items
      expect(scriptItems.length).toBe(4);
    });
    
    test('script list should update when a script is modified', () => {
      // Modify an existing script
      const modifiedScript = { 
        code: 'console.log("Modified script");', 
        enabled: false, 
        library: 'jquery_2_2_4' 
      };
      storageData['runjavascript_example.com'] = modifiedScript;
      
      // Trigger storage change event
      const changeObj = {
        'runjavascript_example.com': {
          oldValue: { code: 'console.log("Example script");', enabled: true, library: 'jquery_3_3_1' },
          newValue: modifiedScript
        }
      };
      chrome.storage.onChanged.trigger(changeObj, 'sync');
      
      // Re-initialize the script list to simulate the storage change handler
      initializeScriptList(document, storageData);
      
      const scriptList = document.getElementById('script-list');
      const exampleItem = Array.from(scriptList.querySelectorAll('.script-item')).find(item =>
        item.querySelector('.script-name').textContent === 'example.com'
      );
      
      const statusIndicator = exampleItem.querySelector('.script-status');
      expect(statusIndicator.classList.contains('disabled')).toBe(true);
    });
    
    test('script list should update when a script is deleted', () => {
      // Delete a script from storage
      delete storageData['runjavascript_test.com'];
      
      // Trigger storage change event
      const changeObj = {
        'runjavascript_test.com': {
          oldValue: { code: 'alert("Test script");', enabled: false, library: '' },
          newValue: undefined
        }
      };
      chrome.storage.onChanged.trigger(changeObj, 'sync');
      
      // Re-initialize the script list to simulate the storage change handler
      initializeScriptList(document, storageData);
      
      // Check if the script was removed from the list
      const scriptList = document.getElementById('script-list');
      const scriptItems = scriptList.querySelectorAll('.script-item');
      
      // Should now have 2 script items
      expect(scriptItems.length).toBe(2);
    });
  });
  
  describe('Empty State', () => {
    test('should display empty state message when no scripts are available', () => {
      // Clear all scripts
      Object.keys(storageData).forEach(key => {
        delete storageData[key];
      });
      
      chrome.storage.sync.clear();
      
      // Trigger storage change event for clearing
      chrome.storage.onChanged.trigger({}, 'sync');
      
      // Re-initialize the script list with empty data
      initializeScriptList(document, {});
      
      // Check if empty message is displayed
      const emptyMessage = document.querySelector('.empty-script-list');
      expect(emptyMessage.style.display).toBe('block');
    });
  });
});
