// This script adds the missing initialization for tests
// Import it in test files that need it

/**
 * Initialize script list for testing
 * @param {Document} document - The document object
 * @param {Object} storageData - Storage data containing scripts
 */
export function initializeScriptList(document, storageData) {
  // Get the script list element
  const scriptListElement = document.getElementById('script-list');
  if (!scriptListElement) return;
  
  // Clear existing items
  scriptListElement.innerHTML = '';
  
  // Process scripts from storage
  let scriptCount = 0;
  
  for (const key in storageData) {
    if (key.startsWith('runjavascript_')) {
      const domain = extractDomainFromKey(key);
      if (domain) {
        const scriptData = storageData[key];
        const isCurrent = domain === 'example.com'; // Assuming example.com is current in tests
        const listItem = createScriptListItem(domain, scriptData, isCurrent, document);
        scriptListElement.appendChild(listItem);
        scriptCount++;
      }
    }
  }
  
  // Show/hide empty message
  const emptyMessage = document.querySelector('.empty-script-list');
  if (emptyMessage) {
    emptyMessage.style.display = scriptCount === 0 ? 'block' : 'none';
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
 * @param {Document} document - The document object
 * @returns {HTMLElement} The created list item element
 */
function createScriptListItem(domain, scriptData, isCurrent, document) {
  // Create list item
  const listItem = document.createElement('li');
  listItem.className = 'script-item';
  listItem.setAttribute('role', 'listitem');
  listItem.setAttribute('tabindex', '0');
  listItem.dataset.domain = domain;
  
  if (isCurrent) {
    listItem.classList.add('current');
  }
  
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
  
  // Add elements to list item
  listItem.appendChild(nameElement);
  listItem.appendChild(statusElement);
  
  return listItem;
}

/**
 * Load a script into the editor for testing
 * @param {Document} document - The document object
 * @param {Object} editor - The mock editor object
 * @param {string} domain - The domain name
 * @param {Object} scriptData - The script data
 */
export function loadScript(document, editor, domain, scriptData) {
  // Update editor with script code
  editor.setValue(scriptData.code || '');
  
  // Update library dropdown
  document.getElementById('slLibrary').value = scriptData.library || '';
  
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
 * Initialize sidebar visibility for testing
 * @param {Document} document - The document object
 * @param {boolean} visible - Whether sidebar should be visible
 */
export function initializeSidebar(document, visible = false) {
  const sidebar = document.getElementById('sidebar');
  const toggleButton = document.getElementById('sidebar-toggle');
  
  if (sidebar && toggleButton) {
    if (visible) {
      sidebar.classList.add('visible');
      toggleButton.setAttribute('aria-expanded', 'true');
      sidebar.style.display = 'block'; // Explicitly set display style
      
      // Add responsive styles
      sidebar.style.maxWidth = '250px';
    } else {
      sidebar.classList.remove('visible');
      toggleButton.setAttribute('aria-expanded', 'false');
      sidebar.style.display = 'none'; // Explicitly set display style
    }
  }
}

/**
 * Toggle sidebar visibility for testing
 * @param {Document} document - The document object
 */
export function toggleSidebar(document) {
  const sidebar = document.getElementById('sidebar');
  const toggleButton = document.getElementById('sidebar-toggle');
  
  if (sidebar && toggleButton) {
    const isVisible = sidebar.classList.contains('visible');
    
    if (isVisible) {
      sidebar.classList.remove('visible');
      toggleButton.setAttribute('aria-expanded', 'false');
      sidebar.style.display = 'none'; // Explicitly set display style
    } else {
      sidebar.classList.add('visible');
      toggleButton.setAttribute('aria-expanded', 'true');
      sidebar.style.display = 'block'; // Explicitly set display style
      
      // Add responsive styles
      sidebar.style.maxWidth = '250px';
    }
  }
}

/**
 * Initialize status indicators for testing
 * @param {Document} document - The document object
 * @param {boolean} enabled - Whether scripts are enabled
 */
export function initializeStatusIndicators(document, enabled = true) {
  const statusIndicator = document.getElementById('status-indicator');
  if (statusIndicator) {
    statusIndicator.textContent = enabled ? 'Enabled' : 'Disabled';
    statusIndicator.className = enabled ? 'enabled' : 'disabled';
  }
}
