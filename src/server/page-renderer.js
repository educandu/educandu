import htmlescape from 'htmlescape';
import Root from 'Components/root';
import { Container } from 'Common/di';
import Doc from 'Components/pages/doc';
import Menu from 'Components/pages/menu';
import Docs from 'Components/pages/docs';
import cloneDeep from 'Utils/clone-deep';
import Index from 'Components/pages/index';
import Login from 'Components/pages/login';
import Menus from 'Components/pages/menus';
import Users from 'Components/pages/users';
import Article from 'Components/pages/article';
import Account from 'Components/pages/account';
import EditDoc from 'Components/pages/edit-doc';
import Register from 'Components/pages/register';
import Settings from 'Components/pages/settings';
import requestHelper from 'Utils/request-helper';
import EditMenu from 'Components/pages/edit-menu';
import ServerConfig from 'Bootstrap/server-config';
import ClientConfig from 'Bootstrap/client-config';
import ResourceManager from 'Resources/resource-manager';
import ClientDataMapper from 'Server/client-data-mapper';
import PageRendererBase from 'Server/page-renderer-base';
import ResetPassword from 'Components/pages/reset-password';
import CompleteRegistration from 'Components/pages/complete-registration';
import CompletePasswordReset from 'Components/pages/complete-password-reset';

const pageComponentsByName = {
  'article': Article,
  'complete-password-reset': CompletePasswordReset,
  'complete-registration': CompleteRegistration,
  'doc': Doc,
  'docs': Docs,
  'edit-doc': EditDoc,
  'edit-menu': EditMenu,
  'index': Index,
  'login': Login,
  'menu': Menu,
  'menus': Menus,
  'account': Account,
  'register': Register,
  'reset-password': ResetPassword,
  'settings': Settings,
  'users': Users
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
      { src: '/commons.js' },
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
