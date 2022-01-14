import htmlescape from 'htmlescape';
import Root from '../components/root.js';
import { Container } from '../common/di.js';
import cloneDeep from '../utils/clone-deep.js';
import PageResolver from '../domain/page-resolver.js';
import requestHelper from '../utils/request-helper.js';
import ClientDataMapper from './client-data-mapper.js';
import PageRendererBase from './page-renderer-base.js';
import ServerConfig from '../bootstrap/server-config.js';
import ClientConfig from '../bootstrap/client-config.js';
import ResourceManager from '../resources/resource-manager.js';

class PageRenderer extends PageRendererBase {
  static get inject() { return [Container, ServerConfig, ClientConfig, ClientDataMapper, ResourceManager, PageResolver]; }

  constructor(container, serverConfig, clientConfig, clientDataMapper, resourceManager, pageResolver) {
    super();
    this.container = container;
    this.serverConfig = serverConfig;
    this.clientConfig = clientConfig;
    this.clientDataMapper = clientDataMapper;
    this.resourceManager = resourceManager;
    this.pageResolver = pageResolver;
  }

  sendPage(req, res, pageName, initialState = {}) {
    const title = 'elmu';
    const language = req.language;
    const settings = req.settings;
    const container = this.container;
    const clientConfig = this.clientConfig;
    const request = requestHelper.expressReqToRequest(req);
    const user = this.clientDataMapper.dbUserToClientUser(req.user);
    const resources = this.resourceManager.getAllResourceBundles();

    const {
      PageComponent,
      PageTemplateComponent,
      SiteLogoComponent
    } = this.pageResolver.getCachedPageComponentInfo(pageName);

    const props = {
      request: cloneDeep(request),
      user: cloneDeep(user),
      container,
      initialState: cloneDeep(initialState),
      language,
      pageName,
      settings: cloneDeep(settings),
      PageComponent,
      PageTemplateComponent,
      SiteLogoComponent
    };

    const inlineScript = [
      `window.__user__=${htmlescape(user)};`,
      `window.__request__=${htmlescape(request)};`,
      `window.__pageName__=${htmlescape(pageName)};`,
      `window.__language__=${htmlescape(language)};`,
      `window.__settings__=${htmlescape(settings)};`,
      `window.__resources__=${htmlescape(resources)};`,
      `window.__initalState__=${htmlescape(initialState)};`,
      `window.__clientconfig__=${htmlescape(clientConfig)};`
    ].join('');

    const styles = [{ href: '/main.css' }];

    const scripts = [{ content: inlineScript }, { src: '/main.js' }];

    const html = this.renderHtml({
      language,
      title,
      styles,
      scripts,
      ContentRoot: Root,
      contentProps: props
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
