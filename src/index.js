const path = require('path');
const express = require('express');
const settings = require('./settings');
const htmlescape = require('htmlescape');
const bootstrapper = require('./bootstrapper');
const expressLayouts = require('express-ejs-layouts');
const DocumentStore = require('./stores/document-store');
const MarkdownPlugin = require('./plugins/markdown/server-renderer');
const QuickTesterPlugin = require('./plugins/quick-tester/server-renderer');

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
      case 'quick-tester':
        return new QuickTesterPlugin();
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
      const plugin = getPluginForType(section.type);
      section._rendered = plugin.render(section);
    });

    return res.render('doc', { doc, htmlescape });
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
