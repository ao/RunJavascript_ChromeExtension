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
            js = {'code':'','enabled':'true','library':'jquery_3_3_1'};
        } else if (typeof js == 'string') {
            js = {'code':js,'enabled':'true','library':'jquery_3_3_1'};
        }
        if (js.enabled) {
            
            // var lib_file = js.library=="" ? "" : "lib_"+js.library+'.js';
                
            // if (lib_file!='') {
            //     chrome.tabs.executeScript(null, {
            //         file: lib_file
            //     }, function() {
            //         chrome.tabs.executeScript(null, {
            //             code: js.code
            //         });
            //     });
            // } else {
                if (js.code!="") {
                    chrome.tabs.executeScript(null, {
                        code: js.code
                    });
                }
            // }
        }
    });

});
