const path = require('path');
const React = require('react');
const express = require('express');
const htmlescape = require('htmlescape');
const bodyParser = require('body-parser');
const { Container } = require('./common/di');
const Page = require('./components/page.jsx');
const Doc = require('./components/pages/doc.jsx');
const ReactDOMServer = require('react-dom/server');
const Docs = require('./components/pages/docs.jsx');
const Edit = require('./components/pages/edit.jsx');
const Index = require('./components/pages/index.jsx');
const DocumentService = require('./services/document-service');

const renderPageTemplate = (bundleName, html, initialState) => `
<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>ELMU</title>
    <link rel="stylesheet" href="/main.css">
  </head>
  <body>
    <main id="main">${html}</main>
    <script>
      window.__initalState__ = ${htmlescape(initialState)};
    </script>
    <script src="/commons.js"></script>
    <script src="/${bundleName}.js"></script>
  </body>
</html>
`;

class ElmuServer {
  static get inject() { return [Container, DocumentService]; }

  constructor(container, documentService) {
    this.container = container;
    this.app = express();

    const jsonParser = bodyParser.json();

    ['../dist', './static']
      .map(dir => path.join(__dirname, dir))
      .forEach(dir => this.app.use(express.static(dir)));

    this.app.get('/', (req, res) => {
      return this._sendPage(res, 'index', Index, {});
    });

    this.app.get('/docs', async (req, res) => {
      const docs = await documentService.getLastUpdatedDocuments();
      return this._sendPage(res, 'docs', Docs, docs);
    });

    this.app.get('/docs/:docId', async (req, res) => {
      const doc = await documentService.getDocumentById(req.params.docId);
      return doc ? this._sendPage(res, 'doc', Doc, doc) : res.sendStatus(404);
    });

    this.app.get('/edit/doc/:docId', async (req, res) => {
      const doc = await documentService.getDocumentById(req.params.docId);
      return doc ? this._sendPage(res, 'edit', Edit, doc) : res.sendStatus(404);
    });

    this.app.post('/api/v1/docs', jsonParser, async (req, res) => {
      const doc = await documentService.createDocumentRevision({ doc: req.body.doc, sections: req.body.sections, user: req.body.user });
      return res.send(doc);
    });
  }

  _sendPage(res, bundleName, PageComponent, initialState) {
    const { container } = this;
    const props = { container, initialState, PageComponent };
    const elem = React.createElement(Page, props);
    const mainContent = ReactDOMServer.renderToString(elem);
    return res.type('html').send(renderPageTemplate(bundleName, mainContent, initialState));
  }

  listen(port, cb) {
    return this.app.listen(port, cb);
  }
}

module.exports = ElmuServer;
