// Common test utilities and helpers
import { expect } from 'bun:test';
import { JSDOM } from 'jsdom';
import sinon from 'sinon';

/**
 * Creates a DOM element with the given HTML
 * @param {string} html - HTML string to create element from
 * @returns {HTMLElement} The created element
 */
export function createElementFromHTML(html) {
  const div = document.createElement('div');
  div.innerHTML = html.trim();
  return div.firstChild;
}

/**
 * Simulates a DOM event on an element
 * @param {HTMLElement} element - The element to trigger the event on
 * @param {string} eventName - The name of the event to trigger
 * @param {Object} [eventData={}] - Additional data for the event
 */
export function simulateEvent(element, eventName, eventData = {}) {
  if (!element) {
    console.error(`Error simulating ${eventName} event: Element is undefined or null`);
    return;
  }
  
  try {
    // Use the global window if element doesn't have ownerDocument
    const targetWindow = (element.ownerDocument && element.ownerDocument.defaultView) || window;
    
    if (targetWindow && typeof targetWindow.Event === 'function') {
      const event = new targetWindow.Event(eventName, {
        bubbles: true,
        cancelable: true,
      });
      
      // Add any custom data to the event
      Object.assign(event, eventData);
      
      element.dispatchEvent(event);
    } else {
      // Fallback for environments without proper Event constructor
      const event = document.createEvent('Event');
      event.initEvent(eventName, true, true);
      
      // Add any custom data to the event
      Object.assign(event, eventData);
      
      element.dispatchEvent(event);
    }
  } catch (e) {
    console.error(`Error simulating ${eventName} event:`, e);
    // Fallback for testing - call the appropriate event handler directly if it exists
    if (eventName === 'click' && element.onclick && typeof element.onclick === 'function') {
      element.onclick();
    } else if (eventName === 'change' && element.onchange && typeof element.onchange === 'function') {
      element.onchange();
    }
  }
}

/**
 * Simulates a click event on an element
 * @param {HTMLElement} element - The element to click
 */
export function simulateClick(element) {
  simulateEvent(element, 'click');
}

/**
 * Simulates a change event on an input element
 * @param {HTMLElement} element - The input element
 * @param {string|boolean} value - The new value
 */
export function simulateChange(element, value) {
  if (element.type === 'checkbox' || element.type === 'radio') {
    element.checked = !!value;
  } else {
    element.value = value;
  }
  simulateEvent(element, 'change');
}

/**
 * Simulates keyboard input on an element
 * @param {HTMLElement} element - The element to type in
 * @param {string} text - The text to type
 */
export function simulateTyping(element, text) {
  element.value = text;
  simulateEvent(element, 'input');
}

/**
 * Creates a mock of the Ace editor
 * @returns {Object} Mock Ace editor
 */
export function createMockAceEditor() {
  return {
    setValue: sinon.stub(),
    getValue: sinon.stub().returns(''),
    on: sinon.stub(),
    session: {
      getValue: sinon.stub().returns(''),
      setValue: sinon.stub(),
    },
    renderer: {
      scroller: document.createElement('div'),
      emptyMessageNode: null,
      emptyMessageNode2: null,
      emptyMessageNode3: null,
    },
  };
}

/**
 * Waits for a specified amount of time
 * @param {number} ms - Time to wait in milliseconds
 * @returns {Promise} Promise that resolves after the specified time
 */
export function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Creates a mock storage object with get/set methods
 * @param {Object} initialData - Initial data for the storage
 * @returns {Object} Mock storage object
 */
