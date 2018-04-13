const path = require('path');
const express = require('express');
const Database = require('./database');
const settings = require('./settings');
const { Container } = require('./common/di');
const MarkdownPlugin = require('./plugins/markdown');
const expressLayouts = require('express-ejs-layouts');
const ArticleRepository = require('./repositories/article-repository');

function createApp(articleRepository) {
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

  app.get('/articles', async (req, res) => {
    const articles = await articleRepository.findLastArticles();
    if (!articles) {
      return res.send(404).end();
    }

    return res.render('articles', { articles });
  });

  app.get('/articles/:articleId', async (req, res) => {
    const article = await articleRepository.findArticleById(req.params.articleId);
    if (!article) {
      return res.send(404).end();
    }

    const sections = article.sections.map(section => {
      const plugin = getPluginForType(section.type);
      return { html: plugin.renderHtml(section) };
    });

    return res.render('article', { sections });
  });

  return app;
}

(async function index() {

  const container = new Container();
  container.registerInstance(Database, await Database.create(settings.elmuWebConnectionString));

  const articleRepository = container.get(ArticleRepository);
  const app = createApp(articleRepository);

  app.listen(settings.port, err => {
    if (err) {
      /* eslint no-console: off */
      console.error(err);
    } else {
      console.log(`Example app listening on http://localhost:${settings.port}`);
    }
  });

})();
