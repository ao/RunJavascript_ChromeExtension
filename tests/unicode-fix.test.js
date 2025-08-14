import { describe, test, expect, beforeEach } from 'bun:test';
import './setup.js';

describe('Unicode Character Fix', () => {
  let mockTab;
  
  beforeEach(() => {
    // Reset Chrome API mocks
    global.chrome.scripting.executeScript.resetHistory();
    global.chrome.storage.sync.get.resetHistory();
    global.chrome.storage.local.get.resetHistory();
    
    mockTab = {
      id: 123,
      url: 'https://example.com'
    };
  });

  test('should handle Unicode characters in JavaScript code without errors', async () => {
    // Test various Unicode characters that would break btoa()
    const unicodeScripts = [
      'console.log("Hello 世界");', // Chinese characters
      'console.log("🚀 Rocket emoji");', // Emoji
      'console.log("Café ñoño");', // Accented characters
      'console.log("Здравствуй мир");', // Cyrillic
      'console.log("مرحبا بالعالم");', // Arabic
      'console.log("こんにちは世界");', // Japanese
    ];

    // Import background script functions
    const backgroundScript = await import('../background.js');
    
    for (const script of unicodeScripts) {
      // Mock storage data with Unicode script
      const storageData = {
        'runjavascript_example.com': {
          code: script,
          enabled: true,
          library: 'jquery_3_3_1'
        }
      };
      
      global.chrome.storage.sync.get.callsArgWith(1, storageData);
      
      // This should not throw an error
      expect(() => {
        global.chrome.runtime.onMessage.trigger({
          action: 'content_script_loaded'
        }, { tab: mockTab });
      }).not.toThrow();
      
      // Wait for async execution
      await new Promise(resolve => setTimeout(resolve, 10));
    }
  });

  test('should generate consistent hash keys for same Unicode content', async () => {
    // Import background script to access the hash function
    const backgroundScript = await import('../background.js');
    
    const unicodeScript = 'console.log("🚀 Test with emoji 世界");';
    
    // Mock storage data
    const storageData = {
      'runjavascript_example.com': {
        code: unicodeScript,
        enabled: true,
        library: 'jquery_3_3_1'
      }
    };
    
    global.chrome.storage.sync.get.callsArgWith(1, storageData);
    
    // Execute the same script twice
    global.chrome.runtime.onMessage.trigger({
      action: 'content_script_loaded'
    }, { tab: mockTab });
    
    await new Promise(resolve => setTimeout(resolve, 10));
    const firstCallCount = global.chrome.scripting.executeScript.callCount;
    
    // Immediate second execution should be prevented (same hash)
    global.chrome.runtime.onMessage.trigger({
      action: 'content_script_loaded'
    }, { tab: mockTab });
    
    await new Promise(resolve => setTimeout(resolve, 10));
    const secondCallCount = global.chrome.scripting.executeScript.callCount;
    
    // Should not have increased (duplicate prevented by consistent hashing)
    expect(secondCallCount).toBe(firstCallCount);
  });

  test('should generate different hash keys for different Unicode content', async () => {
    // Import background script
    const backgroundScript = await import('../background.js');
    
    // First script with Unicode
    const storageData1 = {
      'runjavascript_example.com': {
        code: 'console.log("🚀 First script");',
        enabled: true,
        library: 'jquery_3_3_1'
      }
    };
    
    global.chrome.storage.sync.get.callsArgWith(1, storageData1);
    
    global.chrome.runtime.onMessage.trigger({
      action: 'execute_script',
      tabId: mockTab.id,
      code: 'console.log("🚀 First script");',
      library: 'jquery_3_3_1'
    });
    
    await new Promise(resolve => setTimeout(resolve, 10));
    const firstCallCount = global.chrome.scripting.executeScript.callCount;
    
    // Different script with Unicode should execute (different hash)
    global.chrome.runtime.onMessage.trigger({
      action: 'execute_script',
      tabId: mockTab.id,
      code: 'console.log("🌟 Second script");',
      library: 'jquery_3_3_1'
    });
    
    await new Promise(resolve => setTimeout(resolve, 10));
    const secondCallCount = global.chrome.scripting.executeScript.callCount;
    
    // Should have increased (different script allowed)
    expect(secondCallCount).toBeGreaterThan(firstCallCount);
  });
});