export function createMockStorage(initialData = {}) {
  // Use a shared object to store data
  const mockStorage = {
    _data: { ...initialData }
  };
  
  // Create methods that operate on the _data property
  mockStorage.get = sinon.stub().callsFake((key, callback) => {
    let result;
    if (key === null) {
      // Get all items
      result = { ...mockStorage._data };
    } else if (typeof key === 'string') {
      // Get a specific item
      result = { [key]: mockStorage._data[key] };
    } else if (Array.isArray(key)) {
      // Get multiple items
      result = {};
      key.forEach(k => {
        if (mockStorage._data[k] !== undefined) {
          result[k] = mockStorage._data[k];
        }
      });
    } else {
      // Get items matching object keys
      result = {};
      Object.keys(key).forEach(k => {
        result[k] = mockStorage._data[k] !== undefined ? mockStorage._data[k] : key[k];
      });
    }
    
    if (callback) callback(result);
    return Promise.resolve(result);
  });
  
  mockStorage.set = sinon.stub().callsFake((items, callback) => {
    Object.assign(mockStorage._data, items);
    if (callback) callback();
    return Promise.resolve();
  });
  
  mockStorage.remove = sinon.stub().callsFake((key, callback) => {
    if (Array.isArray(key)) {
      key.forEach(k => delete mockStorage._data[k]);
    } else {
      delete mockStorage._data[key];
    }
    if (callback) callback();
    return Promise.resolve();
  });
  
  mockStorage.clear = sinon.stub().callsFake((callback) => {
    mockStorage._data = {};
    if (callback) callback();
    return Promise.resolve();
  });
  
  return mockStorage;
}

/**
 * Creates a mock tab object
 * @param {Object} tabData - Custom tab data
 * @returns {Object} Mock tab object
 */
export function createMockTab(tabData = {}) {
  return {
    id: 1,
    url: 'https://example.com',
    active: true,
    currentWindow: true,
    ...tabData,
  };
}

/**
 * Sets up a mock popup environment for testing
 * @param {Object} options - Setup options
 * @returns {Object} The setup environment
 */
export function setupPopupTest(options = {}) {
  // Create a basic popup HTML structure
  const dom = new JSDOM(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>Run Javascript</title>
      </head>
      <body>
        <div id="header">
          <a href="#" id="runJavascript">Save &amp; Run</a>
          <a href="#" id="help_a">Help</a>
          <div id="status-indicator" class="enabled">Enabled</div>
          <div id="lblUpdated">Changes has been applied..</div>
          <div id="runToggleOnHost">
            <input type="checkbox" id="chkToggleOnHost" />
            <label for="chkToggleOnHost" id="chkToggleOnHost_span">Enable on <span id='_toggle_host_name'></span></label>
          </div>
          <div id="libraryDropdownContainer">
            <select id="slLibrary">
              <option value="" selected="">Don't use a library..</option>
              <option value="jquery_3_3_1">jQuery 3.3.1</option>
              <option value="jquery_2_2_4">jQuery 2.2.4</option>
              <option value="jquery_1_12_4">jQuery 1.12.4</option>
            </select>
          </div>
          <button id="sidebar-toggle" aria-label="Toggle sidebar" aria-expanded="false" aria-controls="sidebar">
            <span class="toggle-icon">≡</span>
          </button>
        </div>
        <div class="main-container">
          <div id="sidebar">
            <div class="sidebar-header">
              <h3>Scripts</h3>
            </div>
            <div class="sidebar-content">
              <ul id="script-list" role="list" aria-label="Available scripts">
                <!-- Script items will be populated dynamically -->
              </ul>
              <div class="empty-script-list" style="display: none;">
                <p>No scripts available</p>
              </div>
            </div>
          </div>
          <div id="editor"></div>
        </div>
      </body>
    </html>
  `, { url: 'chrome-extension://mock-extension-id/popup.html' });

  // Set up the document
  const document = dom.window.document;
  
  // Create a mock Ace editor
  const mockEditor = createMockAceEditor();
  
  // Set up any custom options
  if (options.storageData) {
    // Set up storage with custom data
    const mockStorage = createMockStorage(options.storageData);
    global.chrome.storage.sync.get.callsFake(mockStorage.get);
    global.chrome.storage.sync.set.callsFake(mockStorage.set);
    global.chrome.storage.local.get.callsFake(mockStorage.get);
    global.chrome.storage.local.set.callsFake(mockStorage.set);
  }
  
  if (options.tabData) {
    // Set up tabs with custom data
    const mockTab = createMockTab(options.tabData);
    global.chrome.tabs.query.callsFake((query, callback) => {
      if (callback) callback([mockTab]);
      return Promise.resolve([mockTab]);
    });
  }
  
  return {
    document,
    window: dom.window,
    editor: mockEditor,
  };
}
