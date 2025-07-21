/**
 * Jest configuration for CSP tests
 */
const baseConfig = require('../../jest.config');

module.exports = {
  ...baseConfig,
  displayName: 'CSP Tests',
  testMatch: [
    '**/tests/csp/**/*.test.js'
  ],
  // Use puppeteer environment for CSP tests
  preset: 'jest-puppeteer',
  testEnvironment: 'puppeteer',
  // Collect coverage only from files being tested in CSP tests
  collectCoverageFrom: [
    '*.js',
    '!ace.js',
    '!lib_jquery_*.js',
    '!**/node_modules/**',
    '!**/tests/**'
  ],
  coverageDirectory: './coverage/csp',
  // Longer timeout for CSP tests
  testTimeout: 120000,
  // Setup files specific to CSP tests
  setupFilesAfterEnv: [
    '../../tests/setup.js',
    '../e2e/setup.js',
    './setup.js'
  ],
  // Global variables for CSP tests
  globals: {
    CSP_CONFIGURATIONS: {
      strict: "default-src 'self'; script-src 'self'",
      facebook: "script-src *.facebook.com .fbcdn.net .facebook.net 'nonce-RANDOM' blob: 'self' connect.facebook.net 'wasm-unsafe-eval' https://.google-analytics.com *.google.com",
      moderate: "default-src 'self'; script-src 'self' 'unsafe-inline'",
      permissive: "default-src * 'unsafe-inline' 'unsafe-eval'"
    }
  }
};