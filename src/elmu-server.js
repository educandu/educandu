const os = require('os');
const path = require('path');
const React = require('react');
const multer = require('multer');
const express = require('express');
const htmlescape = require('htmlescape');
const bodyParser = require('body-parser');
const Cdn = require('./repositories/cdn');
const parseBool = require('parseboolean');
const { Container } = require('./common/di');
const Root = require('./components/root.jsx');
const Doc = require('./components/pages/doc.jsx');
const ReactDOMServer = require('react-dom/server');
const Docs = require('./components/pages/docs.jsx');
const Edit = require('./components/pages/edit.jsx');
const ApiFactory = require('./plugins/api-factory');
const Index = require('./components/pages/index.jsx');
const serverSettings = require('./bootstrap/server-settings');
const DocumentService = require('./services/document-service');

const LANGUAGE = 'de';

const renderPageTemplate = (bundleName, html, initialState, clientEnv) => `
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
      window.env = ${htmlescape(clientEnv)};
      window.__initalState__ = ${htmlescape(initialState)};
    </script>
    <script src="/commons.js"></script>
    <script src="/${bundleName}.js"></script>
  </body>
</html>
`;

function createInitialDisplayState({ doc, language }) {
  return {
    doc: {
      key: doc._id,
      title: doc.title
    },
    sections: doc.sections.map(section => ({
      key: section.key,
      type: section.type,
      order: section.order,
      content: section.content[language]
    })),
    language: language
  };
}

function createInitialEditorState({ doc, language }) {
  return {
    doc: {
      key: doc._id,
      title: doc.title
    },
    sections: doc.sections,
    language: language
  };
}

class ElmuServer {
  static get inject() { return [Container, ApiFactory, DocumentService, Cdn]; }

  constructor(container, apiFactory, documentService, cdn) {
    this.container = container;
    this.apiFactory = apiFactory;

    this.app = express();

    this.app.enable('trust proxy');

    const jsonParser = bodyParser.json();
    const multipartParser = multer({ dest: os.tmpdir() });

    ['../dist', '../static']
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
      if (!doc) {
        return res.sendStatus(404);
      }

      const initialState = createInitialDisplayState({ doc: doc, language: LANGUAGE });
      return this._sendPage(res, 'doc', Doc, initialState);
    });

    this.app.get('/edit/doc/:docId', async (req, res) => {
      const doc = await documentService.getDocumentById(req.params.docId);
      if (!doc) {
        return res.sendStatus(404);
      }

      const initialState = createInitialEditorState({ doc: doc, language: LANGUAGE });
      return this._sendPage(res, 'edit', Edit, initialState);
    });

    this.app.post('/api/v1/docs', jsonParser, async (req, res) => {
      const doc = await documentService.createDocumentRevision({ doc: req.body.doc, sections: req.body.sections, user: req.body.user });
      const initialState = createInitialEditorState({ doc: doc, language: LANGUAGE });
      return res.send(initialState);
    });

    this.app.get('/api/v1/cdn/objects', jsonParser, async (req, res) => {
      const objects = await cdn.listObjects({ prefix: req.query.prefix, recursive: parseBool(req.query.recursive) });
      return res.send({ objects });
    });

    this.app.post('/api/v1/cdn/objects', multipartParser.array('files'), async (req, res) => {
      if (req.files && req.files.length) {
        const uploads = req.files.map(file => cdn.uploadObject(req.body.prefix + file.originalname, file.path, {}));
        await Promise.all(uploads);
      } else if (req.body.prefix && req.body.prefix[req.body.prefix.length - 1] === '/') {
        // Just create a folder
        cdn.uploadEmptyObject(req.body.prefix, {});
      }

      return res.send({});
    });

    this.apis = this.apiFactory.getRegisteredTypes().map(pluginType => {
      const router = express.Router();
      const pathPrefix = `/plugins/${pluginType}`;
      const api = apiFactory.createApi(pluginType, pathPrefix);
      api.registerRoutes(router);
      this.app.use(pathPrefix, router);
      return api;
    });
  }

  _sendPage(res, bundleName, PageComponent, initialState) {
    const { container } = this;
    const props = { container, initialState, PageComponent };
    const elem = React.createElement(Root, props);
    const mainContent = ReactDOMServer.renderToString(elem);
    const clientEnv = { ELMU_ENV: serverSettings.env };
    const pageHtml = renderPageTemplate(bundleName, mainContent, initialState, clientEnv);
    return res.type('html').send(pageHtml);
  }

  listen(port, cb) {
    return this.app.listen(port, cb);
  }
}

module.exports = ElmuServer;
