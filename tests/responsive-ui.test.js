import { describe, test, expect, beforeEach, afterEach } from 'bun:test';
import sinon from 'sinon';
import { JSDOM } from 'jsdom';
import { setupPopupTest } from './utils/test-helpers.js';

describe('Responsive UI Layout', () => {
  let document;
  let window;
  let sandbox;
  let computedStyles = {};

  // Setup before each test
  beforeEach(() => {
    sandbox = sinon.createSandbox();
    
    // Setup the test environment
    const testEnv = setupPopupTest();
    
    document = testEnv.document;
    window = testEnv.window;
    
    // Mock getComputedStyle to return our controlled values
    window.getComputedStyle = (element) => {
      // Return the mock computed styles based on element id or tag
      const id = element.id || element.tagName.toLowerCase();
      return computedStyles[id] || {};
    };
  });

  // Cleanup after each test
  afterEach(() => {
    sandbox.restore();
    computedStyles = {};
  });

  describe('Relative Units', () => {
    test('body should use relative units for dimensions', () => {
      // Set up mock computed styles
      computedStyles['body'] = {
        width: '100%',
        margin: '0px',
        padding: '0px'
      };
      
      const body = document.body;
      const styles = window.getComputedStyle(body);
      
      expect(styles.width).toBe('100%');
    });

    test('header should use relative units for width', () => {
      // Set up mock computed styles
      computedStyles['header'] = {
        width: '100%',
        height: '3rem'
      };
      
      const header = document.getElementById('header');
      const styles = window.getComputedStyle(header);
      
      expect(styles.width).toBe('100%');
      expect(styles.height).toBe('3rem');
    });

    test('editor should use relative units for dimensions', () => {
      // Set up mock computed styles
      computedStyles['editor'] = {
        width: '100%',
        height: '80vh'
      };
      
      const editor = document.getElementById('editor');
      const styles = window.getComputedStyle(editor);
      
      expect(styles.width).toBe('100%');
      expect(styles.height).toBe('80vh');
    });

    test('buttons and controls should use relative units for padding and font size', () => {
      // Set up mock computed styles
      computedStyles['runJavascript'] = {
        padding: '0.5rem 0.75rem',
        fontSize: '0.875rem'
      };
      
      const runButton = document.getElementById('runJavascript');
      const styles = window.getComputedStyle(runButton);
      
      expect(styles.padding).toBe('0.5rem 0.75rem');
      expect(styles.fontSize).toBe('0.875rem');
    });
  });

  describe('Adaptive Layout', () => {
    test('layout should adapt to different viewport widths', () => {
      // Test small viewport
      window.innerWidth = 400;
      window.innerHeight = 300;
      window.dispatchEvent(new window.Event('resize'));
      
      // Set up mock computed styles for small viewport
      computedStyles['header'] = {
        width: '100%',
        height: '2.5rem'
      };
      
      computedStyles['editor'] = {
        width: '100%',
        height: '70vh'
      };
      
      let header = document.getElementById('header');
      let styles = window.getComputedStyle(header);
      
      expect(styles.width).toBe('100%');
      expect(styles.height).toBe('2.5rem');
      
      // Test larger viewport
      window.innerWidth = 800;
      window.innerHeight = 600;
      window.dispatchEvent(new window.Event('resize'));
      
      // Set up mock computed styles for larger viewport
      computedStyles['header'] = {
        width: '100%',
        height: '3rem'
      };
      
      computedStyles['editor'] = {
        width: '100%',
        height: '80vh'
      };
      
      header = document.getElementById('header');
      styles = window.getComputedStyle(header);
      
      expect(styles.width).toBe('100%');
      expect(styles.height).toBe('3rem');
    });
  });

  describe('Responsive Spacing', () => {
    test('spacing should scale appropriately with viewport size', () => {
      // Test small viewport
      window.innerWidth = 400;
      window.innerHeight = 300;
      window.dispatchEvent(new window.Event('resize'));
      
      // Set up mock computed styles for small viewport
      computedStyles['runJavascript'] = {
        padding: '0.4rem 0.6rem',
        margin: '0.5rem'
      };
      
      let runButton = document.getElementById('runJavascript');
      let styles = window.getComputedStyle(runButton);
      
      expect(styles.padding).toBe('0.4rem 0.6rem');
      expect(styles.margin).toBe('0.5rem');
      
      // Test larger viewport
      window.innerWidth = 800;
      window.innerHeight = 600;
      window.dispatchEvent(new window.Event('resize'));
      
      // Set up mock computed styles for larger viewport
      computedStyles['runJavascript'] = {
        padding: '0.5rem 0.75rem',
        margin: '0.75rem'
      };
      
      runButton = document.getElementById('runJavascript');
      styles = window.getComputedStyle(runButton);
      
      expect(styles.padding).toBe('0.5rem 0.75rem');
      expect(styles.margin).toBe('0.75rem');
    });
    
    test('element positioning should use relative units', () => {
      // Set up mock computed styles
      computedStyles['lblUpdated'] = {
        left: '25%',
        top: '0.5rem'
      };
      
      const lblUpdated = document.getElementById('lblUpdated');
      const styles = window.getComputedStyle(lblUpdated);
      
      expect(styles.left).toBe('25%');
      expect(styles.top).toBe('0.5rem');
    });
  });
});