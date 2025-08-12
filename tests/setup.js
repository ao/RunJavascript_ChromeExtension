// Test setup file for Bun tests

import { beforeAll, afterAll, afterEach } from 'bun:test';
import { JSDOM } from 'jsdom';
import sinon from 'sinon';
import { createMockChromeAPI } from './utils/chrome-mock.js';

// Setup global DOM for testing
beforeAll(() => {
  // Create a JSDOM instance
  const dom = new JSDOM('<!DOCTYPE html><html><body></body></html>', {
    url: 'http://localhost/',
    contentType: 'text/html',
    includeNodeLocations: true,
    runScripts: 'dangerously',
    resources: 'usable',
    pretendToBeVisual: true,
  });

  // Set up global variables to mimic browser environment
  global.window = dom.window;
  global.document = dom.window.document;
  global.navigator = dom.window.navigator;
  global.location = dom.window.location;
  global.HTMLElement = dom.window.HTMLElement;
  global.localStorage = {
    getItem: sinon.stub(),
    setItem: sinon.stub(),
    removeItem: sinon.stub(),
    clear: sinon.stub(),
  };

  // Mock the chrome API
  global.chrome = createMockChromeAPI();

  // Mock other browser APIs that might be used
  global.fetch = sinon.stub();
  global.alert = sinon.stub();
  global.confirm = sinon.stub();
  global.prompt = sinon.stub();
});

// Clean up after each test
afterEach(() => {
  // Reset all sinon stubs/mocks
  sinon.restore();
});

// Clean up after all tests
afterAll(() => {
  // Clean up any resources
  delete global.window;
  delete global.document;
  delete global.navigator;
  delete global.location;
  delete global.HTMLElement;
  delete global.localStorage;
  delete global.chrome;
  delete global.fetch;
  delete global.alert;
  delete global.confirm;
  delete global.prompt;
});

// Helper function to wait for promises to resolve
export const flushPromises = () => new Promise((resolve) => setTimeout(resolve, 0));

// Export common test utilities
export * from './utils/test-helpers.js';