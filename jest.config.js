export default {
  testEnvironment: 'node',
  testTimeout: 10000,
  setupFiles: ['<rootDir>/src/test-setup.js'],
  transform: {
    '\\.jsx?$': '@educandu/node-jsx-loader'
  }
};
