const bootstrapper = require('../bootstrap/client-bootstrapper');
const Editor = require('../components/editor.jsx');
const ReactDOM = require('react-dom');
const React = require('react');

(async () => {
  const container = await bootstrapper.createContainer();
  const doc = window.__initalState__;
  const props = { container, doc };
  ReactDOM.hydrate(React.createElement(Editor, props), document.getElementById('main'));
})();
