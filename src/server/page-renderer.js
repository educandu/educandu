const htmlescape = require('htmlescape');
const { Container } = require('../common/di');
const Root = require('../components/root.jsx');
const cloneDeep = require('../utils/clone-deep');
const DataProvider = require('../data/data-provider.js');
const requestHelper = require('../utils/request-helper');
const ClientDataMapper = require('./client-data-mapper');
const PageRendererBase = require('./page-renderer-base');
const ClientSettings = require('../bootstrap/client-settings');
const ServerSettings = require('../bootstrap/server-settings');

// eslint-disable-next-line global-require
const getPageComponent = pageName => require(`../components/pages/${pageName}.jsx`);

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
      PageComponent: getPageComponent(pageName)
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

module.exports = PageRenderer;
