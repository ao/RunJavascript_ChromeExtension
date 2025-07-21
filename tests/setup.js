/**
 * Jest setup file for Run Javascript Chrome Extension tests
 * This file sets up the testing environment, including Chrome API mocks
 */

// Import jest-chrome to mock Chrome API
const chrome = require('jest-chrome');

// Set up global Chrome API mock
global.chrome = chrome;

// Mock chrome.storage API
const storageMock = {
  sync: {
    get: jest.fn(),
    set: jest.fn(),
    getBytesInUse: jest.fn()
  },
  local: {
    get: jest.fn(),
    set: jest.fn(),
    getBytesInUse: jest.fn()
  }
};

// Mock chrome.runtime API
const runtimeMock = {
  lastError: null,
  getURL: jest.fn(path => `chrome-extension://mock-extension-id/${path}`),
  sendMessage: jest.fn(),
  onMessage: {
    addListener: jest.fn(),
    removeListener: jest.fn()
  },
  onInstalled: {
    addListener: jest.fn()
  }
};

// Mock chrome.tabs API
const tabsMock = {
  query: jest.fn(),
  get: jest.fn(),
  create: jest.fn(),
  reload: jest.fn(),
  onActivated: {
    addListener: jest.fn()
  },
  onUpdated: {
    addListener: jest.fn()
  }
};

// Mock chrome.scripting API
const scriptingMock = {
  executeScript: jest.fn()
};

// Mock chrome.alarms API
const alarmsMock = {
  create: jest.fn(),
  onAlarm: {
    addListener: jest.fn()
  }
};

// Assign mocks to chrome object
chrome.storage = storageMock;
chrome.runtime = runtimeMock;
chrome.tabs = tabsMock;
chrome.scripting = scriptingMock;
chrome.alarms = alarmsMock;

// Mock document methods used by the extension
document.createElement = jest.fn().mockImplementation(tagName => {
  const element = {
    tagName: tagName.toUpperCase(),
    style: {},
    setAttribute: jest.fn(),
    appendChild: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn()
  };
  
  if (tagName === 'script') {
    element.src = '';
    element.onload = null;
    element.onerror = null;
  }
  
  if (tagName === 'iframe') {
    element.id = '';
    element.sandbox = '';
    element.src = '';
    element.contentWindow = {
      postMessage: jest.fn()
    };
  }
  
  return element;
});

// Mock window methods
window.addEventListener = jest.fn();
window.removeEventListener = jest.fn();
window.postMessage = jest.fn();

// Reset all mocks before each test
beforeEach(() => {
  jest.clearAllMocks();
  chrome.runtime.lastError = null;
});