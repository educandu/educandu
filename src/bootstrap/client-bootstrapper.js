const React = require('react');
const ReactDOM = require('react-dom');
const Logger = require('../common/logger');
const Root = require('../components/root');
const ClientSettings = require('./client-settings');
const commonBootstrapper = require('./common-bootstrapper');

const logger = new Logger(__filename);

async function createContainer() {
  logger.info('Creating container');
  const container = await commonBootstrapper.createContainer();

  const clientSettings = new ClientSettings(window.__settings__);
  container.registerInstance(ClientSettings, clientSettings);

  return container;
}

async function hydrateApp(bundleConfig) {
  logger.info('Starting application');
  const props = {
    user: window.__user__,
    data: window.__data__,
    request: window.__request__,
    language: window.__language__,
    container: await createContainer(),
    initialState: window.__initalState__,
    PageComponent: bundleConfig[window.__pageName__]
  };

  logger.info('Hydrating application');
  ReactDOM.hydrate(
    React.createElement(Root, props),
    document.getElementById('root')
  );
}

module.exports = {
  createContainer,
  hydrateApp
};
