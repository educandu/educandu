const React = require('react');
const htmlescape = require('htmlescape');
const { Container } = require('../common/di');
const Root = require('../components/root.jsx');
const cloneDeep = require('../utils/clone-deep');
const ReactDOMServer = require('react-dom/server');
const DataProvider = require('../data/data-provider.js');
const requestHelper = require('../utils/request-helper');
const ClientDataMapper = require('./client-data-mapper');
const reactBeautifulDnd = require('react-beautiful-dnd');
const ClientSettings = require('../bootstrap/client-settings');
const ServerSettings = require('../bootstrap/server-settings');

// eslint-disable-next-line global-require
const getPageComponent = pageName => require(`../components/pages/${pageName}.jsx`);

class PageRenderer {
  static get inject() { return [Container, ServerSettings, ClientSettings, ClientDataMapper, DataProvider]; }

  constructor(container, serverSettings, clientSettings, clientDataMapper, dataProvider) {
    this.container = container;
    this.serverSettings = serverSettings;
    this.clientSettings = clientSettings;
    this.clientDataMapper = clientDataMapper;
    this.dataProvider = dataProvider;
  }

  sendPage(req, res, bundleName, pageName, initialState = {}, dataKeys = []) {
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
    const html = this.renderHtml({ bundleName, pageName, request, user, initialState, clientSettings, props, data, language });
    return res.type('html').send(html);
  }

  renderHtml({ bundleName, pageName, request, user, initialState, clientSettings, props, data, language }) {
    const elem = React.createElement(Root, props);
    reactBeautifulDnd.resetServerContext();
    const html = ReactDOMServer.renderToString(elem);

    return `
<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>ELMU</title>
    <link rel="stylesheet" href="/main.css">
  </head>
  <body>
    <div id="root">${html}</div>
    <script>
      window.__user__ = ${htmlescape(user)};
      window.__data__ = ${htmlescape(data)};
      window.__request__ = ${htmlescape(request)};
      window.__pageName__ = ${htmlescape(pageName)};
      window.__language__ = ${htmlescape(language)};
      window.__settings__ = ${htmlescape(clientSettings)};
      window.__initalState__ = ${htmlescape(initialState)};
    </script>
    <script src="/commons.js"></script>
    <script src="/${bundleName}.js"></script>
  </body>
</html>
`;
  }
}

module.exports = PageRenderer;
