/**
 * Setup file for CSP tests
 */

// Set default timeout for CSP tests
jest.setTimeout(120000);

// Import http-server for serving test pages with CSP headers
const httpServer = require('http-server');
const path = require('path');
const fs = require('fs');

// Server instance
let server;

// Global setup for CSP tests
beforeAll(async () => {
  // Create test pages directory if it doesn't exist
  const testPagesDir = path.join(process.cwd(), 'tests', 'csp', 'test-pages');
  if (!fs.existsSync(testPagesDir)) {
    fs.mkdirSync(testPagesDir, { recursive: true });
  }
  
  // Create test page HTML files with different content
  createTestPages(testPagesDir);
  
  // Start HTTP server for test pages
  server = httpServer.createServer({
    root: testPagesDir,
    cors: true,
    headers: {
      // Default CSP header, will be overridden in tests
      'Content-Security-Policy': "default-src 'self'"
    }
  });
  
  // Start server on port 8080
  await new Promise((resolve) => {
    server.listen(8080, () => {
      console.log('CSP test server running on http://localhost:8080');
      resolve();
    });
  });
});

// Global teardown for CSP tests
afterAll(() => {
  // Stop HTTP server
  if (server) {
    server.close();
  }
});

/**
 * Create test pages for CSP testing
 * @param {string} directory - Directory to create test pages in
 */
function createTestPages(directory) {
  // Basic test page
  fs.writeFileSync(
    path.join(directory, 'test-page.html'),
    `
    <!DOCTYPE html>
    <html>
    <head>
      <title>CSP Test Page</title>
      <meta charset="UTF-8">
    </head>
    <body>
      <h1>CSP Test Page</h1>
      <div id="result">No script executed yet</div>
      <script>
        // This script is part of the page and should always run
        console.log('Page script executed');
        document.getElementById('result').textContent = 'Page script executed';
      </script>
    </body>
    </html>
    `
  );
  
  // Facebook-like test page
  fs.writeFileSync(
    path.join(directory, 'facebook-like.html'),
    `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Facebook-like CSP Test Page</title>
      <meta charset="UTF-8">
      <meta http-equiv="Content-Security-Policy" content="script-src 'self' 'nonce-RANDOM' blob: *.facebook.com .fbcdn.net .facebook.net connect.facebook.net 'wasm-unsafe-eval' https://.google-analytics.com *.google.com">
    </head>
    <body>
      <h1>Facebook-like CSP Test Page</h1>
      <div id="result">No script executed yet</div>
      <script nonce="RANDOM">
        // This script has a nonce and should run
        console.log('Page script with nonce executed');
        document.getElementById('result').textContent = 'Page script with nonce executed';
      </script>
    </body>
    </html>
    `
  );
}

/**
 * Helper function to create a test page with specific CSP
 * @param {Object} browser - Puppeteer browser instance
 * @param {string} cspType - CSP type (strict, facebook, moderate, permissive)
 * @param {string} testPage - Test page to load (default: test-page.html)
 * @returns {Promise<Object>} Puppeteer page object
 */
global.createTestPageWithCSP = async (browser, cspType, testPage = 'test-page.html') => {
  // Get CSP value from global configuration
  const cspValue = global.CSP_CONFIGURATIONS[cspType];
  if (!cspValue) {
    throw new Error(`Unknown CSP type: ${cspType}`);
  }
  
  // Create a new page
  const page = await browser.newPage();
  
  // Set request interception to modify headers
  await page.setRequestInterception(true);
  
  // Add CSP header to all responses
  page.on('request', request => {
    const headers = request.headers();
    headers['Content-Security-Policy'] = cspValue;
    request.continue({ headers });
  });
  
  // Navigate to the test page
  await page.goto(`http://localhost:8080/${testPage}`);
  
  return page;
};