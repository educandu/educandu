const React = require('react');
const htmlescape = require('htmlescape');
const { Container } = require('../common/di');
const Root = require('../components/root.jsx');
const ReactDOMServer = require('react-dom/server');
const requestHelper = require('../utils/request-helper');
const ClientDataMapper = require('./client-data-mapper');
const reactBeautifulDnd = require('react-beautiful-dnd');
const ClientSettings = require('../bootstrap/client-settings');
const ServerSettings = require('../bootstrap/server-settings');

class PageRenderer {
  static get inject() { return [Container, ServerSettings, ClientSettings, ClientDataMapper]; }

  constructor(container, serverSettings, clientSettings, clientDataMapper) {
    this.container = container;
    this.serverSettings = serverSettings;
    this.clientSettings = clientSettings;
    this.clientDataMapper = clientDataMapper;
  }

  sendPage(req, res, bundleName, PageComponent, initialState) {
    const language = 'de';
    const container = this.container;
    const clientSettings = this.clientSettings;
    const request = requestHelper.expressReqToRequest(req);
    const user = this.clientDataMapper.dbUserToClientUser(req.user);
    const props = {
      request: JSON.parse(JSON.stringify(request)),
      user: JSON.parse(JSON.stringify(user)),
      container: container,
      initialState: JSON.parse(JSON.stringify(initialState)),
      language: language,
      PageComponent: PageComponent
    };
    const html = this._renderHtml(bundleName, request, user, initialState, clientSettings, props, language);
    return res.type('html').send(html);
  }

  _renderHtml(bundleName, request, user, initialState, clientSettings, props, language) {
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
      window.__request__ = ${htmlescape(request)};
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
