const path = require('path');
const express = require('express');
const htmlescape = require('htmlescape');
const bodyParser = require('body-parser');
const { Container } = require('./common/di');
const expressLayouts = require('express-ejs-layouts');
const DocumentService = require('./services/document-service');
const ServerRendererFactory = require('./plugins/server-renderer-factory');

const Editor = require('./components/editor.jsx');
const ReactDOMServer = require('react-dom/server');
const React = require('react');

class ElmuServer {
  static get inject() { return [Container, DocumentService, ServerRendererFactory]; }

  constructor(container, documentService, serverRendererFactory) {
    this.app = express();

    this.app.set('views', `${__dirname}/views`);
    this.app.set('view engine', 'ejs');
    this.app.use(expressLayouts);
    this.app.locals.htmlescape = htmlescape;

    const jsonParser = bodyParser.json();

    ['../dist', './static']
      .map(dir => path.join(__dirname, dir))
      .forEach(dir => this.app.use(express.static(dir)));

    this.app.get('/', (req, res) => {
      res.render('index', { title: 'The index page!' });
    });

    this.app.get('/docs', async (req, res) => {
      const docs = await documentService.getLastUpdatedDocuments();
      return res.render('docs', { docs });
    });

    this.app.get('/docs/:docId', async (req, res) => {
      const doc = await documentService.getDocumentById(req.params.docId);
      if (!doc) {
        return res.sendStatus(404);
      }

      doc.sections.forEach(section => {
        const renderer = serverRendererFactory.createRenderer(section.type, section);
        section._rendered = renderer.render();
      });

      return res.render('doc', { doc });
    });

    this.app.get('/edit/doc/:docId', async (req, res) => {
      const doc = await documentService.getDocumentById(req.params.docId);
      if (!doc) {
        return res.sendStatus(404);
      }

      const props = { container, doc };
      const elem = React.createElement(Editor, props);
      const html = ReactDOMServer.renderToString(elem);
      return res.render('edit', { html, doc });
    });

    this.app.post('/api/v1/docs', jsonParser, async (req, res) => {
      const doc = await documentService.createDocumentRevision({ doc: req.body.doc, sections: req.body.sections, user: req.body.user });
      return res.send(doc);
    });
  }

  listen(port, cb) {
    return this.app.listen(port, cb);
  }
}

module.exports = ElmuServer;
