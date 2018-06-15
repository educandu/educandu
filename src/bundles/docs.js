const bootstrapper = require('../bootstrap/client-bootstrapper');
const Docs = require('../components/pages/docs.jsx');
const ReactDOM = require('react-dom');
const React = require('react');

(async () => {
  const container = await bootstrapper.createContainer();
  const initialState = window.__initalState__;
  const props = { container, initialState };
  ReactDOM.hydrate(React.createElement(Docs, props), document.getElementById('main'));
})();
