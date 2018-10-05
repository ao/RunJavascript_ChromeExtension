chrome.browserAction.setBadgeText({text: "js()"});

var _host;
var _key;

chrome.tabs.query({
    active: true,
    lastFocusedWindow: true
}, function(tabs) {
    var tab = tabs[0];
    _host = extractHostname(tab.url);
    _key = 'runjavascript_'+host;

    chrome.storage.sync.get(function(obj) {
        var js = obj[_key];
        if (typeof js == undefined) {
            js = {'code':'','enabled':'true'};
        } else if (typeof js == 'string') {
            js = {'code':js,'enabled':'true'};
        }
        if (js.enabled) {
            chrome.tabs.executeScript(null, {
                code: js.code
            });
        }
    });

});
