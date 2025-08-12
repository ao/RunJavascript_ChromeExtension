// Chrome API mock implementation for testing
import sinon from 'sinon';

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
        onChanged: { addListener: sinon.stub(), removeListener: sinon.stub() },
      },
      local: {
        get: sinon.stub(),
        set: sinon.stub(),
        remove: sinon.stub(),
        clear: sinon.stub(),
        getBytesInUse: sinon.stub(),
        onChanged: { addListener: sinon.stub(), removeListener: sinon.stub() },
      },
      session: {
        get: sinon.stub(),
        set: sinon.stub(),
        remove: sinon.stub(),
        clear: sinon.stub(),
        getBytesInUse: sinon.stub(),
        onChanged: { addListener: sinon.stub(), removeListener: sinon.stub() },
      },
      onChanged: { addListener: sinon.stub(), removeListener: sinon.stub() },
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
      onCreated: { addListener: sinon.stub(), removeListener: sinon.stub() },
      onUpdated: { addListener: sinon.stub(), removeListener: sinon.stub() },
      onMoved: { addListener: sinon.stub(), removeListener: sinon.stub() },
      onActivated: { addListener: sinon.stub(), removeListener: sinon.stub() },
      onHighlighted: { addListener: sinon.stub(), removeListener: sinon.stub() },
      onDetached: { addListener: sinon.stub(), removeListener: sinon.stub() },
      onAttached: { addListener: sinon.stub(), removeListener: sinon.stub() },
      onRemoved: { addListener: sinon.stub(), removeListener: sinon.stub() },
      onReplaced: { addListener: sinon.stub(), removeListener: sinon.stub() },
      onZoomChange: { addListener: sinon.stub(), removeListener: sinon.stub() },
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
      onMessage: { addListener: sinon.stub(), removeListener: sinon.stub() },
      onConnect: { addListener: sinon.stub(), removeListener: sinon.stub() },
      onInstalled: { addListener: sinon.stub(), removeListener: sinon.stub() },
      onStartup: { addListener: sinon.stub(), removeListener: sinon.stub() },
      onUpdateAvailable: { addListener: sinon.stub(), removeListener: sinon.stub() },
      onSuspend: { addListener: sinon.stub(), removeListener: sinon.stub() },
      onSuspendCanceled: { addListener: sinon.stub(), removeListener: sinon.stub() },
      onRestartRequired: { addListener: sinon.stub(), removeListener: sinon.stub() },
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
      onClicked: { addListener: sinon.stub(), removeListener: sinon.stub() },
    },

    // Alarms API
    alarms: {
      create: sinon.stub(),
      get: sinon.stub(),
      getAll: sinon.stub(),
      clear: sinon.stub(),
      clearAll: sinon.stub(),
      onAlarm: { addListener: sinon.stub(), removeListener: sinon.stub() },
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