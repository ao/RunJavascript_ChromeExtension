var editor;
var data;
var host;
var key;
var enabled;
var library;


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
    
    // Get the current library selection BEFORE creating the js object
    library = document.getElementById('slLibrary').value;
    console.log('Before creating js object - library:', library);
    
    var js = {'code':_code, 'enabled':enabled, 'library':library};

    if (_code == undefined || _code == 'undefined') {
        js = {'code':'','enabled':'true', 'library':library}; // Use current library selection
    }
    
    console.log('js object being saved:', js);

    var _data = new Object();
    _data['runjavascript_'+host] = js;

    chrome.storage.sync.set(_data, function() {
        if (chrome.runtime.lastError) {
            // console.error('[STORAGE DEBUG] Error saving to chrome.storage.sync:', chrome.runtime.lastError);
            // console.error('[STORAGE DEBUG] Attempted to save data:', _data);
            
            // Fallback to local storage if sync fails
            chrome.storage.local.set(_data, function() {
                if (chrome.runtime.lastError) {
                    console.error('[STORAGE DEBUG] Error saving to chrome.storage.local:', chrome.runtime.lastError);
                } else {
                    // console.log('[STORAGE DEBUG] Successfully saved to chrome.storage.local as fallback');
                }
            });
        } else {
            // console.log('[STORAGE DEBUG] Successfully saved to chrome.storage.sync:', _data);
        }
    });

    if (typeof dont_run === 'undefined') {
        if (enabled) {
            chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
                if (tabs && tabs[0] && tabs[0].id) {
                    // Send message to background script to execute the script
                    // This ensures consistent execution logic and prevents duplication
                    chrome.runtime.sendMessage({
                        action: 'execute_script',
                        tabId: tabs[0].id,
                        code: js.code,
                        library: library
                    });
                }
            });
        }
    }
    
    document.getElementById("lblUpdated").style.display = "inline-block";
    setTimeout(function() {
        document.getElementById("lblUpdated").style.display = "none";
    }, 2000);
}

// setupSandbox function removed - using the one from background.js via chrome.scripting.executeScript
// This eliminates code duplication and potential inconsistencies

function showRightToggleOnHostButton() {
    document.getElementById('chkToggleOnHost').checked = !(!enabled);
}

function toggleOnHost() {
    const wasEnabled = enabled;
    enabled = !enabled;
    showRightToggleOnHostButton();
    saveChanges(true);
    
    // If we're disabling the extension (was enabled, now disabled), reload the page
    if (wasEnabled && !enabled) {
        // console.log('[DEBUG] Extension disabled, reloading page to unapply changes');
        chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
            if (tabs && tabs[0] && tabs[0].id) {
                chrome.tabs.reload(tabs[0].id);
                // Close the popup after initiating reload
                window.close();
            }
        });
    }
console.log('setLibrary called - setting library to:', document.getElementById('slLibrary').value);
}

