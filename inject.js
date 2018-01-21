chrome.extension.sendMessage({}, function(response) {
    var readyStateCheckInterval = setInterval(function() {
        if (document.readyState === "complete") {
            clearInterval(readyStateCheckInterval);
            chrome.storage.sync.get(function(obj) {
                var js = obj['runjavascript_'+location.host];
                eval(obj['runjavascript_'+location.host]);
            });
        }
    }, 10);
});
