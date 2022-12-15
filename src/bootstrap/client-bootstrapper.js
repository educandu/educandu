import React from 'react';
import Root from '../components/root.js';
import Logger from '../common/logger.js';
import { Container } from '../common/di.js';
import ClientConfig from './client-config.js';
import ReactDOMClient from 'react-dom/client';
import PageResolver from '../domain/page-resolver.js';
import ThemeManager from '../resources/theme-manager.js';
import ResourceManager from '../resources/resource-manager.js';
import { ensurePreResolvedModulesAreLoaded } from '../utils/pre-resolved-modules.js';

const logger = new Logger(import.meta.url);

export async function hydrateApp({ bundleConfig }) {
  logger.info('Starting application');

  logger.info('Creating container');
  const container = new Container();

  const clientConfig = new ClientConfig(window.__clientconfig__);
  container.registerInstance(ClientConfig, clientConfig);

  const resourceManager = new ResourceManager(window.__resources__);
  container.registerInstance(ResourceManager, resourceManager);

  const themeManager = new ThemeManager(window.__theme__);
  container.registerInstance(ThemeManager, themeManager);

  const pageResolver = new PageResolver(bundleConfig);
  container.registerInstance(PageResolver, pageResolver);

  logger.info('Resolving entry point');
  const {
    PageComponent,
    PageTemplateComponent,
    HomePageTemplateComponent,
    SiteLogoComponent
  } = await pageResolver.getPageComponentInfo(window.__pageName__);

  logger.info('Preload modules');
  await ensurePreResolvedModulesAreLoaded();

  const props = {
    user: window.__user__,
    storage: window.__storage__,
    storagePlan: window.__storagePlan__,
    request: window.__request__,
    uiLanguage: window.__uiLanguage__,
    settings: window.__settings__,
    pageName: window.__pageName__,
    container,
    initialState: window.__initalState__,
    theme: window.__theme__,
    PageComponent,
    PageTemplateComponent,
    HomePageTemplateComponent,
    SiteLogoComponent
  };

  logger.info('Hydrating application');
  ReactDOMClient.hydrateRoot(
    document.getElementById('root'),
    React.createElement(Root, props)
  );
}