function setLibrary() {
    library = document.getElementById('slLibrary').value;
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
        
        editor.renderer.scroller.removeChild(editor.renderer.emptyMessageNode3);
        editor.renderer.emptyMessageNode3 = null;
    } else if (shouldShow && !node) {
        node = editor.renderer.emptyMessageNode = document.createElement("div");
        node.textContent = "Add your Javascript here and click 'Save and Run'"
        node.className = "ace_invisible ace_emptyMessage"
        node.style.padding = "0px 5px 5px 5px"
        editor.renderer.scroller.appendChild(node);

        node2 = editor.renderer.emptyMessageNode2 = document.createElement("div");
        node2.textContent = "Select a jQuery library if needed for your script"
        node2.className = "ace_invisible ace_emptyMessage"
        node2.style.padding = "10px 5px 5px 5px"
        editor.renderer.scroller.appendChild(node2);

        node3 = editor.renderer.emptyMessageNode3 = document.createElement("div");
        node3.textContent = "It will be run now and everytime you visit this domain again in the future!"
        node3.className = "ace_invisible ace_emptyMessage"
        node3.style.padding = "20px 5px 5px 5px"
        editor.renderer.scroller.appendChild(node3);
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
    // Check Chrome storage quotas and limits
    chrome.storage.sync.getBytesInUse(null, function(bytesInUse) {
        console.log('[STORAGE DEBUG] Chrome storage sync bytes in use:', bytesInUse);
        if (chrome.runtime.lastError) {
            console.error('[STORAGE DEBUG] Error checking sync storage usage:', chrome.runtime.lastError);
        }
    });
    
    chrome.storage.local.getBytesInUse(null, function(bytesInUse) {
        console.log('[STORAGE DEBUG] Chrome storage local bytes in use:', bytesInUse);
        if (chrome.runtime.lastError) {
            console.error('[STORAGE DEBUG] Error checking local storage usage:', chrome.runtime.lastError);
        }
    });
    
    editor = ace.edit("editor");
    document.getElementById('runJavascript').addEventListener('click', function(e) {
        e.preventDefault();
        saveChanges();
    });
    console.log('[STORAGE DEBUG] Loading storage for host:', host, 'key:', key);
    document.getElementById('chkToggleOnHost').addEventListener('change', toggleOnHost);
    document.getElementById('slLibrary').addEventListener('change', setLibrary);

    chrome.storage.sync.get(function(obj) {
        console.log('[STORAGE DEBUG] Loading data for host:', host);
        console.log('[STORAGE DEBUG] Raw storage data:', obj);
        
        if (chrome.runtime.lastError) {
            console.error('[STORAGE DEBUG] Error loading from chrome.storage.sync:', chrome.runtime.lastError);
            
            // Fallback to local storage if sync fails
            chrome.storage.local.get(function(localObj) {
                console.log('[STORAGE DEBUG] Fallback to local storage, data:', localObj);
                if (chrome.runtime.lastError) {
                    console.error('[STORAGE DEBUG] Error loading from chrome.storage.local:', chrome.runtime.lastError);
                } else {
                    processStorageData(localObj);
                }
            });
            return;
        }
        
        processStorageData(obj);
    });
    
    function processStorageData(obj) {
        var js = obj['runjavascript_'+host];
        console.log('[STORAGE DEBUG] Processed data for key runjavascript_' + host + ':', js);
        
        // Get the current library selection from dropdown
        var currentLibrary = document.getElementById('slLibrary').value || '';
        
        // Normalize data structure - handle legacy formats
        if (typeof js === 'string') {
            // Legacy string format
            console.log('[STORAGE DEBUG] Converting legacy string format');
            js = {'code': js, 'enabled': 'true', 'library': currentLibrary};
        } else if (typeof js === 'undefined' || js === null) {
            // No data found
            console.log('[STORAGE DEBUG] No data found, using defaults');
            js = {'code': '', 'enabled': 'true', 'library': currentLibrary};
        } else if (typeof js === 'object') {
            // Ensure all required properties exist with defaults
            console.log('[STORAGE DEBUG] Processing object format');
            js = {
                'code': js.code || '',
                'enabled': js.enabled !== undefined ? js.enabled : 'true',
                'library': js.library || currentLibrary
            };
        }
        
        console.log('[STORAGE DEBUG] Final processed data:', js);
        
        // Convert string boolean to actual boolean for enabled flag
        enabled = (js.enabled === true || js.enabled === 'true');
        showRightToggleOnHostButton();
        editor.setValue(js.code || "");
        // Use the current library selection if no library is specified in storage
        var currentLibrary = document.getElementById('slLibrary').value || '';
        library = js.library || currentLibrary;
        document.getElementById('slLibrary').value = library;
        
        console.log('[STORAGE DEBUG] UI updated - enabled:', enabled, 'library:', library, 'code length:', (js.code || '').length);
    }

    editor.on("input", update_ace_placeholder);
    setTimeout(update_ace_placeholder, 100);
});
