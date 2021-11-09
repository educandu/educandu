export default {
  testEnvironment: 'node',
  testTimeout: 10000,
  setupFiles: ['<rootDir>/src/test-setup.js'],
  coveragePathIgnorePatterns: [
    '<rootDir>/[^/]\\.js',
    '<rootDir>/node_modules/',
    '<rootDir>/migrations/',
    '<rootDir>/coverage/',
    '<rootDir>/dist/',
    '<rootDir>/test-app/',
    '<rootDir>/src/test-helper\\.js',
    '<rootDir>/src/test-setup\\.js'
  ],
  transform: {
    '\\.jsx?$': '@educandu/node-jsx-loader'
  }
};
