var editor;
var data;
var host;
var key;
var enabled;
var library;
var scriptList = {};


function extractHostname(url) {
  if (!url) return;
  var hostname;
  if (url.indexOf("://") > -1) {
    hostname = url.split('/')[2];
  } else {
    hostname = url.split('/')[0];
  }

  // Special handling for IPv6 addresses which are enclosed in square brackets
  if (hostname.startsWith('[') && hostname.includes(']')) {
    // For IPv6, keep everything up to the closing bracket
    var closingBracketPos = hostname.indexOf(']');
    hostname = hostname.substring(0, closingBracketPos + 1);
  } else {
    // For regular hostnames, remove port if present
    hostname = hostname.split(':')[0];
  }

  hostname = hostname.split('?')[0];
  return hostname;
}

function saveChanges(dont_run) {
  var _code = editor.getValue();

  // Get the current library selection BEFORE creating the js object
  library = document.getElementById('slLibrary').value;
  console.log('Before creating js object - library:', library);

  var js = { 'code': _code, 'enabled': enabled, 'library': library };

  if (_code == undefined || _code == 'undefined') {
    js = { 'code': '', 'enabled': 'true', 'library': library }; // Use current library selection
  }

  console.log('js object being saved:', js);

  // Use StorageManager if available, otherwise fall back to direct chrome.storage usage
  if (window.StorageManager) {
    StorageManager.saveScript(host, js)
      .then(function(success) {
        console.log('[STORAGE DEBUG] StorageManager save result:', success);
        
        if (!success) {
          console.error('[STORAGE DEBUG] Failed to save script with StorageManager');
        }
        
        // Continue with execution if needed
        handleScriptExecution(js, dont_run);
      })
      .catch(function(error) {
        console.error('[STORAGE DEBUG] Error saving with StorageManager:', error);
        
        // Fall back to old storage method
        saveWithChromeStorage(js);
        
        // Continue with execution if needed
        handleScriptExecution(js, dont_run);
      });
  } else {
    // Fall back to old storage method
    saveWithChromeStorage(js);
    
    // Continue with execution if needed
    handleScriptExecution(js, dont_run);
  }

  document.getElementById("lblUpdated").style.display = "inline-block";
  setTimeout(function () {
    document.getElementById("lblUpdated").style.display = "none";
  }, 2000);
}

