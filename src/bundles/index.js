const bootstrapper = require('../bootstrap/client-bootstrapper');
const Index = require('../components/pages/index.jsx');
const ReactDOM = require('react-dom');
const React = require('react');

(async () => {
  const container = await bootstrapper.createContainer();
  const initialState = window.__initalState__;
  const props = { container, initialState };
  ReactDOM.hydrate(React.createElement(Index, props), document.getElementById('main'));
})();
