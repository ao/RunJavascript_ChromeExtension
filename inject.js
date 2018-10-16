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
                if (js.enabled) {

                    // var lib_file = js.library=="" ? "" : "lib_"+js.library+'.js';
                    
                    // if (lib_file!='') {


                    //     function loadScript(url) {
                    //         var x = new XMLHttpRequest();
                    //         x.onload = function() {
                    //             alert(js.code);
                    //             eval(js.code);
                    //         };
                    //         x.open('GET', url);
                    //         x.send();
                    //     }
                    //     loadScript(lib_file);

                    // } else {
                        if (js.code!="") {
                            eval(js.code);
                        }
                    // }
                }
            });
        }
    }, 10);
});
