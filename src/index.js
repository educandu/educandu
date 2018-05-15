const path = require('path');
const express = require('express');
const htmlescape = require('htmlescape');
const expressLayouts = require('express-ejs-layouts');
const DocumentStore = require('./stores/document-store');
const serverSettings = require('./bootstrap/server-settings');
const bootstrapper = require('./bootstrap/server-bootstrapper');
const ServerRendererFactory = require('./plugins/server-renderer-factory');

function createApp(container) {
  const documentStore = container.get(DocumentStore);
  const serverRendererFactory = container.get(ServerRendererFactory);

  const app = express();

  app.set('views', `${__dirname}/views`);
  app.set('view engine', 'ejs');
  app.use(expressLayouts);
  app.locals.htmlescape = htmlescape;

  ['../dist', './static']
    .map(dir => path.join(__dirname, dir))
    .forEach(dir => app.use(express.static(dir)));

  app.get('/', (req, res) => {
    res.render('index', { title: 'The index page!' });
  });

  app.get('/docs', async (req, res) => {
    const docs = await documentStore.getLastUpdatedDocuments();
    if (!docs) {
      return res.sendStatus(404);
    }

    return res.render('docs', { docs });
  });

  app.get('/docs/:docId', async (req, res) => {
    const doc = await documentStore.getDocumentById(req.params.docId);
    if (!doc) {
      return res.sendStatus(404);
    }

    doc.sections.forEach(section => {
      const renderer = serverRendererFactory.createRenderer(section.type, section);
      section._rendered = renderer.render();
    });

    return res.render('doc', { doc });
  });

  app.get('/edit/doc/:docId', async (req, res) => {
    const doc = await documentStore.getDocumentById(req.params.docId);
    if (!doc) {
      return res.sendStatus(404);
    }

    doc.sections.forEach(section => {
      const renderer = serverRendererFactory.createRenderer(section.type, section);
      section._rendered = renderer.render();
    });

    return res.render('edit', { doc });
  });

  return app;
}

(async function index() {

  const app = createApp(await bootstrapper.createContainer());

  app.listen(serverSettings.port, err => {
    if (err) {
      /* eslint no-console: off */
      console.error(err);
    } else {
      console.log(`Example app listening on http://localhost:${serverSettings.port}`);
    }
  });

})();
