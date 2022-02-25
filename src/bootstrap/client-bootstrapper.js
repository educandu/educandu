import React from 'react';
import ReactDOM from 'react-dom';
import Root from '../components/root.js';
import Logger from '../common/logger.js';
import { Container } from '../common/di.js';
import ClientConfig from './client-config.js';
import PageResolver from '../domain/page-resolver.js';
import ResourceManager from '../resources/resource-manager.js';

const logger = new Logger(import.meta.url);

export async function hydrateApp({ bundleConfig }) {
  logger.info('Starting application');

  logger.info('Creating container');
  const container = new Container();

  const clientConfig = new ClientConfig(window.__clientconfig__);
  container.registerInstance(ClientConfig, clientConfig);

  const resourceManager = new ResourceManager(window.__resources__);
  container.registerInstance(ResourceManager, resourceManager);

  const pageResolver = new PageResolver(bundleConfig);
  container.registerInstance(PageResolver, pageResolver);

  logger.info('Resolving entry point');
  const {
    PageComponent,
    PageTemplateComponent,
    HomePageTemplateComponent,
    SiteLogoComponent
  } = await pageResolver.getPageComponentInfo(window.__pageName__);

  const props = {
    user: window.__user__,
    storagePlan: window.__storagePlan__,
    request: window.__request__,
    uiLanguage: window.__uiLanguage__,
    settings: window.__settings__,
    pageName: window.__pageName__,
    container,
    initialState: window.__initalState__,
    PageComponent,
    PageTemplateComponent,
    HomePageTemplateComponent,
    SiteLogoComponent
  };

  logger.info('Hydrating application');
  ReactDOM.hydrate(
    React.createElement(Root, props),
    document.getElementById('root')
  );
}
