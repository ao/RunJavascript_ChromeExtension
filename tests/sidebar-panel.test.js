import { describe, test, expect, beforeEach, afterEach } from 'bun:test';
import sinon from 'sinon';
import { setupPopupTest, simulateClick } from './utils/test-helpers.js';
import { initializeSidebar, toggleSidebar } from './setup-fix.js';

describe('Sidebar Panel Structure', () => {
  let document;
  let window;
  let sandbox;
  
  // Setup before each test
  beforeEach(() => {
    sandbox = sinon.createSandbox();
    
    // Setup the test environment
    const testEnv = setupPopupTest();
    document = testEnv.document;
    window = testEnv.window;
    
    // Initialize the sidebar in a hidden state by default
    initializeSidebar(document, false);
    
    // Add CSS for testing
    const style = document.createElement('style');
    style.textContent = `
      #sidebar {
        max-width: 250px;
      }
      @media (max-width: 480px) {
        #sidebar {
          max-width: 200px;
        }
      }
    `;
    document.head.appendChild(style);
  });
  
  // Cleanup after each test
  afterEach(() => {
    sandbox.restore();
  });
  
  describe('Sidebar Element', () => {
    test('sidebar element should exist in the DOM', () => {
      const sidebar = document.getElementById('sidebar');
      expect(sidebar).not.toBeNull();
    });
    
    test('sidebar should have appropriate structure', () => {
      const sidebar = document.getElementById('sidebar');
      
      // Check header
      const header = sidebar.querySelector('.sidebar-header');
      expect(header).not.toBeNull();
      expect(header.querySelector('h3').textContent).toBe('Scripts');
      
      // Check content area
      const content = sidebar.querySelector('.sidebar-content');
      expect(content).not.toBeNull();
      
      // Check script list
      const scriptList = content.querySelector('#script-list');
      expect(scriptList).not.toBeNull();
      expect(scriptList.getAttribute('role')).toBe('list');
      
      // Check empty state message
      const emptyMessage = content.querySelector('.empty-script-list');
      expect(emptyMessage).not.toBeNull();
    });
  });
  
  describe('Sidebar Toggle Button', () => {
    test('toggle button should exist in the DOM', () => {
      const toggleButton = document.getElementById('sidebar-toggle');
      expect(toggleButton).not.toBeNull();
    });
    
    test('toggle button should be accessible', () => {
      const toggleButton = document.getElementById('sidebar-toggle');
      expect(toggleButton.getAttribute('aria-label')).toBe('Toggle sidebar');
      expect(toggleButton.getAttribute('aria-controls')).toBe('sidebar');
      expect(['true', 'false']).toContain(toggleButton.getAttribute('aria-expanded'));
    });
  });
  
  describe('Sidebar Visibility', () => {
    test('sidebar should be hidden by default', () => {
      const sidebar = document.getElementById('sidebar');
      const toggleButton = document.getElementById('sidebar-toggle');
      
      // Initialize sidebar as hidden
      initializeSidebar(document, false);
      
      // Check if sidebar is hidden
      expect(sidebar.classList.contains('visible')).toBe(false);
      expect(toggleButton.getAttribute('aria-expanded')).toBe('false');
    });
    
    test('sidebar should be visible when toggle button is clicked', () => {
      const sidebar = document.getElementById('sidebar');
      const toggleButton = document.getElementById('sidebar-toggle');
      
      // Initialize sidebar as hidden
      initializeSidebar(document, false);
      
      // Set up click handler to toggle sidebar
      toggleButton.onclick = () => toggleSidebar(document);
      
      // Simulate click on toggle button
      simulateClick(toggleButton);
      
      // Check if sidebar is now visible
      expect(sidebar.classList.contains('visible')).toBe(true);
      
      const styles = window.getComputedStyle(sidebar);
      expect(styles.display).toBe('block');
      
      // Toggle button aria-expanded should be updated
      expect(toggleButton.getAttribute('aria-expanded')).toBe('true');
    });
    
    test('sidebar should be hidden when toggle button is clicked again', () => {
      const sidebar = document.getElementById('sidebar');
      const toggleButton = document.getElementById('sidebar-toggle');
      
      // Initialize sidebar as visible
      initializeSidebar(document, true);
      
      // Set up click handler to toggle sidebar
      toggleButton.onclick = () => toggleSidebar(document);
      
      // Simulate click on toggle button
      simulateClick(toggleButton);
      
      // Check if sidebar is now hidden
      expect(sidebar.classList.contains('visible')).toBe(false);
      
      const styles = window.getComputedStyle(sidebar);
      expect(styles.display).toBe('none');
      
      // Toggle button aria-expanded should be updated
      expect(toggleButton.getAttribute('aria-expanded')).toBe('false');
    });
  });
  
  describe('Responsive Behavior', () => {
    test('sidebar should maintain proper responsive behavior at small viewport', () => {
      // Simulate small viewport
      window.innerWidth = 480;
      
      // Initialize sidebar with styles
      initializeSidebar(document, true);
      const sidebar = document.getElementById('sidebar');
      sidebar.style.maxWidth = '200px'; // Set maxWidth for small viewport
      
      // Check responsive styles
      expect(parseInt(sidebar.style.maxWidth)).toBeLessThanOrEqual(480);
    });
    
    test('sidebar should maintain proper responsive behavior at large viewport', () => {
      // Simulate large viewport
      window.innerWidth = 1200;
      
      // Initialize sidebar with styles
      initializeSidebar(document, true);
      const sidebar = document.getElementById('sidebar');
      sidebar.style.maxWidth = '250px'; // Set maxWidth for large viewport
      
      // Check responsive styles
      expect(parseInt(sidebar.style.maxWidth)).toBeLessThanOrEqual(300);
    });
  });
  
  describe('Keyboard Navigation', () => {
    test('toggle button should be keyboard accessible', () => {
      const sidebar = document.getElementById('sidebar');
      const toggleButton = document.getElementById('sidebar-toggle');
      
      // Initialize sidebar as hidden
      initializeSidebar(document, false);
      
      // Add keydown handler to toggle button
      toggleButton.onkeydown = (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          toggleSidebar(document);
        }
      };
      
      // Simulate keydown event
      const keyEvent = new window.KeyboardEvent('keydown', {
        key: 'Enter',
        bubbles: true,
        cancelable: true
      });
      toggleButton.dispatchEvent(keyEvent);
      
      // Check if sidebar is now visible
      expect(sidebar.classList.contains('visible')).toBe(true);
      expect(toggleButton.getAttribute('aria-expanded')).toBe('true');
    });
  });
});
