import React from 'react';
import ReactDOM from 'react-dom';
import Root from '../components/root.js';
import Logger from '../common/logger.js';
import { Container } from '../common/di.js';
import ClientConfig from './client-config.js';
import ResourceManager from '../resources/resource-manager.js';

const logger = new Logger(import.meta.url);

export function createContainer() {
  logger.info('Creating container');
  const container = new Container();

  const clientConfig = new ClientConfig(window.__clientconfig__);
  container.registerInstance(ClientConfig, clientConfig);

  const resourceManager = new ResourceManager(window.__resources__);
  container.registerInstance(ResourceManager, resourceManager);

  return Promise.resolve(container);
}

export async function hydrateApp(bundleConfig) {
  logger.info('Starting application');
  const props = {
    user: window.__user__,
    request: window.__request__,
    language: window.__language__,
    settings: window.__settings__,
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

export default {
  createContainer,
  hydrateApp
};
