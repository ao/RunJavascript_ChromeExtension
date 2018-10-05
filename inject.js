chrome.extension.sendMessage({}, function(response) {
    var readyStateCheckInterval = setInterval(function() {
        if (document.readyState === "complete") {
            clearInterval(readyStateCheckInterval);
            chrome.storage.sync.get(function(obj) {
                var js = obj['runjavascript_'+location.host];
                if (typeof js == undefined) {
                    js = {'code':'','enabled':'true'};
                } else if (typeof js == 'string') {
                    js = {'code':js,'enabled':'true'};
                }
                if (js.enabled) {
                    eval(js.code);
                }
            });
        }
    }, 10);
});
