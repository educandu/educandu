import htmlescape from 'htmlescape';
import Root from '../components/root.js';
import { Container } from '../common/di.js';
import Doc from '../components/pages/doc.js';
import Docs from '../components/pages/docs.js';
import cloneDeep from '../utils/clone-deep.js';
import Index from '../components/pages/index.js';
import Login from '../components/pages/login.js';
import Users from '../components/pages/users.js';
import Article from '../components/pages/article.js';
import Account from '../components/pages/account.js';
import EditDoc from '../components/pages/edit-doc.js';
import Register from '../components/pages/register.js';
import Settings from '../components/pages/settings.js';
import requestHelper from '../utils/request-helper.js';
import ClientDataMapper from './client-data-mapper.js';
import PageRendererBase from './page-renderer-base.js';
import ServerConfig from '../bootstrap/server-config.js';
import ClientConfig from '../bootstrap/client-config.js';
import ResourceManager from '../resources/resource-manager.js';
import ResetPassword from '../components/pages/reset-password.js';
import CompleteRegistration from '../components/pages/complete-registration.js';
import CompletePasswordReset from '../components/pages/complete-password-reset.js';
import Search from '../components/pages/search.js';

const pageComponentsByName = {
  'article': Article,
  'complete-password-reset': CompletePasswordReset,
  'complete-registration': CompleteRegistration,
  'doc': Doc,
  'docs': Docs,
  'edit-doc': EditDoc,
  'index': Index,
  'login': Login,
  'account': Account,
  'register': Register,
  'reset-password': ResetPassword,
  'settings': Settings,
  'users': Users,
  'search': Search
};

class PageRenderer extends PageRendererBase {
  static get inject() { return [Container, ServerConfig, ClientConfig, ClientDataMapper, ResourceManager]; }

  constructor(container, serverConfig, clientConfig, clientDataMapper, resourceManager) {
    super();
    this.container = container;
    this.serverConfig = serverConfig;
    this.clientConfig = clientConfig;
    this.clientDataMapper = clientDataMapper;
    this.resourceManager = resourceManager;
  }

  sendPage(req, res, bundleName, pageName, initialState = {}) {
    const title = 'elmu';
    const language = req.language;
    const settings = req.settings;
    const container = this.container;
    const clientConfig = this.clientConfig;
    const request = requestHelper.expressReqToRequest(req);
    const user = this.clientDataMapper.dbUserToClientUser(req.user);
    const resources = this.resourceManager.getAllResourceBundles();

    const props = {
      request: cloneDeep(request),
      user: cloneDeep(user),
      container,
      initialState: cloneDeep(initialState),
      language,
      settings: cloneDeep(settings),
      PageComponent: pageComponentsByName[pageName]
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

    const scripts = [
      { content: inlineScript },
      { src: `/${bundleName}.js` }
    ];

    const html = this.renderHtml({
      language,
      title,
      styles,
      scripts,
      ContentRoot: Root,
      contentProps: props
    });

    return res.type('html').send(html);
  }
}

export default PageRenderer;
