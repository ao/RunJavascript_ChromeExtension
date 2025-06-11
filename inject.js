// Content script - simplified to just provide utility functions
// Auto-execution is now handled by the background script via chrome.tabs.onUpdated
chrome.runtime.sendMessage({action: 'content_script_loaded'}, function(response) {
    // Content script is ready
});

// Content script now only handles signaling readiness to background script
// All execution logic moved to background script to prevent duplication and ensure consistency

// Utility function kept for potential future use
function extractHostname(url) {
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
