/**
 * Jest configuration for unit tests
 */
const baseConfig = require('../../jest.config');

module.exports = {
  ...baseConfig,
  displayName: 'Unit Tests',
  testMatch: [
    '**/tests/unit/**/*.test.js'
  ],
  // Use jsdom environment for unit tests
  testEnvironment: 'jsdom',
  // Collect coverage only from files being tested in unit tests
  collectCoverageFrom: [
    '*.js',
    '!ace.js',
    '!lib_jquery_*.js',
    '!**/node_modules/**',
    '!**/tests/**'
  ],
  coverageDirectory: './coverage/unit'
};