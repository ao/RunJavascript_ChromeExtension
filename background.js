// Service worker lifecycle management
self.addEventListener('install', (event) => {
    console.log('Service worker installed');
    self.skipWaiting(); // Ensure the service worker activates immediately
});

self.addEventListener('activate', (event) => {
    console.log('Service worker activated');
    // Clear execution tracking on activation
    executionTracker.clear();
});

// Track script executions to prevent duplicates
const executionTracker = new Map();

// Function to generate execution key
function getExecutionKey(tabId, url, code) {
    const host = extractHostname(url);
    const codeHash = btoa(code).slice(0, 10); // Simple hash of first 10 chars of base64
    return `${tabId}-${host}-${codeHash}`;
}

// Function to check if script should be executed (prevents duplicates)
function shouldExecuteScript(tabId, url, code) {
    const key = getExecutionKey(tabId, url, code);
    const now = Date.now();
    const lastExecution = executionTracker.get(key);
    
    // Prevent execution if same script was run within last 5 seconds
    if (lastExecution && (now - lastExecution) < 5000) {
        // console.log('[DEBUG] Preventing duplicate execution for key:', key);
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
    } else if (message.action === 'execute_script') {
        // console.log('[DEBUG] Execute script request from popup for tab:', message.tabId);
        // Execute script directly from popup (bypass duplicate checking for manual execution)
        executeScriptInTab(message.tabId, message.code, message.library);
    }
    return true; // Return true for async response
});

// Execute script function for V3 - using world: 'MAIN' for proper execution context
async function executeScriptInTab(tabId, code, library = '') {
    // console.log('[DEBUG] executeScriptInTab called for tab:', tabId, 'library:', library, 'code length:', code.length);
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
        console.error('[DEBUG] Error details - tabId:', tabId, 'code length:', code.length, 'library:', library);
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
        var js = data[key];
        // console.log('[DEBUG] Retrieved data for', key, ':', js);
        if (typeof js === 'undefined') {
            js = { 'code': '', 'enabled': 'true', 'library': '' }; // Default to no library
            // console.log('[DEBUG] No stored script found, using defaults');
        } else if (typeof js === 'string') {
            js = { 'code': js, 'enabled': 'true', 'library': '' }; // Default to no library
            // console.log('[DEBUG] Converting legacy string format to object');
        }
        if (js.enabled && js.code) {
            // Check for duplicate execution before proceeding
            if (shouldExecuteScript(tab.id, tab.url, js.code)) {
                // console.log('[DEBUG] Executing script for tab:', tab.id, 'Code length:', js.code.length);
                // Use the new scripting API
                executeScriptInTab(tab.id, js.code, js.library);
            } else {
                console.log('[DEBUG] Skipping duplicate execution for tab:', tab.id);
            }
        } else {
            console.log('[DEBUG] Script not enabled or empty for host:', host);
        }
    });
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
    hostname = hostname.split(':')[0];
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