const Index = require('../components/pages/index.jsx');
const { hydrateApp } = require('../bootstrap/client-bootstrapper');

hydrateApp({
  index: Index
});
