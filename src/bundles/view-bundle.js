const Doc = require('../components/pages/doc');
const Menu = require('../components/pages/menu');
const Index = require('../components/pages/index');
const Article = require('../components/pages/article');
const { hydrateApp } = require('../bootstrap/client-bootstrapper');

hydrateApp({
  doc: Doc,
  menu: Menu,
  index: Index,
  article: Article
});
