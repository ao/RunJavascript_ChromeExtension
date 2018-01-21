var editor;
var data;
var host;
var key;

chrome.tabs.query({
    active: true,
    lastFocusedWindow: true
}, function(tabs) {
    var tab = tabs[0];
    host = extractHostname(tab.url);
    key = 'runjavascript_'+host;
});

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
});
