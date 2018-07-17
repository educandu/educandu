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
const ClientSettings = require('./bootstrap/client-settings');
const ServerSettings = require('./bootstrap/server-settings');
const { resetServerContext } = require('react-beautiful-dnd');
const DocumentService = require('./services/document-service');

const LANGUAGE = 'de';

const renderPageTemplate = (bundleName, html, initialState, clientSettings) => `
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
      window.__settings__ = ${htmlescape(clientSettings)};
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

const jsonParser = bodyParser.json();
const multipartParser = multer({ dest: os.tmpdir() });

class ElmuServer {
  static get inject() { return [Container, ServerSettings, ClientSettings, ApiFactory, DocumentService, Cdn]; }

  constructor(container, serverSettings, clientSettings, apiFactory, documentService, cdn) {
    this.container = container;
    this.serverSettings = serverSettings;
    this.clientSettings = clientSettings;
    this.apiFactory = apiFactory;
    this.documentService = documentService;
    this.cdn = cdn;

    this.app = express();

    this.app.enable('trust proxy');

    ['../dist', '../static']
      .map(dir => path.join(__dirname, dir))
      .forEach(dir => this.app.use(express.static(dir)));

    this.registerPages();
    this.registerCoreApi();
    this.registerPluginApis();
  }

  registerPages() {
    this.app.get('/', (req, res) => {
      return this._sendPage(res, 'index', Index, {}, this.clientSettings);
    });

    this.app.get('/docs', async (req, res) => {
      const docs = await this.documentService.getLastUpdatedDocuments();
      return this._sendPage(res, 'docs', Docs, docs, this.clientSettings);
    });

    this.app.get('/docs/:docId', async (req, res) => {
      const doc = await this.documentService.getDocumentById(req.params.docId);
      if (!doc) {
        return res.sendStatus(404);
      }

      const initialState = createInitialDisplayState({ doc: doc, language: LANGUAGE });
      return this._sendPage(res, 'doc', Doc, initialState, this.clientSettings);
    });

    this.app.get('/edit/doc/:docId', async (req, res) => {
      const doc = await this.documentService.getDocumentById(req.params.docId);
      if (!doc) {
        return res.sendStatus(404);
      }

      const initialState = createInitialEditorState({ doc: doc, language: LANGUAGE });
      return this._sendPage(res, 'edit', Edit, initialState, this.clientSettings);
    });
  }

  registerCoreApi() {
    this.app.post('/api/v1/docs', jsonParser, async (req, res) => {
      const { doc, sections, user } = req.body;
      const docRevision = await this.documentService.createDocumentRevision({ doc, sections, user });
      const initialState = createInitialEditorState({ doc: docRevision, language: LANGUAGE });
      return res.send(initialState);
    });

    this.app.get('/api/v1/cdn/objects', jsonParser, async (req, res) => {
      const prefix = req.query.prefix;
      const recursive = parseBool(req.query.recursive);
      const objects = await this.cdn.listObjects({ prefix, recursive });
      return res.send({ objects });
    });

    this.app.post('/api/v1/cdn/objects', multipartParser.array('files'), async (req, res) => {
      if (req.files && req.files.length) {
        const uploads = req.files.map(file => this.cdn.uploadObject(req.body.prefix + file.originalname, file.path, {}));
        await Promise.all(uploads);
      } else if (req.body.prefix && req.body.prefix[req.body.prefix.length - 1] === '/') {
        // Just create a folder
        this.cdn.uploadEmptyObject(req.body.prefix, {});
      }

      return res.send({});
    });
  }

  registerPluginApis() {
    this.apis = this.apiFactory.getRegisteredTypes().map(pluginType => {
      const router = express.Router();
      const pathPrefix = `/plugins/${pluginType}`;
      const api = this.apiFactory.createApi(pluginType, pathPrefix);
      api.registerRoutes(router);
      this.app.use(pathPrefix, router);
      return api;
    });
  }

  _sendPage(res, bundleName, PageComponent, initialState, clientSettings) {
    const { container } = this;
    const props = { container, initialState, PageComponent };
    const elem = React.createElement(Root, props);
    resetServerContext();
    const mainContent = ReactDOMServer.renderToString(elem);
    const pageHtml = renderPageTemplate(bundleName, mainContent, initialState, clientSettings);
    return res.type('html').send(pageHtml);
  }

  listen(cb) {
    return this.app.listen(this.serverSettings.port, err => err ? cb(err) : cb(null, this.serverSettings.port));
  }
}

module.exports = ElmuServer;
