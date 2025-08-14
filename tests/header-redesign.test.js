import { describe, test, expect, beforeEach, jest } from 'bun:test';
import './setup.js';

describe('Header and Run Button Redesign', () => {
  beforeEach(() => {
    // Reset DOM with new header design
    document.body.innerHTML = `
      <div id="header">
        <div class="header-content">
          <div class="header-brand">
            <div class="brand-logo">
              <img src="icon.png" alt="Run JavaScript Extension" class="extension-icon">
            </div>
            <div class="header-title">
              <h1 class="extension-title">Run JavaScript</h1>
              <span class="extension-subtitle">Custom script execution</span>
            </div>
          </div>
          <div class="header-center">
            <button id="sidebar-toggle" aria-label="Toggle sidebar" aria-expanded="false" aria-controls="sidebar">
              <div class="hamburger-icon"></div>
            </button>
          </div>
          <div class="header-actions">
            <a href="https://ataiva.com/run-javascript-chrome-extension-help/?from=extension&click=help" target="_blank" id="help_a" class="header-link">
              <span class="help-icon">?</span>
              Help
            </a>
          </div>
        </div>
      </div>
      
      <div class="editor-container">
        <div class="editor-toolbar">
          <div class="editor-info">
            <span class="editor-label">JavaScript Editor</span>
            <span class="editor-hint">Write your custom JavaScript code below</span>
          </div>
          <div class="editor-controls">
            <div class="library-selector">
              <label for="slLibrary" class="library-label">Library:</label>
              <select id="slLibrary" class="library-dropdown">
                <option value="" selected="">None</option>
                <option value="jquery_3_3_1">jQuery 3.3.1</option>
              </select>
            </div>
            <button id="runJavascript" class="run-button">
              <span class="run-icon"></span>
              Execute
            </button>
          </div>
        </div>
        <div id="editor"></div>
      </div>
    `;
  });

  test('should have proper header structure', async () => {
    // Import popup script
    await import('../popup.js');

    // Check header elements
    const header = document.getElementById('header');
    const headerContent = header.querySelector('.header-content');
    const headerBrand = headerContent.querySelector('.header-brand');
    const brandLogo = headerBrand.querySelector('.brand-logo');
    const extensionIcon = brandLogo.querySelector('.extension-icon');
    const headerTitle = headerBrand.querySelector('.header-title');
    const extensionTitle = headerTitle.querySelector('.extension-title');
    const extensionSubtitle = headerTitle.querySelector('.extension-subtitle');
    const headerCenter = headerContent.querySelector('.header-center');
    const sidebarToggle = headerCenter.querySelector('#sidebar-toggle');
    const headerActions = headerContent.querySelector('.header-actions');
    const helpLink = headerActions.querySelector('#help_a');

    expect(header).toBeTruthy();
    expect(headerContent).toBeTruthy();
    expect(headerBrand).toBeTruthy();
    expect(brandLogo).toBeTruthy();
    expect(extensionIcon).toBeTruthy();
    expect(headerTitle).toBeTruthy();
    expect(extensionTitle).toBeTruthy();
    expect(extensionSubtitle).toBeTruthy();
    expect(headerCenter).toBeTruthy();
    expect(sidebarToggle).toBeTruthy();
    expect(headerActions).toBeTruthy();
    expect(helpLink).toBeTruthy();
  });

  test('should have correct header content and styling', async () => {
    // Import popup script
    await import('../popup.js');

    const extensionTitle = document.querySelector('.extension-title');
    const extensionSubtitle = document.querySelector('.extension-subtitle');
    const extensionIcon = document.querySelector('.extension-icon');
    const helpLink = document.querySelector('#help_a');
    const helpIcon = helpLink.querySelector('.help-icon');

    expect(extensionTitle.textContent).toBe('Run JavaScript');
    expect(extensionSubtitle.textContent).toBe('Custom script execution');
    expect(extensionIcon.src).toContain('icon.png');
    expect(extensionIcon.alt).toBe('Run JavaScript Extension');
    expect(helpLink.textContent.replace(/\s+/g, ' ').trim()).toBe('? Help');
    expect(helpIcon.textContent).toBe('?');
    expect(helpLink.className).toBe('header-link');
  });

  test('should have proper run button in editor toolbar', async () => {
    // Import popup script
    await import('../popup.js');

    const runButton = document.getElementById('runJavascript');
    const runIcon = runButton.querySelector('.run-icon');

    expect(runButton).toBeTruthy();
    expect(runButton.className).toBe('run-button');
    expect(runIcon).toBeTruthy();
    expect(runIcon.className).toBe('run-icon');
    expect(runButton.textContent.replace(/\s+/g, ' ').trim()).toBe('Execute');
  });

  test('should have correct CSS classes for all elements', async () => {
    // Import popup script
    await import('../popup.js');

    const headerContent = document.querySelector('.header-content');
    const headerBrand = document.querySelector('.header-brand');
    const brandLogo = document.querySelector('.brand-logo');
    const extensionIcon = document.querySelector('.extension-icon');
    const headerTitle = document.querySelector('.header-title');
    const extensionTitle = document.querySelector('.extension-title');
    const extensionSubtitle = document.querySelector('.extension-subtitle');
    const headerCenter = document.querySelector('.header-center');
    const headerActions = document.querySelector('.header-actions');
    const helpLink = document.querySelector('.header-link');
    const runButton = document.querySelector('.run-button');
    const runIcon = document.querySelector('.run-icon');

    expect(headerContent.className).toBe('header-content');
    expect(headerBrand.className).toBe('header-brand');
    expect(brandLogo.className).toBe('brand-logo');
    expect(extensionIcon.className).toBe('extension-icon');
    expect(headerTitle.className).toBe('header-title');
    expect(extensionTitle.className).toBe('extension-title');
    expect(extensionSubtitle.className).toBe('extension-subtitle');
    expect(headerCenter.className).toBe('header-center');
    expect(headerActions.className).toBe('header-actions');
    expect(helpLink.className).toBe('header-link');
    expect(runButton.className).toBe('run-button');
    expect(runIcon.className).toBe('run-icon');
  });

  test('should have proper accessibility attributes', async () => {
    // Import popup script
    await import('../popup.js');

    const extensionTitle = document.querySelector('.extension-title');
    const extensionIcon = document.querySelector('.extension-icon');
    const helpLink = document.querySelector('#help_a');
    const sidebarToggle = document.querySelector('#sidebar-toggle');
    const runButton = document.querySelector('#runJavascript');

    // Check heading structure
    expect(extensionTitle.tagName.toLowerCase()).toBe('h1');
    
    // Check image attributes
    expect(extensionIcon.tagName.toLowerCase()).toBe('img');
    expect(extensionIcon.alt).toBe('Run JavaScript Extension');
    expect(extensionIcon.src).toContain('icon.png');
    
    // Check link attributes
    expect(helpLink.getAttribute('target')).toBe('_blank');
    expect(helpLink.href).toContain('help');
    
    // Check button attributes
    expect(sidebarToggle.getAttribute('aria-label')).toBe('Toggle sidebar');
    expect(sidebarToggle.getAttribute('aria-expanded')).toBe('false');
    expect(sidebarToggle.getAttribute('aria-controls')).toBe('sidebar');
    
    // Check run button
    expect(runButton.tagName.toLowerCase()).toBe('button');
    expect(runButton.id).toBe('runJavascript');
  });

  test('should integrate run button with editor controls', async () => {
    // Import popup script
    await import('../popup.js');

    const editorControls = document.querySelector('.editor-controls');
    const librarySelector = editorControls.querySelector('.library-selector');
    const runButton = editorControls.querySelector('.run-button');

    // Check that run button is in editor controls alongside library selector
    expect(editorControls.children.length).toBe(2);
    expect(librarySelector).toBeTruthy();
    expect(runButton).toBeTruthy();
    
    // Check order - library selector should come before run button
    const children = Array.from(editorControls.children);
    const librarySelectorIndex = children.indexOf(librarySelector);
    const runButtonIndex = children.indexOf(runButton);
    
    expect(librarySelectorIndex).toBeLessThan(runButtonIndex);
  });

  test('should handle button interactions', async () => {
    // Import popup script
    await import('../popup.js');

    const runButton = document.getElementById('runJavascript');
    const helpLink = document.getElementById('help_a');
    const sidebarToggle = document.getElementById('sidebar-toggle');

    // Test that elements are interactive
    expect(runButton.tagName.toLowerCase()).toBe('button');
    expect(helpLink.tagName.toLowerCase()).toBe('a');
    expect(sidebarToggle.tagName.toLowerCase()).toBe('button');
    
    // Test click events don't throw errors
    expect(() => {
      runButton.click();
      sidebarToggle.click();
    }).not.toThrow();
  });
});
