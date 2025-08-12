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
