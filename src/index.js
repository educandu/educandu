const path = require('path');
const express = require('express');
const settings = require('./settings');
const bootstrapper = require('./bootstrapper');
const MarkdownPlugin = require('./plugins/markdown');
const expressLayouts = require('express-ejs-layouts');
const DocumentStore = require('./stores/document-store');

function createApp(documentStore) {
  const app = express();

  app.set('views', `${__dirname}/views`);
  app.set('view engine', 'ejs');
  app.use(expressLayouts);

  ['../dist', './static']
    .map(dir => path.join(__dirname, dir))
    .forEach(dir => app.use(express.static(dir)));

  function getPluginForType(type) {
    switch (type) {
      case 'markdown':
        return new MarkdownPlugin();
      default:
        throw new Error(`Plugin for type ${type} is not available.`);
    }
  }
  app.get('/', (req, res) => {
    res.render('index', { title: 'The index page!' });
  });

  app.get('/docs', async (req, res) => {
    const docs = await documentStore.getLastUpdatedDocuments();
    if (!docs) {
      return res.send(404).end();
    }

    return res.render('docs', { docs });
  });

  app.get('/docs/:docId', async (req, res) => {
    const doc = await documentStore.getDocumentById(req.params.docId);
    if (!doc) {
      return res.send(404).end();
    }

    const sections = doc.sections.map(section => {
      const plugin = getPluginForType(section.type);
      return { html: plugin.renderHtml(section) };
    });

    return res.render('doc', { sections });
  });

  return app;
}

(async function index() {

  const container = await bootstrapper.createContainer();
  const documentStore = container.get(DocumentStore);
  const app = createApp(documentStore);

  app.listen(settings.port, err => {
    if (err) {
      /* eslint no-console: off */
      console.error(err);
    } else {
      console.log(`Example app listening on http://localhost:${settings.port}`);
    }
  });

})();
