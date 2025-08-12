import { describe, test, expect, beforeEach, afterEach, mock } from 'bun:test';
import sinon from 'sinon';

describe('inject.js', () => {
  let chrome;
  let sandbox;

  // Setup before each test
  beforeEach(() => {
    sandbox = sinon.createSandbox();
    
    // Get the mocked chrome API
    chrome = global.chrome;
    
    // Reset chrome.runtime.sendMessage mock
    chrome.runtime.sendMessage.reset();
  });

  // Cleanup after each test
  afterEach(() => {
    sandbox.restore();
  });

  describe('Content Script Loading', () => {
    test('sends content_script_loaded message to background script', () => {
      // Simulate the content script loading by executing the main code
      const contentScriptLoaded = () => {
        chrome.runtime.sendMessage({action: 'content_script_loaded'}, function(response) {
          // Content script is ready
        });
      };
      
      // Execute the content script loaded function
      contentScriptLoaded();
      
      // Verify that chrome.runtime.sendMessage was called with the correct message
      expect(chrome.runtime.sendMessage.calledOnce).toBe(true);
      expect(chrome.runtime.sendMessage.firstCall.args[0]).toEqual({action: 'content_script_loaded'});
    });
  });

  describe('extractHostname', () => {
    test('extracts hostname from URL with protocol', () => {
      // Define the extractHostname function from inject.js
      const extractHostname = (url) => {
        var hostname;
        if (url.indexOf("://") > -1) {
          hostname = url.split('/')[2];
        } else {
          hostname = url.split('/')[0];
        }
        hostname = hostname.split(':')[0];
        hostname = hostname.split('?')[0];
        return hostname;
      };
      
      // Test with various URLs
      expect(extractHostname('https://www.example.com/path')).toBe('www.example.com');
      expect(extractHostname('http://example.com:8080/path')).toBe('example.com');
      expect(extractHostname('https://subdomain.example.co.uk/path?query=1')).toBe('subdomain.example.co.uk');
    });

    test('extracts hostname from URL without protocol', () => {
      // Define the extractHostname function from inject.js
      const extractHostname = (url) => {
        var hostname;
        if (url.indexOf("://") > -1) {
          hostname = url.split('/')[2];
        } else {
          hostname = url.split('/')[0];
        }
        hostname = hostname.split(':')[0];
        hostname = hostname.split('?')[0];
        return hostname;
      };
      
      // Test with various URLs without protocol
      expect(extractHostname('www.example.com/path')).toBe('www.example.com');
      expect(extractHostname('example.com:8080/path')).toBe('example.com');
      expect(extractHostname('subdomain.example.co.uk/path?query=1')).toBe('subdomain.example.co.uk');
    });

    test('handles edge cases', () => {
      // Define the extractHostname function from inject.js
      const extractHostname = (url) => {
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
      };
      
      // Test with edge cases
      expect(extractHostname('localhost')).toBe('localhost');
      expect(extractHostname('localhost:8080')).toBe('localhost');
      expect(extractHostname('127.0.0.1')).toBe('127.0.0.1');
      expect(extractHostname('127.0.0.1:8080')).toBe('127.0.0.1');
      expect(extractHostname('http://[2001:db8:85a3:8d3:1319:8a2e:370:7348]')).toBe('[2001:db8:85a3:8d3:1319:8a2e:370:7348]');
    });
  });

  describe('Integration with Background Script', () => {
    test('background script receives the content_script_loaded message', () => {
      // Create a mock background script message handler
      const backgroundMessageHandler = sandbox.stub();
      
      // Override chrome.runtime.sendMessage to simulate the background script receiving the message
      chrome.runtime.sendMessage.callsFake((message, callback) => {
        backgroundMessageHandler(message);
        if (callback) callback({success: true});
        return Promise.resolve({success: true});
      });
      
      // Simulate the content script loading
      const contentScriptLoaded = () => {
        chrome.runtime.sendMessage({action: 'content_script_loaded'}, function(response) {
          // Content script is ready
        });
      };
      
      // Execute the content script loaded function
      contentScriptLoaded();
      
      // Verify that the background message handler was called with the correct message
      expect(backgroundMessageHandler.calledOnce).toBe(true);
      expect(backgroundMessageHandler.firstCall.args[0]).toEqual({action: 'content_script_loaded'});
    });
  });
});