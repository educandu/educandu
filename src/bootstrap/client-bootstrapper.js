const React = require('react');
const ReactDOM = require('react-dom');
const Root = require('../components/root.jsx');
const commonBootstrapper = require('./common-bootstrapper');

async function createContainer() {
  const container = await commonBootstrapper.createContainer();
  return container;
}

async function hydrateApp(PageComponent) {
  const props = {
    container: await createContainer(),
    initialState: window.__initalState__,
    PageComponent: PageComponent
  };

  ReactDOM.hydrate(
    React.createElement(Root, props),
    document.getElementById('root')
  );
}

module.exports = {
  createContainer,
  hydrateApp
};
