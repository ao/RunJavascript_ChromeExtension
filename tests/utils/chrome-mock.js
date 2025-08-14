// Chrome API mock implementation for testing
import sinon from 'sinon';

/**
 * Creates a Chrome event with addListener, removeListener, and trigger methods
 * @returns {Object} Mock Chrome event object
 */
function createChromeEvent() {
  const listeners = [];
  return {
    addListener: sinon.stub().callsFake((listener) => {
      listeners.push(listener);
    }),
    removeListener: sinon.stub().callsFake((listener) => {
      const index = listeners.indexOf(listener);
      if (index !== -1) {
        listeners.splice(index, 1);
      }
    }),
    trigger: function(...args) {
      listeners.forEach((listener) => {
        listener(...args);
      });
    }
  };
}

/**
 * Creates a comprehensive mock of the Chrome extension API
 * @returns {Object} Mock Chrome API
 */
export function createMockChromeAPI() {
  // Create a base object with all Chrome API namespaces
  const chrome = {
    // Storage API
    storage: {
      sync: {
        get: sinon.stub(),
        set: sinon.stub(),
        remove: sinon.stub(),
        clear: sinon.stub(),
        getBytesInUse: sinon.stub(),
        onChanged: createChromeEvent(),
      },
      local: {
        get: sinon.stub(),
        set: sinon.stub(),
        remove: sinon.stub(),
        clear: sinon.stub(),
        getBytesInUse: sinon.stub(),
        onChanged: createChromeEvent(),
      },
      session: {
        get: sinon.stub(),
        set: sinon.stub(),
        remove: sinon.stub(),
        clear: sinon.stub(),
        getBytesInUse: sinon.stub(),
        onChanged: createChromeEvent(),
      },
      onChanged: createChromeEvent(),
    },

    // Tabs API
    tabs: {
      get: sinon.stub(),
      getCurrent: sinon.stub(),
      create: sinon.stub(),
      duplicate: sinon.stub(),
      query: sinon.stub(),
      update: sinon.stub(),
      move: sinon.stub(),
      reload: sinon.stub(),
      remove: sinon.stub(),
      detectLanguage: sinon.stub(),
      captureVisibleTab: sinon.stub(),
      executeScript: sinon.stub(),
      insertCSS: sinon.stub(),
      setZoom: sinon.stub(),
      getZoom: sinon.stub(),
      setZoomSettings: sinon.stub(),
      getZoomSettings: sinon.stub(),
      discard: sinon.stub(),
      goBack: sinon.stub(),
      goForward: sinon.stub(),
      onCreated: createChromeEvent(),
      onUpdated: createChromeEvent(),
      onMoved: createChromeEvent(),
      onActivated: createChromeEvent(),
      onHighlighted: createChromeEvent(),
      onDetached: createChromeEvent(),
      onAttached: createChromeEvent(),
      onRemoved: createChromeEvent(),
      onReplaced: createChromeEvent(),
      onZoomChange: createChromeEvent(),
    },

    // Runtime API
    runtime: {
      lastError: null,
      id: 'mock-extension-id',
      getURL: sinon.stub().callsFake((path) => `chrome-extension://mock-extension-id/${path}`),
      getManifest: sinon.stub().returns({
        name: 'Run Javascript',
        version: '4.1.1',
        manifest_version: 3,
      }),
      connect: sinon.stub(),
      sendMessage: sinon.stub(),
      onMessage: createChromeEvent(),
      onConnect: createChromeEvent(),
      onInstalled: createChromeEvent(),
      onStartup: createChromeEvent(),
      onUpdateAvailable: createChromeEvent(),
      onSuspend: createChromeEvent(),
      onSuspendCanceled: createChromeEvent(),
      onRestartRequired: createChromeEvent(),
    },

    // Scripting API (Manifest V3)
    scripting: {
      executeScript: sinon.stub(),
      insertCSS: sinon.stub(),
      removeCSS: sinon.stub(),
      registerContentScripts: sinon.stub(),
      getRegisteredContentScripts: sinon.stub(),
      updateContentScripts: sinon.stub(),
      unregisterContentScripts: sinon.stub(),
    },

    // Action API (Manifest V3)
    action: {
      setTitle: sinon.stub(),
      getTitle: sinon.stub(),
      setIcon: sinon.stub(),
      setBadgeText: sinon.stub(),
      getBadgeText: sinon.stub(),
      setBadgeBackgroundColor: sinon.stub(),
      getBadgeBackgroundColor: sinon.stub(),
      enable: sinon.stub(),
      disable: sinon.stub(),
      isEnabled: sinon.stub(),
      setPopup: sinon.stub(),
      getPopup: sinon.stub(),
      onClicked: createChromeEvent(),
    },

    // Alarms API
    alarms: {
      create: sinon.stub(),
      get: sinon.stub(),
      getAll: sinon.stub(),
      clear: sinon.stub(),
      clearAll: sinon.stub(),
      onAlarm: createChromeEvent(),
    },
  };

  // Set up default behaviors for commonly used methods
  
  // Storage sync.get default behavior
  chrome.storage.sync.get.callsFake((keys, callback) => {
    if (typeof callback === 'function') {
      callback({});
    }
    return Promise.resolve({});
  });

  // Storage local.get default behavior
  chrome.storage.local.get.callsFake((keys, callback) => {
    if (typeof callback === 'function') {
      callback({});
    }
    return Promise.resolve({});
  });

  // Storage sync.set default behavior
  chrome.storage.sync.set.callsFake((items, callback) => {
    if (typeof callback === 'function') {
      callback();
    }
    return Promise.resolve();
  });

  // Storage local.set default behavior
  chrome.storage.local.set.callsFake((items, callback) => {
    if (typeof callback === 'function') {
      callback();
    }
    return Promise.resolve();
  });

  // Tabs query default behavior
  chrome.tabs.query.callsFake((queryInfo, callback) => {
    const tabs = [{ id: 1, url: 'https://example.com', active: true, currentWindow: true }];
    if (typeof callback === 'function') {
      callback(tabs);
    }
    return Promise.resolve(tabs);
  });

  // Runtime sendMessage default behavior
  chrome.runtime.sendMessage.callsFake((message, callback) => {
    if (typeof callback === 'function') {
      callback({});
    }
    return Promise.resolve({});
  });

  // Scripting executeScript default behavior
  chrome.scripting.executeScript.callsFake((details) => {
    return Promise.resolve([{ frameId: 0, result: undefined }]);
  });

  return chrome;
}

/**
 * Helper to reset all Chrome API mocks
 * @param {Object} chrome - The mocked Chrome API object
 */
export function resetChromeMocks(chrome) {
  // Reset all stubs
  Object.values(chrome).forEach((namespace) => {
    if (namespace && typeof namespace === 'object') {
      Object.values(namespace).forEach((prop) => {
        if (prop && typeof prop === 'object' && prop.reset) {
          prop.reset();
        }
      });
    }
  });

  // Clear lastError
  chrome.runtime.lastError = null;
}
