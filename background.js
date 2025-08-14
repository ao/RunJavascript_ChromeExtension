// Service worker lifecycle management
self.addEventListener('install', (event) => {
  console.log('Service worker installed');
  self.skipWaiting(); // Ensure the service worker activates immediately
});

self.addEventListener('activate', (event) => {
  console.log('Service worker activated');
  // Clear execution tracking on activation
  executionTracker.clear();

  // Initialize badge status for all tabs
  initializeBadgeStatus();
});

// Function to initialize badge status for all tabs
function initializeBadgeStatus() {
  chrome.tabs.query({}, function (tabs) {
    tabs.forEach(function (tab) {
      updateBadgeForTab(tab);
    });
  });
}

// Function to update badge for a specific tab
function updateBadgeForTab(tab) {
  if (!tab.url) return;

  const host = extractHostname(tab.url);
  const key = 'runjavascript_' + host;

  chrome.storage.sync.get(key, function (data) {
    if (chrome.runtime.lastError) {
      // Fallback to local storage if sync fails
      chrome.storage.local.get(key, function (localData) {
        processBadgeStorageData(localData, key, tab);
      });
      return;
    }

    processBadgeStorageData(data, key, tab);
  });
}

// Process storage data for badge updates
function processBadgeStorageData(data, key, tab) {
  let js = data[key];

  // Handle different data formats
  if (typeof js === 'undefined') {
    js = { 'code': '', 'enabled': 'true', 'library': '' };
  } else if (typeof js === 'string') {
    js = { 'code': js, 'enabled': 'true', 'library': '' };
  }

  // Update badge based on enabled status
  const enabled = js.enabled === true || js.enabled === 'true';
  updateBadgeStatus(enabled);
}

// Function to update the extension icon badge
function updateBadgeStatus(isEnabled) {
  chrome.action.setBadgeText({
    text: isEnabled ? 'ON' : 'OFF'
  });

  chrome.action.setBadgeBackgroundColor({
    color: isEnabled ? '#4CAF50' : '#F44336'
  });
}

// Track script executions to prevent duplicates
const executionTracker = new Map();

// Function to generate execution key
function getExecutionKey(tabId, url, code) {
  if (!code) return `${tabId}-null-null`;
  const host = extractHostname(url);
  
  // Use a simple hash function instead of btoa to handle Unicode characters
  const codeHash = simpleHash(code).toString(36).slice(0, 10);
  return `${tabId}-${host}-${codeHash}`;
}

// Simple hash function that works with Unicode characters
function simpleHash(str) {
  let hash = 0;
  if (str.length === 0) return hash;
  
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  
  return Math.abs(hash);
}

