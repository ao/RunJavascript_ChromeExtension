/**
 * Setup file for end-to-end tests with Puppeteer
 */

// Set default timeout for Puppeteer operations
jest.setTimeout(120000);

// Global setup for Puppeteer
beforeAll(async () => {
  // Custom setup for loading the extension in Puppeteer
  // This will be executed before all tests
});

// Global teardown for Puppeteer
afterAll(async () => {
  // Custom teardown for cleaning up after tests
  // This will be executed after all tests
});

// Helper functions for E2E tests

/**
 * Load the extension in a new browser instance
 * @returns {Promise<Object>} Object containing browser, extensionPage, and extensionId
 */
global.loadExtension = async () => {
  // Get the extension directory path
  const extensionPath = process.cwd();
  
  // Launch browser with the extension loaded
  const browser = await puppeteer.launch({
    headless: false, // Extensions don't work in headless mode
    args: [
      `--disable-extensions-except=${extensionPath}`,
      `--load-extension=${extensionPath}`,
      '--no-sandbox',
      '--disable-setuid-sandbox'
    ],
    defaultViewport: {
      width: 1280,
      height: 800
    }
  });
  
  // Wait for the extension to be loaded
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // Get the extension ID
  let extensionId = '';
  const targets = await browser.targets();
  const extensionTarget = targets.find(target => 
    target.type() === 'background_page' && 
    target.url().includes('chrome-extension://')
  );
  
  if (extensionTarget) {
    const url = extensionTarget.url();
    extensionId = url.split('/')[2];
  }
  
  // Open the extension popup
  const extensionPopupUrl = `chrome-extension://${extensionId}/popup.html`;
  const extensionPage = await browser.newPage();
  await extensionPage.goto(extensionPopupUrl);
  
  return { browser, extensionPage, extensionId };
};

/**
 * Create a test page with specific CSP
 * @param {Object} browser - Puppeteer browser instance
 * @param {string} csp - Content Security Policy string
 * @returns {Promise<Object>} Puppeteer page object
 */
global.createTestPageWithCSP = async (browser, csp) => {
  // Start a local server to serve test pages with CSP headers
  // This would typically be done in a beforeAll block
  
  // Create a new page
  const page = await browser.newPage();
  
  // Set CSP header
  await page.setExtraHTTPHeaders({
    'Content-Security-Policy': csp
  });
  
  // Navigate to a test page
  await page.goto('http://localhost:8080/test-page.html');
  
  return page;
};