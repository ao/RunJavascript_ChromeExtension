import { describe, test, expect, beforeEach } from 'bun:test';
import './setup.js';

describe('Execution Fix - Manual vs Auto Execution', () => {
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
    
    // Mock storage data
    const storageData = {
      'runjavascript_example.com': {
        code: 'console.log("test script");',
        enabled: true,
        library: 'jquery_3_3_1'
      }
    };
    
    global.chrome.storage.sync.get.callsArgWith(1, storageData);
  });

  test('manual execution should always work even after recent auto execution', async () => {
    // Import background script functions
    const backgroundScript = await import('../background.js');
    
    // First, simulate auto-execution (like after page load)
    global.chrome.runtime.onMessage.trigger({
      action: 'content_script_loaded'
    }, { tab: mockTab });
    
    // Wait a bit to ensure the execution tracking is set
    await new Promise(resolve => setTimeout(resolve, 10));
    
    // Now simulate manual execution from popup (should work despite recent auto-execution)
    global.chrome.runtime.onMessage.trigger({
      action: 'execute_script',
      tabId: mockTab.id,
      code: 'console.log("test script");',
      library: 'jquery_3_3_1'
    });
    
    // Wait for async execution
    await new Promise(resolve => setTimeout(resolve, 10));
    
    // Should have executed at least twice (once auto, once manual)
    expect(global.chrome.scripting.executeScript.callCount).toBeGreaterThanOrEqual(2);
  });

  test('auto execution should be prevented within 2 seconds but allowed after', async () => {
    // Import background script functions  
    const backgroundScript = await import('../background.js');
    
    // First auto-execution
    global.chrome.runtime.onMessage.trigger({
      action: 'content_script_loaded'
    }, { tab: mockTab });
    
    await new Promise(resolve => setTimeout(resolve, 10));
    const firstCallCount = global.chrome.scripting.executeScript.callCount;
    
    // Immediate second auto-execution (should be prevented)
    global.chrome.runtime.onMessage.trigger({
      action: 'content_script_loaded'
    }, { tab: mockTab });
    
    await new Promise(resolve => setTimeout(resolve, 10));
    const secondCallCount = global.chrome.scripting.executeScript.callCount;
    
    // Should not have increased (duplicate prevented)
    expect(secondCallCount).toBe(firstCallCount);
  });

  test('different scripts should execute independently', async () => {
    // Import background script functions
    const backgroundScript = await import('../background.js');
    
    // Mock different storage data for second script
    const storageData2 = {
      'runjavascript_example.com': {
        code: 'console.log("different script");',
        enabled: true,
        library: 'jquery_3_3_1'
      }
    };
    
    // First script execution
    global.chrome.runtime.onMessage.trigger({
      action: 'execute_script',
      tabId: mockTab.id,
      code: 'console.log("test script");',
      library: 'jquery_3_3_1'
    });
    
    await new Promise(resolve => setTimeout(resolve, 10));
    const firstCallCount = global.chrome.scripting.executeScript.callCount;
    
    // Different script should execute even immediately after
    global.chrome.runtime.onMessage.trigger({
      action: 'execute_script',
      tabId: mockTab.id,
      code: 'console.log("different script");',
      library: 'jquery_3_3_1'
    });
    
    await new Promise(resolve => setTimeout(resolve, 10));
    const secondCallCount = global.chrome.scripting.executeScript.callCount;
    
    // Should have increased (different script allowed)
    expect(secondCallCount).toBeGreaterThan(firstCallCount);
  });
});