// Function to check if script should be executed (prevents duplicates)
function shouldExecuteScript(tabId, url, code, isManualExecution = false) {
  if (!code) return true; // Always execute if no code provided

  // Always allow manual execution from popup
  if (isManualExecution) {
    const key = getExecutionKey(tabId, url, code);
    executionTracker.set(key, Date.now());
    return true;
  }

  const key = getExecutionKey(tabId, url, code);
  const now = Date.now();
  const lastExecution = executionTracker.get(key);

  // For auto-execution, prevent only if same script was run within last 2 seconds
  // This is much shorter to allow legitimate page refreshes while still preventing
  // rapid-fire duplicates from multiple event triggers
  if (lastExecution && (now - lastExecution) < 2000) {
    console.log('[DEBUG] Preventing duplicate auto-execution for key:', key, 'last execution was', now - lastExecution, 'ms ago');
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

// Handle extension installation
chrome.runtime.onInstalled.addListener(function () {
  chrome.tabs.create({ url: "https://ataiva.com/run-javascript-chrome-extension-help/" });
});

// Listen for messages from other parts of the extension
chrome.runtime.onMessage.addListener(function (message, sender, sendResponse) {
  // console.log('[DEBUG] Message received:', message, 'from tab:', sender.tab?.id);
  if (message.action === 'content_script_loaded' && sender.tab) {
    // console.log('[DEBUG] Content script loaded for tab:', sender.tab.id, 'URL:', sender.tab.url);
    // Content script has loaded, check if we need to execute any scripts
    executeScriptForTab(sender.tab);
    // Update badge for this tab
    updateBadgeForTab(sender.tab);
  } else if (message.action === 'execute_script') {
    // console.log('[DEBUG] Execute script request from popup for tab:', message.tabId);
    // Execute script directly from popup (this is manual execution)
    executeScriptInTab(message.tabId, message.code, message.library, true);
  } else if (message.action === 'update_badge') {
    // Update badge status based on enabled state
    updateBadgeStatus(message.enabled);
  }
  return true; // Return true for async response
});

// Execute script function for V3 - using world: 'MAIN' for proper execution context
async function executeScriptInTab(tabId, code, library = '', isManualExecution = false) {
  // console.log('[DEBUG] executeScriptInTab called for tab:', tabId, 'library:', library, 'code length:', code ? code.length : 'null', 'manual:', isManualExecution);
  try {
    // First, inject jQuery library if needed using world: 'MAIN'
    if (library && library !== '') {
      // console.log('[DEBUG] Injecting jQuery library:', library);
      try {
        await chrome.scripting.executeScript({
          target: { tabId: tabId },
          files: [`lib_${library}.js`],
          world: 'MAIN'  // Execute in main world, not isolated world
        });
        // console.log('[DEBUG] jQuery library injected successfully');
      } catch (libError) {
        console.warn('[DEBUG] Failed to inject jQuery library, continuing without it:', libError);
      }
    }

    // Execute user code directly in MAIN world using chrome.scripting
    // console.log('[DEBUG] Executing user code in MAIN world');
    const result = await chrome.scripting.executeScript({
      target: { tabId: tabId },
      func: (userCode) => {
        // console.log('[DEBUG] Executing user code in main world context');
        try {
          // In MAIN world, we can use eval safely as it's the page's context
          eval(userCode);
          // console.log('[DEBUG] User code executed successfully in main world');
        } catch (error) {
          console.error('[DEBUG] Error executing user code:', error);
        }
      },
      args: [code],
      world: 'MAIN'  // This is the key - execute in main world, not isolated world
    });
    // console.log('[DEBUG] Script injection result:', result);
  } catch (error) {
    console.error('[DEBUG] Error in executeScriptInTab:', error);
    console.error('[DEBUG] Error details - tabId:', tabId, 'code length:', code ? code.length : 'null', 'library:', library);
  }
}

// Sandbox setup function removed - now using world: 'MAIN' execution which is much simpler
// and the proper Manifest V3 approach for executing user code in the main page context

// Function to execute script for a tab
function executeScriptForTab(tab) {
  // console.log('[DEBUG] executeScriptForTab called for tab:', tab.id, 'URL:', tab.url);
  if (!tab.url) {
    // console.log('[DEBUG] Skipping tab with no URL');
    return; // Skip if no URL (e.g., chrome:// URLs)
  }

  var host = extractHostname(tab.url);
  var key = 'runjavascript_' + host;
  // console.log('[DEBUG] Looking for stored script for host:', host);

  chrome.storage.sync.get(key, function (data) {
    // console.log('[STORAGE DEBUG] Background script loading data for key:', key);
    // console.log('[STORAGE DEBUG] Background raw storage data:', data);

    if (chrome.runtime.lastError) {
      // console.error('[STORAGE DEBUG] Background error loading from chrome.storage.sync:', chrome.runtime.lastError);

      // Fallback to local storage if sync fails
      chrome.storage.local.get(key, function (localData) {
        console.log('[STORAGE DEBUG] Background fallback to local storage, data:', localData);
        if (chrome.runtime.lastError) {
          console.error('[STORAGE DEBUG] Background error loading from chrome.storage.local:', chrome.runtime.lastError);
        } else {
          processBackgroundStorageData(localData, key, tab);
        }
      });
      return;
    }

    processBackgroundStorageData(data, key, tab);
  });
}

function processBackgroundStorageData(data, key, tab) {
  var js = data[key];
  // console.log('[STORAGE DEBUG] Background retrieved data for', key, ':', js);
  if (typeof js === 'undefined') {
    js = { 'code': '', 'enabled': 'true', 'library': '' }; // Default to no library
    // console.log('[STORAGE DEBUG] Background no stored script found, using defaults');
  } else if (typeof js === 'string') {
    js = { 'code': js, 'enabled': 'true', 'library': '' }; // Default to no library
    // console.log('[STORAGE DEBUG] Background converting legacy string format to object');
  }

  // console.log('[STORAGE DEBUG] Background final processed data:', js);

  // Update badge status based on enabled state
  const enabled = js.enabled === true || js.enabled === 'true';
  updateBadgeStatus(enabled);

  if (enabled && js.code) {
    // Check for duplicate execution before proceeding (this is auto-execution)
    if (shouldExecuteScript(tab.id, tab.url, js.code, false)) {
      // console.log('[STORAGE DEBUG] Background executing script for tab:', tab.id, 'Code length:', js.code ? js.code.length : 'null');
      // Use the new scripting API (auto-execution, not manual)
      executeScriptInTab(tab.id, js.code, js.library, false);
    } else {
      console.log('[DEBUG] Skipping duplicate auto-execution for tab:', tab.id);
    }
  } else {
    console.log('[DEBUG] Script not enabled or empty for host:', extractHostname(tab.url));
  }
}

// Listen for tab activation (switching tabs)
chrome.tabs.onActivated.addListener(function (activeInfo) {
  // console.log('[DEBUG] Tab activated:', activeInfo.tabId);
  chrome.tabs.get(activeInfo.tabId, function (tab) {
    // console.log('[DEBUG] Got tab info for activated tab:', tab.id, tab.url);
    executeScriptForTab(tab);
  });
});

// Listen for tab updates (page loads/reloads)
chrome.tabs.onUpdated.addListener(function (tabId, changeInfo, tab) {
  // console.log('[DEBUG] Tab updated:', tabId, 'changeInfo:', changeInfo, 'status:', changeInfo.status);
  // Only execute when the page has finished loading
  if (changeInfo.status === 'complete' && tab.url) {
    // console.log('[DEBUG] Page load complete for tab:', tabId, 'URL:', tab.url);
    executeScriptForTab(tab);
  }
});

// Function to extract hostname from URL
function extractHostname(url) {
  if (!url) return;
  var hostname;
  if (url.indexOf("://") > -1) {
    hostname = url.split('/')[2];
  } else {
    hostname = url.split('/')[0];
  }

  // Special handling for IPv6 addresses which are enclosed in square brackets
  if (hostname.startsWith('[') && hostname.includes(']')) {
    // For IPv6, keep everything up to the closing bracket
    var closingBracketPos = hostname.indexOf(']');
    hostname = hostname.substring(0, closingBracketPos + 1);
  } else {
    // For regular hostnames, remove port if present
    hostname = hostname.split(':')[0];
  }

  hostname = hostname.split('?')[0];
  return hostname;
}

// Proper service worker lifecycle management for Manifest V3
// Remove unreliable setInterval approach and rely on event-driven architecture
// console.log('[DEBUG] Service worker initialized - relying on event-driven lifecycle');

// Optional: Add alarm-based keep-alive only if absolutely necessary
// This is more reliable than setInterval for service workers
function setupAlarmKeepAlive() {
  chrome.alarms.create('keepAlive', { periodInMinutes: 1 });
  chrome.alarms.onAlarm.addListener((alarm) => {
    if (alarm.name === 'keepAlive') {
      console.log('[DEBUG] Service worker keep-alive via alarm at:', new Date().toISOString());
    }
  });
}

// Only use alarm keep-alive if needed (commented out for now as it may not be necessary)
// setupAlarmKeepAlive();
