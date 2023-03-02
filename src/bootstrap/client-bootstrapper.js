import React from 'react';
import Root from '../components/root.js';
import Logger from '../common/logger.js';
import { Container } from '../common/di.js';
import ClientConfig from './client-config.js';
import ReactDOMClient from 'react-dom/client';
import PageResolver from '../domain/page-resolver.js';
import ThemeManager from '../resources/theme-manager.js';
import PluginRegistry from '../plugins/plugin-registry.js';
import LicenseManager from '../resources/license-manager.js';
import ResourceManager from '../resources/resource-manager.js';
import { ensurePreResolvedModulesAreLoaded } from '../utils/pre-resolved-modules.js';

const logger = new Logger(import.meta.url);

export async function hydrateApp({ customResolvers }) {
  logger.info('Starting application');

  const request = window.__request__;
  const pageName = window.__pageName__;
  const initialState = window.__initalState__;

  const container = new Container();

  const clientConfig = new ClientConfig(window.__clientconfig__);
  container.registerInstance(ClientConfig, clientConfig);

  const resourceManager = new ResourceManager();
  resourceManager.setResources(window.__resources__);
  container.registerInstance(ResourceManager, resourceManager);

  const themeManager = new ThemeManager();
  themeManager.setTheme(window.__theme__);
  container.registerInstance(ThemeManager, themeManager);

  const licenseManager = new LicenseManager();
  licenseManager.setLicenses(window.__licenses__);
  container.registerInstance(LicenseManager, licenseManager);

  const pageResolver = new PageResolver(customResolvers);
  container.registerInstance(PageResolver, pageResolver);

  const pluginRegistry = new PluginRegistry();
  pluginRegistry.setPlugins(container, clientConfig.plugins, customResolvers);
  container.registerInstance(PluginRegistry, pluginRegistry);

  logger.info('Preloading modules');
  await Promise.all([
    ensurePreResolvedModulesAreLoaded(),
    pageResolver.ensurePageIsCached(pageName)
  ]);

  const {
    PageComponent,
    PageTemplateComponent,
    HomePageTemplateComponent,
    SiteLogoComponent
  } = pageResolver.getCachedPageComponentInfo(pageName);

  const PreloaderType = PageComponent.clientPreloader;
  if (PreloaderType) {
    const preloader = container.get(PreloaderType);
    await preloader.preload({ initialState, request });
  }

  const props = {
    user: window.__user__,
    notificationsCount: window.__notificationsCount__,
    storage: window.__storage__,
    storagePlan: window.__storagePlan__,
    request,
    uiLanguage: window.__uiLanguage__,
    settings: window.__settings__,
    pageName,
    container,
    initialState,
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
