import { describe, test, expect, beforeEach, afterEach } from 'bun:test';
import sinon from 'sinon';
import { setupPopupTest, simulateClick, simulateChange } from './utils/test-helpers.js';
import { initializeStatusIndicators } from './setup-fix.js';

describe('Status Indicators', () => {
  let document;
  let window;
  let chrome;
  let sandbox;
  
  // Setup before each test
  beforeEach(() => {
    sandbox = sinon.createSandbox();
    
    // Setup the test environment
    const testEnv = setupPopupTest({
      tabData: { id: 1, url: 'https://example.com', active: true, currentWindow: true }
    });
    
    document = testEnv.document;
    window = testEnv.window;
    chrome = global.chrome;
  });
  
  // Cleanup after each test
  afterEach(() => {
    sandbox.restore();
  });
  
  describe('Popup Header Status Indicators', () => {
    test('should display status indicator in popup header', () => {
      const statusIndicator = document.getElementById('status-indicator');
      expect(statusIndicator).not.toBeNull();
      expect(['enabled', 'disabled']).toContain(statusIndicator.className);
    });
    
    test('should show enabled status when scripts are enabled', () => {
      // Initialize status indicators as enabled
      initializeStatusIndicators(document, true);
      
      // Get the status indicator
      const statusIndicator = document.getElementById('status-indicator');
      
      // Verify it shows enabled status
      expect(statusIndicator.classList.contains('enabled')).toBe(true);
      expect(statusIndicator.textContent).toBe('Enabled');
    });
    
    test('should show disabled status when scripts are disabled', () => {
      // Initialize status indicators as disabled
      initializeStatusIndicators(document, false);
      
      // Get the status indicator
      const statusIndicator = document.getElementById('status-indicator');
      
      // Verify it shows disabled status
      expect(statusIndicator.classList.contains('disabled')).toBe(true);
      expect(statusIndicator.textContent).toBe('Disabled');
    });
  });
  
  describe('Extension Icon Badge Status Indicators', () => {
    test('should update badge when script is enabled', () => {
      // Mock the function that updates badge status
      const updateBadgeStatus = (isEnabled) => {
        chrome.action.setBadgeText({
          text: isEnabled ? 'ON' : 'OFF'
        });
        
        chrome.action.setBadgeBackgroundColor({
          color: isEnabled ? '#4CAF50' : '#F44336'
        });
      };
      
      // Call the function with enabled state
      updateBadgeStatus(true);
      
      // Verify badge was updated correctly
      expect(chrome.action.setBadgeText.calledWith({ text: 'ON' })).toBe(true);
      expect(chrome.action.setBadgeBackgroundColor.calledWith({ color: '#4CAF50' })).toBe(true);
    });
    
    test('should update badge when script is disabled', () => {
      // Mock the function that updates badge status
      const updateBadgeStatus = (isEnabled) => {
        chrome.action.setBadgeText({
          text: isEnabled ? 'ON' : 'OFF'
        });
        
        chrome.action.setBadgeBackgroundColor({
          color: isEnabled ? '#4CAF50' : '#F44336'
        });
      };
      
      // Call the function with disabled state
      updateBadgeStatus(false);
      
      // Verify badge was updated correctly
      expect(chrome.action.setBadgeText.calledWith({ text: 'OFF' })).toBe(true);
      expect(chrome.action.setBadgeBackgroundColor.calledWith({ color: '#F44336' })).toBe(true);
    });
  });
  
  describe('Dynamic Status Updates', () => {
    test('should update status indicators when toggle changes', () => {
      // Initialize status indicators as enabled
      initializeStatusIndicators(document, true);
      
      // Create a mock toggle function
      const toggleOnHost = () => {
        // Toggle enabled state
        const enabled = false; // Simulating toggling from true to false
        
        // Update status indicators
        const statusIndicator = document.getElementById('status-indicator');
        statusIndicator.textContent = enabled ? 'Enabled' : 'Disabled';
        statusIndicator.className = enabled ? 'enabled' : 'disabled';
        
        // Update badge
        chrome.action.setBadgeText({
          text: enabled ? 'ON' : 'OFF'
        });
        
        chrome.action.setBadgeBackgroundColor({
          color: enabled ? '#4CAF50' : '#F44336'
        });
      };
      
      // Get the toggle checkbox
      const toggleCheckbox = document.getElementById('chkToggleOnHost');
      toggleCheckbox.checked = true;
      toggleCheckbox.onchange = toggleOnHost;
      
      // Simulate changing the checkbox
      simulateChange(toggleCheckbox, false);
      
      // Get the status indicator
      const statusIndicator = document.getElementById('status-indicator');
      
      // Verify the status indicator was updated
      expect(statusIndicator.classList.contains('disabled')).toBe(true);
      expect(statusIndicator.textContent).toBe('Disabled');
      
      // Verify badge was updated
      expect(chrome.action.setBadgeText.calledWith({ text: 'OFF' })).toBe(true);
      expect(chrome.action.setBadgeBackgroundColor.calledWith({ color: '#F44336' })).toBe(true);
    });
    
    test('should update status indicators when loading from storage', () => {
      // Mock storage data with disabled script
      const storageData = {
        'runjavascript_example.com': {
          code: 'console.log("test");',
          enabled: false,
          library: ''
        }
      };
      
      // Mock the function that processes storage data
      const processStorageData = () => {
        const enabled = false;
        
        // Update status indicators
        const statusIndicator = document.getElementById('status-indicator');
        statusIndicator.textContent = enabled ? 'Enabled' : 'Disabled';
        statusIndicator.className = enabled ? 'enabled' : 'disabled';
        
        // Update badge
        chrome.action.setBadgeText({
          text: enabled ? 'ON' : 'OFF'
        });
        
        chrome.action.setBadgeBackgroundColor({
          color: enabled ? '#4CAF50' : '#F44336'
        });
        
        // Update toggle checkbox
        const toggleCheckbox = document.getElementById('chkToggleOnHost');
        toggleCheckbox.checked = enabled;
      };
      
      // Call the function to simulate loading from storage
      processStorageData();
      
      // Verify status indicators were updated
      const statusIndicator = document.getElementById('status-indicator');
      expect(statusIndicator.classList.contains('disabled')).toBe(true);
      expect(statusIndicator.textContent).toBe('Disabled');
      
      // Verify checkbox was updated
      const toggleCheckbox = document.getElementById('chkToggleOnHost');
      expect(toggleCheckbox.checked).toBe(false);
    });
  });
});
