// Handle extension installation
chrome.runtime.onInstalled.addListener(function () {
    chrome.tabs.create({ url: "https://blog.ataiva.com/run-javascript-chrome-extension-help/" });
});

// Listen for messages from other parts of the extension
chrome.runtime.onMessage.addListener(function (message, sender, sendResponse) {
    // Handle messages if needed
});

// Listen for tab changes and perform actions accordingly
chrome.tabs.onActivated.addListener(function (activeInfo) {
    chrome.tabs.get(activeInfo.tabId, function (tab) {
        var host = extractHostname(tab.url);
        var key = 'runjavascript_' + host;

        chrome.storage.sync.get(key, function (data) {
            var js = data[key];
            if (typeof js === 'undefined') {
                js = { 'code': '', 'enabled': 'true', 'library': 'jquery_3_3_1' };
            } else if (typeof js === 'string') {
                js = { 'code': js, 'enabled': 'true', 'library': 'jquery_3_3_1' };
            }
            if (js.enabled && js.code) {
                chrome.tabs.executeScript(tab.id, { code: js.code });
            }
        });
    });
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