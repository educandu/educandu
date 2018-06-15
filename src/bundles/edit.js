const bootstrapper = require('../bootstrap/client-bootstrapper');
const Edit = require('../components/pages/edit.jsx');
const ReactDOM = require('react-dom');
const React = require('react');

(async () => {
  const container = await bootstrapper.createContainer();
  const initialState = window.__initalState__;
  const props = { container, initialState };
  ReactDOM.hydrate(React.createElement(Edit, props), document.getElementById('main'));
})();
