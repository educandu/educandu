import React from 'react';
import { EOL } from 'node:os';
import htmlescape from 'htmlescape';
import Root from '../components/root.js';
import { Container } from '../common/di.js';
import ReactDOMServer from 'react-dom/server';
import cloneDeep from '../utils/clone-deep.js';
import requestUtils from '../utils/request-utils.js';
import PageResolver from '../domain/page-resolver.js';
import ServerConfig from '../bootstrap/server-config.js';
import ClientConfig from '../bootstrap/client-config.js';
import ThemeManager from '../resources/theme-manager.js';
import { resetServerContext } from 'react-beautiful-dnd';
import LicenseManager from '../resources/license-manager.js';
import ResourceManager from '../resources/resource-manager.js';
import pageRendererUtils from '../utils/page-renderer-utils.js';
import PageTemplate from '../components/templates/page-template.js';
import { createCache, extractStyle, StyleProvider } from '@ant-design/cssinjs';
import ClientDataMappingService from '../services/client-data-mapping-service.js';

class PageRenderer {
  static dependencies = [Container, ServerConfig, ClientConfig, ClientDataMappingService, ResourceManager, ThemeManager, LicenseManager, PageResolver];

  constructor(container, serverConfig, clientConfig, clientDataMappingService, resourceManager, themeManager, licenseManager, pageResolver) {
    this.container = container;
    this.serverConfig = serverConfig;
    this.clientConfig = clientConfig;
    this.clientDataMappingService = clientDataMappingService;
    this.resourceManager = resourceManager;
    this.themeManager = themeManager;
    this.licenseManager = licenseManager;
    this.pageResolver = pageResolver;
    this.timestamp = Date.now().toString();
  }

  renderHtml({ uiLanguage, title, styles, scripts, ContentRoot, contentProps, additionalHeadHtml }) {
    resetServerContext();
    const cache = createCache();

    const content = ReactDOMServer
      .renderToString(<StyleProvider cache={cache}><ContentRoot {...contentProps} /></StyleProvider>);

    const themeText = extractStyle(cache);
    const themeStylesData = pageRendererUtils.parseThemeText(themeText);

    const pageProps = { uiLanguage, title, content, styles, themeStylesData, scripts, additionalHeadHtml };
    const page = ReactDOMServer.renderToStaticMarkup(<PageTemplate {...pageProps} />);

    return `<!DOCTYPE html>${EOL}${page}${EOL}`;
  }

  getHeaders({ xFrameOptions } = {}) {
    const headers = {
      'Cache-Control': 'max-age=0, no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': 'Wed, 11 Jan 1984 05:00:00 GMT'
    };

    if (xFrameOptions) {
      headers['X-Frame-Options'] = xFrameOptions;
    }

    return headers;
  }

  sendPage(req, res, pageName, initialState = {}) {
    const title = this.serverConfig.appName;
    const uiLanguage = req.uiLanguage;
    const settings = req.settings;
    const container = this.container;
    const clientConfig = this.clientConfig;
    const request = requestUtils.expressReqToRequest(req);
    const user = this.clientDataMappingService.mapWebsiteUser(req.user);
    const notificationsCount = req.notificationsCount;
    const resources = this.resourceManager.getResources();
    const theme = this.themeManager.getTheme();
    const licenses = this.licenseManager.getLicenses();

    const {
      PageComponent,
      PageTemplateComponent,
      HomePageTemplateComponent,
      SiteLogoComponent
    } = this.pageResolver.getCachedPageComponentInfo(pageName);

    const props = {
      request: cloneDeep(request),
      user: cloneDeep(user),
      notificationsCount,
      container,
      initialState: cloneDeep(initialState),
      theme: cloneDeep(theme),
      uiLanguage,
      pageName,
      settings: cloneDeep(settings),
      PageComponent,
      PageTemplateComponent,
      HomePageTemplateComponent,
      SiteLogoComponent
    };

    const inlineScript = [
      `window.__user__=${htmlescape(user)};`,
      `window.__notificationsCount__=${htmlescape(notificationsCount)};`,
      `window.__request__=${htmlescape(request)};`,
      `window.__pageName__=${htmlescape(pageName)};`,
      `window.__uiLanguage__=${htmlescape(uiLanguage)};`,
      `window.__settings__=${htmlescape(settings)};`,
      `window.__resources__=${htmlescape(resources)};`,
      `window.__initalState__=${htmlescape(initialState)};`,
      `window.__clientconfig__=${htmlescape(clientConfig)};`,
      `window.__theme__=${htmlescape(theme)};`,
      `window.__licenses__=${htmlescape(licenses)};`
    ].join('');

    const styles = [{ href: `/main.css?ts=${this.timestamp}` }];

    const scripts = [{ content: inlineScript }, { src: `/main.js?ts=${this.timestamp}` }];

    const html = this.renderHtml({
      uiLanguage,
      title,
      styles,
      scripts,
      ContentRoot: Root,
      contentProps: props,
      additionalHeadHtml: this.serverConfig.additionalHeadHtml
    });

    const headers = this.getHeaders({ xFrameOptions: this.serverConfig.xFrameOptions });

    return res
      .type('html')
      .set(headers)
      .send(html);
  }
}

export default PageRenderer;
