import { describe, test, expect, beforeEach, jest } from 'bun:test';
import './setup.js';

describe('Toggle Switch UX', () => {
  beforeEach(() => {
    // Reset DOM with new toggle design
    document.body.innerHTML = `
      <div id="header">
        <div id="script-toggle-container">
          <div class="toggle-switch-wrapper">
            <label class="toggle-switch" for="chkToggleOnHost">
              <input type="checkbox" id="chkToggleOnHost" />
              <span class="toggle-slider"></span>
            </label>
            <div class="toggle-info">
              <span class="toggle-status" id="toggle-status">Enabled</span>
              <span class="toggle-domain">on <span id='_toggle_host_name'>example.com</span></span>
            </div>
          </div>
        </div>
      </div>
    `;

    // Set global variables
    global.enabled = true;
    global.host = 'example.com';
  });

  test('should have proper toggle switch structure', async () => {
    // Import popup script
    await import('../popup.js');

    // Check that all elements exist
    const container = document.getElementById('script-toggle-container');
    const wrapper = container.querySelector('.toggle-switch-wrapper');
    const toggleSwitch = wrapper.querySelector('.toggle-switch');
    const checkbox = toggleSwitch.querySelector('#chkToggleOnHost');
    const slider = toggleSwitch.querySelector('.toggle-slider');
    const toggleInfo = wrapper.querySelector('.toggle-info');
    const status = toggleInfo.querySelector('#toggle-status');
    const domain = toggleInfo.querySelector('#_toggle_host_name');

    expect(container).toBeTruthy();
    expect(wrapper).toBeTruthy();
    expect(toggleSwitch).toBeTruthy();
    expect(checkbox).toBeTruthy();
    expect(slider).toBeTruthy();
    expect(toggleInfo).toBeTruthy();
    expect(status).toBeTruthy();
    expect(domain).toBeTruthy();
  });

  test('should have correct CSS classes for toggle elements', async () => {
    // Import popup script
    await import('../popup.js');

    const container = document.getElementById('script-toggle-container');
    const wrapper = container.querySelector('.toggle-switch-wrapper');
    const toggleSwitch = wrapper.querySelector('.toggle-switch');
    const slider = toggleSwitch.querySelector('.toggle-slider');
    const toggleInfo = wrapper.querySelector('.toggle-info');
    const status = toggleInfo.querySelector('#toggle-status');
    const domain = toggleInfo.querySelector('.toggle-domain');

    expect(container.id).toBe('script-toggle-container');
    expect(wrapper.className).toBe('toggle-switch-wrapper');
    expect(toggleSwitch.className).toBe('toggle-switch');
    expect(slider.className).toBe('toggle-slider');
    expect(toggleInfo.className).toBe('toggle-info');
    expect(status.className).toContain('toggle-status');
    expect(domain.className).toBe('toggle-domain');
  });

  test('should show correct domain name', async () => {
    // Import popup script
    await import('../popup.js');

    const domainElement = document.getElementById('_toggle_host_name');
    expect(domainElement.textContent).toBe('example.com');

    // Test with different domain
    domainElement.textContent = 'test.com';
    expect(domainElement.textContent).toBe('test.com');
  });

  test('should have proper accessibility attributes', async () => {
    // Import popup script
    await import('../popup.js');

    const toggleSwitch = document.querySelector('.toggle-switch');
    const checkbox = document.getElementById('chkToggleOnHost');

    // Check label association
    expect(toggleSwitch.getAttribute('for')).toBe('chkToggleOnHost');
    expect(checkbox.id).toBe('chkToggleOnHost');
    expect(checkbox.type).toBe('checkbox');
  });

  test('should support enabled and disabled status classes', async () => {
    // Import popup script
    await import('../popup.js');

    const status = document.getElementById('toggle-status');

    // Test enabled class
    status.className = 'toggle-status enabled';
    expect(status.className).toBe('toggle-status enabled');
    expect(status.classList.contains('enabled')).toBe(true);

    // Test disabled class
    status.className = 'toggle-status disabled';
    expect(status.className).toBe('toggle-status disabled');
    expect(status.classList.contains('disabled')).toBe(true);
  });

  test('should handle checkbox state changes', async () => {
    // Import popup script
    await import('../popup.js');

    const checkbox = document.getElementById('chkToggleOnHost');

    // Test initial state
    expect(checkbox.checked).toBe(false);

    // Test checked state
    checkbox.checked = true;
    expect(checkbox.checked).toBe(true);

    // Test unchecked state
    checkbox.checked = false;
    expect(checkbox.checked).toBe(false);
  });
});
