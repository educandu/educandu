const React = require('react');
const ReactDOM = require('react-dom');
const Root = require('../components/root.jsx');
const ClientSettings = require('./client-settings');
const commonBootstrapper = require('./common-bootstrapper');

async function createContainer() {
  const container = await commonBootstrapper.createContainer();

  const clientSettings = new ClientSettings(window.__settings__);
  container.registerInstance(ClientSettings, clientSettings);

  return container;
}

async function hydrateApp(PageComponent) {
  const props = {
    user: window.__user__,
    request: window.__request__,
    language: window.__language__,
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
