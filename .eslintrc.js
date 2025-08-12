export default {
  env: {
    browser: true,
    es2022: true,
    webextensions: true,
    node: true,
  },
  extends: [
    'eslint:recommended',
    'plugin:prettier/recommended',
  ],
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
  },
  plugins: ['import'],
  rules: {
    // Error prevention
    'no-console': ['warn', { allow: ['warn', 'error', 'info'] }],
    'no-debugger': 'warn',
    'no-alert': 'warn',
    'no-unused-vars': ['error', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
    
    // Code style
    'quotes': ['error', 'single', { avoidEscape: true }],
    'semi': ['error', 'always'],
    'comma-dangle': ['error', 'always-multiline'],
    'arrow-parens': ['error', 'always'],
    
    // Chrome extension specific
    'no-eval': 'error', // Prevent unsafe code execution (except in sandbox)
    
    // Import rules
    'import/no-unresolved': 'off', // Chrome extensions use special imports
    'import/order': ['error', {
      'groups': ['builtin', 'external', 'internal', 'parent', 'sibling', 'index'],
      'newlines-between': 'always',
      'alphabetize': { order: 'asc' }
    }],
  },
  overrides: [
    {
      // Test files
      files: ['tests/**/*.js', '**/*.test.js'],
      env: {
        node: true,
      },
      rules: {
        'no-console': 'off',
      },
    },
    {
      // Allow eval in sandbox.html since it's specifically designed for that purpose
      files: ['sandbox.html'],
      rules: {
        'no-eval': 'off',
      },
    },
  ],
  globals: {
    chrome: 'readonly',
  },
};