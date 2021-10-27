export default {
  testEnvironment: 'node',
  setupFiles: ['<rootDir>/src/test-setup.js'],
  transform: {
    '\\.jsx?$': '@educandu/node-jsx-loader'
  }
};
