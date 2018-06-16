const bootstrapper = require('../bootstrap/client-bootstrapper');
const Index = require('../components/pages/index.jsx');
const Page = require('../components/page.jsx');
const ReactDOM = require('react-dom');
const React = require('react');

(async () => {
  const props = {
    container: await bootstrapper.createContainer(),
    initialState: window.__initalState__,
    PageComponent: Index
  };

  ReactDOM.hydrate(<Page {...props} />, document.getElementById('main'));
})();
