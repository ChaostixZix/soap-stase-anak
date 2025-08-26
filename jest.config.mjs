export default {
  testEnvironment: 'node',
  testMatch: [
    '**/tests/**/*.test.mjs',
    'src/**/tests/**/*.test.mjs'
  ],
  collectCoverageFrom: [
    'mcp/**/*.mjs',
    'src/lib/**/*.{js,ts}',
    '!mcp/tests/**/*.mjs',
    '!src/**/tests/**/*.mjs'
  ],
  verbose: true,
  transform: {
    '^.+\\.(js|ts)$': ['babel-jest', {
      presets: [
        ['@babel/preset-env', { targets: { node: 'current' } }],
        '@babel/preset-typescript'
      ]
    }]
  },
  moduleFileExtensions: ['js', 'ts', 'mjs'],
  testPathIgnorePatterns: ['/node_modules/', '/build/']
};