import htmlescape from 'htmlescape';
import Root from '../components/root.js';
import { Container } from '../common/di.js';
import cloneDeep from '../utils/clone-deep.js';
import requestUtils from '../utils/request-utils.js';
import PageResolver from '../domain/page-resolver.js';
import PageRendererBase from './page-renderer-base.js';
import ServerConfig from '../bootstrap/server-config.js';
import ClientConfig from '../bootstrap/client-config.js';
import ResourceManager from '../resources/resource-manager.js';
import ClientDataMappingService from '../services/client-data-mapping-service.js';

class PageRenderer extends PageRendererBase {
  static get inject() { return [Container, ServerConfig, ClientConfig, ClientDataMappingService, ResourceManager, PageResolver]; }

  constructor(container, serverConfig, clientConfig, clientDataMappingService, resourceManager, pageResolver) {
    super();
    this.container = container;
    this.serverConfig = serverConfig;
    this.clientConfig = clientConfig;
    this.clientDataMappingService = clientDataMappingService;
    this.resourceManager = resourceManager;
    this.pageResolver = pageResolver;
  }

  sendPage(req, res, pageName, initialState = {}) {
    const title = this.serverConfig.appName;
    const uiLanguage = req.uiLanguage;
    const settings = req.settings;
    const container = this.container;
    const clientConfig = this.clientConfig;
    const request = requestUtils.expressReqToRequest(req);
    const user = this.clientDataMappingService.mapWebsiteUser(req.user);
    const storagePlan = req.storagePlan;
    const storage = req.storage;
    const resources = this.resourceManager.getAllResourceBundles();

    const {
      PageComponent,
      PageTemplateComponent,
      HomePageTemplateComponent,
      SiteLogoComponent
    } = this.pageResolver.getCachedPageComponentInfo(pageName);

    const themeToken = {};

    const props = {
      request: cloneDeep(request),
      user: cloneDeep(user),
      storage: cloneDeep(storage),
      storagePlan: cloneDeep(storagePlan),
      container,
      initialState: cloneDeep(initialState),
      themeToken: cloneDeep(themeToken),
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
      `window.__storage__=${htmlescape(storage)};`,
      `window.__storagePlan__=${htmlescape(storagePlan)};`,
      `window.__request__=${htmlescape(request)};`,
      `window.__pageName__=${htmlescape(pageName)};`,
      `window.__uiLanguage__=${htmlescape(uiLanguage)};`,
      `window.__settings__=${htmlescape(settings)};`,
      `window.__resources__=${htmlescape(resources)};`,
      `window.__initalState__=${htmlescape(initialState)};`,
      `window.__clientconfig__=${htmlescape(clientConfig)};`,
      `window.__themeToken__=${htmlescape(themeToken)};`
    ].join('');

    const styles = [{ href: '/main.css' }];

    const scripts = [{ content: inlineScript }, { src: '/main.js' }];

    const html = this.renderHtml({
      uiLanguage,
      title,
      styles,
      scripts,
      ContentRoot: Root,
      contentProps: props,
      additionalHeadHtml: this.serverConfig.additionalHeadHtml
    });

    return res
      .type('html')
      .set({
        'Cache-Control': 'max-age=0, no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': 'Wed, 11 Jan 1984 05:00:00 GMT'
      })
      .send(html);
  }
}

export default PageRenderer;
