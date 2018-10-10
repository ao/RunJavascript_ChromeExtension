var editor;
var data;
var host;
var key;
var enabled;


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

function saveChanges(dont_run) {
    var _code = editor.getValue();
    var js = {'code':_code, 'enabled':enabled};

    if (_code == undefined || _code == 'undefined') {
        js = {'code':'','enabled':'true'};
    }

    var _data = new Object();
    _data['runjavascript_'+host] = js;

    chrome.storage.sync.set(_data, function() {});

    if (typeof dont_run === 'undefined') {
        //stop toggleOnHost from running the script again!
    }
    else {
        if (enabled) {
            chrome.tabs.executeScript(null, {
                code: js.code
            });
        }
    }    
}

function showRightToggleOnHostButton() {
    document.getElementById('chkToggleOnHost').checked = !(!enabled);
}

function toggleOnHost() {
    console.log('changing ', !enabled);
    enabled = !enabled;
    showRightToggleOnHostButton();
    saveChanges(true);
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
    if (tab) {
        host = extractHostname(tab.url);
        key = 'runjavascript_'+host;
        document.getElementById('_toggle_host_name').innerHTML = host;
        showRightToggleOnHostButton();
    }
});

document.addEventListener('DOMContentLoaded', function () {
    editor = ace.edit("editor");
    document.getElementById('runJavascript').addEventListener('click', saveChanges);
    document.getElementById('chkToggleOnHost').addEventListener('change', toggleOnHost);

    chrome.storage.sync.get(function(obj) {
        var js = obj['runjavascript_'+host];
        if (typeof js == 'string') {
            js = {'code':js,'enabled':'true'};
        }
        if (typeof js == undefined) {
            js = {'code':'','enabled':'true'};
        }
        enabled = js.enabled;
        showRightToggleOnHostButton();
        editor.setValue(js.code);
    });

    editor.on("input", update_ace_placeholder);
    setTimeout(update_ace_placeholder, 100);

});
