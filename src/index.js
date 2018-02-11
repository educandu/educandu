const express = require('express');
const ArticleRepository = require('./repositories/article-repository');
const MarkdownPlugin = require('./plugins/markdown');

const settings = {
  port: 3000
};

const app = express();

const articleRepository = new ArticleRepository();

function getPluginForType(type) {
  switch (type) {
    case 'markdown':
      return new MarkdownPlugin();
    default:
      throw new Error(`Plugin for type ${type} is not available.`);
  }
}

app.set('views', `${__dirname}/views`);
app.set('view engine', 'ejs');

app.use(express.static(`${__dirname}/static`));

app.get('/', (req, res) => {
  res.render('index', { title: 'The index page!' });
});

app.get('/articles/:articleId', async (req, res) => {
  const article = await articleRepository.findArticleById(req.articleId);
  if (!article) {
    return res.send(404).end();
  }

  const sections = article.sections.map(section => {
    const plugin = getPluginForType(section.type);
    return { html: plugin.renderHtml(section) };
  });

  return res.render('article', { sections });
});

app.listen(settings.port, err => {
  if (err) {
    /* eslint no-console: off */
    console.error(err);
  } else {
    console.log(`Example app listening on port ${settings.port}`);
  }
});
