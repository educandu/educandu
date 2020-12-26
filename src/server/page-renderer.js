import htmlescape from 'htmlescape';
import Root from '../components/root';
import { Container } from '../common/di';
import Doc from '../components/pages/doc';
import Menu from '../components/pages/menu';
import Docs from '../components/pages/docs';
import cloneDeep from '../utils/clone-deep';
import Index from '../components/pages/index';
import Login from '../components/pages/login';
import Menus from '../components/pages/menus';
import Users from '../components/pages/users';
import Article from '../components/pages/article';
import Profile from '../components/pages/profile';
import EditDoc from '../components/pages/edit-doc';
import Register from '../components/pages/register';
import Settings from '../components/pages/settings';
import DataProvider from '../data/data-provider.js';
import requestHelper from '../utils/request-helper';
import ClientDataMapper from './client-data-mapper';
import PageRendererBase from './page-renderer-base';
import EditMenu from '../components/pages/edit-menu';
import ServerSettings from '../bootstrap/server-settings';
import ClientSettings from '../bootstrap/client-settings';
import ResetPassword from '../components/pages/reset-password';
import CompleteRegistration from '../components/pages/complete-registration';
import CompletePasswordReset from '../components/pages/complete-password-reset';

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
  'profile': Profile,
  'register': Register,
  'reset-password': ResetPassword,
  'settings': Settings,
  'users': Users
};

class PageRenderer extends PageRendererBase {
  static get inject() { return [Container, ServerSettings, ClientSettings, ClientDataMapper, DataProvider]; }

  constructor(container, serverSettings, clientSettings, clientDataMapper, dataProvider) {
    super();
    this.container = container;
    this.serverSettings = serverSettings;
    this.clientSettings = clientSettings;
    this.clientDataMapper = clientDataMapper;
    this.dataProvider = dataProvider;
  }

  sendPage(req, res, bundleName, pageName, initialState = {}, dataKeys = []) {
    const title = 'elmu';
    const language = 'de';
    const container = this.container;
    const clientSettings = this.clientSettings;
    const request = requestHelper.expressReqToRequest(req);
    const user = this.clientDataMapper.dbUserToClientUser(req.user);

    const data = dataKeys.reduce((d, key) => {
      d[key] = this.dataProvider.getData(key, language);
      return d;
    }, {});

    const props = {
      request: cloneDeep(request),
      user: cloneDeep(user),
      container: container,
      initialState: cloneDeep(initialState),
      language: language,
      data: data,
      PageComponent: pageComponentsByName[pageName]
    };

    const inlineScript = [
      `window.__user__=${htmlescape(user)};`,
      `window.__data__=${htmlescape(data)};`,
      `window.__request__=${htmlescape(request)};`,
      `window.__pageName__=${htmlescape(pageName)};`,
      `window.__language__=${htmlescape(language)};`,
      `window.__settings__=${htmlescape(clientSettings)};`,
      `window.__initalState__=${htmlescape(initialState)};`
    ].join('');

    const styles = [{ href: '/main.css' }];

    const scripts = [
      { content: inlineScript },
      { src: '/commons.js' },
      { src: `/${bundleName}.js` }
    ];

    const html = this.renderHtml({
      language: language,
      title: title,
      styles: styles,
      scripts: scripts,
      ContentRoot: Root,
      contentProps: props
    });

    return res.type('html').send(html);
  }
}

export default PageRenderer;
