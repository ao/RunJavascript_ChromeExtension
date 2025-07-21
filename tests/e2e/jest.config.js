/**
 * Jest configuration for end-to-end tests with Puppeteer
 */
const baseConfig = require('../../jest.config');

module.exports = {
  ...baseConfig,
  displayName: 'E2E Tests',
  testMatch: [
    '**/tests/e2e/**/*.test.js'
  ],
  // Use puppeteer environment for e2e tests
  preset: 'jest-puppeteer',
  testEnvironment: 'puppeteer',
  // Collect coverage only from files being tested in e2e tests
  collectCoverageFrom: [
    '*.js',
    '!ace.js',
    '!lib_jquery_*.js',
    '!**/node_modules/**',
    '!**/tests/**'
  ],
  coverageDirectory: './coverage/e2e',
  // Longer timeout for e2e tests
  testTimeout: 120000,
  // Setup files specific to e2e tests
  setupFilesAfterEnv: [
    '../../tests/setup.js',
    './setup.js'
  ]
};