export default {
  testEnvironment: 'node',
  testMatch: [
    '**/tests/**/*.test.mjs'
  ],
  collectCoverageFrom: [
    'mcp/**/*.mjs',
    '!mcp/tests/**/*.mjs'
  ],
  verbose: true
};