export default {
  testEnvironment: 'node',
  testTimeout: 15000,
  setupFiles: ['<rootDir>/src/test-setup.js'],
  coveragePathIgnorePatterns: [
    '<rootDir>/[^/]\\.js',
    '<rootDir>/node_modules/',
    '<rootDir>/migrations/',
    '<rootDir>/coverage/',
    '<rootDir>/dev/',
    '<rootDir>/dist/',
    '<rootDir>/test-app/',
    '<rootDir>/src/components/',
    '<rootDir>/src/plugins/',
    '<rootDir>/src/stores/collection-specs/',
    '<rootDir>/src/test-helper\\.js',
    '<rootDir>/src/test-setup\\.js'
  ],
  transform: {
    '\\.jsx?$': '@educandu/node-jsx-loader'
  }
};
