const Doc = require('../components/pages/doc.jsx');
const Menu = require('../components/pages/menu.jsx');
const Article = require('../components/pages/article.jsx');
const { hydrateApp } = require('../bootstrap/client-bootstrapper');

hydrateApp({
  doc: Doc,
  menu: Menu,
  article: Article
});
