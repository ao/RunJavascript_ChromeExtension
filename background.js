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
        if (js == undefined || js == 'undefined') {
            js = '';
        }
        chrome.tabs.executeScript(null, {
      		code: js
      	});
    });

});
