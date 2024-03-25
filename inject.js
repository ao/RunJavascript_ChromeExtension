// Wait for the document to be fully loaded
chrome.runtime.sendMessage({}, function(response) {
    var readyStateCheckInterval = setInterval(function() {
        if (document.readyState === "complete") {
            clearInterval(readyStateCheckInterval);
            // Extract hostname from the current URL
            var host = extractHostname(location.href);
            var key = 'runjavascript_' + host;
            // Retrieve JavaScript code from storage
            chrome.storage.sync.get(key, function(obj) {
                var js = obj[key];
                if (typeof js === 'undefined') {
                    js = {'code': '', 'enabled': 'true', 'library': 'jquery_3_3_1'};
                } else if (typeof js === 'string') {
                    js = {'code': js, 'enabled': 'true', 'library': 'jquery_3_3_1'};
                }
                // If JavaScript is enabled and code exists, execute it
                if (js.enabled && js.code && js.code !== "") {
                    eval(js.code);
                }
            });
        }
    }, 10);
});

// Function to extract hostname from URL
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
