/**
 * Jest configuration for integration tests
 */
const baseConfig = require('../../jest.config');

module.exports = {
  ...baseConfig,
  displayName: 'Integration Tests',
  testMatch: [
    '**/tests/integration/**/*.test.js'
  ],
  // Use jsdom environment for integration tests
  testEnvironment: 'jsdom',
  // Collect coverage only from files being tested in integration tests
  collectCoverageFrom: [
    '*.js',
    '!ace.js',
    '!lib_jquery_*.js',
    '!**/node_modules/**',
    '!**/tests/**'
  ],
  coverageDirectory: './coverage/integration',
  // Longer timeout for integration tests
  testTimeout: 60000
};