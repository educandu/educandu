const bootstrapper = require('../bootstrap/client-bootstrapper');
const Docs = require('../components/pages/docs.jsx');
const Page = require('../components/page.jsx');
const ReactDOM = require('react-dom');
const React = require('react');

(async () => {
  const props = {
    container: await bootstrapper.createContainer(),
    initialState: window.__initalState__,
    PageComponent: Docs
  };

  ReactDOM.hydrate(<Page {...props} />, document.getElementById('main'));
})();