function saveWithChromeStorage(js) {
  var _data = new Object();
  _data['runjavascript_' + host] = js;

  chrome.storage.sync.set(_data, function () {
    if (chrome.runtime.lastError) {
      // console.error('[STORAGE DEBUG] Error saving to chrome.storage.sync:', chrome.runtime.lastError);
      // console.error('[STORAGE DEBUG] Attempted to save data:', _data);

      // Fallback to local storage if sync fails
      chrome.storage.local.set(_data, function () {
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
}

function handleScriptExecution(js, dont_run) {
  if (typeof dont_run === 'undefined') {
    if (enabled) {
      chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
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
}

// setupSandbox function removed - using the one from background.js via chrome.scripting.executeScript
// This eliminates code duplication and potential inconsistencies

function showRightToggleOnHostButton() {
  document.getElementById('chkToggleOnHost').checked = !(!enabled);
  updateToggleStatus(enabled);
}

// Function to update the toggle status display
function updateToggleStatus(isEnabled) {
  // Update toggle status text and styling
  const toggleStatus = document.getElementById('toggle-status');
  if (toggleStatus) {
    toggleStatus.textContent = isEnabled ? 'Enabled' : 'Disabled';
    toggleStatus.className = isEnabled ? 'toggle-status enabled' : 'toggle-status disabled';
  }

  // Update extension icon badge
  updateBadgeStatus(isEnabled);
}

// Function to update all status indicators (for backward compatibility)
function updateStatusIndicators(isEnabled) {
  updateToggleStatus(isEnabled);
}

// Function to update the extension icon badge
function updateBadgeStatus(isEnabled) {
  chrome.action.setBadgeText({
    text: isEnabled ? 'ON' : 'OFF'
  });

  chrome.action.setBadgeBackgroundColor({
    color: isEnabled ? '#4CAF50' : '#F44336'
  });
}

function toggleOnHost() {
  const wasEnabled = enabled;
  enabled = !enabled;
  showRightToggleOnHostButton();
  saveChanges(true);

  // If we're disabling the extension (was enabled, now disabled), reload the page
  if (wasEnabled && !enabled) {
    // console.log('[DEBUG] Extension disabled, reloading page to unapply changes');
    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
      if (tabs && tabs[0] && tabs[0].id) {
        chrome.tabs.reload(tabs[0].id);
        // Close the popup after initiating reload
        // window.close();
      }
    });
  }
}

function setLibrary() {
  library = document.getElementById('slLibrary').value;
  saveChanges(true);
}

/**
 * Toggles the sidebar visibility
 */
function toggleSidebar() {
  const sidebar = document.getElementById('sidebar');
  const toggleButton = document.getElementById('sidebar-toggle');

  // Check if sidebar is currently visible
  const isVisible = sidebar.classList.contains('visible');

  // Toggle visibility
  if (isVisible) {
    sidebar.classList.remove('visible');
    toggleButton.setAttribute('aria-expanded', 'false');
  } else {
    sidebar.classList.add('visible');
    toggleButton.setAttribute('aria-expanded', 'true');

    // Populate script list when sidebar is opened
    populateScriptList();
  }
}

/**
 * Extracts domain name from a storage key
 * @param {string} key - Storage key in format 'runjavascript_domain.com'
 * @returns {string} The extracted domain name
 */
function extractDomainFromKey(key) {
  if (key && key.startsWith('runjavascript_')) {
    return key.substring('runjavascript_'.length);
  }
  return '';
}

/**
 * Creates a script list item element
 * @param {string} domain - Domain name for the script
 * @param {Object} scriptData - Script data object
 * @param {boolean} isCurrent - Whether this is the current domain
 * @returns {HTMLElement} The created list item element
 */
function createScriptListItem(domain, scriptData, isCurrent) {
  // Create list item
  const listItem = document.createElement('li');
  listItem.className = 'script-item';
  listItem.setAttribute('role', 'listitem');
  listItem.setAttribute('tabindex', '0');
  listItem.dataset.domain = domain;

  if (isCurrent) {
    listItem.classList.add('current');
  }

  // Create main content container (clickable area)
  const mainContent = document.createElement('div');
  mainContent.className = 'script-main-content';

  // Create script name element
  const nameElement = document.createElement('span');
  nameElement.className = 'script-name';
  nameElement.textContent = domain;

  // Create status indicator
  const statusElement = document.createElement('span');
  statusElement.className = 'script-status';

  const isEnabled = scriptData.enabled === true || scriptData.enabled === 'true';
  if (isEnabled) {
    statusElement.classList.add('enabled');
    statusElement.textContent = 'Enabled';
  } else {
    statusElement.classList.add('disabled');
    statusElement.textContent = 'Disabled';
  }
  
  // Create container for badges
  const badgesContainer = document.createElement('div');
  badgesContainer.className = 'script-badges';
  
  // Add chunked badge if script is chunked
  if (scriptData.isChunked) {
    const chunkedBadge = document.createElement('span');
    chunkedBadge.className = 'script-badge chunked';
    chunkedBadge.title = `Large script split into ${scriptData.chunkCount} chunks`;
    chunkedBadge.textContent = 'Chunked';
    badgesContainer.appendChild(chunkedBadge);
  }
  
  // Add size badge if size is available
  if (scriptData.size) {
    const sizeBadge = document.createElement('span');
    sizeBadge.className = 'script-badge size';
    sizeBadge.title = 'Script size';
    
    // Format size (KB or MB)
    const sizeKB = scriptData.size / 1024;
    const sizeMB = sizeKB / 1024;
    let sizeText = '';
    
    if (sizeMB >= 1) {
      sizeText = sizeMB.toFixed(1) + ' MB';
    } else {
      sizeText = Math.ceil(sizeKB) + ' KB';
    }
    
    sizeBadge.textContent = sizeText;
    badgesContainer.appendChild(sizeBadge);
  }

  // Add elements to main content
  mainContent.appendChild(nameElement);
  mainContent.appendChild(statusElement);
  if (badgesContainer.children.length > 0) {
    mainContent.appendChild(badgesContainer);
  }

  // Create action buttons container
  const actionsContainer = document.createElement('div');
  actionsContainer.className = 'script-actions';

  // Create enable/disable toggle button
  const toggleButton = document.createElement('button');
  toggleButton.className = 'script-action-btn toggle-btn';
  toggleButton.title = isEnabled ? 'Disable script' : 'Enable script';
  toggleButton.setAttribute('aria-label', isEnabled ? 'Disable script' : 'Enable script');
  
  // Add CSS-based icon
  const toggleIcon = document.createElement('span');
  toggleIcon.className = isEnabled ? 'icon-pause' : 'icon-play';
  toggleButton.appendChild(toggleIcon);
  
  toggleButton.addEventListener('click', function(e) {
    e.stopPropagation(); // Prevent triggering the list item click
    toggleScriptEnabled(domain, scriptData);
  });

  // Create delete button
  const deleteButton = document.createElement('button');
  deleteButton.className = 'script-action-btn delete-btn';
  deleteButton.title = 'Delete script';
  deleteButton.setAttribute('aria-label', 'Delete script');
  
  // Add CSS-based icon
  const deleteIcon = document.createElement('span');
  deleteIcon.className = 'icon-trash';
  deleteButton.appendChild(deleteIcon);
  
  deleteButton.addEventListener('click', function(e) {
    e.stopPropagation(); // Prevent triggering the list item click
    deleteScript(domain);
  });

  // Add buttons to actions container
  actionsContainer.appendChild(toggleButton);
  actionsContainer.appendChild(deleteButton);

  // Add main content and actions to list item
  listItem.appendChild(mainContent);
  listItem.appendChild(actionsContainer);

  // Add click event listener to main content only
  mainContent.addEventListener('click', function () {
    loadScript(domain, scriptData);
  });

  // Add keyboard event listener for accessibility
  listItem.addEventListener('keydown', function (e) {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      loadScript(domain, scriptData);
    }
  });

  return listItem;
}

/**
 * Loads a script into the editor
 * @param {string} domain - Domain name for the script
 * @param {Object} scriptData - Script data object
 */
function loadScript(domain, scriptData) {
  // Update global variables to point to the selected domain
  host = domain;
  key = 'runjavascript_' + domain;

  // Update header to show the current domain
  const hostNameElement = document.getElementById('_toggle_host_name');
  if (hostNameElement) {
    hostNameElement.innerHTML = domain;
  }

  // Update editor with script code
  editor.setValue(scriptData.code || '');

  // Update library dropdown
  document.getElementById('slLibrary').value = scriptData.library || '';

  // Update enabled state
  enabled = (scriptData.enabled === true || scriptData.enabled === 'true');
  showRightToggleOnHostButton();

  // Update the current script indicator
  const scriptItems = document.querySelectorAll('.script-item');
  scriptItems.forEach(item => {
    if (item.dataset.domain === domain) {
      item.classList.add('current');
    } else {
      item.classList.remove('current');
    }
  });
}

/**
 * Populates the script list from storage
 */
function populateScriptList() {
  const scriptListElement = document.getElementById('script-list');
  const emptyMessage = document.querySelector('.empty-script-list');

  // Clear existing items
  scriptListElement.innerHTML = '';

  // Get all scripts from storage
  chrome.storage.sync.get(null, function (items) {
    if (chrome.runtime.lastError) {
      console.error('[SCRIPT LIST] Error loading scripts from storage:', chrome.runtime.lastError);

      // Fallback to local storage
      chrome.storage.local.get(null, function (localItems) {
        processScripts(localItems);
      });
      return;
    }

    processScripts(items);
  });

  function processScripts(items) {
    // Filter for script items and store in scriptList object
    scriptList = {};
    let scriptCount = 0;

    for (const key in items) {
      if (key.startsWith('runjavascript_')) {
        const domain = extractDomainFromKey(key);
        if (domain) {
          scriptList[domain] = items[key];
          scriptCount++;
        }
      }
    }

    // Show/hide empty message
    if (scriptCount === 0) {
      emptyMessage.style.display = 'block';
      return;
    } else {
      emptyMessage.style.display = 'none';
    }

    // Create list items for each script
    for (const domain in scriptList) {
      const isCurrent = domain === host;
      const listItem = createScriptListItem(domain, scriptList[domain], isCurrent);
      scriptListElement.appendChild(listItem);
    }
  }
}

/**
 * Updates a script in the list or adds it if it doesn't exist
 * @param {string} domain - Domain name for the script
 * @param {Object} scriptData - Script data object
 */
function updateScriptInList(domain, scriptData) {
  const scriptListElement = document.getElementById('script-list');
  const emptyMessage = document.querySelector('.empty-script-list');

  // Update scriptList object
  scriptList[domain] = scriptData;

  // Find existing item
  let existingItem = null;
  const scriptItems = scriptListElement.querySelectorAll('.script-item');
  scriptItems.forEach(item => {
    if (item.dataset.domain === domain) {
      existingItem = item;
    }
  });

  // Create new item or update existing
  const isCurrent = domain === host;
  if (existingItem) {
    // Update existing item
    const newItem = createScriptListItem(domain, scriptData, isCurrent);
    scriptListElement.replaceChild(newItem, existingItem);
  } else {
    // Add new item
    const newItem = createScriptListItem(domain, scriptData, isCurrent);
    scriptListElement.appendChild(newItem);

    // Hide empty message when adding a script
    emptyMessage.style.display = 'none';
  }
}

/**
 * Toggles the enabled state of a script
 * @param {string} domain - Domain name for the script
 * @param {Object} scriptData - Current script data object
 */
function toggleScriptEnabled(domain, scriptData) {
  // Toggle the enabled state
  const newEnabledState = !(scriptData.enabled === true || scriptData.enabled === 'true');
  
  // Update the script data
  const updatedScriptData = {
    ...scriptData,
    enabled: newEnabledState
  };

  // Save to storage
  const storageKey = 'runjavascript_' + domain;
  const storageData = {};
  storageData[storageKey] = updatedScriptData;

  // Use StorageManager if available, otherwise fall back to direct chrome.storage usage
  if (window.StorageManager) {
    StorageManager.saveScript(domain, updatedScriptData)
      .then(function(success) {
        if (success) {
          console.log('[SCRIPT TOGGLE] Successfully toggled script for domain:', domain);
          // Update the script list
          updateScriptInList(domain, updatedScriptData);
          
          // If this is the current script, update the UI
          if (domain === host) {
            enabled = newEnabledState;
            showRightToggleOnHostButton();
          }
          
          // Update badge status
          updateBadgeStatus(newEnabledState);
        } else {
          console.error('[SCRIPT TOGGLE] Failed to toggle script for domain:', domain);
          alert('Failed to update script. Please try again.');
        }
      })
      .catch(function(error) {
        console.error('[SCRIPT TOGGLE] Error toggling script:', error);
        // Fall back to old storage method
        saveScriptWithChromeStorage(storageData, domain, updatedScriptData);
      });
  } else {
    // Fall back to old storage method
    saveScriptWithChromeStorage(storageData, domain, updatedScriptData);
  }
}

/**
 * Helper function to save script using chrome.storage
 */
function saveScriptWithChromeStorage(storageData, domain, updatedScriptData) {
  chrome.storage.sync.set(storageData, function () {
    if (chrome.runtime.lastError) {
      console.error('[SCRIPT TOGGLE] Error saving to chrome.storage.sync:', chrome.runtime.lastError);
      
      // Fallback to local storage
      chrome.storage.local.set(storageData, function () {
        if (chrome.runtime.lastError) {
          console.error('[SCRIPT TOGGLE] Error saving to chrome.storage.local:', chrome.runtime.lastError);
          alert('Failed to update script. Please try again.');
        } else {
          console.log('[SCRIPT TOGGLE] Successfully saved to local storage');
          handleSuccessfulToggle(domain, updatedScriptData);
        }
      });
    } else {
      console.log('[SCRIPT TOGGLE] Successfully saved to sync storage');
      handleSuccessfulToggle(domain, updatedScriptData);
    }
  });
}

/**
 * Handle successful script toggle
 */
function handleSuccessfulToggle(domain, updatedScriptData) {
  // Update the script list
  updateScriptInList(domain, updatedScriptData);
  
  // If this is the current script, update the UI
  if (domain === host) {
    enabled = updatedScriptData.enabled;
    showRightToggleOnHostButton();
  }
  
  // Update badge status
  updateBadgeStatus(updatedScriptData.enabled);
}

/**
 * Deletes a script from storage and the UI
 * @param {string} domain - Domain name for the script to delete
 */
function deleteScript(domain) {
  // Confirm deletion
  if (!confirm(`Are you sure you want to delete the script for "${domain}"?\n\nThis action cannot be undone.`)) {
    return;
  }

  const storageKey = 'runjavascript_' + domain;

  // Use StorageManager if available for proper cleanup of chunked scripts
  if (window.StorageManager) {
    StorageManager.removeScript(domain)
      .then(function(success) {
        if (success) {
          console.log('[SCRIPT DELETE] Successfully deleted script for domain:', domain);
          handleSuccessfulDeletion(domain);
        } else {
          console.error('[SCRIPT DELETE] Failed to delete script for domain:', domain);
          alert('Failed to delete script. Please try again.');
        }
      })
      .catch(function(error) {
        console.error('[SCRIPT DELETE] Error deleting script:', error);
        // Fall back to simple chrome.storage removal
        deleteScriptWithChromeStorage(storageKey, domain);
      });
  } else {
    // Fall back to simple chrome.storage removal
    deleteScriptWithChromeStorage(storageKey, domain);
  }
}

/**
 * Helper function to delete script using chrome.storage
 */
function deleteScriptWithChromeStorage(storageKey, domain) {
  chrome.storage.sync.remove(storageKey, function () {
    if (chrome.runtime.lastError) {
      console.error('[SCRIPT DELETE] Error removing from chrome.storage.sync:', chrome.runtime.lastError);
      
      // Try local storage
      chrome.storage.local.remove(storageKey, function () {
        if (chrome.runtime.lastError) {
          console.error('[SCRIPT DELETE] Error removing from chrome.storage.local:', chrome.runtime.lastError);
          alert('Failed to delete script. Please try again.');
        } else {
          console.log('[SCRIPT DELETE] Successfully removed from local storage');
          handleSuccessfulDeletion(domain);
        }
      });
    } else {
      console.log('[SCRIPT DELETE] Successfully removed from sync storage');
      handleSuccessfulDeletion(domain);
    }
  });
}

/**
 * Handle successful script deletion
 */
function handleSuccessfulDeletion(domain) {
  // Remove from scriptList object
  delete scriptList[domain];

  // Remove from UI
  const scriptListElement = document.getElementById('script-list');
  const scriptItems = scriptListElement.querySelectorAll('.script-item');
  
  scriptItems.forEach(item => {
    if (item.dataset.domain === domain) {
      item.remove();
    }
  });

  // Show empty message if no scripts left
  const remainingItems = scriptListElement.querySelectorAll('.script-item');
  if (remainingItems.length === 0) {
    const emptyMessage = document.querySelector('.empty-script-list');
    emptyMessage.style.display = 'block';
  }

  // If this was the current script, reset to a default state
  if (domain === host) {
    // Find another script to load, or reset to empty state
    const remainingDomains = Object.keys(scriptList);
    if (remainingDomains.length > 0) {
      // Load the first available script
      const newDomain = remainingDomains[0];
      loadScript(newDomain, scriptList[newDomain]);
    } else {
      // Reset to empty state
      editor.setValue('');
      document.getElementById('slLibrary').value = '';
      enabled = true;
      showRightToggleOnHostButton();
      
      // Reset host to current tab's domain
      chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
        if (tabs && tabs[0] && tabs[0].url) {
          const currentHost = extractHostname(tabs[0].url);
          if (currentHost) {
            host = currentHost;
            key = 'runjavascript_' + host;
            const hostNameElement = document.getElementById('_toggle_host_name');
            if (hostNameElement) {
              hostNameElement.innerHTML = host;
            }
          }
        }
      });
    }
  }
}

/**
 * Removes a script from the list
 * @param {string} domain - Domain name for the script to remove
 */
function removeScriptFromList(domain) {
  const scriptListElement = document.getElementById('script-list');
  const emptyMessage = document.querySelector('.empty-script-list');

  // Remove from scriptList object
  delete scriptList[domain];

  // Find and remove item from DOM
  const scriptItems = scriptListElement.querySelectorAll('.script-item');
  scriptItems.forEach(item => {
    if (item.dataset.domain === domain) {
      scriptListElement.removeChild(item);
    }
  });

  // Show empty message if no scripts left
  if (scriptListElement.children.length === 0) {
    emptyMessage.style.display = 'block';
  }
}

function update_ace_placeholder() {
  var shouldShow = !editor.session.getValue().length;
  var node = editor.renderer.emptyMessageNode;

  var node2 = editor.renderer.emptyMessageNode2;
  if (!shouldShow && node) {
    editor.renderer.scroller.removeChild(editor.renderer.emptyMessageNode);
    editor.renderer.emptyMessageNode = null;

    if (editor.renderer.emptyMessageNode2) {
      editor.renderer.scroller.removeChild(editor.renderer.emptyMessageNode2);
      editor.renderer.emptyMessageNode2 = null;
    }

    if (editor.renderer.emptyMessageNode3) {
      editor.renderer.scroller.removeChild(editor.renderer.emptyMessageNode3);
      editor.renderer.emptyMessageNode3 = null;
    }
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
}, function (tabs) {
  var tab = tabs[0];
  if (tab) {
    host = extractHostname(tab.url);
    key = 'runjavascript_' + host;

    const hostNameElement = document.getElementById('_toggle_host_name');
    if (hostNameElement) {
      hostNameElement.innerHTML = host;
    }
  }
});

document.addEventListener('DOMContentLoaded', function () {
  // Check Chrome storage quotas and limits
  chrome.storage.sync.getBytesInUse(null, function (bytesInUse) {
    console.log('[STORAGE DEBUG] Chrome storage sync bytes in use:', bytesInUse);
    if (chrome.runtime.lastError) {
      console.error('[STORAGE DEBUG] Error checking sync storage usage:', chrome.runtime.lastError);
    }
  });

  chrome.storage.local.getBytesInUse(null, function (bytesInUse) {
    console.log('[STORAGE DEBUG] Chrome storage local bytes in use:', bytesInUse);
    if (chrome.runtime.lastError) {
      console.error('[STORAGE DEBUG] Error checking local storage usage:', chrome.runtime.lastError);
    }
  });

  editor = ace.edit("editor");
  editor.$blockScrolling = Infinity;
  document.getElementById('runJavascript').addEventListener('click', function (e) {
    e.preventDefault();
    saveChanges();
  });
  console.log('[STORAGE DEBUG] Loading storage for host:', host, 'key:', key);
  document.getElementById('chkToggleOnHost').addEventListener('change', toggleOnHost);
  document.getElementById('slLibrary').addEventListener('change', setLibrary);

  // Add event listener for sidebar toggle button
  const sidebarToggleButton = document.getElementById('sidebar-toggle');
  if (sidebarToggleButton) {
    sidebarToggleButton.addEventListener('click', toggleSidebar);

    // Add keyboard event listener for accessibility
    sidebarToggleButton.addEventListener('keydown', function (e) {
      // Toggle sidebar on Enter or Space key
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        toggleSidebar();
      }
    });
  }
  
  // Add event listeners for import/export buttons
  const exportButton = document.getElementById('export-scripts');
  if (exportButton) {
    exportButton.addEventListener('click', exportScripts);
  }
  
  const importButton = document.getElementById('import-scripts');
  if (importButton) {
    importButton.addEventListener('click', importScripts);
  }

  // Listen for storage changes to update script list
  chrome.storage.onChanged.addListener(function (changes, areaName) {
    if (areaName !== 'sync' && areaName !== 'local') return;

    for (const key in changes) {
      if (key.startsWith('runjavascript_')) {
        const domain = extractDomainFromKey(key);
        if (!domain) continue;

        const change = changes[key];

        if (change.newValue === undefined) {
          // Script was deleted
          removeScriptFromList(domain);
        } else {
          // Script was added or updated
          updateScriptInList(domain, change.newValue);
        }
      }
    }
  });

  chrome.storage.sync.get(function (obj) {
    console.log('[STORAGE DEBUG] Loading data for host:', host);
    console.log('[STORAGE DEBUG] Raw storage data:', obj);

    if (chrome.runtime.lastError) {
      console.error('[STORAGE DEBUG] Error loading from chrome.storage.sync:', chrome.runtime.lastError);

      // Fallback to local storage if sync fails
      chrome.storage.local.get(function (localObj) {
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
    var js = obj['runjavascript_' + host];
    console.log('[STORAGE DEBUG] Processed data for key runjavascript_' + host + ':', js);

    // Get the current library selection from dropdown
    var currentLibrary = document.getElementById('slLibrary').value || '';

    // Normalize data structure - handle legacy formats
    if (typeof js === 'string') {
      // Legacy string format
      console.log('[STORAGE DEBUG] Converting legacy string format');
      js = { 'code': js, 'enabled': 'true', 'library': currentLibrary };
    } else if (typeof js === 'undefined' || js === null) {
      // No data found
      console.log('[STORAGE DEBUG] No data found, using defaults');
      js = { 'code': '', 'enabled': 'true', 'library': currentLibrary };
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

    // Update status indicators based on enabled state
    updateStatusIndicators(enabled);
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

/**
 * Export all scripts to a JSON file
 */
function exportScripts() {
  // Use StorageManager if available, otherwise fall back to manual export
  if (window.StorageManager) {
    StorageManager.exportScripts()
      .then(function(scriptsData) {
        downloadScriptsAsJson(scriptsData);
      })
      .catch(function(error) {
        console.error('Error exporting scripts with StorageManager:', error);
        // Fall back to manual export
        manualExportScripts();
      });
  } else {
    // Fall back to manual export if StorageManager is not available
    manualExportScripts();
  }
}

/**
 * Manual export using chrome.storage directly
 */
function manualExportScripts() {
  chrome.storage.sync.get(null, function(items) {
    if (chrome.runtime.lastError) {
      console.error('Error getting scripts from sync storage:', chrome.runtime.lastError);
      
      // Try local storage as fallback
      chrome.storage.local.get(null, function(localItems) {
        if (chrome.runtime.lastError) {
          console.error('Error getting scripts from local storage:', chrome.runtime.lastError);
          alert('Failed to export scripts. Please try again.');
          return;
        }
        
        processExportItems(localItems);
      });
      return;
    }
    
    processExportItems(items);
  });
}

/**
 * Process storage items for export
 */
function processExportItems(items) {
  const scriptsData = {};
  
  // Filter for script items
  for (const key in items) {
    if (key.startsWith('runjavascript_') && 
        !key.includes('_chunk_') && 
        !key.includes('_meta_')) {
      
      const domain = extractDomainFromKey(key);
      if (domain) {
        let scriptData = items[key];
        
        // Handle legacy string format
        if (typeof scriptData === 'string') {
          scriptData = {
            code: scriptData,
            enabled: true,
            library: ''
          };
        }
        
        scriptsData[domain] = scriptData;
      }
    }
  }
  
  downloadScriptsAsJson(scriptsData);
}

/**
 * Download scripts data as a JSON file
 */
function downloadScriptsAsJson(scriptsData) {
  // Convert scripts data to JSON string
  const jsonStr = JSON.stringify(scriptsData, null, 2);
  
  // Create a Blob with the JSON data
  const blob = new Blob([jsonStr], { type: 'application/json' });
  
  // Create a download link
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'run-javascript-scripts-' + new Date().toISOString().slice(0, 10) + '.json';
  
  // Trigger download
  document.body.appendChild(a);
  a.click();
  
  // Clean up
  setTimeout(function() {
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, 0);
}

/**
 * Import scripts from a JSON file
 */
function importScripts() {
  // Create a file input element
  const fileInput = document.createElement('input');
  fileInput.type = 'file';
  fileInput.accept = 'application/json';
  
  fileInput.addEventListener('change', function(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    
    reader.onload = function(e) {
      try {
        const scriptsData = JSON.parse(e.target.result);
        
        // Use StorageManager if available, otherwise fall back to manual import
        if (window.StorageManager) {
          StorageManager.importScripts(scriptsData)
            .then(function(success) {
              if (success) {
                alert('Scripts imported successfully!');
                // Reload the script list
                populateScriptList();
              } else {
                alert('Failed to import some scripts. Please try again.');
              }
            })
            .catch(function(error) {
              console.error('Error importing scripts with StorageManager:', error);
              // Fall back to manual import
              manualImportScripts(scriptsData);
            });
        } else {
          // Fall back to manual import
          manualImportScripts(scriptsData);
        }
      } catch (error) {
        console.error('Error parsing import file:', error);
        alert('Invalid import file format. Please select a valid JSON file.');
      }
    };
    
    reader.readAsText(file);
  });
  
  // Trigger file selection
  fileInput.click();
}

/**
 * Manual import using chrome.storage directly
 */
function manualImportScripts(scriptsData) {
  let importCount = 0;
  let errorCount = 0;
  const totalScripts = Object.keys(scriptsData).length;
  
  for (const domain in scriptsData) {
    const key = 'runjavascript_' + domain;
    const data = {};
    data[key] = scriptsData[domain];
    
    chrome.storage.sync.set(data, function() {
      if (chrome.runtime.lastError) {
        console.error('Error importing script for domain ' + domain + ':', chrome.runtime.lastError);
        errorCount++;
        
        // Try local storage as fallback
        chrome.storage.local.set(data, function() {
          if (chrome.runtime.lastError) {
            console.error('Error importing script to local storage for domain ' + domain + ':', chrome.runtime.lastError);
          } else {
            importCount++;
          }
          
          checkImportCompletion();
        });
      } else {
        importCount++;
        checkImportCompletion();
      }
    });
  }
  
  function checkImportCompletion() {
    if (importCount + errorCount === totalScripts) {
      if (errorCount > 0) {
        alert(`Import completed with ${errorCount} errors. Successfully imported ${importCount} scripts.`);
      } else {
        alert('Scripts imported successfully!');
      }
      
      // Reload the script list
      populateScriptList();
    }
  }
}
