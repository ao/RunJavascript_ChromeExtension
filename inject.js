chrome.extension.sendMessage({}, function(response) {
    var readyStateCheckInterval = setInterval(function() {
        if (document.readyState === "complete") {
            clearInterval(readyStateCheckInterval);
            chrome.storage.sync.get(function(obj) {
                var js = obj['runjavascript_'+location.host];
                if (typeof js == undefined) {
                    js = {'code':'','enabled':'true','library':'jquery_3_3_1'};
                } else if (typeof js == 'string') {
                    js = {'code':js,'enabled':'true','library':'jquery_3_3_1'};
                }
                if (js && js.enabled) {
                    if (js.code && js.code!="") {
                        eval(js.code);
                    }
                }
            });
        }
    }, 10);
});
