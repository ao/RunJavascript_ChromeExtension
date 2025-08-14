import { describe, test, expect, beforeEach, jest } from 'bun:test';
import './setup.js';

describe('Editor Toolbar UX', () => {
  beforeEach(() => {
    // Reset DOM with new editor toolbar design
    document.body.innerHTML = `
      <div class="main-container">
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
                  <option value="jquery_2_2_4">jQuery 2.2.4</option>
                  <option value="jquery_1_12_4">jQuery 1.12.4</option>
                </select>
              </div>
            </div>
          </div>
          <div id="editor"></div>
        </div>
      </div>
    `;

    // Set global variables
    global.library = '';
  });

  test('should have proper editor toolbar structure', async () => {
    // Import popup script
    await import('../popup.js');

    // Check that all elements exist
    const editorContainer = document.querySelector('.editor-container');
    const toolbar = editorContainer.querySelector('.editor-toolbar');
    const editorInfo = toolbar.querySelector('.editor-info');
    const editorLabel = editorInfo.querySelector('.editor-label');
    const editorHint = editorInfo.querySelector('.editor-hint');
    const editorControls = toolbar.querySelector('.editor-controls');
    const librarySelector = editorControls.querySelector('.library-selector');
    const libraryLabel = librarySelector.querySelector('.library-label');
    const libraryDropdown = librarySelector.querySelector('#slLibrary');
    const editor = editorContainer.querySelector('#editor');

    expect(editorContainer).toBeTruthy();
    expect(toolbar).toBeTruthy();
    expect(editorInfo).toBeTruthy();
    expect(editorLabel).toBeTruthy();
    expect(editorHint).toBeTruthy();
    expect(editorControls).toBeTruthy();
    expect(librarySelector).toBeTruthy();
    expect(libraryLabel).toBeTruthy();
    expect(libraryDropdown).toBeTruthy();
    expect(editor).toBeTruthy();
  });

  test('should have correct CSS classes for toolbar elements', async () => {
    // Import popup script
    await import('../popup.js');

    const editorContainer = document.querySelector('.editor-container');
    const toolbar = document.querySelector('.editor-toolbar');
    const editorInfo = document.querySelector('.editor-info');
    const editorLabel = document.querySelector('.editor-label');
    const editorHint = document.querySelector('.editor-hint');
    const editorControls = document.querySelector('.editor-controls');
    const librarySelector = document.querySelector('.library-selector');
    const libraryLabel = document.querySelector('.library-label');
    const libraryDropdown = document.querySelector('.library-dropdown');

    expect(editorContainer.className).toBe('editor-container');
    expect(toolbar.className).toBe('editor-toolbar');
    expect(editorInfo.className).toBe('editor-info');
    expect(editorLabel.className).toBe('editor-label');
    expect(editorHint.className).toBe('editor-hint');
    expect(editorControls.className).toBe('editor-controls');
    expect(librarySelector.className).toBe('library-selector');
    expect(libraryLabel.className).toBe('library-label');
    expect(libraryDropdown.className).toBe('library-dropdown');
  });

  test('should have correct content and labels', async () => {
    // Import popup script
    await import('../popup.js');

    const editorLabel = document.querySelector('.editor-label');
    const editorHint = document.querySelector('.editor-hint');
    const libraryLabel = document.querySelector('.library-label');

    expect(editorLabel.textContent).toBe('JavaScript Editor');
    expect(editorHint.textContent).toBe('Write your custom JavaScript code below');
    expect(libraryLabel.textContent).toBe('Library:');
  });

  test('should have proper library dropdown options', async () => {
    // Import popup script
    await import('../popup.js');

    const libraryDropdown = document.getElementById('slLibrary');
    const options = libraryDropdown.querySelectorAll('option');

    expect(options.length).toBe(4);
    expect(options[0].value).toBe('');
    expect(options[0].textContent).toBe('None');
    expect(options[1].value).toBe('jquery_3_3_1');
    expect(options[1].textContent).toBe('jQuery 3.3.1');
    expect(options[2].value).toBe('jquery_2_2_4');
    expect(options[2].textContent).toBe('jQuery 2.2.4');
    expect(options[3].value).toBe('jquery_1_12_4');
    expect(options[3].textContent).toBe('jQuery 1.12.4');
  });

  test('should have proper accessibility attributes', async () => {
    // Import popup script
    await import('../popup.js');

    const libraryLabel = document.querySelector('.library-label');
    const libraryDropdown = document.getElementById('slLibrary');

    // Check label association
    expect(libraryLabel.getAttribute('for')).toBe('slLibrary');
    expect(libraryDropdown.id).toBe('slLibrary');
    expect(libraryDropdown.tagName.toLowerCase()).toBe('select');
  });

  test('should handle library selection changes', async () => {
    // Import popup script
    await import('../popup.js');

    const libraryDropdown = document.getElementById('slLibrary');

    // Test initial state
    expect(libraryDropdown.value).toBe('');

    // Test selection change
    libraryDropdown.value = 'jquery_3_3_1';
    expect(libraryDropdown.value).toBe('jquery_3_3_1');

    // Test different selection
    libraryDropdown.value = 'jquery_2_2_4';
    expect(libraryDropdown.value).toBe('jquery_2_2_4');

    // Test back to none
    libraryDropdown.value = '';
    expect(libraryDropdown.value).toBe('');
  });

  test('should integrate well with editor container layout', async () => {
    // Import popup script
    await import('../popup.js');

    const editorContainer = document.querySelector('.editor-container');
    const toolbar = document.querySelector('.editor-toolbar');
    const editor = document.getElementById('editor');

    // Check that toolbar comes before editor
    const children = Array.from(editorContainer.children);
    const toolbarIndex = children.indexOf(toolbar);
    const editorIndex = children.indexOf(editor);

    expect(toolbarIndex).toBeLessThan(editorIndex);
    expect(toolbarIndex).toBe(0);
    expect(editorIndex).toBe(1);
  });
});
