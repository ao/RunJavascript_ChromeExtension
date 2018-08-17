var editor;
var data;
var host;
var key;


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

function saveChanges() {
    var js = editor.getValue();
    if (js == undefined || js == 'undefined') {
        js = '';
    }
    var _data = new Object();
    _data['runjavascript_'+host] = js;

    chrome.storage.sync.set(_data, function() {
        //
    });

    chrome.tabs.executeScript(null, {
      code: js
    });
}

function update_ace_placeholder() {
    var shouldShow = !editor.session.getValue().length;
    var node = editor.renderer.emptyMessageNode;

    var node2 = editor.renderer.emptyMessageNode2;
    if (!shouldShow && node) {
        editor.renderer.scroller.removeChild(editor.renderer.emptyMessageNode);
        editor.renderer.emptyMessageNode = null;

        editor.renderer.scroller.removeChild(editor.renderer.emptyMessageNode2);
        editor.renderer.emptyMessageNode2 = null;
    } else if (shouldShow && !node) {
        node = editor.renderer.emptyMessageNode = document.createElement("div");
        node.textContent = "Add your Javascript here and click 'Save and Run'"
        node.className = "ace_invisible ace_emptyMessage"
        node.style.padding = "200px 5px 5px 5px"
        editor.renderer.scroller.appendChild(node);

        node2 = editor.renderer.emptyMessageNode2 = document.createElement("div");
        node2.textContent = "It will be run now and everytime you visit this domain again in the future!"
        node2.className = "ace_invisible ace_emptyMessage"
        node2.style.padding = "10px 5px 5px 5px"
        editor.renderer.scroller.appendChild(node2);
    }
}

chrome.tabs.query({
    active: true,
    lastFocusedWindow: true
}, function(tabs) {
    var tab = tabs[0];
    host = extractHostname(tab.url);
    key = 'runjavascript_'+host;
});

document.addEventListener('DOMContentLoaded', function () {
    editor = ace.edit("editor");
    document.getElementById('runJavascript').addEventListener('click', saveChanges);

    chrome.storage.sync.get(function(obj) {
        var js = obj['runjavascript_'+host];
        if (js == undefined || js == 'undefined') {
            js = '';
        }
        editor.setValue(js);
    });

    editor.on("input", update_ace_placeholder);
    setTimeout(update_ace_placeholder, 100);

});
